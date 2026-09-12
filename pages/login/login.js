async function authenticateUser(mssv, password) {
    try {
        const response = await fetch("https://6a53c0628547b9f7111bc89e.mockapi.io/accounts/test/testManage");
        if (!response.ok) throw new Error("Lỗi mạng khi tải API");
        const users = await response.json();
        console.log("Users from API:", users);
        const user = users.find(u => u.mssv === mssv && u.password === password);
        return user;
    } catch (error) {
        console.error("Lỗi fetch API:", error);
        return null;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const mssv = document.getElementById("mssv").value.trim();
            const password = document.getElementById("password").value;

            const mssvRegex = /^\d{8}$/;

            if (!mssvRegex.test(mssv)) {
                alert("Vui lòng nhập đúng định dạng MSSV gồm 8 chữ số!");
                return;
            }

            const loginBtn = loginForm.querySelector(".login-btn");
            loginBtn.textContent = "Đang xác thực...";
            loginBtn.disabled = true;

            const user = await authenticateUser(mssv, password);
            
            if (user) {
                console.log("Đăng nhập thành công với user:", user.name);
                localStorage.setItem("isLoggedIn", "true");
                localStorage.setItem("currentUser", JSON.stringify(user)); 
                window.location.href = "../room/room.html";
            } else {
                alert("MSSV hoặc mật khẩu không chính xác!");
                loginBtn.textContent = "Đăng nhập";
                loginBtn.disabled = false;
            }
        });
    }
});
