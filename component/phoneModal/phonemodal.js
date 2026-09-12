import { MissionApp } from '../missionApp/missionApp.js';

const getInitials = (name) => {
	if (!name) return "G"; 
	const words = name.trim().split(/\s+/);
	if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
	return (words[0][0] + words[words.length - 1][0]).toUpperCase();
};

const getAvatarColor = (name) => {
	if (!name) return "#6c757d"; 
	const colors = ["#f56a00", "#7265e6", "#ffbf00", "#00a2ae", "#1890ff", "#eb2f96", "#52c41a", "#e83e8c", "#dc3545", "#fd7e14"];
	let hash = 0;
	for (let i = 0; i < name.length; i++) {
		hash = name.charCodeAt(i) + ((hash << 5) - hash);
	}
	return colors[Math.abs(hash) % colors.length];
};

export const PhoneModal = {
    _initialized: false,

    render() {
        if (document.getElementById('phone-modal-overlay')) return;
        
        const savedUser = localStorage.getItem("currentUser");
        const userData = savedUser ? JSON.parse(savedUser) : null;
        const name = userData?.name || 'Khách';
        const level = userData?.level || 0;
        const xpCurrent = userData?.exp?.current || 0;
        const xpMax = userData?.exp?.max || 20000;
        const xpPct = Math.min((xpCurrent / xpMax) * 100, 100);
        const rank = userData?.rank || 'B-Rank';
        const initials = getInitials(name);
        const bgColor = getAvatarColor(name);

        const overlay = document.createElement('div');
        overlay.id = 'phone-modal-overlay';
        overlay.innerHTML = `
            <div class="phone-modal" id="phone-modal">
                <div class="phone-modal__header">

                </div>

                <div class="phone-modal__stCard">
                    <div class="phone-modal__player">
                        <div class="phone-modal__avatar" style="background-color: ${bgColor}; color: #ffffff; display: flex; align-items: center; justify-content: center; font-weight: bold;">${initials}</div>
                        <div class="phone-modal__info">
                            <span class="phone-modal__name">${name}</span>
                            <span class="phone-modal__level">Cấp ${level}</span>
                            <div class="phone-modal__xp-track">
                                <div class="phone-modal__xp-fill" style="width: ${xpPct}%"></div>
                            </div>
                            <span class="phone-modal__xp-text">${xpCurrent.toLocaleString()} / ${xpMax.toLocaleString()} XP</span>
                        </div>
                    </div>
                    <span class="phone-modal__rank">${rank}</span>
                </div>

                <div class="phone-modal__app-grid" id="phone-app-grid"></div>

                <div class="navigation">
                    <button class="game-menu-btn-phone">
                        <div class="g-icon home-icon"></div>
                        <div class="game-menu-text-phone">Trang chủ</div>
                    </button>
                    <button class="game-menu-btn-phone">
                        <div class="g-icon mission-phone-icon"></div>
                        <div class="game-menu-text-phone">Nhiệm vụ</div>
                    </button>
                    <button class="game-menu-btn-phone">
                        <div class="g-icon explore-icon"></div>
                        <div class="game-menu-text-phone">Khám phá</div>
                    </button>
                    <button class="game-menu-btn-phone">
                        <div class="g-icon social-phone-icon"></div>
                        <div class="game-menu-text-phone">Cộng đồng</div>
                    </button>
                    <button class="game-menu-btn-phone">
                        <div class="g-icon my-icon"></div>
                        <div class="game-menu-text-phone">Cá nhân</div>
                    </button>
                </div>
                <div class="phone-modal__app-view" id="phone-app-view"></div>
            </div>
        `;

        document.body.appendChild(overlay);
        this._renderApps();
        this._bindEvents();
        this._initialized = true;
    },

    _apps: [
        { id: 'mission',  label: 'Nhiệm vụ', icon: '../../img/icon/ri_target-fill.svg' },
        { id: 'todo',     label: 'Tủ đồ',    icon: '../../img/icon/ph_handbag-fill.svg' },
        { id: 'shop',     label: 'Shopuu',    icon: '../../img/icon/icon-park-outline_shopping.svg' },
        { id: 'map',      label: 'Bản đồ',   icon: '../../img/icon/stash_pin-place.svg' },
        { id: 'trophy',   label: 'Thành tích',icon: '../../img/icon/solar_cup-star-bold.svg' },
        { id: 'guild',    label: 'Bang hội',  icon: '../../img/icon/ion_people-sharp.svg' },
        { id: 'mail',     label: 'Thư',       icon: '../../img/icon/tdesign_share.svg' },
        { id: 'event',    label: 'Sự kiện',   icon: '../../img/icon/simple-line-icons_calender.svg' },
        { id: 'ranking',  label: 'BXH',       icon: '../../img/icon/solar_cup-star-bold.svg' },
        { id: 'settings', label: 'Cài đặt',   icon: '../../img/icon/ix_book.svg' },
        { id: 'more',     label: 'Khác',      icon: '../../img/icon/mynaui_plus-solid.svg' },
    ],

    _renderApps() {
        const grid = document.getElementById('phone-app-grid');
        if (!grid) return;
        grid.innerHTML = this._apps.map(app => `
            <button class="phone-app-item" data-app="${app.id}">
                <div class="phone-app-item__icon">
                    <img src="${app.icon}" alt="${app.label}">
                </div>
                <span class="phone-app-item__label">${app.label}</span>
            </button>
        `).join('');
    },

    _bindEvents() {

        document.getElementById('phone-modal-overlay')
            ?.addEventListener('click', (e) => {
                if (e.target.id === 'phone-modal-overlay') this.hide();
            });

        document.getElementById('phone-app-grid')
            ?.addEventListener('click', (e) => {
                const btn = e.target.closest('.phone-app-item');
                if (!btn) return;
                this._onAppClick(btn.dataset.app);
            });

    },

    // _bindNavigation() {
    //     const list = document.querySelectorAll('#phone-modal .list');
    //     const indicator = document.querySelector('#phone-modal .indicator');

    //     // Hàm tính và set vị trí indicator dựa theo item thực tế
    //     const moveIndicator = (item) => {
    //         if (!indicator) return;
    //         const itemWidth = item.offsetWidth;
    //         const indicatorWidth = indicator.offsetWidth;
    //         const index = [...list].indexOf(item);
    //         const offset = index * itemWidth + (itemWidth - indicatorWidth) / 2;
    //         indicator.style.transform = `translateX(${offset}px)`;
    //     };

    //     // Set vị trí ban đầu cho item active (li đầu tiên)
    //     // Dùng requestAnimationFrame để chắc chắn DOM đã layout xong
    //     requestAnimationFrame(() => {
    //         const activeItem = document.querySelector('#phone-modal .list.active');
    //         if (activeItem) moveIndicator(activeItem);
    //     });

    //     list.forEach((item) => {
    //         item.addEventListener('click', function () {
    //             list.forEach(i => i.classList.remove('active'));
    //             this.classList.add('active');
    //             moveIndicator(this);
    //         });

    //         // Ripple
    //         const link = item.querySelector('a');
    //         const rippleContainer = document.createElement('div');
    //         rippleContainer.classList.add('ripple-container');
    //         link.prepend(rippleContainer);

    //         link.addEventListener('click', function (e) {
    //             const rect = rippleContainer.getBoundingClientRect();
    //             const x = e.clientX - rect.left;
    //             const y = e.clientY - rect.top;

    //             const ripple = document.createElement('span');
    //             ripple.classList.add('ripple');
    //             ripple.style.left = `${x}px`;
    //             ripple.style.top = `${y}px`;
    //             rippleContainer.appendChild(ripple);

    //             setTimeout(() => ripple.remove(), 600);
    //         });
    //     });
    // },

    _onAppClick(appId) {
        if (appId === 'mission') {
            this._openApp('mission');
            return;
        }
        console.log('app clicked:', appId);
    },

    _openApp(appId) {
        const view = document.getElementById('phone-app-view');
        if (!view) return;

        view.classList.add('phone-modal__app-view--active');

        if (appId === 'mission') {
            MissionApp.render('phone-app-view', {
                onBack: () => this._closeApp(),
            });
        }
    },

    _closeApp() {
        const view = document.getElementById('phone-app-view');
        if (!view) return;
        view.classList.remove('phone-modal__app-view--active');
        view.innerHTML = '';
    },

    show() {
        if (!this._initialized) this.render();
        const overlay = document.getElementById('phone-modal-overlay');
        requestAnimationFrame(() => {
            overlay?.classList.add('phone-modal-overlay--visible');
        });
    },

    hide() {
        const overlay = document.getElementById('phone-modal-overlay');
        overlay?.classList.remove('phone-modal-overlay--visible');
        this._closeApp();
    },
};