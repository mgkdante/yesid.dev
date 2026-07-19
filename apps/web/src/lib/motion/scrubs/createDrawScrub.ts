// DrawSVG scroll-scrub factory.
//
// Queries all path elements under `svgRoot` (or a custom selector), then
// scrubs `stroke-dashoffset` (via gsap DrawSVGPlugin) from 0% → 100% as the
// user scrolls through `opts.section`.
//
// Plugin loading is the caller's responsibility: `await loadDrawSVG()` at
// route setup BEFORE calling this factory. The factory is synchronous.
//
// Usage:
//   import { loadDrawSVG } from '$lib/motion/utils/gsap.js';
//   onMount(async () => {
//     await loadDrawSVG();
//     destroy = createDrawScrub(blueprintSvg, { section: listingSection });
//   });
//   onDestroy(() => destroy?.());
//
// Reduced-motion: paths rendered at full stroke (drawSVG 100%); ScrollTrigger
// NOT registered; destroy is a no-op.

import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';

export interface DrawScrubOpts {
	/** Scroll-trigger ancestor — usually the containing section. */
	section: HTMLElement;
	/** CSS selector scoped to the svgRoot. Default: 'path'. */
	pathSelector?: string;
	/** If true, stroke draws from 100% → 0% as user scrolls forward (reverse mode). Default: false. */
	reverse?: boolean;
}

/**
 * Create a scroll-driven DrawSVG scrub on every path element under `svgRoot`,
 * triggered by scroll position through `opts.section`.
 *
 * **Precondition:** caller must `await loadDrawSVG()` before invoking.
 */
export function createDrawScrub(
	svgRoot: Element,
	opts: DrawScrubOpts,
): () => void {
	const { section, pathSelector = 'path', reverse = false } = opts;
	const paths = svgRoot.querySelectorAll(pathSelector);

	if (paths.length === 0) {
		// No-op — misapplied to an empty SVG. Return a no-op destroy.
		return () => {};
	}

	// Reduced motion: full stroke, no ScrollTrigger.
	if (isPrefersReducedMotion()) {
		gsap.set(paths, { drawSVG: '100%' });
		return () => {};
	}

	const from = reverse ? '100%' : '0%';
	gsap.set(paths, { drawSVG: from });

	const st = ScrollTrigger.create({
		trigger: section,
		start: 'top bottom',
		end: 'bottom top',
		scrub: true,
		onUpdate: (self) => {
			const pct = self.progress * 100;
			gsap.set(paths, { drawSVG: reverse ? `${100 - pct}%` : `${pct}%` });
		},
	});

	return () => st.kill();
}
