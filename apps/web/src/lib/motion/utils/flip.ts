// Capture FLIP state synchronously before reflow so filter transitions measure the current DOM.

import { tick } from 'svelte';
import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
import { gsap } from '@yesid/motion/utils/gsap';
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

/* Animate the captured FLIP state after the filtered list renders, then clear it through the callback. */
export function animateFlipTransition(
	batchSelector: string,
	flipState: FlipState,
	onFlipDone: () => void,
): void {
	if (typeof document === 'undefined') return;

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
