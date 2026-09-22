import { playerState, GameHeader } from '../../share/main.js';
import { DashboardPanel } from '../../component/dashboardPanel/dashboardPanel.js';

// function resizeGame() {
//     const game = document.querySelector("#web");

//     const scaleX = window.innerWidth / 1920;
//     const scaleY = window.innerHeight / 1080;

//     const scale = Math.min(scaleX, scaleY);

//     const x = (window.innerWidth - 1920 * scale) / 2;
//     const y = (window.innerHeight - 1080 * scale) / 2;

//     game.style.transform =
//         `translate(${x}px, ${y}px) scale(${scale})`;
// }


// window.addEventListener("resize", resizeGame);

// resizeGame();



function resizeGame() {
    const game = document.querySelector("#web");

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const designWidth = 1920;
    const designHeight = 1080;

    let baseWidth = designWidth;
    let baseHeight = designHeight;

    const normalHeight = viewportWidth * 9 / 16;

    // Browser làm viewport thấp hơn tỷ lệ 16:9
    if (viewportHeight < normalHeight) {

        const missing = normalHeight - viewportHeight;

        baseWidth = designWidth + missing * 2;
        // Giảm chiều cao base
        baseHeight = designHeight - missing;

        // Không cho baseHeight quá nhỏ
        baseHeight = Math.max(baseHeight, 900);
    }

    const scaleX = viewportWidth / baseWidth;
    const scaleY = viewportHeight / baseHeight;

    const scale = Math.min(scaleX, scaleY);

    const x = (viewportWidth - baseWidth * scale) / 2;
    const y = (viewportHeight - baseHeight * scale) / 2;

    game.style.width = `${baseWidth}px`;
    game.style.height = `${baseHeight}px`;

    game.style.transform =
        `translate(${x}px, ${y}px) scale(${scale})`;
}

window.addEventListener("resize", resizeGame);
resizeGame();

// Bảng quản lý iPad — render sẵn nhưng ở trạng thái ĐÓNG.
// Bấm nút danh sách trên header (trước đây là nút mở điện thoại) để bật/tắt.
DashboardPanel.render('dashboard-panel-slot', playerState);

// Header — render sau để đồng bộ được trạng thái nút bảng iPad
GameHeader.render(playerState);

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



