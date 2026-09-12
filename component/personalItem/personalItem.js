import { updateStatBar } from '../header/StatBar.js';

export const InventoryModal = {
    allItems: [],
    currentItems: [],
    currentUserMssv: null,
    async fetchData() {
        try {
            const savedUser = localStorage.getItem("currentUser");
            if (!savedUser) return null;
            
            const userData = JSON.parse(savedUser);
            console.log("Toàn bộ dữ liệu User từ API:", userData);
            this.currentUserMssv = userData.mssv || "guest";

            // Tìm mảng items ở root hoặc lồng trong values (đề phòng API cấu trúc khác)
            const rawItems = userData.items || userData.values?.items || [];
            console.log("Dữ liệu mảng items gốc:", rawItems);
            
            // Tách items dựa trên thuộc tính số lượng (quantity/amount)
            const expandedItems = [];
            rawItems.forEach(item => {
                const qty = item.quantity || item.amount || item.count || 1;
                for (let i = 0; i < qty; i++) {
                    expandedItems.push({ ...item });
                }
            });
            
            return expandedItems;
        } catch (error) {
            console.error("Lỗi khi lấy dữ liệu túi đồ:", error);
            return null;
        }
    },

    render() {
        const modalHTML = `
            <div id="inventory-modal">
                <div class="inventory-modal-content">
                    <button class="close-inventory-btn" id="close-inventory-btn" aria-label="Đóng">✕</button>
                    <div class="inventory-sidebar">
                        <ul class="inventory-category-list">
                            <li class="inventory-category-item active" data-category="thực phẩm">Thực phẩm <button class="btnQuestion"><i class="fa-solid fa-question"></i></button></li>
                            <li class="inventory-category-item" data-category="trang bị">Trang bị <button class="btnQuestion"><i class="fa-solid fa-question"></i></button></li>
                        </ul>
                    </div>
                    <div class="inventory-main">
                        <h2 class="inventory-title" id="inventory-title">Túi đồ thực phẩm</h2>
                        <div class="inventory-grid-wrapper">
                            <div class="inventory-grid">
                                ${Array.from({ length: 32 })
                                    .map(() => `<div class="inventory-slot"></div>`)
                                    .join("")}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML("beforeend", modalHTML);
        this._bindEvents();
    },

    filterAndRender(category) {
        if (!this.allItems) return;

        const targetCat = String(category).toLowerCase().trim();

        const filteredItems = this.allItems.filter((item) => {
            const itemType = String(item.type || item.category || "")
                .toLowerCase()
                .trim();

            // Nếu vật phẩm từ API không có type, tạm thời hiển thị tất cả ở tab Thực phẩm để không bị ẩn đi
            if (!itemType) return targetCat === "thực phẩm";

            // Hỗ trợ kiểm tra linh hoạt cả tiếng Việt lẫn tiếng Anh từ API
            if (targetCat === "thực phẩm" && (itemType === "food" || itemType === "drink")) return true;
            if (targetCat === "trang bị" && (itemType === "equipment" || itemType === "trang bị")) return true;

            return itemType === targetCat;
        });

        // Phục hồi vị trí đã sắp xếp từ localStorage (Dựa vào mssv và category)
        const savedLayoutJson = localStorage.getItem(`inventoryLayout_${this.currentUserMssv}_${targetCat}`);
        let finalSlots = Array.from({ length: 32 }, () => null);

        if (savedLayoutJson) {
            const savedLayout = JSON.parse(savedLayoutJson);
            let pool = [...filteredItems];

            // Vòng 1: Xếp các vật phẩm đã lưu vào đúng vị trí cũ
            const getIdentifier = (itm) => itm.nameItems || itm.name || itm.title || itm.id || "";
            for (let i = 0; i < 32; i++) {
                if (savedLayout[i]) {
                    const matchIndex = pool.findIndex(item => getIdentifier(item) === getIdentifier(savedLayout[i]));
                    if (matchIndex !== -1) {
                        finalSlots[i] = pool[matchIndex];
                        pool.splice(matchIndex, 1); // Đã xếp xong thì xóa khỏi danh sách chờ
                    }
                }
            }

            // Vòng 2: Xếp các vật phẩm mới nhận vào các ô còn trống đầu tiên
            for (let i = 0; i < 32; i++) {
                if (!finalSlots[i] && pool.length > 0) {
                    finalSlots[i] = pool.shift();
                }
            }
        } else {
            finalSlots = Array.from({ length: 32 }, (_, i) => filteredItems[i] || null);
        }

        this.currentItems = finalSlots;
        this.renderItems();
    },

    renderItems(data) {
        if (data) {
            const fetchedItems = Array.isArray(data) ? data : data.items || [];
            this.currentItems = Array.from({ length: 32 }, (_, i) => fetchedItems[i] || null);
        }

        const slots = document.querySelectorAll(".inventory-slot");

        slots.forEach((slot, index) => {
            slot.innerHTML = "";
            slot.style.opacity = "";
            slot.onclick = null;
            slot.ondragstart = null;
            slot.ondragover = null;
            slot.ondrop = null;
            slot.ondragend = null;

            const item = this.currentItems[index];

            if (item) {
                // Đọc linh hoạt các key từ API (đề phòng API dùng img thay vì image, title thay vì name)
                const itemName = item?.nameItems || "Vật phẩm";
                const itemImage = item?.image || "";
                // Tìm các key có thể chứa đường dẫn ảnh, nếu không có sẽ lấy ảnh mặc định (để tránh bị ô trống hoàn toàn)
                const itemIndexText = item?.indexItem !== undefined ? `+${item?.indexItem}` : "";

                slot.setAttribute("draggable", "true");
                slot.innerHTML = `
                    <span style="position: absolute; top: 4px; left: 6px; font-size: 13px; font-weight: bold; color: #00f3ff; text-shadow: 1px 1px 2px #000; pointer-events: none;">${itemIndexText}</span>
                    <img src="${itemImage}" alt="${itemName}" title="${itemName}" style="width: 50%; height: 50%; object-fit: contain; pointer-events: none;">
                    <div class="item-actions" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(13, 27, 42, 0.9); flex-direction: column; justify-content: center; align-items: center; gap: 8px; border-radius: 6px; z-index: 10;">
                        <button class="use-item-btn" style="background: #4caf50; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; width: 80%;">Sử dụng</button>
                        <button class="cancel-item-btn" style="background: #f44336; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 12px; cursor: pointer; width: 80%;">Hủy</button>
                    </div>
                `;

                slot.onclick = () => {
                    document.querySelectorAll(".item-actions").forEach((el) => (el.style.display = "none"));
                    slot.querySelector(".item-actions").style.display = "flex";
                };

                slot.querySelector(".use-item-btn").onclick = async (e) => {
                    e.stopPropagation();
                    slot.querySelector(".item-actions").style.display = "none";

                    // 1. Lấy thông tin user hiện tại
                    const savedUser = localStorage.getItem("currentUser");
                    if (!savedUser) return;
                    const userData = JSON.parse(savedUser);

                    // 2. Xác định chỉ số tăng thêm và loại vật phẩm
                    const statIncrease = parseInt(item.indexItem || item.index || 10, 10);
                    const itemType = String(item.type || item.category || "").toLowerCase().trim();

                    // Đảm bảo khởi tạo các chỉ số nếu trên API người dùng chưa có
                    if (!userData.values) userData.values = { hungry: 100, thirsty: 100, stress: 0 };

                    // Tăng chỉ số tương ứng và cập nhật giao diện Header ngay lập tức
                    if (itemType === "food" || itemType === "thực phẩm") {
                        userData.values.hungry = Math.min(parseInt(userData.values.hungry || 0, 10) + statIncrease, 100);
                        updateStatBar("hunger", userData.values.hungry, 100); 
                    } else if (itemType === "drink" || itemType === "nước" || itemType === "nước uống" || itemType === "thức uống") {
                        userData.values.thirsty = Math.min(parseInt(userData.values.thirsty || 0, 10) + statIncrease, 100);
                        updateStatBar("thirst", userData.values.thirsty, 100); 
                    }

                    // 3. Trừ số lượng vật phẩm trong mảng gốc của User
                    const itemIdentifier = item.nameItems || item.name || item.title || item.id;
                    let rawItems = userData.items || userData.values?.items || [];
                    const targetIndex = rawItems.findIndex(i => (i.nameItems || i.name || i.title || i.id) === itemIdentifier);

                    if (targetIndex !== -1) {
                        let qty = rawItems[targetIndex].quantity || rawItems[targetIndex].amount || rawItems[targetIndex].count || 1;
                        qty -= 1;
                        if (qty <= 0) {
                            rawItems.splice(targetIndex, 1); // Xóa hẳn nếu hết
                        } else {
                            // Cập nhật lại số lượng (Hỗ trợ nhiều cách đặt tên key số lượng từ API)
                            if (rawItems[targetIndex].quantity !== undefined) rawItems[targetIndex].quantity = qty;
                            else if (rawItems[targetIndex].amount !== undefined) rawItems[targetIndex].amount = qty;
                            else if (rawItems[targetIndex].count !== undefined) rawItems[targetIndex].count = qty;
                        }
                    }

                    if (userData.values && userData.values.items) userData.values.items = rawItems;
                    else userData.items = rawItems;

                    // Cập nhật LocalStorage
                    localStorage.setItem("currentUser", JSON.stringify(userData));

                    // Hiển thị trạng thái đang xử lý trên ô đồ để chặn click nhiều lần
                    slot.innerHTML = `<span style="color:#00f3ff; font-size: 11px; display:flex; justify-content:center; align-items:center; height:100%; text-align:center;">Đang dùng...</span>`;

                    // 4. Gọi API PUT để lưu trạng thái mới lên server
                    try {
                        await fetch(`https://6a53c0628547b9f7111bc89e.mockapi.io/accounts/test/testManage/${userData.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(userData)
                        });
                        console.log(`✅ Đồng bộ API thành công! Vật phẩm: ${itemIdentifier} | Đói: ${userData.values.hungry}/100 | Khát: ${userData.values.thirsty}/100`);
                    } catch (error) {
                        console.error("Lỗi khi update API:", error);
                    }

                    // 5. Xóa vật phẩm khỏi giao diện (Xóa 1 ô hiện tại đang bấm)
                    this.currentItems[index] = null;
                    
                    const allItemsIdx = this.allItems.findIndex(i => i === item);
                    if (allItemsIdx !== -1) this.allItems.splice(allItemsIdx, 1);

                    // Lưu lại layout túi đồ mới
                    const activeCat = document.querySelector(".inventory-category-item.active");
                    const category = activeCat ? activeCat.dataset.category.toLowerCase().trim() : "thực phẩm";
                    localStorage.setItem(`inventoryLayout_${this.currentUserMssv}_${category}`, JSON.stringify(this.currentItems));

                    this.renderItems();
                };

                slot.querySelector(".cancel-item-btn").onclick = async (e) => {
                    e.stopPropagation();
                    slot.querySelector(".item-actions").style.display = "none";
                    
                    if (!confirm(`Bạn có chắc chắn muốn vứt bỏ toàn bộ ${itemName} không?`)) return;

                    const savedUser = localStorage.getItem("currentUser");
                    if (!savedUser) return;
                    const userData = JSON.parse(savedUser);

                    const itemIdentifier = item.nameItems || item.name || item.title || item.id;
                    let rawItems = userData.items || userData.values?.items || [];
                    const targetIndex = rawItems.findIndex(i => (i.nameItems || i.name || i.title || i.id) === itemIdentifier);

                    if (targetIndex !== -1) {
                        rawItems.splice(targetIndex, 1); // Xóa hẳn bất kể số lượng
                    }

                    if (userData.values && userData.values.items) userData.values.items = rawItems;
                    else userData.items = rawItems;

                    localStorage.setItem("currentUser", JSON.stringify(userData));
                    slot.innerHTML = `<span style="color:#f44336; font-size: 11px; display:flex; justify-content:center; align-items:center; height:100%; text-align:center;">Đang xóa...</span>`;

                    try {
                        await fetch(`https://6a53c0628547b9f7111bc89e.mockapi.io/accounts/test/testManage/${userData.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(userData)
                        });
                    } catch (error) {
                        console.error("Lỗi khi update API:", error);
                    }

                    this.currentItems[index] = null;
                    const allItemsIdx = this.allItems.findIndex(i => i === item);
                    if (allItemsIdx !== -1) this.allItems.splice(allItemsIdx, 1);

                    const activeCat = document.querySelector(".inventory-category-item.active");
                    const category = activeCat ? activeCat.dataset.category.toLowerCase().trim() : "thực phẩm";
                    localStorage.setItem(`inventoryLayout_${this.currentUserMssv}_${category}`, JSON.stringify(this.currentItems));

                    this.renderItems();
                };

                slot.ondragstart = (e) => {
                    e.dataTransfer.setData("sourceIndex", index);
                    setTimeout(() => (slot.style.opacity = "0.5"), 0);
                };
                slot.ondragend = () => {
                    slot.style.opacity = "1";
                };
            } else {
                slot.removeAttribute("draggable");
            }

            slot.ondragover = (e) => {
                e.preventDefault();
            };

            slot.ondrop = (e) => {
                e.preventDefault();
                const sourceIndex = e.dataTransfer.getData("sourceIndex");
                if (sourceIndex !== "" && sourceIndex !== index.toString()) {
                    const srcIdx = parseInt(sourceIndex, 10);

                    const temp = this.currentItems[srcIdx];
                    this.currentItems[srcIdx] = this.currentItems[index];
                    this.currentItems[index] = temp;

                    // Lưu lại vị trí mới vào localStorage mỗi khi kéo thả xong
                    const activeCat = document.querySelector(".inventory-category-item.active");
                    const category = activeCat ? activeCat.dataset.category.toLowerCase().trim() : "thực phẩm";
                    if (this.currentUserMssv) {
                        localStorage.setItem(`inventoryLayout_${this.currentUserMssv}_${category}`, JSON.stringify(this.currentItems));
                    }

                    this.renderItems();
                }
            };
        });
    },

    async show() {
        let modal = document.getElementById("inventory-modal");
        if (!modal) {
            this.render();
            modal = document.getElementById("inventory-modal");
        }
        modal.style.display = "flex";

        const data = await this.fetchData();
        if (data) {
            this.allItems = Array.isArray(data) ? data : data.items || [];
            const activeCat = document.querySelector(".inventory-category-item.active");
            const category = activeCat ? activeCat.dataset.category : "thực phẩm";
            this.filterAndRender(category);
        }
    },
    _bindEvents() {
        const modal = document.getElementById("inventory-modal");
        const closeBtn = document.getElementById("close-inventory-btn");
        const categoryItems = document.querySelectorAll(".inventory-category-item");
        const inventoryTitle = document.getElementById("inventory-title");

        closeBtn.addEventListener("click", () => {
            modal.style.display = "none";
        });

        modal.addEventListener("click", (e) => {
            if (e.target === modal) {
                modal.style.display = "none";
            }
        });

        categoryItems.forEach((item) => {
            item.addEventListener("click", () => {
                categoryItems.forEach((i) => i.classList.remove("active"));
                item.classList.add("active");

                inventoryTitle.textContent = `Túi đồ ${item.dataset.category}`;
                this.filterAndRender(item.dataset.category);
            });
        });

        const btnQuestions = document.querySelectorAll(".btnQuestion");
        btnQuestions.forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.stopPropagation(); // Ngăn sự kiện click lan ra thẻ li bên ngoài
                const item = btn.closest(".inventory-category-item");
                if (item) {
                    if (item.dataset.category === "thực phẩm") {
                        if (typeof openModal === "function") {
                            openModal({
                                title: `Cách sử dụng vật phẩm`,
                                message: `
                                    <ul class="modalInstruct">
                                        <li class="content">Thức ăn: Khi sử dụng, món ăn sẽ hồi phục chỉ số đói của nhân vật theo mức năng lượng mà món ăn đó cung cấp.</li>
                                        <li class="content">Nước uống: Khi sử dụng, nước uống sẽ hồi phục chỉ số khát của nhân vật theo lượng nước mà vật phẩm đó cung cấp.</li>
                                    </ul>
                                `,
                                options: ["hidden"],
                            });
                        }
                    } else if (item.dataset.category === "trang bị") {
                        if (typeof openModal === "function") {
                            openModal({
                                title: `Cách sử dụng trang bị`,
                                message: ``,
                                options: ["hidden"],
                            });
                        }
                    }
                }
            });
        });
    },
};
