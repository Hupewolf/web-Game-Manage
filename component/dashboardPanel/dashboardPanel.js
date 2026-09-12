

// component/dashboardPanel/dashboardPanel.js
// Bảng "quản lý" — component tổng hợp nằm giữa trang home.
// Phong cách: tươi sáng, nhiều màu, vui mắt (khác tông cyberpunk-tối của phần còn lại của game),
// lấy cảm hứng từ mock-up dashboard được cung cấp.

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
    { id: 'journey', title: 'Bắt đầu hành trình tu tiên', sub: 'Đạt cấp 15', progress: 12, max: 15, icon: 'fa-scroll' },
    { id: 'event',   title: 'Sự Kiện Đặc Biệt', sub: 'Tham gia để nhận thưởng hấp dẫn', icon: 'fa-torii-gate' },
    { id: 'gift',    title: 'Gói Quà May Mắn', sub: 'Cơ hội nhận vật phẩm hiếm', icon: 'fa-box-open' },
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

        el.className = 'dboard-root';
        el.innerHTML = `
            <div class="dboard-device">
                <div class="dboard-device__cam"></div>
                <div class="dboard-screen">
            <div class="dboard-card">

                <!-- Sidebar trái -->
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
                        <div class="dboard-mascot__bubble">
                            Học tốt<br>Chơi vui<br>Cùng nhau phát triển
                        </div>
                        <div class="dboard-mascot__cat">🐱</div>
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
                        <div class="dboard-mission-widget">
                            <div class="dboard-mission-widget__head">
                                <i class="fa-solid fa-star"></i>
                                <span>Nhiệm vụ hôm nay</span>
                                <i class="fa-solid fa-chevron-right"></i>
                            </div>
                            <div class="dboard-mission-widget__body">
                                <span class="coin"><img src="../../img/icon/UCoin.svg" alt="coin">${coin.toLocaleString()}</span>
                                <div class="track"><div class="fill" style="width:${(missionsDone/missionsTotal)*100}%"></div></div>
                                <span class="count">${missionsDone}/${missionsTotal}</span>
                            </div>
                        </div>
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
                                <div class="dboard-highlight-card" data-highlight="${h.id}">
                                    <div class="dboard-highlight-card__icon"><i class="fa-solid ${h.icon}"></i></div>
                                    <div class="dboard-highlight-card__text">
                                        <span class="t">${h.title}</span>
                                        <span class="s">${h.sub}</span>
                                        ${h.progress ? `
                                            <div class="mini-track"><div class="mini-fill" style="width:${(h.progress/h.max)*100}%"></div></div>
                                            <span class="mini-count">${h.progress}/${h.max}</span>
                                        ` : ''}
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                </main>
            </div>
                </div>
            </div>
        `;

        this._bindEvents(el);
    },

    _bindEvents(root) {
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
};
