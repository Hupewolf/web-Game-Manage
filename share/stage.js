// share/stage.js
// Co giãn khung 1920x1080 (#web) theo cửa sổ trình duyệt — cùng thuật toán với room/outSide.
// #web ẩn (visibility:hidden trong CSS) cho tới khi tính xong scale, tránh nháy khung chưa co.

export function initStage(selector = '#web') {
    const game = document.querySelector(selector);
    if (!game) return;

    const designWidth = 1920;
    const designHeight = 1080;

    function resize() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        let baseWidth = designWidth;
        let baseHeight = designHeight;

        const normalHeight = vw * 9 / 16;
        if (vh < normalHeight) {
            const missing = normalHeight - vh;
            baseWidth = designWidth + missing * 2;
            baseHeight = Math.max(designHeight - missing, 1000);
        }

        const scale = Math.min(vw / baseWidth, vh / baseHeight);
        const x = (vw - baseWidth * scale) / 2;
        const y = (vh - baseHeight * scale) / 2;

        game.style.width = `${baseWidth}px`;
        game.style.height = `${baseHeight}px`;
        game.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
    }

    window.addEventListener('resize', resize);
    resize();
    game.classList.add('is-ready');
}
