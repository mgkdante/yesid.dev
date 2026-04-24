// FLIP (First, Last, Invert, Play) animation primitives for listing filter transitions.
// Extracted from listingAnimations.ts in slice 17e-2 when the entrance function
// (useListingEntrance) was deleted to satisfy the Snappy Doctrine.
//
// FLIP animates cards smoothly when the filter value changes — the grid reflows
// and cards tween between their old and new positions. This is interaction-driven
// (filter click = user input), so it's doctrine-compatible.
//
// **Precondition:** consumers must `await loadFlip()` at onMount before the
// first captureFlipState() call. captureFlipState() is synchronous because
// Flip.getState() must measure the DOM at the exact moment before the reflow.
//
// Usage:
//   import { loadFlip, captureFlipState, animateFlipTransition } from '$lib/motion/utils';
//   onMount(async () => { await loadFlip(); /* ... */ });
//   // before filter changes:
//   flipState = captureFlipState();
//   // after filter-derived list has rendered:
//   animateFlipTransition('[data-batch="blog-item"]', flipState, batchFired, () => { flipState = null; });

import { tick } from 'svelte';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { gsap } from '$lib/motion/utils/gsap.js';
// Flip imported directly — plugin is runtime-registered by loadFlip() at
// consumer mount (BlogListingPage / ProjectListingPage); this import only
// provides the symbol for Flip.getState() / Flip.from().
// @ts-ignore — Windows casing conflict between gsap/types/flip.d.ts and gsap/Flip.js
import { Flip } from 'gsap/Flip';

/** State snapshot captured by {@link captureFlipState} for replay via `Flip.from()`. */
export type FlipState = ReturnType<typeof Flip.getState> | null;

/**
 * Capture current FLIP state for filter transitions.
 * Call BEFORE the filter value changes.
 *
 * Precondition: the Flip plugin must already be registered (consumer
 * awaits `loadFlip()` at onMount).
 *
 * @returns FLIP state object, or null if reduced motion / no elements
 */
export function captureFlipState(): FlipState {
	if (isPrefersReducedMotion() || typeof document === 'undefined') return null;
	const cards = document.querySelectorAll('[data-flip-id]');
	if (cards.length === 0) return null;
	return Flip.getState(cards);
}

/**
 * Animate FLIP transition after filter change.
 * Call inside a $effect that watches the filtered list.
 *
 * @param batchSelector - CSS selector for batch items
 * @param flipState - state from captureFlipState(), or null
 * @param batchFired - whether initial render has run (always true after 17e-2; retained for API compat)
 * @param onFlipDone - callback to clear flipState in consumer
 */
export function animateFlipTransition(
	batchSelector: string,
	flipState: FlipState,
	batchFired: boolean,
	onFlipDone: () => void,
): void {
	if (!batchFired || typeof document === 'undefined') return;

	tick().then(() => {
		const batchItems = document.querySelectorAll<HTMLElement>(batchSelector);
		const cards = document.querySelectorAll<HTMLElement>('[data-flip-id]');

		if (flipState && !isPrefersReducedMotion()) {
			gsap.killTweensOf(cards);
			gsap.killTweensOf(batchItems);
			gsap.set(batchItems, { opacity: 1, y: 0 });
			gsap.set(cards, { opacity: 1, y: 0, x: 0, scale: 1 });

			Flip.from(flipState, {
				targets: cards,
				duration: 0.5,
				ease: 'power2.inOut',
				stagger: 0.05,
				onEnter: (els) =>
					gsap.fromTo(
						els,
						{ opacity: 0, scale: 0.8 },
						{ opacity: 1, scale: 1, duration: 0.5 },
					),
				onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 }),
			});
			onFlipDone();
		} else {
			batchItems.forEach((el) => {
				el.style.opacity = '1';
				el.style.transform = 'translateY(0)';
			});
		}
	});
}
