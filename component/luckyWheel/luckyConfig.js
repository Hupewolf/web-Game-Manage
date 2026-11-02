// component/luckyWheel/luckyConfig.js
// ⚙️ NƠI DUY NHẤT để chỉnh "xu" và vòng quay may mắn.

/* ============================================================
   1) APP NÀO TRONG iPAD DASHBOARD ĐƯỢC TẶNG XU?
   ------------------------------------------------------------
   Mỗi app trong danh sách này: mỗi ngày bấm vào lần đầu được +1 xu.
   → Số xu tối đa mỗi ngày = số app trong danh sách (5 app = 5 xu/ngày).
   → Sang ngày mới, các app tự "hồi lại" để nhận tiếp.

   Muốn gán / bỏ app nào thì thêm / xoá id ở đây. Các id hiện có:
     'shop'       Phương Tiện      'vicoin'    Ví Coin
     'meet'       Gặp Gỡ           'guide'     Hướng Dẫn
     'library'    Thư Viện         'mail'      Thư Thư
     'challenge'  Thử Thách        'gacha'     Vòng Xoáy Vô Hạn
     'squad'      Đội Hình         'course'    Giáo Trình
     'contribute' Cống Hiến        'trophy'    Thành Tựu
   ============================================================ */
export const XU_APPS = ['shop', 'vicoin', 'guide'];

// Mỗi app tặng bao nhiêu xu mỗi ngày
export const XU_PER_APP = 1;

// true  = xu chưa quay hết hôm nay vẫn được giữ sang ngày mai
// false = sang ngày mới, xu còn dư bị xoá (ép người chơi quay trong ngày)
export const XU_CARRY_OVER = true;

/* ============================================================
   2) VÒNG QUAY
   ------------------------------------------------------------
   WHEEL_PRIZES: các ô TRÚNG THƯỞNG (số coin). Vòng quay tự chèn 1 ô
   "không có gì" xen kẽ giữa các ô trúng → 8 ô thưởng + 8 ô trống = 16 ô.
   Hiện tại: 1 ô 5 coin, 3 ô 2 coin, 4 ô 1 coin.
   Mỗi ô có cùng xác suất (1/16).
   ============================================================ */
export const WHEEL_PRIZES = [5, 1, 2, 1, 2, 1, 2, 1];

// Thời gian quay (ms) — ~2 giây rồi ra kết quả
export const SPIN_MS = 2000;

// Mỗi lượt quay tốn bao nhiêu xu
export const XU_PER_SPIN = 1;
