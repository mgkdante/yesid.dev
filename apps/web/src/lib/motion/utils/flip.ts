// FLIP (First, Last, Invert, Play) animation primitives for listing filter transitions.
// Extracted from listingAnimations.ts in slice 17e-2 when the entrance function
// (useListingEntrance) was deleted to satisfy the Snappy Doctrine.
//
// FLIP animates cards smoothly when the filter value changes — the grid reflows
// and cards tween between their old and new positions. This is interaction-driven
// (filter click = user input), so it's doctrine-compatible.
//
// Registration is module-local and synchronous. captureFlipState() stays
// synchronous because Flip.getState() must measure the DOM at the exact moment
// before the reflow.
//
// Usage:
//   import { captureFlipState, animateFlipTransition } from '$lib/motion/utils';
//   // before filter changes:
//   flipState = captureFlipState();
//   // after filter-derived list has rendered:
//   animateFlipTransition('[data-batch="blog-item"]', flipState, batchFired, () => { flipState = null; });

import { tick } from 'svelte';
import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
import { gsap } from '$lib/motion/utils/gsap.js';
// Flip is imported directly so ensureFlipRegistered() registers the same
// symbol used by Flip.getState() / Flip.from().
//
// CJS interop: gsap/Flip ships as CommonJS, so static `import { Flip }` fails
// in Node ESM SSR (Vercel) with "Named export 'Flip' not found". Use default
// import + property access — compatible with both Vite dev and Node SSR.
// @ts-ignore — Windows casing conflict between gsap/types/flip.d.ts and gsap/Flip.js
import gsapFlipModule from 'gsap/Flip';
import { durationSec } from '@yesid/motion/tokens';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Flip: typeof import('gsap/Flip').Flip = (gsapFlipModule as any).Flip ?? (gsapFlipModule as any);

let flipRegistered = false;

function ensureFlipRegistered(): void {
	if (flipRegistered) return;
	gsap.registerPlugin(Flip);
	flipRegistered = true;
}

/** State snapshot captured by {@link captureFlipState} for replay via `Flip.from()`. */
export type FlipState = ReturnType<typeof Flip.getState> | null;

/**
 * Capture current FLIP state for filter transitions.
 * Call BEFORE the filter value changes.
 *
 * Registration is handled internally immediately before `Flip.getState()`.
 *
 * @returns FLIP state object, or null if reduced motion / no elements
 */
export function captureFlipState(): FlipState {
	if (isPrefersReducedMotion() || typeof document === 'undefined') return null;
	const cards = document.querySelectorAll('[data-flip-id]');
	if (cards.length === 0) return null;
	ensureFlipRegistered();
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

			ensureFlipRegistered();
			Flip.from(flipState, {
				targets: cards,
				duration: durationSec('slower'),
				ease: 'power2.inOut',
				stagger: 0.05,
				onEnter: (els) =>
					gsap.fromTo(
						els,
						{ opacity: 0, scale: 0.8 },
						{ opacity: 1, scale: 1, duration: durationSec('slower') },
					),
				onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: durationSec('slow') }),
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
