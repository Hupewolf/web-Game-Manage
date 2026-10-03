// component/shopPanel/giftService.js
// Admin gửi nguyên liệu cho tài khoản tsv -> quà nằm trong `inbox` của tsv (trên MockAPI)
// -> tsv mở thông báo ở header bấm "Nhận" thì nguyên liệu mới vào kho.
//
// inbox[i] = { id, type: 'ingredient_gift', from: { id, name }, items: { rau, thit, tinhbot },
//              time, timestamp, claimed: false }

import { API_BASE, fetchAccount, putAccount } from '../../share/accountApi.js';
import { can, getCurrentUser, normalizeRole, ROLE } from '../../share/roles.js';
import { INGREDIENTS } from './shopConfig.js';
import { ShopError, mutateAccount, getIngredients } from './shopService.js';

const MAX_PER_ITEM = 99;
const KEEP_CLAIMED = 10; // chỉ giữ lại vài quà đã nhận gần nhất cho inbox khỏi phình to

const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

export const GIFT_TYPE = 'ingredient_gift';

/* ===== Đọc inbox ===== */

const otherEntries = (user) => (Array.isArray(user?.inbox) ? user.inbox : []).filter((g) => g && g.type !== GIFT_TYPE);

export function getInbox(user) {
    return (Array.isArray(user?.inbox) ? user.inbox : []).filter((g) => g && g.type === GIFT_TYPE);
}

export function describeItems(items = {}) {
    return Object.values(INGREDIENTS)
        .filter((i) => Number(items[i.id]) > 0)
        .map((i) => `${i.name} x${Number(items[i.id])}`)
        .join(' · ');
}

// Giữ mọi quà chưa nhận + vài quà đã nhận gần nhất
function pruneInbox(list) {
    const unclaimed = list.filter((g) => !g.claimed);
    const claimed = list.filter((g) => g.claimed).slice(0, KEEP_CLAIMED);
    return [...unclaimed, ...claimed].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

/* ===== Admin: danh sách tsv + gửi ===== */

export async function listTsvAccounts() {
    let res;
    try {
        res = await fetch(API_BASE, { cache: 'no-store' });
    } catch {
        throw new ShopError('Không kết nối được máy chủ, thử lại sau.');
    }
    if (!res.ok) throw new ShopError('Không tải được danh sách tài khoản.');
    const all = await res.json();
    return (Array.isArray(all) ? all : [])
        .filter((a) => normalizeRole(a?.role ?? a?.values?.role) === ROLE.TSV)
        .map((a) => ({ id: String(a.id), name: a.name || a.username || `Tài khoản ${a.id}`, mssv: a.mssv || '' }));
    // chỉ giữ id/tên/mssv — không để các field khác (mật khẩu...) đi vào giao diện
}

function cleanItems(items) {
    const out = {};
    let total = 0;
    for (const id of Object.keys(INGREDIENTS)) {
        const n = Number(items?.[id] ?? 0);
        if (!Number.isInteger(n) || n < 0 || n > MAX_PER_ITEM) {
            throw new ShopError(`Số lượng ${INGREDIENTS[id].name} phải là số nguyên từ 0 đến ${MAX_PER_ITEM}.`);
        }
        out[id] = n;
        total += n;
    }
    if (total < 1) throw new ShopError('Hãy chọn ít nhất 1 nguyên liệu để gửi.');
    return out;
}

export async function sendIngredients(toId, items) {
    const me = getCurrentUser();
    if (!me?.id) throw new ShopError('Bạn cần đăng nhập để gửi nguyên liệu.');
    const clean = cleanItems(items);
    if (!toId) throw new ShopError('Hãy chọn tài khoản nhận.');

    let sender, target;
    try {
        [sender, target] = await Promise.all([fetchAccount(me.id), fetchAccount(toId)]);
    } catch {
        throw new ShopError('Không kết nối được máy chủ, thử lại sau.');
    }
    // Quyền kiểm tra theo role trên server, không tin bản local
    if (!can('send_ingredient', sender)) throw new ShopError('Chỉ admin mới được gửi nguyên liệu.');
    if (normalizeRole(target?.role ?? target?.values?.role) !== ROLE.TSV) {
        throw new ShopError('Chỉ gửi được cho tài khoản có vai trò tsv.');
    }

    const now = new Date();
    const gift = {
        id: `gift_${now.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
        type: GIFT_TYPE,
        from: { id: String(sender.id), name: sender.name || 'Admin' },
        items: clean,
        time: dateStr(now),
        timestamp: now.getTime(),
        claimed: false,
    };
    const next = { ...target, inbox: [...pruneInbox([gift, ...getInbox(target)]), ...otherEntries(target)] };

    let res;
    try {
        res = await putAccount(toId, next);
    } catch {
        throw new ShopError('Không gửi được, thử lại sau.');
    }
    if (!res.ok) throw new ShopError('Không gửi được, thử lại sau.');
    return gift;
}

/* ===== tsv: nhận quà ===== */

export function claimGift(giftId) {
    return mutateAccount((u) => {
        if (!can('receive_ingredient', u)) throw new ShopError('Chỉ tài khoản tsv mới nhận được nguyên liệu.');
        const inbox = getInbox(u);
        const gift = inbox.find((g) => g.id === giftId);
        if (!gift) throw new ShopError('Không tìm thấy quà này.');
        if (gift.claimed) throw new ShopError('Quà này đã được nhận rồi.');

        const have = getIngredients(u);
        for (const id of Object.keys(INGREDIENTS)) {
            have[id] += Math.max(0, Math.floor(Number(gift.items?.[id]) || 0));
        }
        u.ingredients = have;
        gift.claimed = true;
        gift.claimedAt = Date.now();
        u.inbox = [...pruneInbox(inbox), ...otherEntries(u)];
    });
}
