// component/shopPanel/shopPanel.js
// Giao diện cửa hàng. Tab hiển thị theo vai trò:
//   Món ăn          : mọi vai trò (mua món từ sàn bằng coin, sàn có món mới mua được)
//   Chế biến        : tsv / admin (1 rau + 2 thịt + 1 tinh bột -> 1 món)
//   Bán món         : tsv / admin (đưa món đã chế biến lên sàn chung, nhận coin)
//   Gửi nguyên liệu : chỉ admin (gửi cho tsv, tsv nhận trong thông báo ở header)

import { SHOPS, INGREDIENTS } from './shopConfig.js';
import { can, getRole, getCurrentUser, ROLE_LABEL } from '../../share/roles.js';
import {
    ShopError, buyFood, craftFood, sellFood,
    refreshAccount, coinOf, getIngredients, getFoodCount, maxCraftable, getMarketStock,
} from './shopService.js';
import { listTsvAccounts, sendIngredients } from './giftService.js';

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

const TABS = [
    { id: 'food',  label: 'Món ăn',          perm: 'buy_food' },
    { id: 'craft', label: 'Chế biến',        perm: 'craft_food' },
    { id: 'sell',  label: 'Bán món',         perm: 'sell_food' },
    { id: 'send',  label: 'Gửi nguyên liệu', perm: 'send_ingredient' },
];

export const ShopPanel = {
    _root: null,
    _shop: null,
    _tab: 'food',
    _busy: false,
    _qty: {},
    _stock: null, // số món trên sàn; null = đang tải
    _recipients: null, // null = chưa tải, [] = không có tsv nào
    _recipientsError: '',
    _to: '',
    _toastTimer: null,

    async render(containerId, shopId) {
        const root = document.getElementById(containerId);
        if (!root) return;
        this._root = root;
        this._shop = SHOPS[shopId];
        if (!this._shop) return;

        root.className = 'shop-root';
        if (!getCurrentUser()) {
            root.innerHTML = `<div class="shop-card"><p class="shop-empty">Bạn cần đăng nhập để vào cửa hàng.</p></div>`;
            return;
        }

        root.addEventListener('click', (e) => this._onClick(e));
        root.addEventListener('change', (e) => {
            if (e.target.id === 'shop-gift-to') {
                this._to = e.target.value;
                this._draw();
            }
        });
        this._draw(); // vẽ ngay bằng dữ liệu đang lưu
        await Promise.all([refreshAccount(), this._loadStock()]); // rồi làm mới từ API (role, coin, kho, sàn)
        this._draw();
    },

    async _loadStock() {
        try {
            this._stock = await getMarketStock(this._shop);
        } catch (err) {
            console.warn('Cửa hàng: chưa tải được sàn giao dịch.', err);
        }
    },

    _tabs() {
        const user = getCurrentUser();
        return TABS.filter((t) => can(t.perm, user));
    },

    _key(name) {
        // số lượng gửi mặc định 0, còn lại mặc định 1
        return this._qty[name] ?? (name.startsWith('gift-') ? 0 : 1);
    },

    _draw() {
        const shop = this._shop;
        const user = getCurrentUser();
        const tabs = this._tabs();
        if (!tabs.some((t) => t.id === this._tab)) this._tab = tabs[0]?.id;

        const role = getRole(user);
        const ing = getIngredients(user);
        const showStock = can('craft_food', user) || can('receive_ingredient', user);

        this._root.innerHTML = `
            <div class="shop-awning" aria-hidden="true"></div>
            <div class="shop-card">
                <div class="shop-head">
                    <div class="shop-head__title">
                        <i class="fa-solid fa-store"></i>
                        <div>
                            <h1>${shop.name}</h1>
                            <p>${shop.tagline}</p>
                        </div>
                    </div>
                    <span class="shop-role shop-role--${role}">Vai trò: ${ROLE_LABEL[role]}</span>
                </div>

                ${showStock ? `
                <div class="shop-stock">
                    <span class="shop-stock__label">Kho nguyên liệu</span>
                    ${Object.values(INGREDIENTS).map((i) => `
                        <span class="shop-stock__item"><i class="fa-solid ${i.icon}"></i> ${i.name}: <b>${ing[i.id]}</b></span>
                    `).join('')}
                </div>` : ''}

                <div class="shop-tabs">
                    ${tabs.map((t) => `
                        <button class="shop-tab${t.id === this._tab ? ' is-active' : ''}" data-action="tab" data-tab="${t.id}">${t.label}</button>
                    `).join('')}
                </div>

                <div class="shop-body">
                    ${this._tab === 'food' ? this._foodTab(user) : ''}
                    ${this._tab === 'craft' ? this._craftTab(user) : ''}
                    ${this._tab === 'sell' ? this._sellTab(user) : ''}
                    ${this._tab === 'send' ? this._sendTab() : ''}
                </div>
            </div>
            <div class="shop-toast" id="shop-toast"></div>
        `;
    },

    _stepper(key, max = 99, min = 1) {
        const q = Math.min(Math.max(this._key(key), min), max);
        return `
            <div class="shop-qty">
                <button data-action="qty" data-key="${key}" data-delta="-1" data-max="${max}" data-min="${min}" aria-label="Giảm">−</button>
                <span>${q}</span>
                <button data-action="qty" data-key="${key}" data-delta="1" data-max="${max}" data-min="${min}" aria-label="Tăng">+</button>
            </div>`;
    },

    _foodTab(user) {
        const f = this._shop.food;
        const stock = this._stock; // null = đang tải
        const max = Math.max(stock ?? 0, 1);
        const q = Math.min(this._key('food'), max);
        const total = f.price * q;
        const poor = coinOf(user) < total;
        const soldOut = stock !== null && stock < 1;
        const label = stock === null ? 'Đang tải sàn...' : soldOut ? 'Sàn hết món' : poor ? 'Không đủ coin' : 'Mua';
        return `
            <div class="shop-grid">
                <div class="shop-item">
                    <img class="shop-item__img" src="${f.image}" alt="${f.nameItems}">
                    <h3>${f.nameItems}</h3>
                    <p class="shop-item__meta">Hồi +${f.indexItem} Đói</p>
                    <p class="shop-item__meta">Trên sàn: <b>${stock === null ? '...' : stock}</b> · Đang có: <b>${getFoodCount(user, f)}</b></p>
                    ${this._stepper('food', max)}
                    <button class="shop-btn" data-action="buy-food" ${stock === null || soldOut || poor || this._busy ? 'disabled' : ''}>
                        ${label} · ${fmt(total)} coin
                    </button>
                </div>
            </div>`;
    },

    _sellTab(user) {
        const f = this._shop.food;
        const have = getFoodCount(user, f);
        const q = Math.min(this._key('sell'), Math.max(have, 1));
        return `
            <div class="shop-craft">
                <div class="shop-craft__recipe">
                    <img src="${f.image}" alt="${f.nameItems}">
                    <div>
                        <h3>Bán ${f.nameItems} lên sàn</h3>
                        <p>Giá cố định ${fmt(f.price)} coin / món · Ai cũng mua được từ sàn</p>
                    </div>
                </div>
                <p class="shop-item__meta">Đang có: <b>${have}</b> món · Trên sàn: <b>${this._stock === null ? '...' : this._stock}</b></p>
                ${this._stepper('sell', Math.max(have, 1))}
                <button class="shop-btn" data-action="sell-food" ${have < 1 || this._busy ? 'disabled' : ''}>
                    ${have < 1 ? 'Chưa có món để bán' : `Bán x${q}`} · +${fmt(f.price * (have < 1 ? 0 : q))} coin
                </button>
            </div>`;
    },

    _sendTab() {
        let recipient;
        if (this._recipients === null) {
            recipient = `<p class="shop-item__meta">${this._recipientsError || 'Đang tải danh sách tài khoản tsv...'}</p>`;
        } else if (!this._recipients.length) {
            recipient = '<p class="shop-item__meta">Chưa có tài khoản nào có vai trò tsv.</p>';
        } else {
            recipient = `
                <select class="shop-select" id="shop-gift-to" ${this._busy ? 'disabled' : ''}>
                    <option value="">— Chọn tài khoản tsv —</option>
                    ${this._recipients.map((r) => `
                        <option value="${r.id}" ${r.id === this._to ? 'selected' : ''}>${esc(r.name)}${r.mssv ? ` (${esc(r.mssv)})` : ''}</option>
                    `).join('')}
                </select>`;
        }

        const total = Object.keys(INGREDIENTS).reduce((s, id) => s + this._key(`gift-${id}`), 0);
        const canSend = this._to && total > 0 && !this._busy;
        return `
            <div class="shop-craft shop-send">
                <h3>Gửi nguyên liệu cho tsv</h3>
                <p class="shop-item__meta">Gửi miễn phí. Tài khoản tsv nhận thông báo ở header và bấm "Nhận" để bỏ vào kho.</p>
                ${recipient}
                <div class="shop-send__row">
                    ${Object.values(INGREDIENTS).map((i) => `
                        <div class="shop-send__ing">
                            <div class="shop-item__icon shop-item__icon--${i.id} shop-send__icon"><i class="fa-solid ${i.icon}"></i></div>
                            <div class="shop-send__col">
                                <span>${i.name}</span>
                                ${this._stepper(`gift-${i.id}`, 99, 0)}
                            </div>
                        </div>
                    `).join('')}
                    <button class="shop-btn shop-send__btn" data-action="send" ${canSend ? '' : 'disabled'}>
                        ${!this._to ? 'Chọn người nhận' : total < 1 ? 'Chọn số lượng' : 'Gửi'}
                    </button>
                </div>
            </div>`;
    },

    async _loadRecipients() {
        if (this._recipients !== null || this._loadingRecipients) return;
        this._loadingRecipients = true;
        try {
            this._recipients = await listTsvAccounts();
            this._recipientsError = '';
        } catch (err) {
            this._recipientsError = err.message || 'Không tải được danh sách tài khoản.';
            this._recipients = null;
        } finally {
            this._loadingRecipients = false;
            if (this._tab === 'send') this._draw();
        }
    },

    _craftTab(user) {
        const shop = this._shop;
        const have = getIngredients(user);
        const max = maxCraftable(user, shop.recipe);
        const q = Math.min(this._key('craft'), Math.max(max, 1));
        const recipeText = Object.entries(shop.recipe)
            .map(([id, n]) => `${n} ${INGREDIENTS[id].name}`).join(' + ');
        return `
            <div class="shop-craft">
                <div class="shop-craft__recipe">
                    <img src="${shop.food.image}" alt="${shop.food.nameItems}">
                    <div>
                        <h3>${shop.food.nameItems}</h3>
                        <p>${recipeText} → 1 phần</p>
                    </div>
                </div>
                <ul class="shop-craft__need">
                    ${Object.entries(shop.recipe).map(([id, n]) => {
                        const ok = have[id] >= n * q;
                        return `<li class="${ok ? 'is-ok' : 'is-missing'}">
                            <i class="fa-solid ${INGREDIENTS[id].icon}"></i> ${INGREDIENTS[id].name}
                            <span>${have[id]} / ${n * q}</span>
                        </li>`;
                    }).join('')}
                </ul>
                <p class="shop-item__meta">Có thể chế biến tối đa: <b>${max}</b> phần · Đang có món: <b>${getFoodCount(user, shop.food)}</b></p>
                ${this._stepper('craft', Math.max(max, 1))}
                <button class="shop-btn" data-action="craft" ${max < 1 || this._busy ? 'disabled' : ''}>
                    ${max < 1 ? 'Thiếu nguyên liệu' : `Chế biến x${q}`}
                </button>
            </div>`;
    },

    async _onClick(e) {
        const btn = e.target.closest('[data-action]');
        if (!btn || btn.disabled) return;
        const action = btn.dataset.action;

        if (action === 'tab') {
            this._tab = btn.dataset.tab;
            if (this._tab === 'send') this._loadRecipients();
            if (this._tab === 'food' || this._tab === 'sell') this._loadStock().then(() => this._draw());
            return this._draw();
        }
        if (action === 'qty') {
            const key = btn.dataset.key;
            const max = Number(btn.dataset.max) || 99;
            const min = Number(btn.dataset.min ?? 1);
            this._qty[key] = Math.min(max, Math.max(min, this._key(key) + Number(btn.dataset.delta)));
            return this._draw();
        }

        if (this._busy) return;
        this._busy = true;
        this._draw();
        try {
            if (action === 'buy-food') {
                const n = Math.min(this._key('food'), Math.max(this._stock ?? 1, 1));
                await buyFood(this._shop, n);
                this._toast(`Đã mua ${n} ${this._shop.food.nameItems}.`, 'ok');
            } else if (action === 'send') {
                const items = Object.fromEntries(Object.keys(INGREDIENTS).map((id) => [id, this._key(`gift-${id}`)]));
                const who = this._recipients?.find((r) => r.id === this._to)?.name || 'tsv';
                await sendIngredients(this._to, items);
                for (const id of Object.keys(INGREDIENTS)) this._qty[`gift-${id}`] = 0;
                this._toast(`Đã gửi quà cho ${who}.`, 'ok');
            } else if (action === 'sell-food') {
                const n = Math.min(this._key('sell'), Math.max(getFoodCount(getCurrentUser(), this._shop.food), 1));
                await sellFood(this._shop, n);
                this._qty.sell = 1;
                this._toast(`Đã bán ${n} ${this._shop.food.nameItems} lên sàn (+${fmt(this._shop.food.price * n)} coin).`, 'ok');
            } else if (action === 'craft') {
                const n = Math.min(this._key('craft'), maxCraftable(getCurrentUser(), this._shop.recipe));
                await craftFood(this._shop, n);
                this._toast(`Đã chế biến ${n} ${this._shop.food.nameItems}.`, 'ok');
            }
        } catch (err) {
            if (err instanceof ShopError) this._toast(err.message, 'err');
            else { console.error(err); this._toast('Có lỗi xảy ra, thử lại sau.', 'err'); }
        } finally {
            await this._loadStock();
            this._busy = false;
            this._draw();
        }
    },

    _toast(msg, type = 'ok') {
        // _draw() vẽ lại toàn bộ nên vẽ xong mới hiện toast
        setTimeout(() => {
            const el = document.getElementById('shop-toast');
            if (!el) return;
            el.textContent = msg;
            el.className = `shop-toast shop-toast--${type} is-show`;
            clearTimeout(this._toastTimer);
            this._toastTimer = setTimeout(() => el.classList.remove('is-show'), 2600);
        }, 0);
    },
};
