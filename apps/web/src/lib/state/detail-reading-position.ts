import { lenisAwareScrollTo, registerScrollContext, type ScrollContext } from './locale-handoff.svelte';

interface DetailPosition {
	kind: 'detail-section';
	index: number;
	count: number;
	progress: number;
	y: number;
}

// Match the detail TOC's reading line, but measure geometry rather than its
// asynchronously updated active ID. Blog heading slugs change with the locale.
const READING_LINE = 0.25;

/** Locale handoff only: no disclosure writes, TOC jumps or persistent page state. */
export function detailReadingPosition(selector: string): ScrollContext & { dispose(): void } {
	let dispose = () => {};
	const sections = () => [...document.querySelectorAll<HTMLElement>(selector)]
		.filter((el) => {
			const box = el.getBoundingClientRect();
			return box.height > 0 && box.width > 0;
		});

	return {
		dispose: () => dispose(),
		capture() {
			const elements = sections();
			const line = window.innerHeight * READING_LINE;
			const index = elements.findIndex((el) => {
				const box = el.getBoundingClientRect();
				return box.top <= line && box.bottom > line;
			});
			if (index < 0) return { kind: 'offset', y: window.scrollY };
			const box = elements[index].getBoundingClientRect();
			return {
				kind: 'detail-section', index, count: elements.length,
				progress: (line - box.top) / box.height, y: window.scrollY,
			} satisfies DetailPosition;
		},
		restore(snapshot) {
			dispose();
			const saved = snapshot as Partial<DetailPosition> | null;
			const elements = sections();
			let y = typeof saved?.y === 'number' && Number.isFinite(saved.y) ? saved.y : 0;
			// Ordinal mapping is safe only when the translated structure agrees.
			if (saved?.kind === 'detail-section' && saved.count === elements.length &&
				typeof saved.index === 'number' && Number.isInteger(saved.index) &&
				typeof saved.progress === 'number' && Number.isFinite(saved.progress)) {
				const target = elements[saved.index];
				if (target) {
					const progress = Math.max(0, Math.min(1, saved.progress));
					const align = () => {
						const box = target.getBoundingClientRect();
						lenisAwareScrollTo(Math.max(0, window.scrollY + box.top + box.height * progress
							- window.innerHeight * READING_LINE));
					};
					align();
					// Fonts, images and asynchronous diagrams can resize after the two
					// navigation frames. Follow that layout only until the reader acts.
					if (typeof ResizeObserver !== 'undefined') {
						let active = true;
						const observer = new ResizeObserver(() => { if (active) align(); });
						const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'];
						dispose = () => {
							active = false;
							observer.disconnect();
							for (const event of inputs) window.removeEventListener(event, dispose, true);
						};
						observer.observe(document.body);
						for (const el of elements) observer.observe(el);
						for (const event of inputs) window.addEventListener(event, dispose, { capture: true, passive: true });
					}
					return;
				}
			}
			lenisAwareScrollTo(Math.max(0, y));
		},
	};
}

/** Called on mount so both the locale strategy and late-layout correction leave with the page. */
export function registerDetailReadingPosition(selector: string): () => void {
	const context = detailReadingPosition(selector);
	const unregister = registerScrollContext(context);
	return () => { unregister(); context.dispose(); };
}
