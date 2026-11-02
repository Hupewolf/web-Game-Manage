// component/shopPanel/colorMemoryGame.js
// Mini game "nhớ màu" khi nấu ăn. Hiện ngay khi bỏ đủ nguyên liệu vào nồi.
//
// Luồng chơi (mọi mốc thời gian chỉnh trong COOK_MINIGAME ở shopConfig.js):
//   1. Bảng có 9 bi xám, mỗi bi được gán ngẫu nhiên 1 trong 9 màu (không trùng nhau).
//   2. Trên bảng hiện nhanh 1 chữ tên màu, in đúng màu đó (vd "ĐEN" màu đen) trong `wordMs`, rồi biến mất.
//   3. Sau `gapMs`, cả 9 bi đồng loạt đổi sang màu đã gán trong `revealMs`, rồi quay về xám.
//   4. Người chơi bấm vào bi có màu của chữ lúc nãy: đúng -> nấu thành công, sai -> nấu thất bại.
//
// ColorMemoryGame.play() trả về Promise<boolean>: true = chọn đúng, false = chọn sai.

import { COOK_MINIGAME } from './shopConfig.js';

// edge = màu viền chữ để chữ đen / trắng vẫn đọc được trên nền bảng
export const GAME_COLORS = [
    { id: 'red',    name: 'Đỏ',         hex: '#e53935', edge: '#ffffff' },
    { id: 'orange', name: 'Cam',        hex: '#fb8c00', edge: '#3b1f08' },
    { id: 'yellow', name: 'Vàng',       hex: '#fdd835', edge: '#3b1f08' },
    { id: 'green',  name: 'Xanh lá',    hex: '#43a047', edge: '#ffffff' },
    { id: 'blue',   name: 'Xanh dương', hex: '#1e88e5', edge: '#ffffff' },
    { id: 'purple', name: 'Tím',        hex: '#8e24aa', edge: '#ffffff' },
    { id: 'white',  name: 'Trắng',      hex: '#ffffff', edge: '#3b1f08' },
    { id: 'brown',  name: 'Nâu',        hex: '#7b4a2a', edge: '#ffffff' },
    { id: 'black',  name: 'Đen',        hex: '#111111', edge: '#ffffff' },
];

const DEFAULTS = {
    needStartButton: true,
    wordMs: 1000,
    gapMs: 2000,
    revealMs: 1000,
    resultMs: 1400,
};

const sleep = (ms) => new Promise((r) => setTimeout(r, Math.max(0, Number(ms) || 0)));

function shuffle(list) {
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// 1000 -> "1 giây", 2500 -> "2,5 giây"
const secText = (ms) => `${String(+(Number(ms) / 1000).toFixed(1)).replace('.', ',')} giây`;

export const ColorMemoryGame = {
    play(config = COOK_MINIGAME) {
        const o = { ...DEFAULTS, ...config };

        return new Promise((resolve) => {
            const colors = shuffle(GAME_COLORS);                 // colors[i] = màu của bi thứ i
            const targetIdx = Math.floor(Math.random() * colors.length);
            const target = colors[targetIdx];                    // chữ hiện ra = màu của bi này

            const root = document.createElement('div');
            root.className = 'cmg';
            root.setAttribute('role', 'dialog');
            root.setAttribute('aria-modal', 'true');
            root.setAttribute('aria-label', 'Mini game nhớ màu');
            root.innerHTML = `
                <div class="cmg-card">
                    <h3 class="cmg-title"><i class="fa-solid fa-fire-burner"></i> Mini game: Nhớ màu</h3>

                    <div class="cmg-board">
                        <div class="cmg-word" data-ref="word" aria-live="polite">&nbsp;</div>
                        <div class="cmg-grid">
                            ${colors.map((_, i) => `<button type="button" class="cmg-ball" data-i="${i}" aria-label="Bi số ${i + 1}" disabled></button>`).join('')}
                        </div>
                    </div>

                    <p class="cmg-status" data-ref="status"></p>
                    <button type="button" class="cmg-start" data-ref="start">Bắt đầu</button>

                    <div class="cmg-help">
                        <b>Cách chơi</b>
                        <ol>
                            <li>Một chữ tên màu, in đúng màu đó, hiện trên bảng trong <em>${secText(o.wordMs)}</em> rồi biến mất. Hãy nhớ màu đó.</li>
                            <li>Sau <em>${secText(o.gapMs)}</em>, cả 9 bi đồng loạt đổi màu trong <em>${secText(o.revealMs)}</em>. Hãy nhớ bi nào màu gì.</li>
                            <li>Các bi trở về màu xám. Bấm vào bi có màu của chữ lúc nãy.</li>
                            <li>Chọn đúng thì nấu thành công, chọn sai thì nấu thất bại.</li>
                        </ol>
                    </div>
                </div>`;
            document.body.appendChild(root);

            const ref = {};
            root.querySelectorAll('[data-ref]').forEach((n) => { ref[n.dataset.ref] = n; });
            const balls = [...root.querySelectorAll('.cmg-ball')];

            const setStatus = (text) => { ref.status.textContent = text; };
            const paintBall = (i) => {
                balls[i].style.setProperty('--c', colors[i].hex);
                balls[i].classList.add('is-colored');
            };
            const grayBall = (i) => {
                balls[i].style.removeProperty('--c');
                balls[i].classList.remove('is-colored');
            };

            const finish = async (win, chosen) => {
                balls.forEach((b) => { b.disabled = true; });
                balls.forEach((_, i) => paintBall(i)); // lộ hết màu để người chơi thấy đáp án
                balls[targetIdx].classList.add('is-correct');
                if (!win) balls[chosen].classList.add('is-wrong');
                root.classList.add(win ? 'is-win' : 'is-lose');
                setStatus(win
                    ? 'Chọn đúng rồi! Nấu thành công.'
                    : `Sai rồi! Bi màu ${target.name} mới đúng. Nấu thất bại.`);
                await sleep(o.resultMs);
                root.remove();
                resolve(win);
            };

            const round = async () => {
                // 1) chữ màu hiện nhanh rồi biến mất
                setStatus('Nhìn kỹ chữ màu!');
                ref.word.innerHTML = `<span class="cmg-word__text" style="color:${target.hex};--edge:${target.edge}">${target.name.toUpperCase()}</span>`;
                await sleep(o.wordMs);
                ref.word.innerHTML = '&nbsp;';

                // 2) chờ rồi 9 bi đổi màu cùng lúc
                setStatus('Chuẩn bị...');
                await sleep(o.gapMs);
                setStatus('Nhớ vị trí từng màu!');
                balls.forEach((_, i) => paintBall(i));
                await sleep(o.revealMs);
                balls.forEach((_, i) => grayBall(i));

                // 3) chọn bi
                setStatus('Bi nào mang màu của chữ lúc nãy? Bấm để chọn.');
                balls.forEach((b) => { b.disabled = false; });
            };

            let picked = false;
            ref.start.addEventListener('click', () => {
                ref.start.hidden = true;
                round();
            });
            root.querySelector('.cmg-grid').addEventListener('click', (e) => {
                const b = e.target.closest('.cmg-ball');
                if (!b || b.disabled || picked) return;
                picked = true;
                const i = Number(b.dataset.i);
                finish(i === targetIdx, i);
            });

            if (o.needStartButton) {
                setStatus('Sẵn sàng thì bấm "Bắt đầu". Chữ màu chỉ hiện thoáng qua thôi!');
                ref.start.focus();
            } else {
                ref.start.hidden = true;
                setStatus('Chuẩn bị...');
                sleep(800).then(round);
            }
        });
    },
};
