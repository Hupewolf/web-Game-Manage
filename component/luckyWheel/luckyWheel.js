// component/luckyWheel/luckyWheel.js
// Vòng quay may mắn nằm dưới bảng "Nhiệm vụ hôm nay".
// 1 xu = 1 lượt quay. Bấm quay là khoá ngay (chống spam), ~2 giây ra kết quả,
// trúng thì cộng thẳng coin vào ví.

import { WHEEL_PRIZES, SPIN_MS, XU_PER_SPIN } from './luckyConfig.js';
import { getXuView, hasUser, syncXu, claimApp, spendSpin, todayKey } from './xuService.js';
import { emitWalletChange } from '../viCoinApp/viCoinApp.js';

/* ===== Các ô của vòng quay: ô thưởng xen kẽ ô trống ===== */

const SLOTS = WHEEL_PRIZES.flatMap((coin) => [{ coin }, { coin: 0 }]);
const STEP = 360 / SLOTS.length;
const SIZE = 200;
const C = SIZE / 2;
const R = 94;

const PRIZE_FILL = (coin) => (coin >= 5 ? '#ffc83d' : coin >= 2 ? '#ff93bb' : '#7db4ff');

const polar = (deg, r) => {
    const a = ((deg - 90) * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

function wheelSvg() {
    const sectors = SLOTS.map((s, i) => {
        const a0 = i * STEP;
        const a1 = a0 + STEP;
        const [x0, y0] = polar(a0, R);
        const [x1, y1] = polar(a1, R);
        const mid = a0 + STEP / 2;
        const fill = s.coin ? PRIZE_FILL(s.coin) : '#eef2fb';
        const label = s.coin
            ? `<text x="${C}" y="${C - 66}" text-anchor="middle" dominant-baseline="middle" class="lw-label lw-label--${s.coin >= 5 ? 'big' : 'prize'}">+${s.coin}</text>`
            : `<text x="${C}" y="${C - 66}" text-anchor="middle" dominant-baseline="middle" class="lw-label lw-label--empty">×</text>`;
        return `
            <g class="lw-slot" data-slot="${i}">
                <path d="M${C} ${C} L${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} Z" fill="${fill}" stroke="#fff" stroke-width="2"/>
                <g transform="rotate(${mid} ${C} ${C})">${label}</g>
            </g>`;
    }).join('');

    return `
        <svg viewBox="0 0 ${SIZE} ${SIZE}" class="lw-svg" aria-hidden="true">
            ${sectors}
            <circle cx="${C}" cy="${C}" r="${R}" fill="none" stroke="#4f8ef7" stroke-width="5"/>
            <circle cx="${C}" cy="${C}" r="15" fill="#fff" stroke="#4f8ef7" stroke-width="3"/>
            <circle cx="${C}" cy="${C}" r="5" fill="#ffb000"/>
        </svg>`;
}

/* ===== Toast nhỏ báo "+1 xu" ===== */

export function showXuToast(msg) {
    const old = document.querySelector('.xu-toast');
    old?.remove();
    const el = document.createElement('div');
    el.className = 'xu-toast';
    el.setAttribute('role', 'status');
    el.innerHTML = `<i class="fa-solid fa-star"></i><span></span>`;
    el.querySelector('span').textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('xu-toast--show'));
    setTimeout(() => {
        el.classList.remove('xu-toast--show');
        setTimeout(() => el.remove(), 300);
    }, 2400);
}

// Gọi khi người chơi bấm vào 1 app trên iPad: nếu app được gán xu và hôm nay chưa nhận -> +1 xu
export async function claimXuForApp(appId) {
    const r = await claimApp(appId);
    if (r.granted) showXuToast(`+1 xu! Bạn đang có ${r.balance} xu — quay ngay ở vòng quay may mắn.`);
    return r;
}

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/* ===== Component ===== */

export const LuckyWheel = {
    _el: null,
    _rot: 0,
    _busy: false,
    _startBalance: 0,
    _shownDate: null,

    async mount(containerId) {
        const el = document.getElementById(containerId);
        if (!el || !hasUser()) return; // khách chưa đăng nhập: không hiện
        this._el = el;

        el.innerHTML = `
            <div class="lucky-card">
                <div class="lucky-head">
                    <span class="lucky-title">VÒNG QUAY MAY MẮN</span>
                    <button class="lucky-close" id="lucky-close" type="button" aria-label="Thu nhỏ vòng quay"><i class="fa-solid fa-xmark"></i></button>
                    <span class="lucky-xu" title="Số xu đang có (1 xu = 1 lượt quay)"><i class="fa-solid fa-star"></i><b id="lucky-balance">0</b> xu</span>
                </div>
                <div class="lucky-stage">
                    <div class="lucky-pointer"></div>
                    <div class="lucky-disc" id="lucky-disc">${wheelSvg()}</div>
                </div>
                <div class="lucky-result" id="lucky-result" role="status" aria-live="polite"></div>
                <button class="lucky-spin" id="lucky-spin" type="button"></button>
                <div class="lucky-foot" id="lucky-foot"></div>
            </div>
        `;

        el.querySelector('#lucky-spin').addEventListener('click', () => this._spin());

        // Đóng/mở riêng, không liên quan bảng nhiệm vụ
        const outer = document.getElementById('lucky-outer');
        el.querySelector('#lucky-close').addEventListener('click', () => outer?.classList.add('minimized'));
        document.getElementById('lucky-icon')?.addEventListener('click', () => outer?.classList.remove('minimized'));
        document.addEventListener('xu:change', () => this._render());

        this._shownDate = todayKey();
        this._render();
        syncXu(); // lấy số liệu mới nhất từ server, xong sẽ tự vẽ lại

        // Qua nửa đêm khi đang mở trang: làm mới (xu/app hồi lại)
        setInterval(() => {
            if (todayKey() !== this._shownDate) {
                this._shownDate = todayKey();
                syncXu();
            }
        }, 30000);
    },

    // Cập nhật số xu / nút / dòng chú thích (không đụng tới góc quay của vòng)
    _render() {
        const el = this._el;
        if (!el) return;
        const v = getXuView();
        // Đang quay: hiện luôn số xu đã trừ, không nhảy lên xuống theo lúc server trả lời
        const shown = this._busy ? Math.max(0, this._startBalance - XU_PER_SPIN) : v.balance;

        el.querySelector('#lucky-balance').textContent = shown;

        const btn = el.querySelector('#lucky-spin');
        const noXu = v.balance < XU_PER_SPIN;
        btn.disabled = this._busy || noXu;
        btn.textContent = this._busy ? 'ĐANG QUAY...' : noXu ? 'HẾT XU' : `QUAY · ${XU_PER_SPIN} XU`;

        el.querySelector('#lucky-foot').textContent = noXu && !this._busy
            ? `Mở app có dấu ★ trên iPad để nhận xu · hôm nay ${v.earned}/${v.total}`
            : `Xu nhận hôm nay: ${v.earned}/${v.total}`;

        // Huy hiệu số xu trên nút vòng quay khi đang thu nhỏ
        const icon = document.getElementById('lucky-icon');
        if (icon) {
            let badge = icon.querySelector('.lucky-badge');
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'lucky-badge';
                icon.appendChild(badge);
            }
            badge.textContent = v.balance;
            badge.hidden = v.balance < 1;
        }
    },

    async _spin() {
        // Khoá NGAY, trước mọi thao tác bất đồng bộ → bấm liên tục cũng chỉ ăn 1 lượt
        if (this._busy) return;
        if (getXuView().balance < XU_PER_SPIN) return;
        this._busy = true;
        this._startBalance = getXuView().balance;

        const el = this._el;
        const disc = el.querySelector('#lucky-disc');
        const result = el.querySelector('#lucky-result');
        el.querySelectorAll('.lw-slot.is-win').forEach((n) => n.classList.remove('is-win'));
        result.textContent = '';
        result.className = 'lucky-result';
        el.querySelector('.lucky-card').classList.add('is-spinning');
        this._render();

        // Chọn ô trúng + tính góc dừng
        const idx = Math.floor(Math.random() * SLOTS.length);
        const slot = SLOTS[idx];
        const jitter = (Math.random() * 2 - 1) * (STEP / 2 - 4); // dừng lệch tâm ô cho tự nhiên, không chạm vạch
        const center = idx * STEP + STEP / 2 + jitter;
        const cur = ((this._rot % 360) + 360) % 360;
        const need = (((-center - cur) % 360) + 360) % 360;
        this._rot += 4 * 360 + need;

        // Ghi server chạy song song với animation
        const saving = spendSpin(slot.coin).then((r) => ({ ok: true, ...r }), (err) => ({ ok: false, err }));

        disc.style.transition = `transform ${SPIN_MS}ms cubic-bezier(0.15, 0.7, 0.1, 1)`;
        disc.style.transform = `rotate(${this._rot}deg)`;

        const [outcome] = await Promise.all([
            Promise.race([saving, sleep(10000).then(() => ({ ok: false, err: new Error('TIMEOUT') }))]),
            sleep(SPIN_MS + 80),
        ]);

        this._busy = false;
        el.querySelector('.lucky-card').classList.remove('is-spinning');

        if (!outcome.ok) {
            const msg = outcome.err?.message === 'NO_XU'
                ? 'Bạn đã hết xu.'
                : outcome.err?.message === 'TIMEOUT'
                    ? 'Mạng chậm — kiểm tra lại ví và số xu của bạn.'
                    : 'Có lỗi kết nối, lượt quay không bị tính.';
            result.textContent = msg;
            result.className = 'lucky-result lucky-result--error';
            this._render();
            return;
        }

        el.querySelector(`.lw-slot[data-slot="${idx}"]`)?.classList.add('is-win');
        if (slot.coin > 0) {
            result.textContent = `🎉 Trúng +${slot.coin} coin!`;
            result.className = 'lucky-result lucky-result--win';
            emitWalletChange(outcome.coin); // header cập nhật số coin ngay
            document.querySelector('.wallet-pill[data-currency="coin"]')?.classList.add('xu-pop');
            setTimeout(() => document.querySelector('.wallet-pill[data-currency="coin"]')?.classList.remove('xu-pop'), 900);
        } else {
            result.textContent = 'Chưa trúng — chúc may mắn lần sau!';
            result.className = 'lucky-result lucky-result--miss';
        }
        this._render();
    },
};
