export const SCHEDULE_TYPES = {
    deadline: { label: 'Deadline', color: '#ff5252', soft: '#ffe9e9' },
    activity: { label: 'Hoạt động', color: '#14b8a6', soft: '#dcf8f3' },
    event:    { label: 'Sự kiện',  color: '#8b5cf6', soft: '#efe8ff' },
};

export const TYPE_PRIORITY = ['deadline', 'event', 'activity'];

const pad = (n) => String(n).padStart(2, '0');
function inDays(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const SCHEDULE_EVENTS = [
    { weekday: 0, type: 'activity', title: 'Họp tuần', time: '20:00', desc: 'Tổng kết tuần và chia việc tuần mới.' },
    { date: inDays(2),  type: 'deadline', title: 'Nộp báo cáo tuần',       time: '23:59',       desc: 'Nộp bản tổng kết công việc trong tuần.' },
    { date: '2026-11-20',  type: 'event',    title: 'Boss tuần xuất hiện',    time: '20:00',       desc: 'Cả server cùng đánh boss, có thưởng coin.' },
    { date: inDays(5),  type: 'activity', title: 'Luyện tập kỹ năng',      time: '17:30 – 18:30', desc: 'Buổi luyện tập chung cho cả nhóm.' },
    { date: inDays(9),  type: 'deadline', title: 'Hạn đăng ký sự kiện',    time: '12:00',       desc: 'Quá giờ sẽ không đăng ký được nữa.' },
    { date: inDays(12), type: 'activity', title: 'Học tập nhóm',           time: '14:00',       desc: 'Ôn bài và làm bài tập cùng nhau.' },
    { date: inDays(16), type: 'event',    title: 'Lễ hội mùa đông',        time: 'Cả ngày',     desc: 'Nhiều nhiệm vụ và quà đặc biệt.' },
];
