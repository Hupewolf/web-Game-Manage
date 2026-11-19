// component/schedulePanel/schedulePanel.js
// Nút "Lịch trình" ở trang room: bấm vào -> hiện bảng lịch giữa màn hình.
// Ngày có deadline / hoạt động / sự kiện được tô màu; hover vào ngày đó -> hiện thông tin chi tiết.
// Dữ liệu chỉnh ở scheduleData.js.

import { SCHEDULE_TYPES, TYPE_PRIORITY, SCHEDULE_EVENTS } from './scheduleData.js';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const pad = (n) => String(n).padStart(2, '0');
const keyOf = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function eventsByDate() {
    const map = new Map();
    for (const ev of SCHEDULE_EVENTS) {
        if (!map.has(ev.date)) map.set(ev.date, []);
        map.get(ev.date).push(ev);
    }
    return map;
}

export const SchedulePanel = {
    _el: null,
    _year: 0,
    _month: 0,

    // buttonEl: nút mở lịch. stageSel: khung #web để gắn bảng vào (bảng co giãn theo khung game).
    mount(buttonEl, stageSel = '#web') {
        if (!buttonEl || this._el) return;
        const stage = document.querySelector(stageSel) ?? document.body;

        const el = document.createElement('div');
        el.className = 'sch-overlay';
        el.setAttribute('aria-hidden', 'true');
        el.innerHTML = `
            <div class="sch-card" role="dialog" aria-modal="true" aria-label="Lịch trình">
                <div class="sch-head">
                    <div class="sch-title"><i class="fa-regular fa-calendar-days"></i> LỊCH TRÌNH</div>
                    <button class="sch-close" id="sch-close" aria-label="Đóng lịch">&times;</button>
                </div>
                <div class="sch-nav">
                    <button class="sch-nav__btn" id="sch-prev" aria-label="Tháng trước">&#8249;</button>
                    <div class="sch-nav__label" id="sch-label"></div>
                    <button class="sch-nav__btn" id="sch-next" aria-label="Tháng sau">&#8250;</button>
                    <button class="sch-today" id="sch-today">Hôm nay</button>
                </div>
                <div class="sch-week">${WEEKDAYS.map((w) => `<span>${w}</span>`).join('')}</div>
                <div class="sch-grid" id="sch-grid"></div>
                <div class="sch-legend">
                    ${Object.values(SCHEDULE_TYPES).map((t) => `<span class="sch-legend__item"><i style="background:${t.color}"></i>${t.label}</span>`).join('')}
                </div>
            </div>
        `;
        stage.appendChild(el);
        this._el = el;

        const now = new Date();
        this._year = now.getFullYear();
        this._month = now.getMonth();
        this._render();

        buttonEl.addEventListener('click', () => this.open());
        el.addEventListener('click', (e) => { if (e.target === el) this.close(); }); // bấm nền tối
        el.querySelector('#sch-close').addEventListener('click', () => this.close());
        el.querySelector('#sch-prev').addEventListener('click', () => this._shift(-1));
        el.querySelector('#sch-next').addEventListener('click', () => this._shift(1));
        el.querySelector('#sch-today').addEventListener('click', () => {
            const t = new Date();
            this._year = t.getFullYear();
            this._month = t.getMonth();
            this._render();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen()) this.close();
        });
    },

    isOpen() { return !!this._el?.classList.contains('is-open'); },

    open() {
        if (!this._el) return;
        this._el.classList.add('is-open');
        this._el.setAttribute('aria-hidden', 'false');
    },

    close() {
        if (!this._el) return;
        this._el.classList.remove('is-open');
        this._el.setAttribute('aria-hidden', 'true');
    },

    _shift(delta) {
        const d = new Date(this._year, this._month + delta, 1);
        this._year = d.getFullYear();
        this._month = d.getMonth();
        this._render();
    },

    _render() {
        const y = this._year;
        const m = this._month;
        this._el.querySelector('#sch-label').textContent = `Tháng ${m + 1}, ${y}`;

        const byDate = eventsByDate();
        const t = new Date();
        const todayKey = keyOf(t.getFullYear(), t.getMonth(), t.getDate());

        // Tuần bắt đầu từ Thứ 2; luôn vẽ 6 hàng (42 ô) để bảng không nhảy kích thước khi đổi tháng
        const first = new Date(y, m, 1);
        const offset = (first.getDay() + 6) % 7;
        const cells = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(y, m, 1 - offset + i);
            const inMonth = d.getMonth() === m;
            const key = keyOf(d.getFullYear(), d.getMonth(), d.getDate());
            const events = inMonth ? (byDate.get(key) ?? []) : [];
            cells.push(this._cellHtml(d.getDate(), key, inMonth, key === todayKey, events, i));
        }
        this._el.querySelector('#sch-grid').innerHTML = cells.join('');
    },

    _cellHtml(day, key, inMonth, isToday, events, index) {
        const col = index % 7;
        const row = Math.floor(index / 7);
        const cls = ['sch-day'];
        if (!inMonth) cls.push('is-out');
        if (isToday) cls.push('is-today');

        if (!events.length) {
            return `<div class="${cls.join(' ')}"><span class="sch-day__num">${day}</span></div>`;
        }

        const types = TYPE_PRIORITY.filter((tp) => events.some((e) => e.type === tp));
        cls.push('has-events', `sch-day--${types[0]}`);
        const dots = types.map((tp) => `<i class="sch-dot" style="background:${SCHEDULE_TYPES[tp].color}"></i>`).join('');
        const items = events.map((e) => {
            const t = SCHEDULE_TYPES[e.type] ?? SCHEDULE_TYPES.event;
            return `
                <div class="sch-tip__item">
                    <span class="sch-tip__badge" style="background:${t.color}">${t.label}</span>
                    <div class="sch-tip__title">${esc(e.title)}</div>
                    ${e.time ? `<div class="sch-tip__time"><i class="fa-regular fa-clock"></i> ${esc(e.time)}</div>` : ''}
                    ${e.desc ? `<div class="sch-tip__desc">${esc(e.desc)}</div>` : ''}
                </div>`;
        }).join('');

        // Hàng đầu: tooltip hiện phía dưới ô; còn lại hiện phía trên. Cột sát mép: canh lệch để không tràn bảng.
        return `
            <div class="${cls.join(' ')}" tabindex="0" data-date="${key}" data-col="${col}" data-row="${row <= 1 ? 'top' : 'low'}">
                <span class="sch-day__num">${day}</span>
                <span class="sch-day__dots">${dots}</span>
                <div class="sch-tip" role="tooltip">${items}</div>
            </div>`;
    },
};
