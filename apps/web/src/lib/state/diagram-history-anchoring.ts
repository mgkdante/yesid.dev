import { beforeNavigate, onNavigate } from '$app/navigation';
import { onDestroy } from 'svelte';

const PENDING_DIAGRAM = '.mermaid-diagram[data-rendering="true"]';
const READER_INPUTS = ['wheel', 'touchstart', 'pointerdown', 'keydown'];

/** Keep pending diagram layout out of navigation's saved and restored offsets.
 * Ordinary reading retains native anchoring. */
export function attachDiagramHistoryAnchoring(): void {
	let release = () => {};
	let settleAfterNavigation = () => {};

	beforeNavigate(({ type, willUnload, shallow }) => {
		release();
		if (willUnload || shallow) return;

		const history = type === 'popstate';
		let active = true;
		const root = document.documentElement;
		const previous = root.style.overflowAnchor;
		root.style.overflowAnchor = 'none';
		let frame = 0;
		const observer = new MutationObserver(settle);

		function finish() {
			if (!active) return;
			active = false;
			observer.disconnect();
			cancelAnimationFrame(frame);
			root.style.overflowAnchor = previous;
			for (const event of READER_INPUTS) window.removeEventListener(event, finish, true);
			release = () => {};
			settleAfterNavigation = () => {};
		}

		function settle() {
			if (!active) return;
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
			if (!active) return;
			// Kit captures the outgoing offset during navigation. Keep it fixed until
			// commit even if the outgoing SVG finishes while route data is loading.
			if (!history) { finish(); return; }
			observer.observe(document.body, {
				subtree: true, childList: true, attributes: true, attributeFilter: ['data-rendering'],
			});
			settle();
		};
		for (const event of READER_INPUTS) window.addEventListener(event, finish, { capture: true, passive: true });
	});

	onNavigate(() => {
		// Capture this navigation's lease; a stale completion cannot settle a new one.
		const complete = settleAfterNavigation;
		return () => complete();
	});
	onDestroy(() => release());
}
