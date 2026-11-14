import type { Action } from 'svelte/action';

/** Aligns card rows when multiple cards fit across the container.
 * Single-column layouts keep their natural heights. */
export const equalizeRows: Action<HTMLElement, readonly string[]> = (node, initial) => {
	let selectors = initial;
	let frame = 0;
	let width = -1;

	const run = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const firstCard = node.firstElementChild;
			const multipleColumns = firstCard !== null
				&& firstCard.getBoundingClientRect().width * 2 <= node.getBoundingClientRect().width + 1;
			for (const selector of selectors) {
				const rows = [...node.querySelectorAll<HTMLElement>(selector)];
				for (const row of rows) row.style.minHeight = '';
				if (!multipleColumns) continue;
				const tallest = Math.max(0, ...rows.map((row) => row.getBoundingClientRect().height));
				for (const row of rows) row.style.minHeight = `${tallest}px`;
			}
		});
	};

	const resize = new ResizeObserver(([entry]) => {
		if (entry && entry.contentRect.width !== width) {
			width = entry.contentRect.width;
			run();
		}
	});
	const cards = new MutationObserver(run);
	resize.observe(node);
	cards.observe(node, { childList: true, subtree: true });
	document.fonts?.ready.then(run);
	run();

	return {
		update(next) {
			selectors = next;
			run();
		},
		destroy() {
			cancelAnimationFrame(frame);
			resize.disconnect();
			cards.disconnect();
		},
	};
};
