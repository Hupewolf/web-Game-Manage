export const NotificationPanel = {
    _initialized: false,

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

        if (!this._notifications.length) {
            list.innerHTML = `<div class="notification-panel__empty">Không có thông báo mới</div>`;
            return;
        }

        list.innerHTML = this._notifications.map(n => `
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
    },

    _bindEvents() {
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

    markAllRead() {
        this._notifications.forEach(n => n.unread = false);
        this._renderList();
    },

    // Demo: gọi NotificationPanel.addNotification({...}) khi có đơn ăn về / quái xuất hiện
    addNotification({ icon = '🔔', title, message, time = 'Vừa xong' }) {
        this._notifications.unshift({ id: Date.now(), icon, title, message, time, unread: true });
        this._renderList();
    },

    hasUnread() {
        return this._notifications.some(n => n.unread);
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
