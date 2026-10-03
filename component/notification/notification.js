import { fetchAccount } from '../../share/accountApi.js';
import { getCurrentUser, getRole, ROLE } from '../../share/roles.js';
import { claimGift, getInbox, describeItems } from '../shopPanel/giftService.js';

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export const NotificationPanel = {
    _initialized: false,

    // Quà nguyên liệu admin gửi cho tsv (đọc từ inbox trên server). Chỉ tài khoản tsv có.
    _gifts: [],
    _inboxTimer: null,

    // Demo data — sau này có thể thay bằng dữ liệu thật từ server/socket
    _notifications: [
        {
            id: 1,
            icon: '../../img/icon/burger.png',
            title: 'Sự kiện Quái Vật xuất hiện!',
            message: 'Quái vật tungtungtung sahuar xuất hiện',
            time: '21/6/2026',
            unread: true,
        },
        {
            id: 2,
            icon: '../../img/icon/burger.png',
            title: 'Đơn hàng đã về!',
            message: 'Bạn vừa nhận 3 món ăn từ FoodApp. Ghé tủ đồ kiểm tra ngay nhé',
            time: '21/6/2026',
            unread: true,
        },
        {
            id: 3,
            icon: '../../img/icon/burger.png',
            title: 'Boss tuần xuất hiện!',
            message: 'Bánh mì ramramram',
            time: '20/6/2026',
            unread: false,
        },
        {
            id: 4,
            icon: '../../img/icon/burger.png',
            title: 'Đơn hàng đang được giao',
            message: 'Burger Thợ Săn của bạn sẽ đến trong khoảng 5 phút nữa.',
            time: '19/6/2026',
            unread: false,
        },
    ],

    render() {
        if (document.getElementById('notification-panel')) return;

        const panel = document.createElement('div');
        panel.id = 'notification-panel';
        panel.className = 'notification-panel';
        panel.innerHTML = `
            <div class="notification-panel__header">
                <span class="notification-panel__title">Thông báo</span>
                <button class="notification-panel__mark-all" id="notification-mark-all">Đọc tất cả</button>
            </div>
            <div class="notification-panel__list" id="notification-list"></div>
            <button class="notification-panel__view-all">Xem tất cả thông báo</button>
        `;

        document.body.appendChild(panel);
        this._renderList();
        this._bindEvents();
        this._initialized = true;
    },

    _renderList() {
        const list = document.getElementById('notification-list');
        if (!list) return;

        if (!this._notifications.length && !this._gifts.length) {
            list.innerHTML = `<div class="notification-panel__empty">Không có thông báo mới</div>`;
            return;
        }

        const gifts = this._gifts.map(g => `
            <div class="notification-item ${g.claimed ? '' : 'notification-item--unread'}" data-gift="${esc(g.id)}">
                <span class="notification-item__icon"><img src="../../img/icon/mdi_gift.svg"></span>
                <div class="notification-item__body">
                    <div class="notification-item__title-row">
                        <span class="notification-item__dot"></span>
                        <span class="notification-item__title">Nguyên liệu từ ${esc(g.from?.name || 'Admin')}</span>
                    </div>
                    <p class="notification-item__message">${esc(describeItems(g.items))}</p>
                    <span class="notification-item__time">${esc(g.time)}</span>
                    ${g.claimed
                        ? `<span class="notification-item__done">Đã nhận ✓</span>`
                        : `<button class="notification-item__btn" data-claim="${esc(g.id)}">Nhận</button>`}
                </div>
            </div>
        `).join('');

        const demos = this._notifications.map(n => `
            <div class="notification-item ${n.unread ? 'notification-item--unread' : ''}" data-id="${n.id}">
                <span class="notification-item__icon"><img src="${n.icon}"></span>
                <div class="notification-item__body">
                    <div class="notification-item__title-row">
                        <span class="notification-item__dot"></span>
                        <span class="notification-item__title">${n.title}</span>
                    </div>
                    <p class="notification-item__message">${n.message}</p>
                    <span class="notification-item__time">${n.time}</span>
                </div>
            </div>
        `).join('');

        list.innerHTML = gifts + demos;
    },

    _bindEvents() {
        // Bấm "Nhận" trên quà nguyên liệu
        document.getElementById('notification-list')?.addEventListener('click', async (e) => {
            const btn = e.target.closest('[data-claim]');
            if (!btn || btn.disabled) return;
            btn.disabled = true;
            btn.textContent = 'Đang nhận...';
            try {
                await claimGift(btn.dataset.claim);
                this._gifts = getInbox(getCurrentUser());
            } catch (err) {
                alert(err?.message || 'Không nhận được quà, thử lại sau.');
                await this.refreshInbox();
            }
            this._renderList();
            this._emitChange();
        });

        document.getElementById('notification-mark-all')
            ?.addEventListener('click', () => this.markAllRead());

        // Click ra ngoài thì tự đóng
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notification-panel');
            const trigger = document.querySelector('.notification-btn');
            if (!panel?.classList.contains('notification-panel--visible')) return;
            if (panel.contains(e.target) || trigger?.contains(e.target)) return;
            this.hide();
        });
    },

    _position(triggerEl) {
        const panel = document.getElementById('notification-panel');
        if (!panel || !triggerEl) return;
        const rect = triggerEl.getBoundingClientRect();
        panel.style.top = `${rect.bottom + 10}px`;
        panel.style.right = `${window.innerWidth - rect.right}px`;
    },

    // Chỉ tài khoản tsv có quà: nạp từ bản đã lưu cho huy hiệu hiện ngay, rồi hỏi server định kỳ
    startInbox() {
        if (this._inboxTimer) return;
        const me = getCurrentUser();
        if (!me?.id || getRole(me) !== ROLE.TSV) return;
        this._gifts = getInbox(me);
        this._renderList();
        this._emitChange();
        this.refreshInbox();
        this._inboxTimer = setInterval(() => {
            if (!document.hidden) this.refreshInbox();
        }, 30000);
    },

    async refreshInbox() {
        const me = getCurrentUser();
        if (!me?.id) return;
        try {
            const acc = await fetchAccount(me.id);
            this._gifts = getInbox(acc);
            const cur = getCurrentUser();
            if (cur) {
                cur.inbox = Array.isArray(acc.inbox) ? acc.inbox : [];
                localStorage.setItem('currentUser', JSON.stringify(cur));
            }
            this._renderList();
            this._emitChange();
        } catch (err) {
            console.warn('Thông báo: chưa tải được quà nguyên liệu, sẽ thử lại.', err);
        }
    },

    markAllRead() {
        this._notifications.forEach(n => n.unread = false);
        this._renderList();
        this._emitChange();
    },

    // Demo: gọi NotificationPanel.addNotification({...}) khi có đơn ăn về / quái xuất hiện
    addNotification({ icon = '🔔', title, message, time = 'Vừa xong' }) {
        this._notifications.unshift({ id: Date.now(), icon, title, message, time, unread: true });
        this._renderList();
        this._emitChange();
    },

    hasUnread() {
        return this.unreadCount() > 0;
    },

    // Số thông báo chưa đọc — header dùng để hiện huy hiệu đỏ
    unreadCount() {
        return this._notifications.filter(n => n.unread).length + this._gifts.filter(g => !g.claimed).length;
    },

    _emitChange() {
        document.dispatchEvent(new CustomEvent('notification:change', {
            detail: { unread: this.unreadCount() },
        }));
    },

    toggle(triggerEl) {
        const panel = document.getElementById('notification-panel');
        if (panel?.classList.contains('notification-panel--visible')) {
            this.hide();
        } else {
            this.show(triggerEl);
        }
    },

    show(triggerEl) {
        if (!this._initialized) this.render();
        if (this._inboxTimer) this.refreshInbox(); // mở bảng là hỏi server xem có quà mới không
        this._position(triggerEl);
        const panel = document.getElementById('notification-panel');
        requestAnimationFrame(() => {
            panel?.classList.add('notification-panel--visible');
        });
    },

    hide() {
        document.getElementById('notification-panel')
            ?.classList.remove('notification-panel--visible');
    },
};
