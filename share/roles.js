// share/roles.js
// Phân quyền theo vai trò tài khoản: tsv, csv, admin.
//   admin : toàn quyền (gồm gửi nguyên liệu cho tsv)
//   tsv   : di chuyển, mua món, chế biến món, bán món lên sàn, nhận nguyên liệu do admin gửi
//   csv   : di chuyển, chỉ được mua món
// Vai trò đọc từ field `role` của tài khoản (MockAPI). Thiếu / sai giá trị -> csv (quyền thấp nhất).
//
// Lưu ý: đây là kiểm tra phía client để ẩn/chặn giao diện. MockAPI ai cũng ghi được,
// muốn chặn thật sự thì cần kiểm tra ở backend.

export const ROLE = { TSV: 'tsv', CSV: 'csv', ADMIN: 'admin' };

export const ROLE_LABEL = { tsv: 'TSV', csv: 'CSV', admin: 'Admin' };

const PERMISSIONS = {
    admin: ['*'],
    tsv: ['move', 'buy_food', 'craft_food', 'sell_food', 'receive_ingredient'],
    csv: ['move', 'buy_food'],
};

export function getCurrentUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function normalizeRole(raw) {
    const r = String(raw ?? '').trim().toLowerCase();
    return PERMISSIONS[r] ? r : ROLE.CSV;
}

export function getRole(user = getCurrentUser()) {
    return normalizeRole(user?.role ?? user?.values?.role);
}

export function can(action, user = getCurrentUser()) {
    if (!user) return false;
    const perms = PERMISSIONS[getRole(user)];
    return perms.includes('*') || perms.includes(action);
}
