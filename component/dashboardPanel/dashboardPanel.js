import { ViCoinApp } from '../viCoinApp/viCoinApp.js';
import { VehicleApp } from '../vehicleApp/vehicleApp.js';

// Tiêu đề + icon trên thanh trạng thái khi mở app con
const APP_META = {
    vicoin: { title: 'Ví Coin', icon: 'fa-wallet' },
    vehicle: { title: 'Phương Tiện', icon: 'fa-motorcycle' },
};

function updateClock() {
    const time = document.getElementById("time");
    if (!time) return;
    const now = new Date();
    const h = String(now.getHours()).padStart(2, "0");
    const m = String(now.getMinutes()).padStart(2, "0");
    time.textContent = `${h}:${m}`;
}

updateClock();
setInterval(updateClock, 1000);



// Ảnh thẻ thành viên: thẻ ở trang chủ và avatar tròn trong "Hồ sơ" dùng chung 1 nguồn này
// (avatar chỉ là phần cắt nhỏ của thẻ). Để trống = hiện khung "Chưa có thẻ".
// Cũng có thể truyền qua state.profile.cardImage.
const MEMBER_CARD_IMG = '';

const FEATURES_ROW_1 = [
    { id: 'shop',      label: 'Phương Tiện',     sub: 'Mua & sở hữu xe',      icon: 'fa-motorcycle',   badge: false, accent: 'orange' },
    { id: 'vicoin',    label: 'Ví Coin',         sub: 'Số dư & giao dịch',    icon: 'fa-wallet',       badge: false, accent: 'yellow' },
    { id: 'meet',      label: 'Gặp Gỡ',          sub: 'Kết nối thành viên',   icon: 'fa-handshake',    badge: false, accent: 'blue' },
    { id: 'guide',     label: 'Hướng Dẫn',       sub: 'Làm quen nhanh',       icon: 'fa-book-open',    badge: false, accent: 'violet' },
    { id: 'library',   label: 'Thư Viện',        sub: 'Tài liệu & sách',      icon: 'fa-book',         badge: false, accent: 'mint' },
    { id: 'mail',      label: 'Thư Thư',         sub: 'Hộp thư của bạn',      icon: 'fa-envelope',     badge: true,  accent: 'pink' },
];

const FEATURES_ROW_2 = [
    { id: 'challenge', label: 'Thử Thách',       sub: 'Vượt ải nhận thưởng',  icon: 'fa-mountain',     badge: false, accent: 'pink' },
    { id: 'gacha',     label: 'Vòng Xoáy Vô Hạn', sub: 'Quay nhận vật phẩm',  icon: 'fa-rotate',       badge: false, accent: 'blue' },
    { id: 'squad',     label: 'Đội Hình',        sub: 'Quản lý đội nhóm',     icon: 'fa-people-group', badge: true,  accent: 'yellow' },
    { id: 'course',    label: 'Giáo Trình',      sub: 'Lộ trình học tập',     icon: 'fa-compass',      badge: false, accent: 'violet' },
    { id: 'contribute',label: 'Cống Hiến',       sub: 'Đóng góp điểm',        icon: 'fa-leaf',         badge: false, accent: 'mint' },
    { id: 'trophy',    label: 'Thành Tựu',       sub: 'Cột mốc đã mở',        icon: 'fa-trophy',       badge: false, accent: 'orange' },
];

// Rail trái: luôn hiện, kể cả khi mở app con — chỉ đổi bộ icon theo màn hình đang xem
const railSvg = (paths) => `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">${paths}</svg>`;

const RAIL_ICON = {
    home: railSvg('<path d="m3 11 9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>'),
    user: railSvg('<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
    wallet: railSvg('<path d="M4 6.5h14a2 2 0 0 1 2 2V19H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12v3.5"/><path d="M15 11h5v4h-5a2 2 0 1 1 0-4Z"/>'),
    mission: railSvg('<path d="M8 4h8M9 2h6v4H9z"/><path d="M6 4H5a2 2 0 0 0-2 2v15h18V6a2 2 0 0 0-2-2h-1"/><path d="m8 13 2 2 5-5"/>'),
    gift: railSvg('<path d="M3 9h18v12H3zM2 5h20v4H2zM12 5v16"/><path d="M12 5H7.5A2.5 2.5 0 1 1 10 2.5ZM12 5h4.5A2.5 2.5 0 1 0 14 2.5Z"/>'),
    settings: railSvg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.08a1.7 1.7 0 0 0-1.04-1.56 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15 1.7 1.7 0 0 0 3.08 14H3v-4h.08A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.52V3h4v.08A1.7 1.7 0 0 0 15 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.25.61.85 1 1.51 1H21v4h-.08c-.67 0-1.27.4-1.52 1Z"/>'),
    vehicle: '<i class="fa-solid fa-motorcycle"></i>',
};

// Mỗi nhóm ứng với 1 giá trị data-view của .dboard-card (CSS chỉ hiện nhóm đang xem).
// home: bấm để đổi cột giữa (thẻ / hồ sơ). Nhóm app: "home" = quay về trang chủ, current = app đang mở.
const RAIL_ITEMS = {
    home: [
        { id: 'card', label: 'Trang chủ', icon: RAIL_ICON.home },
        { id: 'profile', label: 'Hồ sơ', icon: RAIL_ICON.user },
    ],
    vicoin: [
        { id: 'home', label: 'Trang chủ', icon: RAIL_ICON.home },
        { id: 'vicoin', label: 'Ví coin', icon: RAIL_ICON.wallet, current: true },
        { id: 'mission', label: 'Nhiệm vụ', icon: RAIL_ICON.mission },
        { id: 'gift', label: 'Hộp quà', icon: RAIL_ICON.gift },
        { id: 'settings', label: 'Cài đặt', icon: RAIL_ICON.settings, end: true },
    ],
    vehicle: [
        { id: 'home', label: 'Trang chủ', icon: RAIL_ICON.home },
        { id: 'vehicle', label: 'Phương Tiện', icon: RAIL_ICON.vehicle, current: true },
    ],
};

function renderRail(side) {
    return Object.entries(RAIL_ITEMS).map(([group, items]) => `
        <div class="dboard-rail__group" data-group="${group}">
            ${items.map((item) => {
                const active = group === 'home' ? item.id === side : item.current;
                return `
                    <button class="dboard-rail__btn${item.end ? ' dboard-rail__btn--end' : ''}" data-rail="${item.id}"${active ? ' aria-current="page"' : ''} aria-label="${item.label}" title="${item.label}">
                        ${item.icon}
                    </button>
                `;
            }).join('')}
        </div>
    `).join('');
}

function renderFeatureIcon(f) {
    return `
        <button class="dboard-feature dboard-feature--${f.accent}" data-feature="${f.id}">
            <div class="dboard-feature__icon">
                <i class="fa-solid ${f.icon}"></i>
                ${f.badge ? '<span class="dboard-feature__dot"></span>' : ''}
            </div>
            <div class="dboard-feature__text">
                <span class="dboard-feature__label">${f.label}</span>
                <span class="dboard-feature__sub">${f.sub}</span>
            </div>
        </button>
    `;
}

export const DashboardPanel = {
    _state: null,
    _open: false,        // mặc định bảng iPad đóng, mở bằng nút trên header
    _side: 'card',       // cột trái trang chủ: 'card' (thẻ thành viên) | 'profile' (hồ sơ) — đổi bằng rail bên trái
    _escBound: false,
    _outsideBound: false,

    render(containerId, state = {}) {
        const el = document.getElementById(containerId) || (() => {
            const d = document.createElement('div');
            d.id = containerId;
            document.body.appendChild(d);
            return d;
        })();

        this._state = state;

        const name = state.name || 'Người chơi';
        const level = state.level ?? 0;
        const xp = state.xp || { current: 0, max: 1 };
        const xpPct = Math.min(100, Math.round((xp.current / xp.max) * 100));
        const tier = state.profile?.tier || 'Tân Thủ';
        const coin = state.survival?.coin ?? 0;
        const missionsDone = 1; // demo: nhiệm vụ đã hoàn thành hôm nay
        const missionsTotal = 3;
        const cardImg = state.profile?.cardImage || MEMBER_CARD_IMG;
        // url() trong biến CSS bị tính theo vị trí file .css, nên đổi sang đường dẫn tuyệt đối theo trang
        const cardUrl = cardImg ? new URL(cardImg, document.baseURI).href : '';
        const initial = (name.trim()[0] || '?').toUpperCase();

        el.className = 'dboard-root' + (this._open ? ' dboard-root--open' : '');
        el.setAttribute('aria-hidden', String(!this._open));
        el.innerHTML = `
            <div class="dboard-device">
                <div class="dboard-device__cam"></div>
                <div class="dboard-screen">
            <div class="dboard-card" data-view="home">
                <div class="ipad-status-bar">
                    <div class="outer-bcn outer-bcn--home">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-xml"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                        Ban Công Nghệ
                    </div>
                    <div class="outer-bcn outer-bcn--app">
                        <button class="outer-bcn__back" id="dboard-app-back" aria-label="Quay lại màn hình chính">
                            <i class="fa-solid fa-chevron-left"></i>
                        </button>
                        <span class="outer-bcn__app-icon"><i class="fa-solid fa-wallet"></i></span>
                        <span class="outer-bcn__app-title">Ví Coin</span>
                    </div>
                    <div class="inner-status-bar">
                        <div class="time" id="time">00:00</div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22C55E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wifi"><path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/></svg>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-battery-full">
                            <!-- Khung ngoài của pin -->
                            <rect x="2" y="6" width="16" height="12" rx="2" />
                            
                            <!-- Đầu cực dương của pin -->
                            <path d="M22 14v-4" />
                            
                            <!-- Phần dung lượng đầy đặn màu xanh bên trong -->
                            <rect x="4" y="8" width="12" height="8" rx="1" fill="#22c55e" stroke="none" />
                        </svg>
                        
                    </div>
                </div>
                <!-- Thân iPad: rail trái (luôn hiện) + trang chủ hoặc app con -->
                <div class="ipad-body">
                    <nav class="dboard-rail" aria-label="Điều hướng chính">
                        ${renderRail(this._side)}
                    </nav>
                    <!-- Trang chủ: thẻ thành viên / hồ sơ + cụm app bên phải -->
                    <div class="ipad-main" data-side="${this._side}" style="--member-card-img: ${cardUrl ? `url('${cardUrl}')` : 'none'}">
                        <section class="dboard-panel dboard-member-panel" aria-labelledby="dboard-member-title">
                            <div class="dboard-panel__head">
                                <h2 id="dboard-member-title">Thẻ thành viên</h2>
                                <span>TỈ LỆ 1.5 : 1</span>
                            </div>
                            <div class="dboard-panel__body">
                                <div class="dboard-member-card" role="img" aria-label="${cardImg ? 'Thẻ thành viên' : 'Thẻ thành viên đang chờ cập nhật'}">
                                    ${cardImg ? '' : '<span class="dboard-member-card__status">Chưa có thẻ</span>'}
                                </div>
                                <p class="dboard-member-note"><i></i><span>Thẻ chính thức sẽ tự thay thế khung này khi được cấp.</span></p>
                            </div>
                        </section>
                        <section class="dboard-panel dboard-profile-panel" aria-labelledby="dboard-profile-title">
                            <div class="dboard-panel__head">
                                <h2 id="dboard-profile-title">Hồ sơ</h2>
                                <span>THÔNG TIN CÁ NHÂN</span>
                            </div>
                            <div class="dboard-panel__body">
                                <div class="dboard-profile">
                                    <div class="dboard-profile__avatar">${cardImg ? '' : initial}</div>
                                    <div class="dboard-profile__info">
                                        <div class="dboard-profile__name">${name}</div>
                                        <span class="dboard-profile__tier">${tier}</span>
                                    </div>
                                </div>
                                <div class="dboard-level">
                                    <div class="dboard-level__row">
                                        <span>Lv.${level}</span>
                                        <span>${xp.current.toLocaleString()}/${xp.max.toLocaleString()}</span>
                                    </div>
                                    <div class="dboard-level__track">
                                        <div class="dboard-level__fill" style="width:${xpPct}%"></div>
                                    </div>
                                </div>
                                <div class="dboard-side-list">
                                    <button class="dboard-side-item" data-action="checkin">
                                        <div class="dboard-side-item__icon icon-star"><i class="fa-solid fa-star"></i></div>
                                        <div class="dboard-side-item__text">
                                            <span class="t">Điểm Danh</span>
                                            <span class="s">7 ngày liên tiếp</span>
                                        </div>
                                        <i class="fa-solid fa-chevron-right dboard-side-item__arrow"></i>
                                    </button>
                                    <button class="dboard-side-item" data-action="activity">
                                        <div class="dboard-side-item__icon icon-fire"><i class="fa-solid fa-fire"></i></div>
                                        <div class="dboard-side-item__text">
                                            <span class="t">Hoạt Động</span>
                                            <span class="s">Hôm nay 3h20m</span>
                                        </div>
                                        <i class="fa-solid fa-chevron-right dboard-side-item__arrow"></i>
                                    </button>
                                    <button class="dboard-side-item" data-action="trophy">
                                        <div class="dboard-side-item__icon icon-trophy"><i class="fa-solid fa-trophy"></i></div>
                                        <div class="dboard-side-item__text">
                                            <span class="t">Thành Tựu</span>
                                            <span class="s">8/32</span>
                                        </div>
                                        <i class="fa-solid fa-chevron-right dboard-side-item__arrow"></i>
                                    </button>
                                </div>
                            </div>
                        </section>
                        <section class="dboard-panel dboard-menu-panel" aria-labelledby="dboard-menu-title">
                            <div class="dboard-panel__head">
                                <h2 id="dboard-menu-title">Menu nhanh</h2>
                                <span>${FEATURES_ROW_1.length + FEATURES_ROW_2.length} CHỨC NĂNG</span>
                            </div>
                            <div class="dboard-feature-grid">
                                ${FEATURES_ROW_1.map(renderFeatureIcon).join('')}
                                ${FEATURES_ROW_2.map(renderFeatureIcon).join('')}
                            </div>
                        </section>
                    </div>
                    <div class="dboard-app-view" id="dboard-app-view"></div>
                </div>
            </div>
                </div>
            </div>
        `;

        this._bindEvents(el);
    },

    _bindEvents(root) {
        if (!this._escBound) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this._open) this.hide();
            });
            this._escBound = true;
        }

        // Click ra ngoài khung iPad thì tự đóng.
        // Dùng composedPath() thay vì e.target.closest() vì nhiều nút bên trong
        // (tab lịch sử, nút đóng modal...) tự vẽ lại DOM ngay trong lúc xử lý click,
        // khiến e.target bị gỡ khỏi cây DOM trước khi sự kiện nổi tới đây —
        // composedPath() chụp lại đường đi của sự kiện tại thời điểm phát ra nên không bị ảnh hưởng.
        if (!this._outsideBound) {
            document.addEventListener('click', (e) => {
                if (!this._open) return;
                const path = typeof e.composedPath === 'function' ? e.composedPath() : [];
                const insideDashboard = path.some((node) => node?.classList?.contains?.('dboard-root'));
                const onTrigger = path.some((node) => node?.id === 'dashboard-trigger-btn');
                if (insideDashboard || onTrigger) return;
                this.hide();
            });
            this._outsideBound = true;
        }

        root.querySelector('#dboard-app-back')?.addEventListener('click', () => this._closeApp());
        root.querySelectorAll('.dboard-rail__btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const group = btn.closest('.dboard-rail__group')?.dataset.group;
                const id = btn.dataset.rail;
                if (group === 'home') {
                    this._setSide(id);
                    return;
                }
                if (id === 'home') {
                    this._closeApp();
                    return;
                }
                if (btn.getAttribute('aria-current') === 'page') return;
                console.log('Mở mục thanh bên:', id);
            });
        });

        root.querySelectorAll('.dboard-feature').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.dataset.feature === 'vicoin') {
                    this._openApp('vicoin');
                    return;
                }
                if (btn.dataset.feature === 'shop') {
                    this._openApp('vehicle');
                    return;
                }
                console.log('Mở tính năng:', btn.dataset.feature);
            });
        });
        root.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Hành động bảng quản lý:', btn.dataset.action);
            });
        });
    },

    /* ===== Đổi cột trái trang chủ: thẻ thành viên <-> hồ sơ ===== */

    _setSide(side) {
        this._side = side;
        const root = this._root();
        if (!root) return;
        const main = root.querySelector('.ipad-main');
        if (main) main.dataset.side = side;
        root.querySelectorAll('.dboard-rail__group[data-group="home"] .dboard-rail__btn').forEach(btn => {
            if (btn.dataset.rail === side) btn.setAttribute('aria-current', 'page');
            else btn.removeAttribute('aria-current');
        });
    },

    /* ===== Mở / đóng app con bên trong iPad (Ví Coin, ...) ===== */

    _openApp(appId) {
        const root = this._root();
        if (!root) return;
        const card = root.querySelector('.dboard-card');
        if (card) card.dataset.view = appId;

        const meta = APP_META[appId];
        if (meta) {
            const title = root.querySelector('.outer-bcn__app-title');
            const icon = root.querySelector('.outer-bcn__app-icon i');
            if (title) title.textContent = meta.title;
            if (icon) icon.className = `fa-solid ${meta.icon}`;
        }

        if (appId === 'vehicle') {
            VehicleApp.render('dboard-app-view');
        }

        if (appId === 'vicoin') {
            const saved = localStorage.getItem('currentUser');
            const userData = saved ? JSON.parse(saved) : null;
            ViCoinApp.render('dboard-app-view', {
                userData,
                onBack: () => this._closeApp(),
            });
        }
    },

    _closeApp() {
        const root = this._root();
        if (!root) return;
        const card = root.querySelector('.dboard-card');
        if (card) card.dataset.view = 'home';
        const view = root.querySelector('#dboard-app-view');
        if (view) view.innerHTML = '';
    },

    /* ===== Đóng / mở bảng iPad (nút trên header gọi vào đây) ===== */

    _root() {
        return document.querySelector('.dboard-root');
    },

    isOpen() {
        return this._open;
    },

    show() {
        const el = this._root();
        if (!el) return;
        this._open = true;
        el.classList.add('dboard-root--open');
        el.setAttribute('aria-hidden', 'false');
        this._emit();
    },

    hide() {
        const el = this._root();
        if (!el) return;
        this._open = false;
        el.classList.remove('dboard-root--open');
        el.setAttribute('aria-hidden', 'true');
        this._closeApp(); // đóng bảng thì luôn quay về màn hình chính, không giữ app con đang mở
        this._setSide('card');
        this._emit();
    },

    toggle() {
        this._open ? this.hide() : this.show();
    },

    // Báo cho header biết để đổi trạng thái nút (khi đóng bằng X hoặc Esc)
    _emit() {
        document.dispatchEvent(new CustomEvent('dashboard:change', {
            detail: { open: this._open },
        }));
    },
};
