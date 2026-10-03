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
