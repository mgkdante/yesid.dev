import type { Action } from 'svelte/action';

/** Gives every match of each selector inside the node the height of the tallest match,
 *  so card rows line up across the whole grid, not only within one grid row. */
export const equalizeRows: Action<HTMLElement, readonly string[]> = (node, initial) => {
	let selectors = initial;
	let frame = 0;
	let width = -1;

	const run = () => {
		cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			for (const selector of selectors) {
				const rows = [...node.querySelectorAll<HTMLElement>(selector)];
				for (const row of rows) row.style.minHeight = '';
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
