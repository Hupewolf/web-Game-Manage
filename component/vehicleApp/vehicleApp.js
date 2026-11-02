// component/vehicleApp/vehicleApp.js
// App "Phương Tiện" mở bên trong bảng iPad (DashboardPanel): mua phương tiện bằng coin
// để rút ngắn thời gian di chuyển phòng <-> outSide. Có nhiều xe thì tự dùng xe nhanh nhất.

import { VEHICLES, TRAVEL_BASE_MS } from '../../share/travelConfig.js';
import { ownedVehicleIds, bestVehicle, travelDuration } from '../../share/travel.js';
import { getCurrentUser } from '../../share/roles.js';
import { ShopError, buyVehicle, refreshAccount, coinOf } from '../shopPanel/shopService.js';

const fmt = (n) => Math.round(n || 0).toLocaleString('vi-VN');

function fmtTime(ms) {
    const s = Math.round(ms / 1000);
    if (s >= 3600) return `${Math.floor(s / 3600)} giờ${s % 3600 >= 60 ? ` ${Math.floor((s % 3600) / 60)} phút` : ''}`;
    if (s >= 60) return `${Math.round(s / 60)} phút`;
    return `${s} giây`;
}

export const VehicleApp = {
    _id: null,
    _busy: false,
    _selected: null,     // id phương tiện đang được chọn xem ở thanh dưới
    _timer: null,        // timer của "Thử di chuyển" (chỉ là mô phỏng, không ảnh hưởng game)

    async render(containerId) {
        this._id = containerId;
        const el = document.getElementById(containerId);
        if (!el) return;
        this._draw();
        await refreshAccount(); // làm mới coin + phương tiện đang sở hữu từ API
        this._draw();
    },

    _draw() {
        const el = document.getElementById(this._id);
        if (!el) return;
        this._stopTrip();
        const user = getCurrentUser();
        const owned = ownedVehicleIds(user);
        const best = bestVehicle(user);
        const coin = coinOf(user);

        // Mặc định chọn phương tiện kế tiếp chưa sở hữu; có đủ hết thì chọn xe đang dùng
        const next = VEHICLES.find((v) => !owned.includes(v.id));
        const sel = VEHICLES.find((v) => v.id === this._selected) || next || best;
        const bottom = this._bottom(sel, owned, best, coin);

        el.innerHTML = `
            <div class="vh-app">
                <header class="vh-top">
                    <div class="vh-title">
                        <h1>Phương tiện</h1>
                        <p>Chọn bạn đồng hành cho chuyến đi tiếp theo</p>
                    </div>
                    <div class="vh-wallet" aria-label="Số dư coin">
                        <span class="vh-coin" aria-hidden="true"></span>
                        <span>${fmt(coin)}</span>
                    </div>
                </header>

                <section class="vh-summary" aria-label="Trạng thái phương tiện">
                    <div class="vh-active">
                        <div class="vh-active__icon"><i class="fa-solid ${best.icon}"></i></div>
                        <div class="vh-active__info">
                            <p class="vh-eyebrow">ĐANG SỬ DỤNG</p>
                            <h2>${best.name}</h2>
                            <p>${best.desc}</p>
                        </div>
                        <div class="vh-active__time">
                            <strong>${fmtTime(travelDuration(best))}</strong>
                            <span>mỗi lần di chuyển</span>
                        </div>
                    </div>
                    <div class="vh-route" id="vh-route">
                        <div class="vh-route__head">
                            <strong>Đường đến hoạt động</strong>
                            <span class="vh-route__label">Sẵn sàng khởi hành</span>
                        </div>
                        <div class="vh-route__track">
                            <span class="vh-route__node"><i class="fa-solid fa-house"></i></span>
                            <div class="vh-route__road">
                                <div class="vh-route__fill"></div>
                                <div class="vh-route__traveler"></div>
                            </div>
                            <span class="vh-route__node"><i class="fa-solid fa-star"></i></span>
                        </div>
                    </div>
                </section>

                <section class="vh-section">
                    <div class="vh-section__head">
                        <div>
                            <h2>Chọn chuyến đi</h2>
                            <p>Mỗi nâng cấp sẽ giúp bạn trở lại cuộc chơi nhanh hơn.</p>
                        </div>
                        <span class="vh-legend">Mở khóa tuần tự →</span>
                    </div>
                    <div class="vh-cards">
                        ${VEHICLES.map((v) => this._card(v, owned, best, sel)).join('')}
                    </div>
                </section>

                <footer class="vh-bottom">
                    <div class="vh-choice">
                        <small>${bottom.label}</small>
                        <strong>${sel.name}</strong>
                        <span class="vh-choice__saving">${fmtTime(TRAVEL_BASE_MS * sel.timeFactor)} / lần di chuyển</span>
                    </div>
                    ${bottom.action}
                </footer>
            </div>`;

        el.querySelectorAll('[data-select]').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._selected = btn.dataset.select;
                this._draw();
            });
        });
        el.querySelectorAll('[data-buy]').forEach((btn) => {
            btn.addEventListener('click', () => this._buy(btn.dataset.buy));
        });
        el.querySelector('[data-trip]')?.addEventListener('click', () => this._startTrip(best));
    },

    _card(v, owned, best, sel) {
        const has = owned.includes(v.id);
        const inUse = best.id === v.id;
        const saved = Math.round((1 - v.timeFactor) * 100);
        const status = inUse ? 'Đang sử dụng' : has ? 'Đã sở hữu' : `${fmt(v.price)} coin`;

        return `
            <button type="button" class="vh-card ${sel.id === v.id ? 'vh-card--selected' : ''} ${has ? '' : 'vh-card--locked'}" data-select="${v.id}" aria-pressed="${sel.id === v.id}">
                <div class="vh-card__top">
                    <span class="vh-card__icon"><i class="fa-solid ${v.icon}"></i></span>
                    <span class="vh-card__badge">${has ? '✓' : '×'}</span>
                </div>
                <h3 class="vh-card__name">${v.name}</h3>
                <p class="vh-card__desc">${v.desc}</p>
                <div class="vh-card__stats">
                    <span class="vh-chip">${fmtTime(TRAVEL_BASE_MS * v.timeFactor)}</span>
                    <span class="vh-chip">${saved > 0 ? `-${saved}%` : 'Mặc định'}</span>
                </div>
                <span class="vh-card__status">${status}</span>
            </button>`;
    },

    // Thanh dưới: nhãn + nút hành động theo trạng thái của phương tiện đang chọn
    _bottom(v, owned, best, coin) {
        const i = VEHICLES.indexOf(v);
        const has = owned.includes(v.id);
        const prev = i > 0 ? VEHICLES[i - 1] : null;
        const locked = !has && prev && !owned.includes(prev.id); // chưa có phương tiện ngay trước nó

        if (best.id === v.id) {
            return { label: 'PHƯƠNG TIỆN HIỆN TẠI', action: `<button class="vh-action" data-trip ${this._timer ? 'disabled' : ''}>Thử di chuyển</button>` };
        }
        if (has) {
            return { label: 'ĐÃ SỞ HỮU', action: `<button class="vh-action" disabled>Đã sở hữu</button>` };
        }
        if (locked) {
            return { label: `CẦN MUA ${prev.name.toUpperCase()} TRƯỚC`, action: `<button class="vh-action vh-action--buy" disabled><i class="fa-solid fa-lock"></i> Chưa mở khoá</button>` };
        }
        if (coin < v.price) {
            return { label: 'NÂNG CẤP TIẾP THEO', action: `<button class="vh-action vh-action--buy" disabled>Không đủ coin · ${fmt(v.price)}</button>` };
        }
        return { label: 'NÂNG CẤP TIẾP THEO', action: `<button class="vh-action vh-action--buy" data-buy="${v.id}" ${this._busy ? 'disabled' : ''}>Mua · ${fmt(v.price)} coin</button>` };
    },

    // "Thử di chuyển": chạy mô phỏng đoạn đường đúng bằng thời gian di chuyển thật của xe đang dùng
    _startTrip(best) {
        const el = document.getElementById(this._id);
        const route = el?.querySelector('#vh-route');
        if (!route || this._timer) return;
        const fill = route.querySelector('.vh-route__fill');
        const traveler = route.querySelector('.vh-route__traveler');
        const label = route.querySelector('.vh-route__label');
        const btn = el.querySelector('[data-trip]');
        const ms = travelDuration(best);

        route.classList.add('vh-route--running');
        label.textContent = 'Đang tới hoạt động…';
        if (btn) { btn.disabled = true; btn.textContent = 'Đang di chuyển…'; }
        fill.style.transition = `width ${ms}ms linear`;
        traveler.style.transition = `left ${ms}ms linear`;
        requestAnimationFrame(() => {
            fill.style.width = '100%';
            traveler.style.left = '100%';
        });

        this._timer = setTimeout(() => {
            this._timer = null;
            route.classList.remove('vh-route--running');
            label.textContent = `Đã đến nơi · ${fmtTime(ms)}`;
            if (btn) { btn.disabled = false; btn.textContent = 'Thử di chuyển'; }
            this._toast('Đến hoạt động rồi!');
            setTimeout(() => {
                fill.style.transition = traveler.style.transition = 'none';
                fill.style.width = '0';
                traveler.style.left = '0';
            }, 900);
        }, ms);
    },

    _stopTrip() {
        clearTimeout(this._timer);
        this._timer = null;
    },

    _toast(text, type = 'ok') {
        const el = document.getElementById(this._id);
        if (!el) return;
        el.querySelector('.vh-toast')?.remove();
        const t = document.createElement('div');
        t.className = `vh-toast vh-toast--${type}`;
        t.textContent = text;
        el.appendChild(t);
        requestAnimationFrame(() => t.classList.add('vh-toast--show'));
        setTimeout(() => t.remove(), 2400);
    },

    async _buy(id) {
        const v = VEHICLES.find((x) => x.id === id);
        if (!v || this._busy) return;
        this._busy = true;
        this._draw();
        let msg = { type: 'ok', text: `Đã mua ${v.name}.` };
        try {
            await buyVehicle(v);
        } catch (err) {
            msg = { type: 'err', text: err instanceof ShopError ? err.message : 'Có lỗi xảy ra, thử lại sau.' };
        } finally {
            this._busy = false;
            this._draw();
        }
        this._toast(msg.text, msg.type);
    },
};
