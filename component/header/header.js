import { PhoneModal } from '../phoneModal/phonemodal.js';
import { NotificationPanel } from '../notification/notification.js';
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
export const GameHeader = {
	render(state = {}) {
		const el = document.getElementById('game-header');
		if (!el) return;

		const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
		if (!isLoggedIn) {
			el.innerHTML = `
				<div class="header__left">
					<div class="header__player-card">
						<div class="header__avatar">
							<img src="../../img/icon/fluent_person-28-filled.svg" alt="Guest" width="40" height="40">
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
		const profile = state.profile;
		const s = state.survival;
		const lifespanText = `${s.lifespan.years} năm ${s.lifespan.months} tháng`;

		el.innerHTML = `
			<div class="header__left">
				<div class="header__player-card" id="user-profile-toggle">
					<div class="header__avatar" style="background:${bgColor};">
						${initials}
					</div>
					<div class="header__info">
						<span class="header__name">${state.name}</span>
						<div class="header__divider"></div>
						<span class="header__tier">${profile.tier}</span>
						<span class="header__id">ID: ${profile.id}</span>
					</div>
					<div class="dropdown-menu" id="user-dropdown">
						<button class="dropdown-item" id="logout-btn">
							<i class="fa-solid fa-right-from-bracket"></i> Đăng xuất
						</button>
					</div>
				</div>

				<!-- Bảng chỉ số sinh tồn -->
				
			</div>

			<div class="header__right">
				<div class="header__survival">
					<div class="survival__row">
						<img class="survival__icon" src="../../img/icon/UCoin.svg" alt="coin">
						<span class="survival__text">Coin: <strong class="survival__value">${s.coin.toLocaleString()}</strong></span>
					</div>
				</div>
				<button class="notification-btn"><div class="g-icon noti-icon"></div></button>
				<button class="phone-trigger-btn" id="phone-trigger-btn" aria-label="Mở điện thoại">
					<div class="g-icon phone-icon"></div>
				</button>
			</div>
		`;

		this._bindEvents();
	},

	_bindEvents(isLoggedIn = true) {
		if (!isLoggedIn) {
			document.getElementById("header-login-btn")?.addEventListener("click", () => {
				window.location.href = "../login/login.html"; 
			});
		} else {
			const profileToggle = document.getElementById('user-profile-toggle');
			const dropdown = document.getElementById('user-dropdown');
			const logoutBtn = document.getElementById('logout-btn');

			if (profileToggle && dropdown) {
				profileToggle.addEventListener('click', (e) => {
					e.stopPropagation();
					dropdown.classList.toggle('show');
				});
				
				document.addEventListener('click', (e) => {
					if (!profileToggle.contains(e.target)) {
						dropdown.classList.remove('show');
					}
				});
			}

			if (logoutBtn) {
				logoutBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					localStorage.clear(); 
					window.location.replace("../login/login.html");
				});
			}
			document.querySelector('.notification-btn')
				?.addEventListener('click', (e) => {
					e.stopPropagation();
					NotificationPanel.toggle(e.currentTarget);
				});
			document.querySelector('#phone-trigger-btn')
				?.addEventListener('click', () => {
					PhoneModal.show();
				});
		}
	},

	//cập nhật sau khi tìm ra cách tăng giảm chỉ số
	// // Cập nhật stat cụ thể
	// updateStat(key, value, max) {
	// 	updateStatBar(key, value, max);
	// },

	// // Cập nhật currency
	// updateCurrency(key, value) {
	// 	const el = document.querySelector(`.currency-item[data-currency="${key}"] .currency-item__val`);
	// 	if (!el) return;
	// 	el.textContent = typeof value === 'object'
	// 		? `${value.current}/${value.max}`
	// 		: value.toLocaleString();
	// },

	// // Cập nhật XP
	// updateXP(current, max) {
	// 	const pct = (current / max) * 100;
	// 	const fill = document.querySelector('.header__xp-fill');
	// 	const text = document.querySelector('.header__xp-text');
	// 	if (fill) fill.style.width = `${pct}%`;
	// 	if (text) text.textContent = `${current.toLocaleString()} / ${max.toLocaleString()} XP`;
	// },
};
