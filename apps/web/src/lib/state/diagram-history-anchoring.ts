import { afterNavigate, beforeNavigate } from '$app/navigation';
import { onDestroy } from 'svelte';

const PENDING_DIAGRAM = '.mermaid-diagram[data-rendering="true"]';
const READER_INPUTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/** History restores an absolute offset before Mermaid finishes. Do not add
 * native anchor compensation to that offset while its fallback becomes SVG.
 * Ordinary reading and locale handoff retain native anchoring. */
export function attachDiagramHistoryAnchoring(): void {
	let release = () => {};
	let settleAfterNavigation = () => {};

	beforeNavigate(({ type }) => {
		release();
		if (type !== 'popstate') return;

		const root = document.documentElement;
		const previous = root.style.overflowAnchor;
		root.style.overflowAnchor = 'none';
		let frame = 0;
		const observer = new MutationObserver(settle);

		function finish() {
			observer.disconnect();
			cancelAnimationFrame(frame);
			root.style.overflowAnchor = previous;
			for (const event of READER_INPUTS) window.removeEventListener(event, finish, true);
			release = () => {};
			settleAfterNavigation = () => {};
		}

		function settle() {
			cancelAnimationFrame(frame);
			if (document.querySelector(PENDING_DIAGRAM)) return;
			// Let the final SVG layout paint with anchoring still suppressed.
			frame = requestAnimationFrame(() => {
				frame = requestAnimationFrame(() => {
					if (!document.querySelector(PENDING_DIAGRAM)) finish();
				});
			});
		}

		release = finish;
		settleAfterNavigation = () => {
			observer.observe(document.body, {
				subtree: true, childList: true, attributes: true, attributeFilter: ['data-rendering'],
			});
			settle();
		};
		for (const event of READER_INPUTS) window.addEventListener(event, finish, { capture: true, passive: true });
	});

	afterNavigate(() => settleAfterNavigation());
	onDestroy(() => release());
}
