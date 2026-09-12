import { NavButton } from "../navButton/NavButton.js";
import { InventoryModal } from "../personalItem/personalItem.js";

const footer = document.getElementsByTagName("footer")[0] ?? [];
footer.innerHTML = `
        <div class="game-menu">
            <span class="left"></span>
            <span class="center"></span>
            <span class="right"></span>
            <span class="content">
                <button class="game-menu-btn">
                    <div class="g-icon bag-icon"></div>
                    <div class="game-menu-text">Túi đồ</div>
                </button>
                <button class="game-menu-btn" id="skill-btn">
                    <div class="g-icon skill-icon"></div>
                    <div class="game-menu-text">Thần thông</div>
                </button>

                <button class="game-menu-btn" id="realm-btn">
                    <div class="g-icon realm-icon"></div>
                    <div class="game-menu-text">Cảnh giới</div>
                </button>

                <button class="game-menu-btn">
                    <div class="g-icon mission-icon"></div>
                    <div class="game-menu-text">Nhiệm vụ</div>
                </button>
                <button class="game-menu-btn">
                    <div class="g-icon place-icon"></div>
                    <div class="game-menu-text">Bản đồ</div>
                </button>
                <button class="game-menu-btn">
                    <div class="g-icon social-icon"></div>
                    <div class="game-menu-text">Xã hội</div>
                </button>
                <button class="game-menu-btn">
                    <div class="g-icon cup-icon"></div>
                    <div class="game-menu-text">Thành tích</div>
                </button>
            </span>
        </div>
        <div class="footer-right-panel">
            <div id="battle-card-slot"></div>
            <div id="nav-btn-slot"></div>
        </div>
`;

const navBtnArrow = document.querySelector(".nav-btn__arrow");

const isCityPage = window.location.pathname.includes("city.html");
const isThanThongPage = window.location.pathname.includes("thanThong.html");

NavButton.render("nav-btn-slot", {
    label: isCityPage ? "Quay về phòng" : isThanThongPage ? "Quay lại phòng" : "Rời khỏi phòng",
    icon: isCityPage || isThanThongPage ? "/img/icon/iconRoom.svg" : "/img/icon/icon sơn môn.svg",
    href: isCityPage ? "../room/room.html" : isThanThongPage ? "../room/room.html" : "../city/city.html",
});

const bagBtn = document.querySelector(".bag-icon")?.closest(".game-menu-btn");
if (bagBtn) {
    bagBtn.addEventListener("click", () => {
        InventoryModal.show();
    });
}

const realmBtn = document.getElementById("realm-btn");
if (realmBtn) {
    realmBtn.addEventListener("click", () => {
        window.location.href = "../dotPhaCanhGioi/dotPhaCanhGioi.html";
    });
}

const skillBtn = document.getElementById("skill-btn");
if (skillBtn) {
    skillBtn.addEventListener("click", () => {
        window.location.href = "../thanThong/thanThong.html";
    });
}
