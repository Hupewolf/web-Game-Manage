// share/travel.js
// Trạng thái di chuyển phòng <-> outSide. NGUỒN THẬT là bản ghi tài khoản trên MockAPI:
//   travel   : { to, startAt, endAt, duration, vehicle } | null   (đang đi)
//   location : 'room' | 'outSide'                                 (đang ở đâu)
// localStorage (currentUser.travel / currentUser.location) chỉ là bản nhớ đệm để chuyển trang nhanh;
// mỗi trang đều đối chiếu lại với API nên xoá/sửa localStorage không thoát được chuyến đi.
// Giờ lấy theo header Date của server (nếu MockAPI cho đọc), không thì dùng đồng hồ máy.

import { getCurrentUser } from './roles.js';
import { API_BASE, putAccount } from './accountApi.js';
import { TRAVEL_BASE_MS, VEHICLES } from './travelConfig.js';

// Đường dẫn tính từ các trang trong /pages/<tên>/
export const PAGE_URL = {
    room: '../room/room.html',
    outSide: '../outSide/outSide.html',
    shop: '../shop/shop.html',
    travel: '../travel/travel.html',
};

/* ===== Phương tiện ===== */

export function ownedVehicleIds(u = getCurrentUser()) {
    const ids = Array.isArray(u?.vehicles) ? u.vehicles : [];
    return ['walk', ...ids.filter((id) => id !== 'walk')];
}

export function bestVehicle(u = getCurrentUser()) {
    const owned = ownedVehicleIds(u);
    return VEHICLES.filter((v) => owned.includes(v.id)).reduce((a, b) => (b.timeFactor < a.timeFactor ? b : a));
}

export const travelDuration = (vehicle = bestVehicle()) => Math.round(TRAVEL_BASE_MS * vehicle.timeFactor);

export function formatDuration(ms) {
    const s = Math.ceil(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const p = (n) => String(n).padStart(2, '0');
    return h > 0 ? `${h}:${p(m)}:${p(sec)}` : `${p(m)}:${p(sec)}`;
}

/* ===== Giờ server =====
   Lệch giữa đồng hồ server và đồng hồ máy, đọc từ header Date mỗi lần gọi API. */

let clockOffset = 0;
export const serverNow = () => Date.now() + clockOffset;

/* ===== Đọc / ghi API ===== */

// Lấy bản ghi tài khoản + cập nhật lệch giờ + nhớ đệm travel/location vào currentUser
async function fetchRecord() {
    const id = getCurrentUser()?.id;
    if (!id) throw new Error('Chưa đăng nhập.');
    const res = await fetch(`${API_BASE}/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Không tải được dữ liệu tài khoản.');
    const date = res.headers.get('Date');
    if (date && !Number.isNaN(Date.parse(date))) clockOffset = Date.parse(date) - Date.now();
    const rec = await res.json();
    cacheState(rec);
    return rec;
}

function cacheState(rec) {
    const cur = getCurrentUser();
    if (!cur) return;
    localStorage.setItem('currentUser', JSON.stringify({
        ...cur,
        travel: rec.travel ?? null,
        location: rec.location ?? null,
        vehicles: rec.vehicles ?? cur.vehicles,
    }));
}

async function saveRecord(rec) {
    const res = await putAccount(rec.id, rec);
    if (!res.ok) throw new Error('Không lưu được dữ liệu, thử lại sau.');
    cacheState(rec);
    return rec;
}

/* ===== Trạng thái (đọc nhanh từ nhớ đệm) ===== */

export const getTravel = () => getCurrentUser()?.travel ?? null;
export const getLocation = () => getCurrentUser()?.location ?? null;

export function remaining(t) {
    if (!t) return 0;
    // Tính theo cấu hình hiện tại nên chỉnh TRAVEL_BASE_MS khi test là áp dụng ngay
    const vehicle = VEHICLES.find((v) => v.id === t.vehicle) ?? VEHICLES[0];
    return Math.max(0, t.startAt + travelDuration(vehicle) - serverNow());
}

// Đồng bộ lại từ API (dùng ở trang đếm ngược). Lỗi mạng thì giữ nhớ đệm.
export async function syncTravel() {
    try {
        await fetchRecord();
    } catch (err) {
        console.warn('Travel: chưa đồng bộ được với máy chủ, dùng bản nhớ đệm.', err);
    }
}

/* ===== Chuyến đi ===== */

// Bắt đầu đi tới `to` ('room' | 'outSide'). Đang có chuyến thì giữ nguyên chuyến cũ. Ném lỗi nếu không lưu được lên API.
export async function startTravel(to) {
    const rec = await fetchRecord();
    if (rec.travel) return rec.travel;
    const vehicle = bestVehicle(rec);
    const duration = travelDuration(vehicle);
    const now = serverNow();
    const travel = { to, startAt: now, endAt: now + duration, duration, vehicle: vehicle.id };
    await saveRecord({ ...rec, travel });
    return travel;
}

// Đến nơi: chỉ khi server xác nhận đã hết giờ. Trả về trang đích, hoặc null nếu chưa hết giờ.
export async function finishTravel() {
    const rec = await fetchRecord();
    if (rec.travel && remaining(rec.travel) > 0) return null;
    const to = rec.travel?.to ?? rec.location ?? 'room';
    await saveRecord({ ...rec, travel: null, location: to });
    return to;
}

/* ===== Chặn đi sai chỗ =====
   Gọi ở đầu các trang room / outSide / shop:
   - đang có chuyến đi  -> về trang đếm ngược
   - đang ở nơi khác (ví dụ bấm Back từ outSide về room khi chưa đi) -> đưa về đúng nơi
   Kiểm tra nhanh bằng nhớ đệm, rồi đối chiếu lại với API. */
export function guardTravel() {
    if (localStorage.getItem('isLoggedIn') !== 'true') return;
    const path = location.pathname;
    const page = path.includes('outSide.html') ? 'outSide'
        : path.includes('room.html') ? 'room'
        : path.includes('shop.html') ? 'shop'
        : null;
    if (!page) return;
    const here = page === 'shop' ? 'outSide' : page;

    // Trả về true nếu đã chuyển trang
    const check = () => {
        if (getTravel()) { location.replace(PAGE_URL.travel); return true; }
        const loc = getLocation();
        if (loc && loc !== here) { location.replace(PAGE_URL[loc]); return true; }
        return false;
    };

    const verify = async () => {
        if (check()) return;
        try {
            const rec = await fetchRecord(); // nguồn thật
            if (check()) return;
            if (!rec.location) await saveRecord({ ...rec, location: here }); // lần đầu: ghi vị trí hiện tại
        } catch (err) {
            console.warn('Travel: chưa đối chiếu được với máy chủ.', err);
        }
    };

    verify();
    // Back từ bfcache thì JS không chạy lại -> kiểm tra lại khi trang được khôi phục
    window.addEventListener('pageshow', (e) => { if (e.persisted) verify(); });
}
