import { playerState } from '../component/header/playerState.js';
import { GameHeader }  from '../component/header/header.js';

const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

if (!isLoggedIn) {
    // Chặn mọi tương tác bấm nếu chưa đăng nhập (Sử dụng Capture phase)
    document.addEventListener("click", (e) => {
        const isLoginBtn = e.target.id === "header-login-btn" || e.target.closest("#header-login-btn");
        const isLoginModal = e.target.closest("#require-login-modal");
        
        // Bỏ qua chặn nếu click vào nút Đăng nhập trên header hoặc đang tương tác với chính Modal này
        if (!isLoginBtn && !isLoginModal) {
            e.preventDefault();
            e.stopPropagation();
            showRequireLoginModal();
        }
    }, true);
}

function showRequireLoginModal() {
    let modal = document.getElementById("require-login-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "require-login-modal";
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 9999; backdrop-filter: blur(5px);">
                <div style="background: #0d1b2a; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; text-align: center; color: white; min-width: 320px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8); position: relative;">
                    <button id="btn-close-login-modal" style="font-size: 18px; position: absolute; top: 10px; right: 10px; color: #868a8f;"><i class="fa-solid fa-xmark"></i></button>
                    <h3 style="color: #00f3ff; margin-top: 0; font-size: 22px; text-transform: uppercase; text-shadow: 0 0 10px rgba(0, 243, 255, 0.3); margin-bottom: 6px">Yêu cầu đăng nhập</h3>
                    <p style="margin-bottom: 25px; color: #ccc; font-size: 15px;">Bạn cần đăng nhập để trải nghiệm những tính năng trên website này!</p>
                    <div style="display: flex; gap: 15px; justify-content: center; width:100%;">
                        <button id="btn-go-login" style="background: #00f3ff; width:fit-content; color: #0d1b2a; border: none; padding: 8px 25px; border-radius: 6px; font-weight: bold; cursor: pointer; transition: 0.3s;  box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);">Đăng nhập</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        const btnGoLogin = document.getElementById("btn-go-login");
        const btnClose = document.getElementById("btn-close-login-modal");

        btnGoLogin.addEventListener("click", () => window.location.href = "../login/login.html");
        btnClose.addEventListener("click", () => modal.style.display = "none");

        // Hiệu ứng hover cho nút bấm
        btnGoLogin.onmouseover = () => { btnGoLogin.style.backgroundColor = "#00c2cc"; btnGoLogin.style.boxShadow = "0 0 15px rgba(0, 243, 255, 0.5)"; }
        btnGoLogin.onmouseout = () => { btnGoLogin.style.backgroundColor = "#00f3ff"; btnGoLogin.style.boxShadow = "0 0 10px rgba(0, 243, 255, 0.3)"; }
        
        btnClose.onmouseover = () => { btnClose.style.color = "#ff1616"; }
        btnClose.onmouseout = () => { btnClose.style.color = "#868a8f"; }
    } else {
        modal.style.display = "flex";
    }
}

// Export để pages dùng, không tự render ở đây
// vì mỗi trang có option khác nhau (showHamburger, v.v.)
export { playerState, GameHeader };
