// component/loader/preloader.js
// Tải sẵn (và giải mã) toàn bộ ảnh của 1 trang TRƯỚC khi màn loading đóng lại,
// để vào trang là hiện đủ luôn, không bị ảnh nền / icon "nhảy ra" từng cái.
//
// Thêm ảnh mới vào game? Chỉ cần thêm đường dẫn (tính từ thư mục img/) vào đúng trang ở ASSETS bên dưới.

const IMG = (p) => new URL(`../../img/${p}`, import.meta.url).href;

// Icon dùng ở header / footer / thông báo / phone modal -> trang nào cũng có
const COMMON = [
    'icon/UCoin.svg', 'icon/brain.png', 'icon/burger.png', 'icon/water-drop.png', 'icon/flash.png',
    'icon/fluent_person-28-filled.svg', 'icon/mdi_gift.svg',
    // footer
    'icon/ph_handbag-fill.svg', 'icon/tdesign_share.svg', 'icon/streamline-ultimate_flag-bold.svg',
    'icon/pagoda-realm.svg', 'icon/ic_baseline-place-phone.svg', 'icon/ion_people-sharp.svg',
    'icon/solar_cup-star-bold.svg',
    // phone modal
    'icon/mdi_home.svg', 'icon/ri_target-fill.svg', 'icon/ion_people-sharp-phone.svg',
    'icon/material-symbols_person-phone.svg', 'icon/simple-line-icons_calender.svg', 'icon/ix_book.svg',
    'icon/mynaui_plus-solid.svg', 'icon/icon-park-outline_shopping.svg', 'icon/stash_pin-place.svg',
];

export const ASSETS = {
    common: COMMON.map(IMG),
    login: [],
    travel: [],
    room: [
        'background/phong-hien-dai.png',          // nền phòng
        'background/db-banner.png',               // 3 ảnh trong bảng iPad (mở iPad là có ngay)
        'background/sukiendacbiet.png',
        'background/goiquamayman.png',
        'character/beMeo.png',
        'icon/star.png', 'icon/check.png',
    ].map(IMG),
    outSide: [
        'BackgroundMap/946e8ef1-0b91-4261-9d40-ce42751b9105.png', // nền bản đồ
    ].map(IMG),
    shop: [
        'BackgroundMap/946e8ef1-0b91-4261-9d40-ce42751b9105.png',
        'icon/FoodandDrink/hamburger.svg',
    ].map(IMG),
};

// "/pages/room/room.html" -> "room"; "../shop/shop.html?shop=home" -> "shop"
export function pageKey(url = location.href) {
    try {
        const m = new URL(url, location.href).pathname.match(/\/pages\/([^/]+)\//i);
        return m ? m[1] : null;
    } catch {
        return null;
    }
}

const jobs = new Map(); // mỗi ảnh chỉ tải 1 lần dù nhiều trang cùng gọi
const held = [];        // giữ tham chiếu để ảnh đã giải mã không bị trình duyệt dọn sớm

function loadImage(url) {
    if (!jobs.has(url)) {
        jobs.set(url, new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
                held.push(img);
                (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(true));
            };
            img.onerror = () => resolve(false); // 1 ảnh lỗi không được làm kẹt cả trang
            img.src = url;
        }));
    }
    return jobs.get(url);
}

// keys: ['room', 'common', ...]  ·  onProgress(0..1)  ·  timeout: mạng quá chậm thì thôi, không đứng mãi
export async function preload(keys = [], { onProgress, timeout = 20000 } = {}) {
    const urls = [...new Set(keys.flatMap((k) => ASSETS[k] ?? []))];
    if (!urls.length) return;
    let done = 0;
    const all = Promise.all(urls.map((u) => loadImage(u).then(() => onProgress?.(++done / urls.length))));
    await Promise.race([all, new Promise((r) => setTimeout(r, timeout))]);
}
