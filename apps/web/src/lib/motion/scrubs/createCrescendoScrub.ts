// Crescendo scroll-scrub factory.
//
// Scales a target element with scroll position through its section:
// minScale at section edges, maxScale mid-scroll. Pure transform — no DOM
// reorder, no tag change, no opacity. Heading hierarchy is preserved.
//
// Usage:
//   const destroy = createCrescendoScrub(statementEl, { section: sectionEl });
//   onDestroy(destroy);
//
// Reduced-motion: target is set to maxScale immediately; ScrollTrigger is NOT
// registered; destroy is a no-op.

import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
import { ScrollTrigger, initScrollTriggerConfig } from '$lib/motion/utils/gsap.js';
import type { EaseKey } from '@yesid/motion/tokens';

export interface CrescendoOpts {
	/** Scroll-trigger ancestor — usually the containing <section>. */
	section: HTMLElement;
	/** Scale applied at the section edges (start and end of scroll). Default: 0.6 */
	minScale?: number;
	/** Scale applied mid-scroll. Default: 1.4 */
	maxScale?: number;
	/** Ease curve key from the shared motion package. Default: 'inOut'. */
	ease?: EaseKey;
}

/**
 * Create a scroll-driven scale scrub on `target`, triggered by scroll position
 * through `opts.section`.
 */
export function createCrescendoScrub(
	target: HTMLElement,
	opts: CrescendoOpts,
): () => void {
	const { section, minScale = 0.6, maxScale = 1.4 } = opts;

	// Reduced motion: render final state, skip ScrollTrigger, no-op destroy.
	// Slice-23 Task 4: use the individual `scale` property instead of
	// `transform: scale()` so the title's own sticky positioning is not
	// disturbed by a self-applied transform shorthand. The individual
	// property composes cleanly with the rotated-title's `rotate: 180deg`.
	if (isPrefersReducedMotion()) {
		target.style.scale = String(maxScale);
		return () => {};
	}

	// Ensure gsap.registerPlugin(ScrollTrigger) ran. Other consumers (HeroBanner,
	// SvgIcon, +layout, etc.) call init themselves, but Manifesto.svelte — the
	// sole caller of this helper — does not. Without init, ScrollTrigger.create
	// throws "Ui is not a function" in minified production. Idempotent.
	initScrollTriggerConfig();

	const st = ScrollTrigger.create({
		trigger: section,
		start: 'top bottom',
		end: 'bottom top',
		scrub: true,
		onUpdate: (self) => {
			// t ∈ [0, 1, 0] via sin(π·progress) — 0 at edges, 1 at mid-scroll.
			const t = Math.sin(self.progress * Math.PI);
			const scale = minScale + t * (maxScale - minScale);
			target.style.scale = String(scale);
		},
	});

	return () => st.kill();
}
