import { NavButton } from "../navButton/NavButton.js";
import { InventoryModal } from "../personalItem/personalItem.js";

{/* <div class="game-menu">
            <span class="left"></span>
            <span class="center"></span>
            <span class="right"></span>
            <span class="content">
                <button class="game-menu-btn">
                    <span class="game-menu-btn__tile"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-backpack"><path d="M4 10a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M8 10h8"/><path d="M8 18h8"/><path d="M8 22v-6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v6"/><path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/></svg></span>
                    <div class="game-menu-text">Túi đồ</div>
                </button>
                <button class="game-menu-btn" id="skill-btn">
                    <span class="game-menu-btn__tile"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/></svg></span>
                    <div class="game-menu-text">Thần thông</div>
                </button>

                <button class="game-menu-btn" id="realm-btn">
                    <span class="game-menu-btn__tile"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M15.914 4a1.5 1.5 0 00-2.474-1.561l-9 9A1.5 1.5 0 005.5 14h4.002a.5.5 0 01.471.666L8.086 20a1.5 1.5 0 002.475 1.56l9-9A1.5 1.5 0 0018.5 10h-3.997a.5.5 0 01-.472-.667z"/></svg></span>
                    <div class="game-menu-text">Cảnh giới</div>
                </button>

                <button class="game-menu-btn">
                    <span class="game-menu-btn__tile"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shield-minus"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="M9 12h6"/></svg></span>
                    <div class="game-menu-text">Nhiệm vụ</div>
                </button>
                <button class="game-menu-btn">
                    <span class="game-menu-btn__tile"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg></span>
                    <div class="game-menu-text">Bản đồ</div>
                </button>
                <button class="game-menu-btn">
                    <span class="game-menu-btn__tile"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user-group"><path d="M17 21v-1a2 2 0 00-2-2H9a2 2 0 00-2 2v1"/><path d="M19 10h1a2 2 0 012 2v1"/><path d="M5 10H4a2 2 0 00-2 2v1"/><circle cx="12" cy="11" r="3"/><circle cx="18" cy="4" r="2"/><circle cx="6" cy="4" r="2"/></svg></span>
                    <div class="game-menu-text">Xã hội</div>
                </button>
                <button class="game-menu-btn">
                    <span class="game-menu-btn__tile"><svg xmlns="http://www.w3.org/2000/svg" width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-medal"><path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15"/><path d="M11 12 5.12 2.2"/><path d="m13 12 5.88-9.8"/><path d="M8 7h8"/><circle cx="12" cy="17" r="5"/><path d="M12 18v-2h-.5"/></svg></span>
                    <div class="game-menu-text">Thành tích</div>
                </button>
            </span>
        </div> */}


const footer = document.getElementsByTagName("footer")[0] ?? [];
footer.innerHTML = `
        
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
    
});

const bagBtn = document.getElementById("bag-btn")
    ?? document.querySelector(".bag-icon")?.closest(".game-menu-btn");
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
