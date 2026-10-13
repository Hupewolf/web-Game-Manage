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
    _msg: null,

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
        const user = getCurrentUser();
        const owned = ownedVehicleIds(user);
        const best = bestVehicle(user);
        const coin = coinOf(user);

        el.innerHTML = `
            <div class="vh-app">
                <div class="vh-summary">
                    <div>
                        <div class="vh-summary__label">Đang dùng</div>
                        <div class="vh-summary__value"><i class="fa-solid ${best.icon}"></i> ${best.name}</div>
                    </div>
                    <div>
                        <div class="vh-summary__label">Thời gian di chuyển</div>
                        <div class="vh-summary__value">${fmtTime(travelDuration(best))}</div>
                    </div>
                    <div>
                        <div class="vh-summary__label">Số dư</div>
                        <div class="vh-summary__value">${fmt(coin)} coin</div>
                    </div>
                </div>
                ${this._msg ? `<div class="vh-msg vh-msg--${this._msg.type}">${this._msg.text}</div>` : ''}
                <div class="vh-flex">
                    ${VEHICLES.map((v, i) => this._card(v, i, owned, best, coin)).join('')}
                </div>
            </div>`;

        el.querySelectorAll('[data-buy]').forEach((btn) => {
            btn.addEventListener('click', () => this._buy(btn.dataset.buy));
        });
        el.querySelectorAll('[data-locked]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const v = VEHICLES.find((x) => x.id === btn.dataset.locked);
                const prev = VEHICLES[VEHICLES.indexOf(v) - 1];
                this._msg = { type: 'err', text: `Bạn cần mua ${prev.name} trước khi mua ${v.name}.` };
                this._draw();
            });
        });
    },

    _card(v, i, owned, best, coin) {
        const has = owned.includes(v.id);
        const prev = i > 0 ? VEHICLES[i - 1] : null;
        const locked = !has && prev && !owned.includes(prev.id); // chưa có phương tiện ngay trước nó
        const inUse = best.id === v.id;
        const saved = Math.round((1 - v.timeFactor) * 100);
        let action;
        if (inUse) action = `<button class="vh-btn vh-btn--use" disabled>Đang dùng</button>`;
        else if (has) action = `<button class="vh-btn" disabled>Đã sở hữu</button>`;
        else if (locked) action = `<button class="vh-btn vh-btn--locked" data-locked="${v.id}"><i class="fa-solid fa-lock"></i> Chưa mở khoá</button>`;
        else if (coin < v.price) action = `<button class="vh-btn" disabled>Không đủ coin · ${fmt(v.price)}</button>`;
        else action = `<button class="vh-btn vh-btn--buy" data-buy="${v.id}" ${this._busy ? 'disabled' : ''}>Mua · ${fmt(v.price)} coin</button>`;

        return `
            <div class="vh-card ${inUse ? 'vh-card--active' : ''}">
                <div class="vh-card-top">
                    <div class="vh-card__icon"><i class="fa-solid ${v.icon}"></i></div>
                    <div class="vh-card__name">${v.name}</div>
                    <div class="vh-card__desc">${v.desc}</div>
                </div>
                <div class="vh-card-down">
                    <div class="vh-card__time">${fmtTime(TRAVEL_BASE_MS * v.timeFactor)}${saved > 0 ? ` <span>(-${saved}%)</span>` : ''}</div>
                    ${action}
                </div>
            </div>`;
    },

    async _buy(id) {
        const v = VEHICLES.find((x) => x.id === id);
        if (!v || this._busy) return;
        this._busy = true;
        this._msg = null;
        this._draw();
        try {
            await buyVehicle(v);
            this._msg = { type: 'ok', text: `Đã mua ${v.name}.` };
        } catch (err) {
            this._msg = { type: 'err', text: err instanceof ShopError ? err.message : 'Có lỗi xảy ra, thử lại sau.' };
        } finally {
            this._busy = false;
            this._draw();
        }
    },
};
