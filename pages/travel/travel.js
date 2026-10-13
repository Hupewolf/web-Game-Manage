// Trang loading đếm ngược khi di chuyển phòng <-> outSide.
// Hết giờ mới chuyển sang trang đích. Trạng thái nằm trên API nên thoát web rồi vào lại vẫn chạy tiếp.

import { Loader } from '../../component/loader/loader.js';
import { PAGE_URL, getTravel, getLocation, remaining, syncTravel, finishTravel, formatDuration } from '../../share/travel.js';
import { VEHICLES } from '../../share/travelConfig.js';

if (localStorage.getItem('isLoggedIn') !== 'true') {
    location.replace('../login/login.html');
} else {
    start();
}

async function start() {
    Loader.show('Đang tải...');
    await syncTravel(); // lấy chuyến đi + giờ server từ API
    const travel = getTravel();
    if (!travel) {
        // Không có chuyến nào -> về nơi đang ở
        location.replace(PAGE_URL[getLocation() ?? 'room']);
        return;
    }
    run(travel);
}

function run(travel) {
    const dest = travel.to === 'outSide' ? 'ra ngoài' : 'về phòng';
    const vehicle = VEHICLES.find((v) => v.id === travel.vehicle)?.name ?? 'Đi bộ';
    let done = false;

    const tick = async () => {
        if (done) return;
        const left = remaining(travel);
        if (left > 0) {
            Loader.show(`Đang đi ${dest} bằng ${vehicle}...`, `Còn ${formatDuration(left)}`);
            return;
        }
        done = true;
        clearInterval(timer);
        try {
            const to = await finishTravel(); // server xác nhận hết giờ mới cho qua
            if (!to) { done = false; return; }
            Loader.show('Đã đến nơi!', '');
            setTimeout(() => location.replace(PAGE_URL[to]), 700);
        } catch {
            Loader.show('Mất kết nối, đang thử lại...', '');
            done = false;
            setTimeout(() => { timer = setInterval(tick, 250); }, 2000);
        }
    };

    let timer = setInterval(tick, 250);
    tick();
}
