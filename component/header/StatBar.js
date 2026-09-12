export function StatBar({ key, label, icon, value, max }) {
	return `
		<div class="stat-bar" data-stat="${key}">
			<img class="stat-bar__icon" src="${icon}" alt="${label}">
			<div class="inner-stat-bar">
				<span class="stat-bar__label">${label}</span>
				<span class="stat-bar__value">${value}/${max}</span>
			</div>
		</div>
	`;
}

export function updateStatBar(key, value, max) {
	const el = document.querySelector(`.stat-bar[data-stat="${key}"]`);
	if (!el) return;
	const pct = (value / max) * 100;
	const fill = el.querySelector('.stat-bar__fill');
	if (fill) {
		fill.style.width = `${pct}%`;
		fill.className = 'stat-bar__fill ' + (
			pct <= 20 ? 'stat-bar__fill--danger' :
			pct <= 50 ? 'stat-bar__fill--warn' : 'stat-bar__fill--ok'
		);
	}
	el.querySelector('.stat-bar__value').textContent = `${value}/${max}`;
}
