// component/mood/mood.js
// Chỉ số "Tinh thần" (0–100, mặc định 100).
//   - Ở ngoài (outSide, cửa hàng...): giảm dần.
//   - Về phòng: hồi dần.
// Giá trị lưu ở currentUser.mood (localStorage), đồng bộ lên MockAPI mỗi ~60s nếu có thay đổi.
// Header nghe sự kiện "mood:change" để cập nhật thanh hiển thị.

import { fetchAccount, putAccount } from '../../share/accountApi.js';

const MAX = 100;

function readUser() {
    try {
        const raw = localStorage.getItem('currentUser');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

function clamp(v) {
    return Math.min(MAX, Math.max(0, v));
}

function loadValue() {
    const v = Number(readUser()?.mood);
    return Number.isFinite(v) ? clamp(v) : MAX;
}

export const Mood = {
    // Tốc độ chỉnh ở đây (điểm / phút)
    config: {
        decayPerMin: 6,       // ở ngoài: ~16 phút từ 100 về 0
        recoverPerMin: 12,    // ở phòng: ~8 phút từ 0 lên 100
        tickMs: 1000,
        saveEveryMs: 5000,
        syncEveryMs: 60000,
    },

    max: MAX,
    value: loadValue(),
    zone: null,            // 'outside' | 'room'
    _timer: null,
    _last: 0,
    _lastSave: 0,
    _lastSync: 0,
    _shown: null,
    _dirty: false,
    _syncing: false,
    _bound: false,

    get() {
        return Math.round(this.value);
    },

    trend() {
        if (this.zone === 'outside' && this.value > 0) return 'down';
        if (this.zone === 'room' && this.value < MAX) return 'up';
        return 'flat';
    },

    start(zone) {
        if (!readUser()) return; // khách chưa đăng nhập: không tính
        this.zone = zone;
        this.value = loadValue();
        this._last = Date.now();
        this._lastSave = this._last;
        this._lastSync = this._last;
        this._shown = null;
        this._emit(true);

        if (!this._timer) this._timer = setInterval(() => this._tick(), this.config.tickMs);

        if (!this._bound) {
            this._bound = true;
            // Rời trang / ẩn tab: lưu ngay vào localStorage
            window.addEventListener('pagehide', () => this._save());
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) this._save();
                else this._last = Date.now(); // quay lại tab không bù thời gian đã ẩn
            });
        }
    },

    _tick() {
        const now = Date.now();
        // Giới hạn dt để máy ngủ / tab bị trình duyệt làm chậm không gây nhảy giá trị
        const dt = Math.min(now - this._last, this.config.tickMs * 3);
        this._last = now;
        if (document.hidden) return; // tab ẩn thì tạm dừng

        const perMin = this.zone === 'outside' ? -this.config.decayPerMin
            : this.zone === 'room' ? this.config.recoverPerMin
            : 0;
        if (perMin !== 0) {
            const next = clamp(this.value + (perMin / 60000) * dt);
            if (next !== this.value) {
                this.value = next;
                this._dirty = true;
            }
        }

        this._emit();

        if (this._dirty && now - this._lastSave >= this.config.saveEveryMs) this._save();
        if (this._dirty && now - this._lastSync >= this.config.syncEveryMs) this._sync();
    },

    _emit(force = false) {
        const shown = this.get();
        if (!force && shown === this._shown) return;
        this._shown = shown;
        document.dispatchEvent(new CustomEvent('mood:change', {
            detail: { value: shown, max: MAX, trend: this.trend() },
        }));
    },

    _save() {
        const user = readUser();
        if (!user) return;
        user.mood = Math.round(this.value * 10) / 10;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this._lastSave = Date.now();
    },

    async _sync() {
        const user = readUser();
        if (!user?.id || this._syncing) return;
        this._syncing = true;
        this._lastSync = Date.now();
        try {
            this._save();
            const fresh = await fetchAccount(user.id);
            const res = await putAccount(user.id, { ...fresh, mood: Math.round(this.value * 10) / 10 });
            if (res.ok) this._dirty = false;
        } catch (err) {
            console.warn('Mood: chưa đồng bộ được lên API, sẽ thử lại.', err);
        } finally {
            this._syncing = false;
        }
    },
};
