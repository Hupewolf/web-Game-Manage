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

const HIGHLIGHT_FEATURES = [
    { id: 'lucky', icon: 'fa-dice', grad: 'vc-grad-blue', title: 'Vòng quay may mắn', sub: 'Cơ hội nhận coin miễn phí' },
    { id: 'mission', icon: 'fa-calendar-check', grad: 'vc-grad-green', title: 'Nhiệm vụ hàng ngày', sub: 'Hoàn thành để nhận thưởng' },
    { id: 'ranking', icon: 'fa-ranking-star', grad: 'vc-grad-orange', title: 'BXH Thành viên', sub: 'Top nạp coin nhiều nhất' },
    { id: 'giftshop', icon: 'fa-gift', grad: 'vc-grad-purple', title: 'Cửa hàng quà tặng', sub: 'Đổi coin lấy vật phẩm' },
];

function fmtCoin(n) {
    return Math.round(n || 0).toLocaleString('vi-VN');
}

function fmtVND(coin) {
    return (Math.round(coin || 0) * 10).toLocaleString('vi-VN');
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
        return `
            <div class="vc-app">
                <div class="vc-top">
                    <div class="vc-balance-card">
                        <div class="vc-balance-card__badge">Hạng thành viên: ${this._tier()}</div>
                        <div class="vc-balance-card__main">
                            <div class="vc-coin-orb"></div>
                            <div class="vc-balance-card__info">
                                <span class="vc-balance-card__label">Số dư của bạn</span>
                                <div class="vc-balance-card__amount">${fmtCoin(coin)} <img src="../../img/icon/UCoin.svg" ></div>
                                <span class="vc-balance-card__vnd">≈ ${fmtVND(coin)} VNĐ (ước tính)</span>
                            </div>
                        </div>
                        <button class="vc-balance-card__history" data-action="focus-history">
                            <i class="fa-regular fa-clock"></i> Lịch sử giao dịch <i class="fa-solid fa-chevron-right"></i>
                        </button>
                        <div class="vc-balance-card__tagline">Cùng nhau phát triển · Ban Công Nghệ</div>
                    </div>
                    <div class="vc-quick-grid">
                        <button class="vc-quick" data-action="transfer">
                            <span class="vc-quick__icon vc-grad-blue"><i class="fa-solid fa-paper-plane"></i></span>
                            Chuyển Coin
                        </button>
                        <button class="vc-quick" data-action="pay">
                            <span class="vc-quick__icon vc-grad-teal"><i class="fa-solid fa-file-invoice-dollar"></i></span>
                            Thanh toán dịch vụ CLB
                        </button>
                        <button class="vc-quick" data-action="topup">
                            <span class="vc-quick__icon vc-grad-orange"><i class="fa-solid fa-wallet"></i></span>
                            Nạp Coin
                        </button>
                        <button class="vc-quick" data-action="offers">
                            <span class="vc-quick__icon vc-grad-purple"><i class="fa-solid fa-gift"></i></span>
                            Ưu đãi & quà tặng
                        </button>
                    </div>
                </div>

                <div class="vc-mid">
                    <div class="vc-history-card" id="vc-history-anchor">
                        <div class="vc-card-head">
                            <span>Lịch sử giao dịch</span>
                            <a href="#" class="vc-see-all" data-action="see-all">Xem tất cả</a>
                        </div>
                        <div class="vc-tabs">
                            ${TAB_LABELS.map((t) => `<button class="vc-tab ${this._activeTab === t.id ? 'vc-tab--active' : ''}" data-tab="${t.id}">${t.label}</button>`).join('')}
                        </div>
                        <div class="vc-tx-list">
                            ${this._renderTxList()}
                        </div>
                    </div>

                    <div class="outer-vc-highlights-card">
                        <div class="vc-highlights-card">
                            <div class="vc-card-head"><span>Tính năng nổi bật</span></div>
                            <div class="vc-highlights-grid">
                                ${HIGHLIGHT_FEATURES.map((f) => `
                                    <button class="vc-highlight" data-action="feature-${f.id}">
                                        <span class="vc-highlight__icon ${f.grad}"><i class="fa-solid ${f.icon}"></i></span>
                                        <span class="vc-highlight__text">
                                            <span class="t">${f.title}</span>
                                            <span class="s">${f.sub}</span>
                                        </span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>
                        <div class="vc-banner">
                            <div class="vc-banner__text">
                                <span class="vc-banner__title">Nạp coin nhận quà xịn</span>
                                <span class="vc-banner__sub">Tặng thêm 20% khi nạp từ 500 coin trở lên!</span>
                            </div>
                            <button class="vc-banner__cta" data-action="topup"><i class="fa-solid fa-chevron-right"></i></button>
                        </div>
                    </div>
                </div>

                
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

        root.querySelector('[data-action="focus-history"]')?.addEventListener('click', (e) => {
            e.preventDefault();
            root.querySelector('#vc-history-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        root.querySelector('[data-action="see-all"]')?.addEventListener('click', (e) => e.preventDefault());

        root.querySelectorAll('.vc-tab').forEach((btn) => {
            btn.addEventListener('click', () => {
                this._activeTab = btn.dataset.tab;
                this._draw();
            });
        });

        root.querySelector('[data-action="transfer"]')?.addEventListener('click', () => this._openTransferModal());
        root.querySelector('[data-action="pay"]')?.addEventListener('click', () => this._toast('Thanh toán dịch vụ CLB đang được phát triển.'));
        root.querySelectorAll('[data-action="topup"]').forEach((b) => b.addEventListener('click', () => this._toast('Tính năng Nạp Coin đang được phát triển.')));
        root.querySelector('[data-action="offers"]')?.addEventListener('click', () => this._toast('Ưu đãi & quà tặng sắp ra mắt.'));
        root.querySelectorAll('[data-action^="feature-"]').forEach((b) => b.addEventListener('click', () => this._toast('Tính năng đang được phát triển.')));
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

    async _openTransferModal() {
        const modalRoot = document.getElementById('vc-modal-root');
        if (!modalRoot) return;

        modalRoot.innerHTML = `
            <div class="vc-overlay" id="vc-transfer-overlay">
                <div class="vc-transfer-modal">
                    <div class="vc-transfer-modal__head">
                        <span>Chuyển Coin</span>
                        <button class="vc-modal-close" id="vc-transfer-close"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                    <div class="vc-transfer-modal__body" id="vc-transfer-body">
                        <div class="vc-loading vc-loading--small"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tải danh sách tài khoản...</div>
                    </div>
                </div>
            </div>
        `;

        // Chặn sự kiện click nổi lên khỏi modal (xem lý do ở _bindEvents phía trên) —
        // để bấm X hay bấm ra vùng tối chỉ đóng MODAL, không đóng cả bảng iPad.
        modalRoot.addEventListener('click', (e) => e.stopPropagation());

        const close = () => { modalRoot.innerHTML = ''; };
        modalRoot.querySelector('#vc-transfer-close')?.addEventListener('click', close);
        modalRoot.querySelector('#vc-transfer-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'vc-transfer-overlay') close();
        });

        let accounts = [];
        try {
            const res = await apiFetch(API_BASE);
            if (!res.ok) throw new Error('network');
            accounts = (await res.json()).filter((a) => a.id !== this._userData?.id);
        } catch (err) {
            const body = modalRoot.querySelector('#vc-transfer-body');
            if (body) body.innerHTML = `<div class="vc-tx-empty">Không tải được danh sách tài khoản. Vui lòng thử lại.</div>`;
            return;
        }

        if (!accounts.length) {
            const body = modalRoot.querySelector('#vc-transfer-body');
            if (body) body.innerHTML = `<div class="vc-tx-empty">Chưa có tài khoản nào khác để chuyển coin.</div>`;
            return;
        }

        const body = modalRoot.querySelector('#vc-transfer-body');
        if (!body) return;
        body.innerHTML = `
            <label class="vc-field">
                <span>Người nhận</span>
                <select id="vc-transfer-recipient">
                    ${accounts.map((a) => `<option value="${a.id}">${a.name}${a.mssv ? ' (' + a.mssv + ')' : ''}</option>`).join('')}
                </select>
            </label>
            <label class="vc-field">
                <span>Số coin muốn chuyển</span>
                <input type="number" id="vc-transfer-amount" min="1" max="${this._coin()}" placeholder="Nhập số coin" />
            </label>
            <div class="vc-transfer-balance">Số dư hiện tại: <strong>${fmtCoin(this._coin())} coin</strong></div>
            <div class="vc-transfer-error" id="vc-transfer-error"></div>
            <button class="vc-transfer-submit" id="vc-transfer-submit">Xác nhận chuyển</button>
        `;

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
