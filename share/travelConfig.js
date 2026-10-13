// share/travelConfig.js

// Thời gian di chuyển gốc (đi bộ). Chỉnh số này để test, ví dụ 10 * 1000 = 10 giây.
export const TRAVEL_BASE_MS = 20 * 1000; // 1 tiếng

export const VEHICLES = [
    { id: 'walk',   name: 'Đi bộ',     icon: 'fa-person-walking', price: 0,    timeFactor: 1,    desc: 'Mặc định, ai cũng có.' },
    { id: 'bike',   name: 'Xe đạp',    icon: 'fa-bicycle',        price: 100,  timeFactor: 0.7,  desc: 'Rẻ, nhanh hơn đi bộ một chút.' },
    { id: 'moto',   name: 'Xe máy',    icon: 'fa-motorcycle',     price: 300,  timeFactor: 0.45, desc: 'Cân bằng giữa giá và tốc độ.' },
    { id: 'car',    name: 'Ô tô',      icon: 'fa-car-side',       price: 800,  timeFactor: 0.25, desc: 'Nhanh, êm, tốn coin.' },
    { id: 'heli',   name: 'Trực thăng', icon: 'fa-helicopter',    price: 2000, timeFactor: 0.1,  desc: 'Gần như tức thì.' },
];

