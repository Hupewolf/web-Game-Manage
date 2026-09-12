
export const NavButton = {

	render(slotId, { label, icon, href }) {
		const el = document.getElementById(slotId);
		if (!el) return;

		el.innerHTML = `
			<a class="nav-btn primary" href="${href}">
				<span class="left"></span>
				<span class="center"></span>
				<span class="right"></span>
				<span class="content">
					<img class="nav-btn__icon" src="${icon}" alt="${label}">
					<span class="nav-btn__label">${label}</span>
				</span>
				
			</a>
    `;
	},
};
