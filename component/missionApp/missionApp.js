// component/missionApp/missionApp.js
// App "Nhiệm vụ" mở bên trong PhoneModal — cấp/giao nhiệm vụ hằng ngày cho người chơi.

const MISSIONS = [
    {
        id: 'daily-login',
        icon: 'fa-gift',
        title: 'Đăng nhập hàng ngày',
        reward: { icon: '../../img/icon/UCoin.svg', amount: 100 },
        progress: 1,
        max: 1,
        done: true,
    },
    {
        id: 'complete-3',
        icon: 'fa-bullseye',
        title: 'Hoàn thành 3 nhiệm vụ',
        reward: { icon: '../../img/icon/UCoin.svg', amount: 200 },
        progress: 2,
        max: 3,
        done: false,
    },
    {
        id: 'study-30',
        icon: 'fa-book',
        title: 'Học tập 30 phút',
        reward: { icon: '../../img/icon/flash.png', amount: 50 },
        progress: 18,
        max: 30,
        done: false,
    },
];

export const MissionApp = {
    render(containerId, { onBack } = {}) {
        const el = document.getElementById(containerId);
        if (!el) return;

        el.innerHTML = `
            <div class="mission-app">
                <div class="mission-app__header">
                    <button class="mission-app__back" id="mission-app-back">
                        <i class="fa-solid fa-chevron-left"></i>
                    </button>
                    <span class="mission-app__title">NHIỆM VỤ HÔM NAY</span>
                </div>
                <div class="mission-app__list">
                    ${MISSIONS.map(m => `
                        <div class="mission-app__card ${m.done ? 'mission-app__card--done' : ''}">
                            <div class="mission-app__icon"><i class="fa-solid ${m.icon}"></i></div>
                            <div class="mission-app__body">
                                <span class="mission-app__name">${m.title}</span>
                                <div class="mission-app__reward">
                                    <img src="${m.reward.icon}" alt="thưởng"> x${m.reward.amount}
                                </div>
                            </div>
                            <div class="mission-app__progress">
                                ${m.done
                                    ? `<i class="fa-solid fa-circle-check"></i>`
                                    : `<span>${m.progress}/${m.max}</span>`}
                            </div>
                        </div>
                    `).join('')}
                </div>
                <button class="mission-app__watch-all">XEM TẤT CẢ</button>
            </div>
        `;

        document.getElementById('mission-app-back')?.addEventListener('click', () => onBack?.());
    },
};
