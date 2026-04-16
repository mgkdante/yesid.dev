/**
 * Shared GSAP animation utilities for listing pages (Blog, Projects).
 * Extracted from duplicate logic in BlogListingPage and ProjectListingPage.
 */
import { tick } from 'svelte';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { registerGsapPlugins, gsap, Flip } from '$lib/motion/utils/gsap.js';

/**
 * Fire staggered entrance animation on page load for all batch items.
 * Call from onMount(). Returns a cleanup function.
 *
 * @param batchSelector - CSS selector for batch items (e.g., '[data-batch="blog-item"]')
 * @param onBatchFired - callback to set batchFired flag in consumer
 */
export function useListingEntrance(
	batchSelector: string,
	onBatchFired: () => void
): void {
	if (isPrefersReducedMotion()) {
		document.querySelectorAll<HTMLElement>(batchSelector).forEach(el => {
			el.style.opacity = '1';
		});
		onBatchFired();
		return;
	}

	registerGsapPlugins();
	onBatchFired();

	const items = document.querySelectorAll(batchSelector);
	gsap.fromTo(items,
		{ opacity: 0, y: 20 },
		{ opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'back.out(1.4)' }
	);
}

/**
 * Capture current FLIP state for filter transitions.
 * Call BEFORE the filter value changes.
 *
 * @returns FLIP state object, or null if reduced motion / no elements
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function captureFlipState(): any {
	if (isPrefersReducedMotion() || typeof document === 'undefined') return null;
	const cards = document.querySelectorAll('[data-flip-id]');
	if (cards.length === 0) return null;
	registerGsapPlugins();
	return Flip.getState(cards);
}

/**
 * Animate FLIP transition after filter change.
 * Call inside a $effect that watches the filtered list.
 *
 * @param batchSelector - CSS selector for batch items
 * @param flipState - state from captureFlipState(), or null
 * @param batchFired - whether initial entrance has run
 * @param onFlipDone - callback to clear flipState in consumer
 */
export function animateFlipTransition(
	batchSelector: string,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	flipState: any,
	batchFired: boolean,
	onFlipDone: () => void
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
				onEnter: (els) => gsap.fromTo(els, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.5 }),
				onLeave: (els) => gsap.to(els, { opacity: 0, scale: 0.8, duration: 0.3 })
			});
			onFlipDone();
		} else {
			batchItems.forEach(el => {
				el.style.opacity = '1';
				el.style.transform = 'translateY(0)';
			});
		}
	});
}
