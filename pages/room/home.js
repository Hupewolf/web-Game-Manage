import { playerState, GameHeader } from '../../share/main.js';
import { DashboardPanel } from '../../component/dashboardPanel/dashboardPanel.js';

// Không có hamburger
GameHeader.render(playerState, { showHamburger: false });

// Bảng quản lý (component mới) — nằm giữa trang home
DashboardPanel.render('dashboard-panel-slot', playerState);

const box = document.getElementById("mission-box");
const openBtn = document.getElementById("mission-icon");
const closeBtn = document.getElementById("mission-close");
const wrapper = document.querySelector(".outer-box");

closeBtn.addEventListener("click", () => {
    box.classList.add("collapsed");
    wrapper.classList.add("minimized");
});

openBtn.addEventListener("click", () => {
    box.classList.remove("collapsed");
    wrapper.classList.remove("minimized");
});

