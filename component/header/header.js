// component/header/header.js
// Thanh header trên cùng — layout theo bản mock:
//   Trái : thẻ người chơi (avatar tròn lồi ra ngoài + tên + bút sửa + Lv & thanh XP)
//   Phải : ví (coin / linh thạch + nút nạp) và 3 nút tròn vuông (thư, thông báo, bảng iPad)
// Điện thoại đã được ẩn: nút cũ #phone-trigger-btn nay là #dashboard-trigger-btn,
// dùng để bật/tắt bảng quản lý iPad (DashboardPanel).

import { NotificationPanel } from '../notification/notification.js';
import { DashboardPanel } from '../dashboardPanel/dashboardPanel.js';

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

// 126250 -> "126.250" (kiểu số Việt Nam, giống trong mock)
const fmt = (n) => Number(n || 0).toLocaleString('vi-VN');

/* ===== Icon SVG (nhúng thẳng cho chắc, không phụ thuộc font icon) ===== */
const ICON = {
	pencil: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
	plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
		<path d="M12 5v14M5 12h14"/></svg>`,
	mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/></svg>`,
	bell: `<svg viewBox="0 0 24 24" fill="currentColor">
		<path d="M12 2a6 6 0 0 0-6 6c0 3.6-.9 5.2-2 6.4A1 1 0 0 0 4.8 16h14.4a1 1 0 0 0 .8-1.6c-1.1-1.2-2-2.8-2-6.4a6 6 0 0 0-6-6Z"/>
		<path d="M9.8 18a2.2 2.2 0 0 0 4.4 0Z"/></svg>`,
	list: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
						<defs>
							<mask id="phone-mask">

								<rect x="5" y="2" width="14" height="24" rx="2" fill="white" />

								<circle cx="12" cy="18" r="2" fill="black" />
							</mask>
						</defs>

						<rect x="5" y="2" width="14" height="20" rx="2" fill="white" mask="url(#phone-mask)" />
					</svg>`,
	logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
		<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>`,
};

export const GameHeader = {
	_state: null,

	render(state = {}) {
		const el = document.getElementById('game-header');
		if (!el) return;

		this._state = state;

		const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
		if (!isLoggedIn) {
			el.innerHTML = `
				<div class="header__left">
					<div class="header__player-card header__player-card--guest">
						<div class="header__avatar">
							<img src="../../img/icon/fluent_person-28-filled.svg" alt="Khách" width="40" height="40">
						</div>
						<div class="header__info">
							<span class="header__name">Khách</span>
							<span class="header__guest-note">Đăng nhập để bắt đầu tu luyện</span>
						</div>
						<button id="header-login-btn">Đăng nhập</button>
					</div>
				</div>
			`;
			this._bindEvents(false);
			return;
		}

		const initials = getInitials(state.name);
		const bgColor = getAvatarColor(state.name);
		const profile = state.profile || {};
		const s = state.survival || {};
		const xp = state.xp || { current: 0, max: 1 };
		const xpPct = Math.min(100, Math.round((xp.current / (xp.max || 1)) * 100));
		const gem = state.currency?.gem?.value ?? 0;
		const unread = NotificationPanel.unreadCount?.() ?? 0;
		const avatarInner = state.avatar
			? `<img src="${state.avatar}" alt="${state.name}">`
			: initials;
			
		el.innerHTML = `
			<div class="header__left">
				<div class="inner-header__left-avatar"></div>
				<div class="inner-header__left">
					<div class="header__player-card" id="user-profile-toggle">
						<div class="header__avatar" style="background:${bgColor};">
							${avatarInner}
						</div>
						<div class="header__info">
							<div class="header__name-row">
								<span class="header__name">${state.name}</span>
								<button class="header__edit-btn" id="header-edit-btn" aria-label="Đổi tên nhân vật">
									${ICON.pencil}
								</button>
							</div>
							<div class="header__chips">
								<span class="header__chip header__chip--tier">${profile.tier ?? ''}</span>
								<span class="header__chip header__chip--id">ID ${profile.id ?? '000000'}</span>
							</div>
							<div class="header__level-row">
								<div class="header__xp-track">
									<div class="header__xp-fill" style="width:${xpPct}%"></div>
								</div>
								<span class="header__xp-text">${fmt(xp.current)} / ${fmt(xp.max)}</span>
							</div>
						</div>
						<div class="dropdown-menu" id="user-dropdown">
							<button class="dropdown-item" id="rename-btn">
								${ICON.pencil} Đổi tên nhân vật
							</button>
							<button class="dropdown-item dropdown-item--danger" id="logout-btn">
								${ICON.logout} Đăng xuất
							</button>
						</div>
					</div>
				</div>
			</div>	

			<div class="header__right">
				<div class="header__wallet">
					<div class="wallet-pill" data-currency="coin">
						<img class="wallet-pill__icon" src="../../img/icon/UCoin.svg" alt="Coin">
						<span class="wallet-pill__value" id="wallet-coin">${fmt(s.coin)}</span>
					</div>

					
				</div>

			

				<button class="header__icon-btn notification-btn" aria-label="Thông báo">
					${ICON.bell}
					<span class="header__badge${unread ? '' : ' header__badge--hidden'}" id="noti-badge">${unread}</span>
				</button>

				<button class="header__icon-btn dashboard-trigger-btn" id="dashboard-trigger-btn"
					aria-label="Mở bảng quản lý" aria-expanded="false">
					${ICON.list}
				</button>
			</div>
		`;

		this._bindEvents();
		this.syncDashboardButton();
	},

	_bindEvents(isLoggedIn = true) {
		if (!isLoggedIn) {
			document.getElementById("header-login-btn")?.addEventListener("click", () => {
				window.location.href = "../login/login.html";
			});
			return;
		}

		const profileToggle = document.getElementById('user-profile-toggle');
		const dropdown = document.getElementById('user-dropdown');

		if (profileToggle && dropdown) {
			profileToggle.addEventListener('click', (e) => {
				e.stopPropagation();
				dropdown.classList.toggle('show');
			});

			document.addEventListener('click', (e) => {
				if (!profileToggle.contains(e.target)) dropdown.classList.remove('show');
			});
		}

		// Bút chì: mở nhanh menu đổi tên / đăng xuất
		document.getElementById('header-edit-btn')?.addEventListener('click', (e) => {
			e.stopPropagation();
			dropdown?.classList.toggle('show');
		});

		document.getElementById('rename-btn')?.addEventListener('click', (e) => {
			e.stopPropagation();
			dropdown?.classList.remove('show');
			this._renameCharacter();
		});

		document.getElementById('logout-btn')?.addEventListener('click', (e) => {
			e.stopPropagation();
			localStorage.clear();
			window.location.replace("../login/login.html");
		});

		document.querySelector('.notification-btn')?.addEventListener('click', (e) => {
			e.stopPropagation();
			NotificationPanel.toggle(e.currentTarget);
			// mở bảng thông báo xong thì cập nhật lại số chưa đọc
			setTimeout(() => this.updateNotificationBadge(), 0);
		});

		document.querySelector('.mail-btn')?.addEventListener('click', () => {
			console.log('Mở hộp thư (chưa có nội dung)');
		});

		document.querySelector('.wallet-pill__add')?.addEventListener('click', (e) => {
			e.stopPropagation();
			console.log('Mở cửa hàng nạp linh thạch');
		});

		// Nút cũ mở điện thoại -> giờ bật/tắt bảng quản lý iPad
		document.getElementById('dashboard-trigger-btn')?.addEventListener('click', (e) => {
			e.stopPropagation();
			DashboardPanel.toggle();
			this.syncDashboardButton();
		});

		// Bảng iPad có thể tự đóng (nút X / phím Esc) -> đồng bộ lại trạng thái nút
		document.addEventListener('dashboard:change', () => this.syncDashboardButton());

		// Đọc hết thông báo / có thông báo mới -> cập nhật huy hiệu
		document.addEventListener('notification:change', () => this.updateNotificationBadge());
	},

	/* ===== Cập nhật từng phần, không cần render lại cả header ===== */

	syncDashboardButton() {
		const btn = document.getElementById('dashboard-trigger-btn');
		if (!btn) return;
		const open = DashboardPanel.isOpen?.() ?? false;
		btn.classList.toggle('is-active', open);
		btn.setAttribute('aria-expanded', String(open));
		btn.setAttribute('aria-label', open ? 'Đóng bảng quản lý' : 'Mở bảng quản lý');
	},

	updateNotificationBadge() {
		const badge = document.getElementById('noti-badge');
		if (!badge) return;
		const n = NotificationPanel.unreadCount?.() ?? 0;
		badge.textContent = n;
		badge.classList.toggle('header__badge--hidden', n === 0);
	},

	updateCurrency(key, value) {
		const el = document.getElementById(key === 'gem' ? 'wallet-gem' : 'wallet-coin');
		if (el) el.textContent = fmt(value);
	},

	updateXP(current, max) {
		const pct = Math.min(100, Math.round((current / (max || 1)) * 100));
		const fill = document.querySelector('.header__xp-fill');
		const text = document.querySelector('.header__xp-text');
		if (fill) fill.style.width = `${pct}%`;
		if (text) text.textContent = `${fmt(current)} / ${fmt(max)}`;
	},

	_renameCharacter() {
		const current = this._state?.name || '';
		const next = window.prompt('Tên nhân vật mới:', current);
		if (!next) return;

		const name = next.trim().slice(0, 20);
		if (!name || name === current) return;

		try {
			const saved = localStorage.getItem('currentUser');
			if (saved) {
				const user = JSON.parse(saved);
				user.name = name;
				localStorage.setItem('currentUser', JSON.stringify(user));
			}
		} catch (err) {
			console.warn('Không lưu được tên mới:', err);
		}

		this._state.name = name;
		this.render(this._state);
	},
};
