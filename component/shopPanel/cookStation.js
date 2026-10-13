// component/shopPanel/cookStation.js
// Trạm nấu ăn ở tab "Chế biến": kệ nguyên liệu -> kéo thả (cầm ném) vào nồi -> có nguyên liệu thì lửa cháy
// -> ném đủ công thức thì bắt đầu đếm giờ nấu (mặc định 5 giây) -> xong thì món bay ra khay thành phẩm.
//
// Nguyên liệu CHỈ bị trừ khi món nấu xong (hooks.craft gọi craftFood lên server). Thoát trang giữa chừng
// thì không mất gì. Trạng thái nồi nằm trong object này nên ShopPanel vẽ lại giao diện (tab, toast...) vẫn
// giữ nguyên nồi đang nấu: ShopPanel chỉ gắn lại đúng phần tử #cook-station.

import { INGREDIENTS } from './shopConfig.js';
import { getIngredients } from './shopService.js';

const DEFAULT_COOK_SECONDS = 5;
const DRAG_THRESHOLD = 6; // dưới ngần này px thì coi là bấm (tự ném), không phải kéo

// Vị trí (%) nguyên liệu nổi trong miệng nồi
const SLOTS = [[30, 50], [56, 38], [46, 64], [72, 56], [22, 62], [64, 70], [38, 40], [80, 44]];

// Ngọn lửa: x (px trong khung lửa), scale, delay
const FLAMES = [[2, 0.78, -0.1], [46, 1, -0.5], [92, 1.22, -0.3], [138, 1, -0.7], [182, 0.8, -0.2]];
const SPARKS = [[40, 18, 0], [80, -14, 0.5], [118, 10, 0.9], [150, -20, 0.3], [184, 16, 1.2]];

const zero = (shop) => Object.fromEntries(Object.keys(shop.recipe).map((id) => [id, 0]));
const sum = (o) => Object.values(o).reduce((s, n) => s + n, 0);

export const CookStation = {
    _el: null,
    _shop: null,
    _ref: {},
    _hooks: {},
    _user: null,
    _inPot: {},
    _pending: {},   // nguyên liệu đang bay giữa không trung (đã ném, chưa rơi vào nồi)
    _phase: 'idle', // idle | cooking | finishing
    _startedAt: 0,
    _cookMs: DEFAULT_COOK_SECONDS * 1000,
    _raf: 0,
    _lastSecs: -1,
    _floaters: 0,
    _made: 0,
    _hint: '',
    _hintTimer: null,
    _drag: null,

    /* ===== Gắn vào giao diện ===== */

    // ShopPanel gọi mỗi lần vẽ lại. Lần đầu dựng phần tử, các lần sau chỉ trả lại đúng phần tử cũ + cập nhật số liệu.
    // hooks: { craft: () => Promise<user>, toast: (msg, type) => void }
    mount(shop, user, hooks = {}) {
        if (!this._el || this._shop?.id !== shop.id) this._build(shop);
        this._hooks = hooks;
        this.sync(user);
        return this._el;
    },

    // Cập nhật số nguyên liệu còn lại (lấy từ tài khoản) mà không dựng lại phần tử
    sync(user) {
        this._user = user;
        if (!this._el) return;
        const have = getIngredients(user);
        for (const id of Object.keys(this._shop.recipe)) {
            const left = Math.max(0, have[id] - this._count(id));
            this._ref[`have-${id}`].textContent = left;
            const card = this._el.querySelector(`.cook-ing[data-ing="${id}"]`);
            card.classList.toggle('is-empty', left <= 0 || this._count(id) >= this._shop.recipe[id]);
        }
        this._refresh();
    },

    /* ===== Dựng giao diện ===== */

    _build(shop) {
        this._stopCook();
        this._shop = shop;
        this._inPot = zero(shop);
        this._pending = zero(shop);
        this._phase = 'idle';
        this._floaters = 0;
        this._made = 0;
        this._hint = '';

        const ids = Object.keys(shop.recipe);
        const secs = shop.cookSeconds ?? DEFAULT_COOK_SECONDS;
        this._cookMs = secs * 1000;
        const recipeText = ids.map((id) => `${shop.recipe[id]} ${INGREDIENTS[id].name}`).join(' + ');

        const el = document.createElement('div');
        el.id = 'cook-station';
        el.className = 'cook';
        el.innerHTML = `
            <aside class="cook-shelf">
                <h3 class="cook-title">Kệ nguyên liệu</h3>
                ${ids.map((id) => `
                    <div class="cook-ing" data-ing="${id}" role="button" tabindex="0" aria-label="${INGREDIENTS[id].name}: kéo vào nồi">
                        <div class="cook-ing__icon cook-ing__icon--${id}"><i class="fa-solid ${INGREDIENTS[id].icon}"></i></div>
                        <div class="cook-ing__info">
                            <b>${INGREDIENTS[id].name}</b>
                            <span>Còn <em data-ref="have-${id}">0</em></span>
                            <span class="cook-ing__pips" data-ref="pips-${id}">
                                ${Array.from({ length: shop.recipe[id] }, () => '<i class="cook-pip"></i>').join('')}
                            </span>
                        </div>
                    </div>`).join('')}
                <p class="cook-tip"><i class="fa-solid fa-hand"></i> Cầm nguyên liệu ném vào nồi</p>
            </aside>

            <section class="cook-stage" data-ref="stage">
                <div class="cook-glow"></div>
                <div class="cook-status">
                    <span data-ref="statusText"></span>
                    <div class="cook-bar"><i data-ref="bar"></i></div>
                </div>
                <button class="cook-clear" type="button" data-ref="clear">Lấy nguyên liệu ra</button>

                <div class="cook-counter"></div>
                <div class="cook-stove"></div>

                <div class="cook-fire" data-ref="fire" aria-hidden="true">
                    ${FLAMES.map(([x, s, d]) => `<span class="cook-flame" style="--x:${x}px;--s:${s};--d:${d}s"><i></i></span>`).join('')}
                    ${SPARKS.map(([x, dx, d]) => `<span class="cook-spark" style="--x:${x}px;--dx:${dx}px;--d:${d}s"></span>`).join('')}
                </div>

                <div class="cook-pot" data-ref="pot">
                    <div class="cook-steam" aria-hidden="true"><span></span><span></span><span></span></div>
                    <div class="cook-pot__body"></div>
                    <i class="cook-pot__handle cook-pot__handle--l"></i>
                    <i class="cook-pot__handle cook-pot__handle--r"></i>
                    <div class="cook-pot__rim">
                        <div class="cook-pot__mouth" data-ref="mouth">
                            <div class="cook-soup"></div>
                            <i class="cook-bubble" style="left:24%;--d:0s"></i>
                            <i class="cook-bubble" style="left:44%;--d:.4s"></i>
                            <i class="cook-bubble" style="left:62%;--d:.8s"></i>
                            <i class="cook-bubble" style="left:78%;--d:.2s"></i>
                        </div>
                    </div>
                </div>
            </section>

            <aside class="cook-side">
                <div class="cook-recipe">
                    <img src="${shop.food.image}" alt="${shop.food.nameItems}">
                    <div>
                        <b>${shop.food.nameItems}</b>
                        <small>${recipeText}</small>
                        <small><i class="fa-solid fa-clock"></i> Nấu ${secs} giây</small>
                    </div>
                </div>
                <div class="cook-plate" data-ref="plate">
                    <div class="cook-plate__dish" data-ref="dish"></div>
                </div>
                <p class="cook-plate__label" data-ref="plateLabel">Khay thành phẩm</p>
            </aside>`;

        this._el = el;
        this._ref = {};
        el.querySelectorAll('[data-ref]').forEach((n) => { this._ref[n.dataset.ref] = n; });

        el.addEventListener('pointerdown', (e) => this._onDown(e));
        el.addEventListener('keydown', (e) => {
            const card = e.target.closest?.('.cook-ing');
            if (card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                this._quickThrow(card.dataset.ing);
            }
        });
        this._ref.clear.addEventListener('click', () => this._clearPot());
    },

    /* ===== Trạng thái ===== */

    _count(id) { return (this._inPot[id] || 0) + (this._pending[id] || 0); },

    _isFull() {
        return Object.entries(this._shop.recipe).every(([id, need]) => this._inPot[id] >= need);
    },

    _missingText() {
        return Object.entries(this._shop.recipe)
            .filter(([id, need]) => this._inPot[id] < need)
            .map(([id, need]) => `${need - this._inPot[id]} ${INGREDIENTS[id].name}`)
            .join(', ');
    },

    // Vẽ lại các thứ phụ thuộc trạng thái nồi (lửa, màu canh, trạng thái, chấm công thức)
    _refresh() {
        if (!this._el) return;
        const shop = this._shop;
        const total = sum(this._inPot);
        const need = sum(shop.recipe);
        const cooking = this._phase === 'cooking' || this._phase === 'finishing';

        const heat = cooking ? 1.2 : total > 0 ? Math.min(1.05, 0.55 + (total - 1) * 0.16) : 0;
        this._el.style.setProperty('--heat', heat);
        this._el.style.setProperty('--fill', total / need);
        this._el.classList.toggle('is-lit', total > 0);
        this._el.classList.toggle('is-cooking', cooking);

        for (const id of Object.keys(shop.recipe)) {
            this._ref[`pips-${id}`].querySelectorAll('.cook-pip')
                .forEach((p, i) => p.classList.toggle('is-on', i < this._inPot[id]));
        }

        this._ref.clear.hidden = !(this._phase === 'idle' && total > 0 && sum(this._pending) === 0);
        this._setStatus();
    },

    _setStatus(text) {
        if (!this._ref.statusText) return;
        let msg = text;
        if (msg === undefined) {
            if (this._phase === 'finishing') msg = 'Sắp xong...';
            else if (this._phase === 'cooking') msg = `Đang nấu... ${Math.max(1, Math.ceil(this._cookMs / 1000))}s`;
            else if (this._hint) msg = this._hint;
            else if (sum(this._inPot) === 0) msg = 'Kéo nguyên liệu thả vào nồi';
            else msg = `Còn thiếu: ${this._missingText()}`;
        }
        if (this._ref.statusText.textContent !== msg) this._ref.statusText.textContent = msg;
    },

    _flash(msg) {
        this._hint = msg;
        clearTimeout(this._hintTimer);
        this._hintTimer = setTimeout(() => { this._hint = ''; this._setStatus(); }, 2200);
        this._setStatus();
    },

    _canThrow(id) {
        if (this._phase !== 'idle') { this._flash('Nồi đang nấu, đợi chút nhé'); return false; }
        const left = getIngredients(this._user)[id] - this._count(id);
        if (this._count(id) >= this._shop.recipe[id]) { this._flash(`Nồi đủ ${INGREDIENTS[id].name} rồi`); return false; }
        if (left <= 0) { this._flash(`Hết ${INGREDIENTS[id].name} — nhờ admin gửi thêm`); return false; }
        return true;
    },

    _shake(id) {
        const card = this._el.querySelector(`.cook-ing[data-ing="${id}"]`);
        card.classList.remove('is-shake');
        void card.offsetWidth; // chạy lại animation
        card.classList.add('is-shake');
    },

    /* ===== Cầm - kéo - ném ===== */

    _makeGhost(id, size, x, y) {
        const g = document.createElement('div');
        g.className = `cook-ghost cook-ing__icon--${id}`;
        g.style.width = g.style.height = `${size}px`;
        g.style.fontSize = `${size * 0.46}px`;
        g.innerHTML = `<i class="fa-solid ${INGREDIENTS[id].icon}"></i>`;
        document.body.appendChild(g);
        this._pose(g, x, y, 1.15);
        return g;
    },

    _pose(g, x, y, k = 1) {
        g.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${k})`;
    },

    _iconRect(id) {
        return this._el.querySelector(`.cook-ing[data-ing="${id}"] .cook-ing__icon`).getBoundingClientRect();
    },

    _overPot(x, y) {
        const r = this._ref.pot.getBoundingClientRect();
        const pad = 36; // thả gần nồi cũng tính
        return x > r.left - pad && x < r.right + pad && y > r.top - pad - 30 && y < r.bottom + pad;
    },

    _onDown(e) {
        const card = e.target.closest('.cook-ing');
        if (!card || (e.pointerType === 'mouse' && e.button !== 0) || this._drag) return;
        const id = card.dataset.ing;
        if (!this._canThrow(id)) { this._shake(id); return; }
        e.preventDefault();

        const r = this._iconRect(id);
        const origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        const d = {
            id, card, origin, size: r.width,
            startX: e.clientX, startY: e.clientY, x: e.clientX, y: e.clientY,
            ghost: this._makeGhost(id, r.width, e.clientX, e.clientY),
        };
        this._drag = d;
        card.classList.add('is-dragging');
        this._el.classList.add('is-carrying');

        d.move = (ev) => {
            d.x = ev.clientX; d.y = ev.clientY;
            this._pose(d.ghost, d.x, d.y, 1.15);
            this._ref.pot.classList.toggle('is-hover', this._overPot(d.x, d.y));
        };
        d.up = (ev) => {
            window.removeEventListener('pointermove', d.move);
            window.removeEventListener('pointerup', d.up);
            window.removeEventListener('pointercancel', d.up);
            this._drag = null;
            card.classList.remove('is-dragging');
            this._el.classList.remove('is-carrying');
            this._ref.pot.classList.remove('is-hover');

            const moved = Math.hypot(d.x - d.startX, d.y - d.startY) >= DRAG_THRESHOLD;
            if (ev.type === 'pointercancel') this._giveBack(d);
            else if (!moved) this._throw(d.id, d.ghost, d.origin.x, d.origin.y); // chỉ bấm -> tự ném từ kệ
            else if (this._overPot(d.x, d.y)) this._throw(d.id, d.ghost, d.x, d.y);
            else this._giveBack(d);
        };
        window.addEventListener('pointermove', d.move);
        window.addEventListener('pointerup', d.up);
        window.addEventListener('pointercancel', d.up);
    },

    // Dùng bàn phím (Enter / Space): ném thẳng từ kệ vào nồi
    _quickThrow(id) {
        if (!this._canThrow(id)) { this._shake(id); return; }
        const r = this._iconRect(id);
        const x = r.left + r.width / 2, y = r.top + r.height / 2;
        this._throw(id, this._makeGhost(id, r.width, x, y), x, y);
    },

    // Thả ngoài nồi: nguyên liệu bay về kệ
    _giveBack(d) {
        const to = d.origin;
        const a = d.ghost.animate([
            { transform: d.ghost.style.transform },
            { transform: `translate(${to.x}px, ${to.y}px) translate(-50%, -50%) scale(1)` },
        ], { duration: 260, easing: 'ease-out', fill: 'forwards' });
        a.onfinish = () => d.ghost.remove();
        a.oncancel = () => d.ghost.remove();
    },

    // Ném vào nồi: bay theo đường vòng cung vào miệng nồi, rơi xuống thì bắn nước
    async _throw(id, ghost, fromX, fromY) {
        if (!this._canThrow(id)) { ghost.remove(); return; }
        this._pending[id]++;
        this.sync(this._user);

        if (this._el.isConnected) {
            const m = this._ref.mouth.getBoundingClientRect();
            const slot = SLOTS[this._floaters % SLOTS.length];
            const tx = m.left + (m.width * slot[0]) / 100;
            const ty = m.top + (m.height * slot[1]) / 100;
            const midX = (fromX + tx) / 2;
            const midY = Math.min(fromY, ty) - 110 * (m.width / 248 || 1);
            const t = (x, y, k, rot) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${k}) rotate(${rot}deg)`;
            const a = ghost.animate([
                { transform: t(fromX, fromY, 1.15, 0), offset: 0 },
                { transform: t(midX, midY, 1, 200), offset: 0.5 },
                { transform: t(tx, ty, 0.5, 400), opacity: 0.95, offset: 1 },
            ], { duration: 520, easing: 'cubic-bezier(.35,.1,.55,1)', fill: 'forwards' });
            try { await a.finished; } catch { /* bị huỷ thì vẫn cho rơi vào nồi */ }
        }
        ghost.remove();
        this._land(id);
    },

    _land(id) {
        this._pending[id]--;
        this._inPot[id]++;
        this._addFloater(id);
        this._splash();
        this.sync(this._user);
        if (this._phase === 'idle' && this._isFull()) this._startCooking();
    },

    _addFloater(id) {
        const n = this._floaters++;
        const [x, y] = SLOTS[n % SLOTS.length];
        const f = document.createElement('span');
        f.className = `cook-floater cook-ing__icon--${id}`;
        f.style.left = `${x}%`;
        f.style.top = `${y}%`;
        f.style.animationDelay = `${-(n * 0.37)}s`;
        f.innerHTML = `<i class="fa-solid ${INGREDIENTS[id].icon}"></i>`;
        this._ref.mouth.appendChild(f);
    },

    _splash() {
        const mouth = this._ref.mouth;
        const ring = document.createElement('i');
        ring.className = 'cook-ripple';
        mouth.appendChild(ring);
        ring.addEventListener('animationend', () => ring.remove());
        for (let i = 0; i < 6; i++) {
            const d = document.createElement('i');
            d.className = 'cook-drop';
            d.style.left = `${35 + Math.random() * 30}%`;
            d.style.setProperty('--dx', `${(Math.random() - 0.5) * 90}px`);
            d.style.setProperty('--dy', `${-40 - Math.random() * 40}px`);
            mouth.appendChild(d);
            d.addEventListener('animationend', () => d.remove());
        }
        const pot = this._ref.pot;
        pot.classList.remove('is-bump');
        void pot.offsetWidth;
        pot.classList.add('is-bump');
    },

    _clearPot() {
        if (this._phase !== 'idle' || sum(this._pending) > 0) return;
        this._resetPot();
        this.sync(this._user);
    },

    _resetPot() {
        this._inPot = zero(this._shop);
        this._floaters = 0;
        this._ref.mouth.querySelectorAll('.cook-floater').forEach((n) => n.remove());
        this._el.style.setProperty('--cook', 0);
        this._ref.bar.style.width = '0%';
    },

    /* ===== Nấu ===== */

    _startCooking() {
        this._phase = 'cooking';
        this._startedAt = performance.now();
        this._lastSecs = -1;
        this._refresh();

        const tick = (now) => {
            const p = Math.min(1, (now - this._startedAt) / this._cookMs);
            this._el.style.setProperty('--cook', p);
            this._ref.bar.style.width = `${p * 100}%`;
            const secs = Math.ceil((1 - p) * (this._cookMs / 1000));
            if (secs !== this._lastSecs && p < 1) {
                this._lastSecs = secs;
                this._setStatus(`Đang nấu... ${secs}s`);
            }
            if (p < 1) this._raf = requestAnimationFrame(tick);
            else { this._raf = 0; this._finish(); }
        };
        this._raf = requestAnimationFrame(tick);
    },

    _stopCook() {
        if (this._raf) cancelAnimationFrame(this._raf);
        this._raf = 0;
    },

    async _finish() {
        this._phase = 'finishing';
        this._refresh();
        let user = null;
        try {
            user = await this._hooks.craft?.();
        } catch (err) {
            // Thiếu nguyên liệu / mất mạng...: chưa trừ gì nên chỉ cần dọn nồi
            this._hooks.toast?.(err?.message || 'Không nấu được, thử lại sau.', 'err');
        }

        const ok = !!user;
        const from = this._ref.mouth.getBoundingClientRect();
        this._phase = 'idle';
        this._resetPot();
        if (ok) {
            this._made++;
            this._user = user;
            this._hooks.toast?.(`Đã nấu xong 1 ${this._shop.food.nameItems}!`, 'ok');
            await this._serve(from);
        }
        this.sync(this._user);
    },

    // Món bay từ nồi ra khay thành phẩm
    async _serve(from) {
        const { dish, plate, plateLabel } = this._ref;
        const food = this._shop.food;
        if (this._el.isConnected) {
            const to = plate.getBoundingClientRect();
            const fx = from.left + from.width / 2, fy = from.top + from.height / 2;
            const tx = to.left + to.width / 2, ty = to.top + to.height / 2;
            const fly = document.createElement('img');
            fly.className = 'cook-dish-fly';
            fly.src = food.image;
            fly.alt = '';
            const s = Math.max(48, to.width * 0.5);
            fly.style.width = fly.style.height = `${s}px`;
            document.body.appendChild(fly);
            const t = (x, y, k) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${k})`;
            const a = fly.animate([
                { transform: t(fx, fy, 0.3), opacity: 0, offset: 0 },
                { transform: t(fx, fy - 130, 1.1), opacity: 1, offset: 0.45 },
                { transform: t(tx, ty, 1), opacity: 1, offset: 1 },
            ], { duration: 800, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'forwards' });
            try { await a.finished; } catch { /* bỏ qua */ }
            fly.remove();
        }
        dish.innerHTML = `<img src="${food.image}" alt="${food.nameItems}">`;
        dish.classList.remove('is-pop');
        void dish.offsetWidth;
        dish.classList.add('is-pop');
        plate.classList.add('has-dish');
        plateLabel.textContent = `${food.nameItems} · đã cho vào túi đồ (${this._made} phần)`;
    },
};
