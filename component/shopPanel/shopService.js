// component/shopPanel/shopService.js
// Logic mua món / chế biến món (nguyên liệu do admin gửi, xem giftService.js).
// Mỗi giao dịch: lấy tài khoản mới nhất từ API -> kiểm tra quyền + điều kiện -> sửa -> PUT lên API
// -> chỉ khi PUT thành công mới cập nhật localStorage. Lỗi ở bước nào thì không đổi gì cả.

import { API_BASE, fetchAccount, putAccount } from '../../share/accountApi.js';
import { can, getCurrentUser } from '../../share/roles.js';
import { INGREDIENTS } from './shopConfig.js';

export class ShopError extends Error {}

const pad = (n) => String(n).padStart(2, '0');
const dateStr = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

/* ===== Đọc / ghi từng phần của tài khoản (khớp cách túi đồ & ví coin đang lưu) ===== */

export const coinOf = (u) => Number(u?.values?.coin ?? u?.coin ?? 0);

function setCoin(u, v) {
    if (u.values && u.values.coin !== undefined) u.values.coin = v;
    else if (u.coin !== undefined) u.coin = v;
    else u.values = { ...(u.values || {}), coin: v };
}

// Túi đồ nằm ở values.items nếu có, không thì ở root (giống personalItem.js)
const itemsHolder = (u) => (u.values?.items ? u.values : u);

const qtyOf = (it) => Number(it.quantity ?? it.amount ?? it.count ?? 1);
const qtyKey = (it) => (it.quantity !== undefined ? 'quantity' : it.amount !== undefined ? 'amount' : it.count !== undefined ? 'count' : 'quantity');

export function getIngredients(u) {
    const raw = u?.ingredients || {};
    const out = {};
    for (const id of Object.keys(INGREDIENTS)) out[id] = Math.max(0, Number(raw[id]) || 0);
    return out;
}

export function getFoodCount(u, food) {
    const items = itemsHolder(u || {}).items || [];
    return items.filter((i) => i.nameItems === food.nameItems).reduce((s, i) => s + qtyOf(i), 0);
}

export function maxCraftable(u, recipe) {
    const have = getIngredients(u);
    return Math.min(...Object.entries(recipe).map(([id, need]) => Math.floor(have[id] / need)));
}

function addFood(u, food, n) {
    const h = itemsHolder(u);
    h.items = Array.isArray(h.items) ? h.items : [];
    const existing = h.items.find((i) => i.nameItems === food.nameItems);
    if (existing) {
        existing[qtyKey(existing)] = qtyOf(existing) + n;
    } else {
        h.items.push({
            nameItems: food.nameItems,
            image: food.image,
            type: food.type,
            indexItem: food.indexItem,
            quantity: n,
        });
    }
}

function removeFood(u, food, n) {
    const h = itemsHolder(u);
    const items = Array.isArray(h.items) ? h.items : [];
    let left = n;
    for (const it of items) {
        if (left <= 0) break;
        if (it.nameItems !== food.nameItems) continue;
        const take = Math.min(qtyOf(it), left);
        it[qtyKey(it)] = qtyOf(it) - take;
        left -= take;
    }
    if (left > 0) throw new ShopError('Bạn không có đủ món để bán.');
    h.items = items.filter((it) => !(it.nameItems === food.nameItems && qtyOf(it) <= 0));
}

function logTx(u, { title, subtitle, amount }) {
    const now = new Date();
    u.transactions = [
        { id: `shop_${now.getTime()}`, type: 'payment', title, subtitle, amount, date: dateStr(now), timestamp: now.getTime() },
        ...(Array.isArray(u.transactions) ? u.transactions : []),
    ];
}

/* ===== Đồng bộ với localStorage ===== */

// Chỉ gộp các field cửa hàng đụng tới, không ghi đè phần còn lại của local (exp, lifespan, mood...)
function mergeIntoLocal(server) {
    const cur = getCurrentUser() || {};
    const next = { ...cur, values: { ...(cur.values || {}) } };
    setCoin(next, coinOf(server));
    if (server.values && 'items' in server.values) next.values.items = server.values.items;
    if ('items' in server) next.items = server.items;
    if ('ingredients' in server) next.ingredients = server.ingredients;
    if ('inbox' in server) next.inbox = server.inbox;
    if ('transactions' in server) next.transactions = server.transactions;
    if ('role' in server) next.role = server.role;
    localStorage.setItem('currentUser', JSON.stringify(next));
    document.dispatchEvent(new CustomEvent('wallet:change', { detail: { coin: coinOf(next) } }));
    return next;
}

// Làm mới dữ liệu từ API khi mở cửa hàng (để role / coin / kho luôn đúng). Lỗi mạng thì dùng bản local.
export async function refreshAccount() {
    const local = getCurrentUser();
    if (!local?.id) return local;
    try {
        return mergeIntoLocal(await fetchAccount(local.id));
    } catch (err) {
        console.warn('Cửa hàng: chưa làm mới được dữ liệu, dùng bản đang lưu.', err);
        return local;
    }
}

export async function mutateAccount(mutator) {
    const local = getCurrentUser();
    if (!local?.id) throw new ShopError('Bạn cần đăng nhập để giao dịch.');

    let server;
    try {
        server = await fetchAccount(local.id);
    } catch {
        throw new ShopError('Không kết nối được máy chủ, thử lại sau.');
    }

    const draft = structuredClone(server);
    mutator(draft); // ném ShopError nếu thiếu quyền / thiếu coin / thiếu nguyên liệu

    let res;
    try {
        res = await putAccount(local.id, draft);
    } catch {
        throw new ShopError('Không lưu được giao dịch, thử lại sau.');
    }
    if (!res.ok) throw new ShopError('Không lưu được giao dịch, thử lại sau.');

    return mergeIntoLocal(draft);
}

/* ===== Điều kiện chung ===== */

function toQty(q) {
    const n = Number(q);
    if (!Number.isInteger(n) || n < 1 || n > 99) throw new ShopError('Số lượng phải là số nguyên từ 1 đến 99.');
    return n;
}

function requirePermission(u, action) {
    if (!can(action, u)) throw new ShopError('Vai trò của bạn không có quyền thực hiện thao tác này.');
}

function spend(u, cost) {
    const coin = coinOf(u);
    if (coin < cost) throw new ShopError('Không đủ coin.');
    setCoin(u, coin - cost);
}

/* ===== Sàn giao dịch chung =====
   Kho món trên sàn nằm trong 1 bản ghi riêng (isMarket: true) cùng endpoint tài khoản:
       { name: 'Sàn giao dịch', isMarket: true, stock: { <shopId>: <số món> } }
   Không lưu ai bán — tsv bán thì cộng vào kho chung, ai mua thì trừ khỏi kho chung. */

async function findMarket() {
    let res;
    try {
        res = await fetch(API_BASE, { cache: 'no-store' });
    } catch {
        throw new ShopError('Không kết nối được máy chủ, thử lại sau.');
    }
    if (!res.ok) throw new ShopError('Không tải được sàn giao dịch.');
    const all = await res.json();
    return (Array.isArray(all) ? all : []).find((a) => a && a.isMarket === true) || null;
}

const stockOf = (market, shop) => Math.max(0, Math.floor(Number(market?.stock?.[shop.id]) || 0));

export async function getMarketStock(shop) {
    return stockOf(await findMarket(), shop);
}

// Cộng / trừ số món trên sàn. Trả về số món sau khi đổi.
async function adjustMarket(shop, delta) {
    let market = await findMarket();
    let res;
    try {
        if (!market) {
            if (delta < 0) throw new ShopError('Sàn chưa có món nào để mua.');
            res = await fetch(API_BASE, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Sàn giao dịch', isMarket: true, stock: { [shop.id]: delta } }),
            });
            if (!res.ok) throw new ShopError('Không lưu được sàn giao dịch, thử lại sau.');
            return delta;
        }
        const next = stockOf(market, shop) + delta;
        if (next < 0) throw new ShopError('Sàn đã hết món (có người vừa mua).');
        res = await putAccount(market.id, { ...market, stock: { ...(market.stock || {}), [shop.id]: next } });
        if (!res.ok) throw new ShopError('Không lưu được sàn giao dịch, thử lại sau.');
        return next;
    } catch (err) {
        if (err instanceof ShopError) throw err;
        throw new ShopError('Không lưu được sàn giao dịch, thử lại sau.');
    }
}

/* ===== Thao tác ===== */

// Mua món từ sàn: phải có món trên sàn mới mua được. Giữ chỗ trên sàn trước, giao dịch tài khoản lỗi thì trả lại.
export async function buyFood(shop, qty) {
    const n = toQty(qty);
    const me = getCurrentUser();
    if (!can('buy_food', me)) throw new ShopError('Vai trò của bạn không có quyền thực hiện thao tác này.');
    if (coinOf(me) < shop.food.price * n) throw new ShopError('Không đủ coin.');

    await adjustMarket(shop, -n);
    try {
        return await mutateAccount((u) => {
            requirePermission(u, 'buy_food');
            const cost = shop.food.price * n;
            spend(u, cost);
            addFood(u, shop.food, n);
            logTx(u, { title: `Mua ${shop.food.nameItems} x${n}`, subtitle: 'Sàn giao dịch', amount: -cost });
        });
    } catch (err) {
        try { await adjustMarket(shop, n); } catch { /* không hoàn được thì thôi, tránh che lỗi gốc */ }
        throw err;
    }
}

// tsv đưa món đã chế biến lên sàn: trừ món trong túi, nhận giá cố định cho mỗi món.
export async function sellFood(shop, qty) {
    const n = toQty(qty);
    const me = getCurrentUser();
    if (!can('sell_food', me)) throw new ShopError('Chỉ tsv mới được bán món lên sàn.');
    if (getFoodCount(me, shop.food) < n) throw new ShopError('Bạn không có đủ món để bán.');

    await adjustMarket(shop, n);
    try {
        return await mutateAccount((u) => {
            requirePermission(u, 'sell_food');
            removeFood(u, shop.food, n);
            const earn = shop.food.price * n;
            setCoin(u, coinOf(u) + earn);
            logTx(u, { title: `Bán ${shop.food.nameItems} x${n}`, subtitle: 'Sàn giao dịch', amount: earn });
        });
    } catch (err) {
        try { await adjustMarket(shop, -n); } catch { /* như trên */ }
        throw err;
    }
}

export async function craftFood(shop, qty) {
    const n = toQty(qty);
    return mutateAccount((u) => {
        requirePermission(u, 'craft_food');
        const ing = getIngredients(u);
        for (const [id, need] of Object.entries(shop.recipe)) {
            if (ing[id] < need * n) throw new ShopError(`Không đủ ${INGREDIENTS[id].name} để chế biến.`);
        }
        for (const [id, need] of Object.entries(shop.recipe)) ing[id] -= need * n;
        u.ingredients = ing;
        addFood(u, shop.food, n);
    });
}
