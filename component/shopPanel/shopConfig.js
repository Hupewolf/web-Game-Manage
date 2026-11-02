// component/shopPanel/shopConfig.js
// Khai báo nguyên liệu và các cửa hàng. Nguyên liệu không bán: admin gửi cho tsv qua thông báo. Thêm cửa hàng mới = thêm 1 key vào SHOPS
// (key trùng với tham số ?shop= trên URL trang shop.html).

export const INGREDIENTS = {
    rau:     { id: 'rau',     name: 'Rau',      icon: 'fa-carrot' },
    thit:    { id: 'thit',    name: 'Thịt',     icon: 'fa-drumstick-bite' },
    tinhbot: { id: 'tinhbot', name: 'Tinh bột', icon: 'fa-bowl-rice' },
};

export const SHOPS = {
    home: {
        id: 'home',
        name: 'Quán ăn',
        tagline: 'Nguyên liệu tươi, món nóng hổi',

        // Công thức: 1 phần món = 1 rau + 2 thịt + 1 tinh bột
        recipe: { rau: 1, thit: 2, tinhbot: 1 },
        cookSeconds: 5,

        // Món ăn (lưu vào túi đồ cùng định dạng item hiện có: nameItems / image / type / indexItem / quantity)
        food: {
            nameItems: 'bánh',
            image: '../../img/icon/FoodandDrink/hamburger.svg',
            type: 'food',
            indexItem: 30, // hồi bao nhiêu Đói khi dùng
            price: 20,     // giá cố định (coin): tsv bán lên sàn nhận 20, người mua trả 20
        },
    },
};

// ===== Mini game "nhớ màu" khi nấu ăn (xuất hiện ngay khi bỏ đủ nguyên liệu vào nồi) =====
// Mọi mốc thời gian tính bằng mili giây (1000 = 1 giây) — sửa tự do ở đây.
export const COOK_MINIGAME = {
    enabled: true,              // false = tắt mini game, bỏ đủ nguyên liệu là nấu luôn như cũ
    needStartButton: true,      // true = bấm "Bắt đầu" mới chạy; false = tự chạy sau 800ms
    wordMs: 1000,               // chữ màu hiện trên bảng bao lâu
    gapMs: 2000,                // sau khi chữ biến mất, chờ bao lâu thì 9 bi đổi màu
    revealMs: 1000,             // 9 bi hiện màu trong bao lâu rồi quay về xám
    resultMs: 1400,             // hiện kết quả đúng / sai bao lâu rồi đóng bảng
    loseIngredientsOnFail: false, // true = nấu thất bại thì mất nguyên liệu trong nồi; false = giữ nguyên, thử lại
};
