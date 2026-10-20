// component/viCoinApp/viCoinApp.js
// App "Ví Coin" mở bên trong bảng iPad (DashboardPanel) — hiển thị số dư,
// chuyển coin thật giữa các tài khoản qua MockAPI, và lịch sử giao dịch.
//
// Lịch sử giao dịch được LƯU VĨNH VIỄN ngay trên chính bản ghi tài khoản ở
// MockAPI (field "transactions"), không còn lưu tạm ở localStorage nữa —
// nên mở trên máy nào, tài khoản nào cũng thấy đúng lịch sử của tài khoản đó,
// và cả hai bên gửi/nhận đều thấy giao dịch của mình sau khi chuyển.

const API_BASE = 'https://6a53c0628547b9f7111bc89e.mockapi.io/accounts/test/testManage';
const TX_SEED_URL = '../../data/viCoinTransactions.json';

const TAB_LABELS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'receive', label: 'Nhận' },
    { id: 'send', label: 'Chuyển' },
    { id: 'payment', label: 'Thanh toán' },
    { id: 'topup', label: 'Nạp' },
];

const TX_TYPE_META = {
    receive: { icon: 'fa-arrow-down', cls: 'tx-icon--receive' },
    send: { icon: 'fa-arrow-up', cls: 'tx-icon--send' },
    payment: { icon: 'fa-file-invoice-dollar', cls: 'tx-icon--payment' },
    topup: { icon: 'fa-wallet', cls: 'tx-icon--topup' },
};

// Lưới chức năng (theo prototype): 1 dịch vụ, 3 ô "sắp ra mắt", rồi 4 thao tác chính
const FEATURE_ACTIONS = [
    { id: 'pay',      label: 'Dịch vụ CLB',  icon: 'fa-file-invoice-dollar', accent: 'pink' },
    { coming: true },
    { coming: true },
    { coming: true },
    { id: 'transfer', label: 'Chuyển coin',  icon: 'fa-paper-plane',         accent: 'blue' },
    { id: 'topup',    label: 'Nạp coin',     icon: 'fa-credit-card',         accent: 'yellow' },
    { id: 'history',  label: 'Lịch sử',      icon: 'fa-clock-rotate-left',   accent: 'mint' },
    { id: 'offers',   label: 'Ưu đãi &amp; quà', icon: 'fa-gift',            accent: 'violet' },
];

const WEEK_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

function fmtCoin(n) {
    return Math.round(n || 0).toLocaleString('vi-VN');
}

function fmtVND(coin) {
    return (Math.round(coin || 0) * 10).toLocaleString('vi-VN');
}

function renderAction(a) {
    if (a.coming) {
        return `
            <button class="vc-action vc-action--coming" disabled aria-label="Tính năng tương lai, sắp ra mắt">
                <span class="vc-action__icon"><i class="fa-solid fa-lock"></i></span>
                <span class="vc-action__label">Sắp ra mắt</span>
            </button>
        `;
    }
    return `
        <button class="vc-action vc-action--${a.accent}" data-action="${a.id}">
            <span class="vc-action__icon"><i class="fa-solid ${a.icon}"></i></span>
            <span class="vc-action__label">${a.label}</span>
        </button>
    `;
}

// Chuỗi ngày trong tuần (demo): coi như đã điểm danh các ngày trước hôm nay
function renderWeek() {
    const todayIdx = (new Date().getDay() + 6) % 7; // T2 = 0 ... CN = 6
    return WEEK_LABELS.map((label, i) => {
        const cls = i < todayIdx ? 'vc-day--done' : i === todayIdx ? 'vc-day--today' : '';
        return `
            <div class="vc-day ${cls}">
                <span>${i < todayIdx ? '✓' : i + 1}</span>
                <small>${label}</small>
            </div>
        `;
    }).join('');
}

// Luôn tắt cache khi gọi MockAPI để tránh nhận dữ liệu số dư/lịch sử cũ
// (browser hoặc CDN cache lại response GET rồi trả về bản cũ).
function apiFetch(url, options = {}) {
    return fetch(url, { ...options, cache: 'no-store' });
}

async function fetchAccount(id) {
    const res = await apiFetch(`${API_BASE}/${id}`);
    if (!res.ok) throw new Error('Không tải được dữ liệu tài khoản.');
    return res.json();
}

async function putAccount(id, payload) {
    return apiFetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
}

// ===== Đồng bộ số dư với header (wallet pill) =====
// Mọi nơi làm đổi số dư đều gọi emitWalletChange(); header lắng nghe sự kiện
// "wallet:change" nên cập nhật ngay, không cần F5.
function coinOf(acc) {
    return acc?.values?.coin ?? acc?.coin ?? 0;
}

export function emitWalletChange(coin) {
    document.dispatchEvent(new CustomEvent('wallet:change', { detail: { coin } }));
}

// Thỉnh thoảng hỏi MockAPI xem số dư có đổi không (ví dụ có người chuyển coin
// cho mình) rồi báo cho header. Tạm dừng khi tab bị ẩn hoặc đang chuyển coin.
let _watchTimer = null;
export function startWalletWatcher(intervalMs = 10000) {
    if (_watchTimer) return;
    const tick = async () => {
        if (document.hidden || ViCoinApp._busy) return;
        try {
            const saved = localStorage.getItem('currentUser');
            const local = saved ? JSON.parse(saved) : null;
            if (!local?.id) return;
            const fresh = await fetchAccount(local.id);
            if (ViCoinApp._busy) return; // đang chuyển coin -> để luồng chuyển tự cập nhật
            if (coinOf(fresh) === coinOf(local)) return;
            // Chỉ gộp coin + lịch sử, không ghi đè các field khác của local (exp, lifespan...)
            local.values = { ...local.values, coin: coinOf(fresh) };
            local.transactions = fresh.transactions ?? local.transactions;
            localStorage.setItem('currentUser', JSON.stringify(local));
            if (ViCoinApp._userData?.id === local.id) {
                ViCoinApp._userData = { ...ViCoinApp._userData, values: local.values, transactions: local.transactions };
            }
            emitWalletChange(coinOf(local));
        } catch (err) {
            console.warn('Wallet watcher: không đồng bộ được số dư.', err);
        }
    };
    _watchTimer = setInterval(tick, intervalMs);
}

export const ViCoinApp = {
    _containerId: null,
    _onBack: null,
    _userData: null,
    _tx: [],
    _activeTab: 'all',
    _busy: false,

    async render(containerId, { onBack, userData } = {}) {
        this._containerId = containerId;
        this._onBack = onBack || (() => {});
        const saved = localStorage.getItem('currentUser');
        this._userData = userData || (saved ? JSON.parse(saved) : null);
        this._activeTab = 'all';

        const el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = `<div class="vc-loading"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải Ví Coin...</div>`;

        await this._refreshBalance();
        await this._loadHistory();
        this._draw();
    },

    async _refreshBalance() {
        if (!this._userData?.id) return;
        try {
            const fresh = await fetchAccount(this._userData.id);
            this._userData = fresh;
            localStorage.setItem('currentUser', JSON.stringify(fresh));
            emitWalletChange(coinOf(fresh));
        } catch (err) {
            console.warn('Ví Coin: không tải được số dư mới nhất, dùng dữ liệu cục bộ.', err);
        }
    },

    // Lịch sử = giao dịch thật đã lưu trên tài khoản (MockAPI, vĩnh viễn).
    // Chỉ dùng file mẫu data/viCoinTransactions.json làm ví dụ khi tài khoản
    // CHƯA từng có giao dịch thật nào — để màn hình không trống trơn lúc mới dùng.
    async _loadHistory() {
        const ownTx = Array.isArray(this._userData?.transactions) ? this._userData.transactions : [];
        if (ownTx.length) {
            this._tx = [...ownTx].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
            return;
        }
        let seed = [];
        try {
            const res = await apiFetch(TX_SEED_URL);
            if (res.ok) seed = await res.json();
        } catch (err) {
            console.warn('Ví Coin: không tải được dữ liệu mẫu giao dịch.', err);
        }
        this._tx = seed;
    },

    _coin() {
        return this._userData?.values?.coin ?? this._userData?.coin ?? 0;
    },

    _tier() {
        return this._userData?.tier || this._userData?.profile?.tier || 'Tân Thủ';
    },

    _filteredTx() {
        if (this._activeTab === 'all') return this._tx;
        return this._tx.filter((t) => t.type === this._activeTab);
    },

    _draw() {
        const el = document.getElementById(this._containerId);
        if (!el) return;
        el.innerHTML = this._html();
        this._bindEvents(el);
    },

    _html() {
        const coin = this._coin();
        const name = this._userData?.name || 'Người chơi';
        const level = this._userData?.level ?? 0;
        const exp = this._userData?.exp || { current: 0, max: 20000 };
        const expPct = Math.min(100, Math.round(((exp.current || 0) / (exp.max || 1)) * 100));
        const today = new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' });
        return `
            <div class="vc-app">
                <header class="vc-topline">
                    <div class="vc-greeting">
                        <small>${today}</small>
                        <strong>Ví của ${name}</strong>
                    </div>
                    <div class="vc-status-pill">
                        <i></i><span>Đã bảo vệ</span>
                        <svg width="16" height="16" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/></svg>
                    </div>
                </header>

                <div class="vc-dashboard">
                    <section class="vc-balance-card" aria-labelledby="vc-balance-title">
                        <div class="vc-balance-card__label">
                            <span id="vc-balance-title">Số dư khả dụng</span>
                            <span class="vc-balance-card__rank">${this._tier().toUpperCase()} · LV.${String(level).padStart(2, '0')}</span>
                        </div>
                        <div class="vc-balance-card__main">
                            <div class="vc-coin-orb" aria-hidden="true"></div>
                            <div class="vc-balance-card__info">
                                <div class="vc-balance-card__amount">${fmtCoin(coin)}<span class="vc-balance-card__unit">coin</span></div>
                                <div class="vc-balance-card__vnd">≈ ${fmtVND(coin)} VNĐ · Giá trị ước tính</div>
                            </div>
                        </div>
                        <div class="vc-balance-card__foot">
                            <span>${expPct}% đến cấp tiếp theo</span>
                            <div class="vc-mini-progress" aria-label="Tiến độ ${expPct} phần trăm"><span style="width:${expPct}%"></span></div>
                        </div>
                    </section>

                    <section class="vc-panel vc-daily" aria-labelledby="vc-daily-title">
                        <div class="vc-daily__copy">
                            <h2 id="vc-daily-title">Chuỗi ngày năng động</h2>
                            <p>Quay lại mỗi ngày để tích tiến độ nhận quà tuần.</p>
                        </div>
                        <div class="vc-streak" aria-label="Tiến độ tuần">
                            ${renderWeek()}
                        </div>
                    </section>
                </div>

                <section class="vc-panel vc-feature-panel" aria-label="Chức năng ví coin">
                    <div class="vc-feature-grid">
                        ${FEATURE_ACTIONS.map(renderAction).join('')}
                    </div>
                </section>
            </div>

            <div class="vc-modal-root" id="vc-modal-root"></div>
        `;
    },

    _renderTxList() {
        const list = this._filteredTx();
        if (!list.length) {
            return `<div class="vc-tx-empty">Chưa có giao dịch nào.</div>`;
        }
        return list.map((t) => {
            const meta = TX_TYPE_META[t.type] || TX_TYPE_META.receive;
            const positive = t.amount > 0;
            return `
                <div class="vc-tx-item">
                    <div class="vc-tx-icon ${meta.cls}"><i class="fa-solid ${meta.icon}"></i></div>
                    <div class="vc-tx-info">
                        <span class="t">${t.title}</span>
                        <span class="s">${t.subtitle || ''}${t.date ? ' · ' + t.date : ''}</span>
                    </div>
                    <span class="vc-tx-amount ${positive ? 'is-positive' : 'is-negative'}">${positive ? '+' : ''}${fmtCoin(t.amount)}</span>
                </div>
            `;
        }).join('');
    },

    // Mọi handler bên dưới đều nhận tham số sự kiện (e) và gọi stopPropagation().
    // Lý do: nhiều nút ở đây (tab, đóng modal...) tự vẽ lại DOM của chính app này
    // ngay trong lúc xử lý click. Nếu để sự kiện nổi lên tới document, phần xử lý
    // "click ra ngoài thì đóng iPad" ở DashboardPanel có thể hiểu nhầm là click ra
    // ngoài (vì DOM cũ đã bị thay) rồi đóng luôn cả bảng iPad — stopPropagation
    // chặn việc đó ngay tại nguồn, an toàn hơn là chỉ sửa một phía.
    _bindEvents(root) {
        root.addEventListener('click', (e) => e.stopPropagation());

        root.querySelector('[data-action="transfer"]')?.addEventListener('click', () => this._openTransferModal());
        root.querySelector('[data-action="history"]')?.addEventListener('click', () => this._openHistorySheet());
        root.querySelector('[data-action="pay"]')?.addEventListener('click', () => this._toast('Thanh toán dịch vụ CLB đang được phát triển.'));
        root.querySelector('[data-action="topup"]')?.addEventListener('click', () => this._toast('Tính năng Nạp Coin đang được phát triển.'));
        root.querySelector('[data-action="offers"]')?.addEventListener('click', () => this._toast('Ưu đãi & quà tặng sắp ra mắt.'));
    },

    _toast(msg) {
        const modalRoot = document.getElementById('vc-modal-root');
        if (!modalRoot) return;
        const toast = document.createElement('div');
        toast.className = 'vc-toast';
        toast.textContent = msg;
        modalRoot.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('vc-toast--show'));
        setTimeout(() => {
            toast.classList.remove('vc-toast--show');
            setTimeout(() => toast.remove(), 250);
        }, 2200);
    },

    // Sheet dùng chung (chuyển coin, lịch sử) theo kiểu prototype: nền tối + hộp bo tròn.
    // Chặn click nổi lên (xem lý do ở _bindEvents) để bấm X hay vùng tối chỉ đóng sheet, không đóng cả iPad.
    _openSheet({ title, desc, body }) {
        const modalRoot = document.getElementById('vc-modal-root');
        if (!modalRoot) return null;

        modalRoot.innerHTML = `
            <div class="vc-overlay" id="vc-sheet-overlay">
                <div class="vc-sheet" role="dialog" aria-modal="true" aria-labelledby="vc-sheet-title">
                    <div class="vc-sheet__head">
                        <div>
                            <h2 id="vc-sheet-title">${title}</h2>
                            <p>${desc}</p>
                        </div>
                        <button class="vc-sheet__close" id="vc-sheet-close" aria-label="Đóng"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="vc-sheet__body" id="vc-sheet-body">${body}</div>
                </div>
            </div>
        `;

        modalRoot.onclick = (e) => e.stopPropagation();

        const close = () => { modalRoot.innerHTML = ''; };
        modalRoot.querySelector('#vc-sheet-close')?.addEventListener('click', close);
        modalRoot.querySelector('#vc-sheet-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'vc-sheet-overlay') close();
        });
        return modalRoot;
    },

    _openHistorySheet() {
        this._activeTab = 'all';
        const modalRoot = this._openSheet({
            title: 'Lịch sử giao dịch',
            desc: 'Giao dịch mới nhất hiển thị trước.',
            body: this._historyHtml(),
        });
        if (modalRoot) this._bindHistoryTabs(modalRoot);
    },

    _historyHtml() {
        return `
            <div class="vc-tabs">
                ${TAB_LABELS.map((t) => `<button class="vc-tab ${this._activeTab === t.id ? 'vc-tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
            </div>
            <div class="vc-tx-list">
                ${this._renderTxList()}
            </div>
        `;
    },

    // Đổi tab chỉ vẽ lại phần thân sheet (không _draw cả app, vì sẽ làm đóng sheet)
    _bindHistoryTabs(modalRoot) {
        modalRoot.querySelectorAll('.vc-tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._activeTab = btn.dataset.tab;
                const body = modalRoot.querySelector('#vc-sheet-body');
                if (body) body.innerHTML = this._historyHtml();
                this._bindHistoryTabs(modalRoot);
            });
        });
    },

    async _openTransferModal() {
        const modalRoot = this._openSheet({
            title: 'Chuyển coin',
            desc: 'Chọn người nhận và nhập số coin muốn chuyển.',
            body: `<div class="vc-loading vc-loading--small"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách tài khoản...</div>`,
        });
        if (!modalRoot) return;

        let accounts = [];
        try {
            const res = await apiFetch(API_BASE);
            if (!res.ok) throw new Error('network');
            accounts = (await res.json()).filter((a) => a.id !== this._userData?.id && !a.isMarket);
        } catch (err) {
            const body = modalRoot.querySelector('#vc-sheet-body');
            if (body) body.innerHTML = `<div class="vc-tx-empty">Không tải được danh sách tài khoản. Vui lòng thử lại.</div>`;
            return;
        }

        if (!accounts.length) {
            const body = modalRoot.querySelector('#vc-sheet-body');
            if (body) body.innerHTML = `<div class="vc-tx-empty">Chưa có tài khoản nào khác để chuyển coin.</div>`;
            return;
        }

        const body = modalRoot.querySelector('#vc-sheet-body');
        if (!body) return;
        body.innerHTML = `
            <label class="vc-field">
                <span>Người nhận</span>
                <div class="vc-input-wrap">
                    <select id="vc-transfer-recipient">
                        ${accounts.map((a) => `<option value="${a.id}">${a.name}${a.mssv ? ' (' + a.mssv + ')' : ''}</option>`).join('')}
                    </select>
                </div>
            </label>
            <label class="vc-field">
                <span>Số coin muốn chuyển</span>
                <div class="vc-input-wrap">
                    <input type="number" id="vc-transfer-amount" min="1" max="${this._coin()}" placeholder="0" />
                    <em>COIN</em>
                </div>
            </label>
            <div class="vc-preview">
                <div class="vc-preview__row"><span>Số dư hiện tại</span><strong>${fmtCoin(this._coin())} coin</strong></div>
                <div class="vc-preview__row"><span>Còn lại</span><strong id="vc-transfer-remain">${fmtCoin(this._coin())} coin</strong></div>
            </div>
            <div class="vc-transfer-error" id="vc-transfer-error"></div>
            <button class="vc-primary" id="vc-transfer-submit">Xác nhận chuyển</button>
        `;

        modalRoot.querySelector('#vc-transfer-amount')?.addEventListener('input', (e) => {
            const remain = Math.max(0, this._coin() - Number(e.target.value || 0));
            const el = modalRoot.querySelector('#vc-transfer-remain');
            if (el) el.textContent = `${fmtCoin(remain)} coin`;
        });
        modalRoot.querySelector('#vc-transfer-submit')?.addEventListener('click', () => this._submitTransfer());
    },

    // Chuyển coin: luôn lấy dữ liệu MỚI NHẤT của cả hai bên ngay trước khi ghi
    // (tránh ghi đè bằng dữ liệu cũ lấy từ lúc mở danh sách), ghi TUẦN TỰ
    // (trừ người gửi trước, cộng người nhận sau — không dùng Promise.all chạy
    // song song vì MockAPI xử lý 2 request PUT đồng thời không ổn định, dễ
    // khiến một bên "chuyển đi nhưng không tới nơi"). Nếu bước cộng cho người
    // nhận thất bại, tự động hoàn lại coin cho người gửi.
    // Lịch sử giao dịch được ghi thẳng vào field "transactions" của MỖI tài khoản
    // nên lưu vĩnh viễn trên MockAPI, không mất khi tải lại trang hay đổi máy.
    async _submitTransfer() {
        if (this._busy) return;
        const modalRoot = document.getElementById('vc-modal-root');
        const errorEl = modalRoot?.querySelector('#vc-transfer-error');
        const recipientId = modalRoot?.querySelector('#vc-transfer-recipient')?.value;
        const amountRaw = modalRoot?.querySelector('#vc-transfer-amount')?.value;
        const amount = Number(amountRaw);

        if (errorEl) errorEl.textContent = '';

        if (!recipientId) { if (errorEl) errorEl.textContent = 'Vui lòng chọn người nhận.'; return; }
        if (!amount || amount <= 0) { if (errorEl) errorEl.textContent = 'Số coin không hợp lệ.'; return; }
        if (recipientId === this._userData?.id) { if (errorEl) errorEl.textContent = 'Không thể tự chuyển cho chính mình.'; return; }

        const submitBtn = modalRoot?.querySelector('#vc-transfer-submit');
        this._busy = true;
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang xử lý...'; }

        let freshSender = null;
        let senderDeducted = false;

        try {
            const [senderData, recipientData] = await Promise.all([
                fetchAccount(this._userData.id),
                fetchAccount(recipientId),
            ]);
            freshSender = senderData;
            const freshRecipient = recipientData;

            const senderCoin = freshSender.values?.coin ?? 0;
            if (amount > senderCoin) {
                if (errorEl) errorEl.textContent = 'Số dư không đủ để thực hiện giao dịch.';
                return;
            }

            const now = new Date();
            const dateStr = now.toLocaleString('vi-VN');

            const senderPayload = {
                ...freshSender,
                values: { ...freshSender.values, coin: senderCoin - amount },
                transactions: [
                    {
                        id: `tx_${now.getTime()}_s`,
                        type: 'send',
                        title: `Chuyển cho ${freshRecipient.name}`,
                        subtitle: 'Chuyển coin nội bộ',
                        amount: -amount,
                        date: dateStr,
                        timestamp: now.getTime(),
                    },
                    ...(Array.isArray(freshSender.transactions) ? freshSender.transactions : []),
                ],
            };

            // Bước 1: trừ coin người gửi.
            const senderRes = await putAccount(this._userData.id, senderPayload);
            if (!senderRes.ok) throw new Error('Không thể trừ coin của bạn, vui lòng thử lại.');
            senderDeducted = true;

            const receiverPayload = {
                ...freshRecipient,
                values: { ...freshRecipient.values, coin: (freshRecipient.values?.coin ?? 0) + amount },
                transactions: [
                    {
                        id: `tx_${now.getTime()}_r`,
                        type: 'receive',
                        title: `Nhận từ ${freshSender.name}`,
                        subtitle: 'Chuyển coin nội bộ',
                        amount: amount,
                        date: dateStr,
                        timestamp: now.getTime(),
                    },
                    ...(Array.isArray(freshRecipient.transactions) ? freshRecipient.transactions : []),
                ],
            };

            // Bước 2: cộng coin người nhận.
            const receiverRes = await putAccount(recipientId, receiverPayload);
            if (!receiverRes.ok) {
                // Cộng cho người nhận thất bại -> hoàn lại nguyên trạng cho người gửi.
                await putAccount(this._userData.id, freshSender);
                senderDeducted = false; // đã tự hoàn ở đây, catch bên dưới khỏi hoàn lại lần nữa
                throw new Error('Chuyển coin cho người nhận thất bại, đã hoàn lại coin cho bạn.');
            }

            this._userData = senderPayload;
            localStorage.setItem('currentUser', JSON.stringify(senderPayload));
            emitWalletChange(coinOf(senderPayload));
            this._tx = senderPayload.transactions;

            this._draw();
            this._toast(`Đã chuyển ${fmtCoin(amount)} coin cho ${freshRecipient.name}.`);
        } catch (err) {
            if (senderDeducted && freshSender) {
                // Phòng hờ: nếu lỗi xảy ra sau khi đã trừ tiền người gửi nhưng
                // chưa kịp hoàn (ví dụ lỗi mạng giữa chừng), vẫn cố hoàn lại.
                try { await putAccount(this._userData.id, freshSender); } catch { /* đã cố hết sức */ }
            }
            if (errorEl) errorEl.textContent = err.message || 'Có lỗi xảy ra, vui lòng thử lại sau.';
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Xác nhận chuyển'; }
        } finally {
            this._busy = false;
        }
    },
};
