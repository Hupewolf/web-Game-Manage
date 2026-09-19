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



const FEATURES_ROW_1 = [
    { id: 'shop',      label: 'Cửa Hàng',        icon: 'fa-bag-shopping', badge: true,  grad: 'grad-orange' },
    { id: 'event',     label: 'Sự Kiện',         icon: 'fa-gift',         badge: true,  grad: 'grad-pink' },
    { id: 'meet',      label: 'Gặp Gỡ',          icon: 'fa-handshake',    badge: false, grad: 'grad-blue' },
    { id: 'guide',     label: 'Hướng Dẫn',       icon: 'fa-book-open',    badge: false, grad: 'grad-purple' },
    { id: 'library',   label: 'Thư Viện',        icon: 'fa-book',         badge: false, grad: 'grad-teal' },
    { id: 'mail',      label: 'Thư Thư',         icon: 'fa-envelope',     badge: true,  grad: 'grad-indigo' },
];

const FEATURES_ROW_2 = [
    { id: 'challenge', label: 'Thử Thách',       icon: 'fa-mountain',     badge: false, grad: 'grad-red' },
    { id: 'gacha',     label: 'Vòng Xoáy Vô Hạn', icon: 'fa-rotate',      badge: false, grad: 'grad-sky' },
    { id: 'squad',     label: 'Đội Hình',        icon: 'fa-people-group', badge: true,  grad: 'grad-cyan' },
    { id: 'course',    label: 'Giáo Trình',      icon: 'fa-compass',     badge: false, grad: 'grad-violet' },
    { id: 'contribute',label: 'Cống Hiến',       icon: 'fa-leaf',        badge: false, grad: 'grad-green' },
    { id: 'trophy',    label: 'Thành Tựu',       icon: 'fa-trophy',      badge: false, grad: 'grad-navy' },
];

const HIGHLIGHTS = [
    { id: 'journey', the: '1', title: 'Bắt đầu hành trình tu tiên', sub: 'Đạt cấp 15', progress: 12, max: 15, icon: 'fa-scroll' },
    { id: 'event',  the: '2', title: 'Sự Kiện Đặc Biệt', sub: 'Tham gia để nhận thưởng hấp dẫn', icon: 'fa-torii-gate' },
    { id: 'gift',  the: '3',  title: 'Gói Quà May Mắn', sub: 'Cơ hội nhận vật phẩm hiếm', icon: 'fa-box-open' },
];

function renderFeatureIcon(f) {
    return `
        <button class="dboard-feature" data-feature="${f.id}">
            <div class="dboard-feature__icon ${f.grad}">
                <i class="fa-solid ${f.icon}"></i>
                ${f.badge ? '<span class="dboard-feature__dot"></span>' : ''}
            </div>
            <span class="dboard-feature__label">${f.label}</span>
        </button>
    `;
}

export const DashboardPanel = {
    _state: null,
    _open: false,        // mặc định bảng iPad đóng, mở bằng nút trên header
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

        el.className = 'dboard-root' + (this._open ? ' dboard-root--open' : '');
        el.setAttribute('aria-hidden', String(!this._open));
        el.innerHTML = `
            <div class="dboard-device">
                <div class="dboard-device__cam"></div>
                <div class="dboard-screen">
            <div class="dboard-card">
                <div class="ipad-status-bar">
                    <div class="outer-bcn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-code-xml"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>
                        Ban Công Nghệ
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
                <!-- Sidebar trái -->
                <div class="ipad-main">
                    <aside class="dboard-side">
                        <div class="dboard-profile">
                            <div class="dboard-profile__avatar">

                            </div>
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
                        <button class="dboard-tagline">
                            <span>Cùng học, cùng tiến bộ!</span>
                            <i class="fa-solid fa-pen"></i>
                        </button>
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
                        <div class="dboard-mascot">
                            <div class="cat-box">
                                <div class="cat-hand">
                                    <div class="line1"></div>
                                    <div class="line2"></div>
                                    <div class="shadow1"></div>
                                    <div class="shadow2"></div>
                                </div>
                            </div>
                            <div class="dboard-mascot-text">
                                Học tốt
                                <br>
                                &nbsp; Chơi vui
                                <br>
                                &nbsp; &nbsp; Cùng nhau
                                <br>
                                &nbsp; &nbsp; &nbsp; Phát triển!
                            </div>
                        </div>
                        <button class="dboard-rank-btn" data-action="ranking">
                            <i class="fa-solid fa-ranking-star"></i>
                            <div class="dboard-rank-btn__text">
                                <span class="t">Bảng Xếp Hạng</span>
                                <span class="s">Xem thành tích thành viên</span>
                            </div>
                        </button>
                    </aside>
                    <!-- Nội dung chính -->
                    <main class="dboard-main">
                        <div class="dboard-banner">
                            <div class="dboard-banner__text">
                                <span class="line1">Học hết mình</span>
                                <span class="line2">Chơi hết sức! </span>
                            </div>
                            <div class="dboard-banner__glow"></div>
                            
                        </div>
                        <div class="dboard-feature-grid">
                            ${FEATURES_ROW_1.map(renderFeatureIcon).join('')}
                            ${FEATURES_ROW_2.map(renderFeatureIcon).join('')}
                        </div>
                        <div class="dboard-highlights">
                            <div class="dboard-highlights__head">
                                <i class="fa-solid fa-fire"></i>
                                <span>Nổi bật</span>
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                            <div class="dboard-highlights__list">
                                ${HIGHLIGHTS.map(h => `
                                    <div class="dboard-highlight-card${h.the}" data-highlight="${h.id}">
                                        <div class="inner-dboard-highlight-card">
                                            <div class="dboard-highlight-card__icon"><i class="fa-solid ${h.icon}"></i></div>
                                            <div class="dboard-highlight-card__text">
                                                <span class="t">${h.title}</span>
                                                <span class="s">${h.sub}</span>
                                                ${h.progress ? `
                                                    <div class="mini-track"><div class="mini-fill" style="width:${(h.progress/h.max)*100}%"></div></div>
                                                    <span class="mini-count">${h.progress}/${h.max}</span>
                                                ` : ''}
                                            </div>
                                        </div>>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </main>
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
        // Nút trên header đã stopPropagation nên không bị đóng-mở chồng nhau.
        if (!this._outsideBound) {
            document.addEventListener('click', (e) => {
                if (!this._open) return;
                if (e.target.closest?.('.dboard-root')) return;
                if (e.target.closest?.('#dashboard-trigger-btn')) return;
                this.hide();
            });
            this._outsideBound = true;
        }

        root.querySelectorAll('.dboard-feature').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Mở tính năng:', btn.dataset.feature);
            });
        });
        root.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                console.log('Hành động bảng quản lý:', btn.dataset.action);
            });
        });
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
