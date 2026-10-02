import { playerState, GameHeader } from '../../share/main.js';

function resizeGame() {
    const game = document.querySelector("#web");

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const designWidth = 1920;
    const designHeight = 1080;

    let baseWidth = designWidth;
    let baseHeight = designHeight;

    const normalHeight = viewportWidth * 9 / 16;

    // Browser làm viewport thấp hơn tỷ lệ 16:9
    if (viewportHeight < normalHeight) {

        const missing = normalHeight - viewportHeight;

        baseWidth = designWidth + missing * 2;
        // Giảm chiều cao base
        baseHeight = designHeight - missing;

        // Không cho baseHeight quá nhỏ
        baseHeight = Math.max(baseHeight, 1000);
    }

    const scaleX = viewportWidth / baseWidth;
    const scaleY = viewportHeight / baseHeight;

    const scale = Math.min(scaleX, scaleY);

    const x = (viewportWidth - baseWidth * scale) / 2;
    const y = (viewportHeight - baseHeight * scale) / 2;

    game.style.width = `${baseWidth}px`;
    game.style.height = `${baseHeight}px`;

    game.style.transform =
        `translate(${x}px, ${y}px) scale(${scale})`;
}

window.addEventListener("resize", resizeGame);
resizeGame();

GameHeader.render(playerState);