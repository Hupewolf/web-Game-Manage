// component/luckyWheel/xuService.js
// Quản lý "xu" (vé quay) theo ngày + cộng coin thưởng.
//
// Dữ liệu lưu trong tài khoản (MockAPI) ở field "xu":
//   { date: '2026-11-03', claimed: ['shop','vicoin'], balance: 3 }
//   - date    : ngày hiện tại của bản ghi (đổi ngày -> claimed được làm mới)
//   - claimed : các app đã nhận xu HÔM NAY
//   - balance : số xu đang có (mỗi xu = 1 lượt quay)
// Bản sao cũng nằm trong localStorage.currentUser.xu để đọc nhanh (giống mood).
// Mọi thay đổi đều đọc dữ liệu MỚI NHẤT từ server → sửa → ghi lại, xếp hàng tuần tự.

import { XU_APPS, XU_PER_APP, XU_CARRY_OVER, XU_PER_SPIN } from './luckyConfig.js';
import { fetchAccount, putAccount } from '../../share/accountApi.js';

/* ===== Tiện ích ===== */

export function todayKey(d = new Date()) {
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${m}-${day}`;
}

function readUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function hasUser() {
    return !!readUser()?.id;
}

function coinOf(acc) {
    return acc?.values?.coin ?? acc?.coin ?? 0;
}

// Chuẩn hoá bản ghi xu về "hôm nay" (qua ngày mới thì làm mới danh sách đã nhận)
function normalize(xu, today = todayKey()) {
    const base = xu && typeof xu === 'object' ? xu : {};
    const balance = Math.max(0, Math.floor(Number(base.balance) || 0));
    if (base.date === today) {
        return { date: today, claimed: Array.isArray(base.claimed) ? [...base.claimed] : [], balance };
    }
    return { date: today, claimed: [], balance: XU_CARRY_OVER ? balance : 0 };
}

/* ===== Đọc trạng thái (đồng bộ, từ bản sao local) ===== */

export function isAssigned(appId) {
    return XU_APPS.includes(appId);
}

export function getXuView() {
    const xu = normalize(readUser()?.xu);
    const claimed = xu.claimed.filter(isAssigned);
    return {
        date: xu.date,
        balance: xu.balance,
        claimed,                       // app (đang được gán) đã nhận hôm nay
        earned: claimed.length * XU_PER_APP,
        total: XU_APPS.length * XU_PER_APP, // trần xu/ngày
    };
}

export function hasClaimed(appId) {
    return getXuView().claimed.includes(appId);
}

function emitXuChange() {
    document.dispatchEvent(new CustomEvent('xu:change', { detail: getXuView() }));
}

/* ===== Ghi: đọc bản mới nhất -> sửa -> PUT (xếp hàng, không chạy song song) ===== */

let queue = Promise.resolve();

// mutate(acc) trả về acc đã sửa, hoặc null nếu không có gì để ghi. Có thể throw để huỷ.
function updateAccount(mutate) {
    const run = async () => {
        const user = readUser();
        if (!user?.id) throw new Error('NO_USER');

        const fresh = await fetchAccount(user.id);
        const next = mutate(structuredClone(fresh));
        const result = next || fresh;

        if (next) {
            const res = await putAccount(user.id, next);
            if (!res.ok) throw new Error('SAVE_FAILED');
        }

        // Cập nhật bản sao local. Chỉ gộp các field mình đụng tới, không ghi đè
        // mood/exp... đang chạy ở local.
        const local = readUser() || user;
        local.values = { ...local.values, coin: coinOf(result) };
        local.transactions = result.transactions ?? local.transactions;
        local.xu = normalize(result.xu);
        localStorage.setItem('currentUser', JSON.stringify(local));
        return result;
    };
    const p = queue.then(run);
    queue = p.catch(() => {});
    return p;
}

/* ===== Đồng bộ từ server (gọi khi vào trang) ===== */

export async function syncXu() {
    if (!hasUser()) return getXuView();
    try {
        await updateAccount(() => null);
    } catch (err) {
        console.warn('Xu: không đồng bộ được từ server, dùng dữ liệu local.', err);
    }
    emitXuChange();
    return getXuView();
}

/* ===== Nhận xu khi bấm vào app ===== */

const claiming = new Set();

export async function claimApp(appId) {
    if (!hasUser() || !isAssigned(appId)) return { granted: false, reason: 'not-assigned' };
    if (hasClaimed(appId)) return { granted: false, reason: 'claimed' };
    if (claiming.has(appId)) return { granted: false, reason: 'busy' };

    claiming.add(appId);
    let granted = false;
    try {
        await updateAccount((acc) => {
            const xu = normalize(acc.xu);
            if (xu.claimed.includes(appId)) return null; // đã nhận ở máy/tab khác
            xu.claimed.push(appId);
            xu.balance += XU_PER_APP;
            acc.xu = xu;
            granted = true;
            return acc;
        });
    } catch (err) {
        console.warn('Xu: chưa nhận được xu, thử lại lần bấm sau.', err);
        return { granted: false, reason: 'error' };
    } finally {
        claiming.delete(appId);
    }
    emitXuChange();
    return { granted, balance: getXuView().balance };
}

/* ===== Quay: trừ xu + cộng coin thưởng (nếu trúng) ===== */

export async function spendSpin(prizeCoin) {
    const prize = Math.max(0, Math.floor(Number(prizeCoin) || 0));
    await updateAccount((acc) => {
        const xu = normalize(acc.xu);
        if (xu.balance < XU_PER_SPIN) throw new Error('NO_XU');
        xu.balance -= XU_PER_SPIN;
        acc.xu = xu;

        if (prize > 0) {
            const now = new Date();
            acc.values = { ...acc.values, coin: coinOf(acc) + prize };
            acc.transactions = [
                {
                    id: `tx_${now.getTime()}_wheel`,
                    type: 'receive',
                    title: 'Vòng quay may mắn',
                    subtitle: `Trúng ${prize} coin`,
                    amount: prize,
                    date: now.toLocaleString('vi-VN'),
                    timestamp: now.getTime(),
                },
                ...(Array.isArray(acc.transactions) ? acc.transactions : []),
            ];
        }
        return acc;
    });
    emitXuChange();
    return { coin: coinOf(readUser()) };
}
