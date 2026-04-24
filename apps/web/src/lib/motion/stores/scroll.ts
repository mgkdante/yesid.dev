// Tracks the user's scroll progress as a 0-1 value.
// 0 = top of page, 1 = bottom of page.
//
// Uses an rAF-gated listener so we only compute one value per animation frame
// even if scroll events fire multiple times — avoids layout thrashing.
//
// SSR-safe: defaults to 0 when window is not available.

import { readable } from 'svelte/store';

function computeProgress(): number {
	const scrollable = document.documentElement.scrollHeight - window.innerHeight;
	// Guard against division by zero when content fits the viewport.
	if (scrollable <= 0) return 0;
	return Math.min(1, Math.max(0, window.scrollY / scrollable));
}

export const scrollProgress = readable<number>(0, (set) => {
	if (typeof window === 'undefined') return;

	let rafId: number | null = null;

	function onScroll() {
		if (rafId !== null) return; // Already scheduled.
		rafId = requestAnimationFrame(() => {
			set(computeProgress());
			rafId = null;
		});
	}

	window.addEventListener('scroll', onScroll, { passive: true });

	// Set initial value in case the page loads mid-scroll.
	set(computeProgress());

	return () => {
		window.removeEventListener('scroll', onScroll);
		if (rafId !== null) cancelAnimationFrame(rafId);
	};
});
