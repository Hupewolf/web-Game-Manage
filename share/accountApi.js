// share/accountApi.js
// Gọi MockAPI tài khoản dùng chung cho các component mới (cửa hàng, tinh thần).

export const API_BASE = 'https://6a53c0628547b9f7111bc89e.mockapi.io/accounts/test/testManage';

function apiFetch(url, options = {}) {
    return fetch(url, { ...options, cache: 'no-store' });
}

export async function fetchAccount(id) {
    const res = await apiFetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Không tải được dữ liệu tài khoản.');
    return res.json();
}

export function putAccount(id, payload) {
    return apiFetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}
