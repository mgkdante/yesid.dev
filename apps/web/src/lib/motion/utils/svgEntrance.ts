// Shared entrance animations for decorative SVG art. Morphing stays held until `onComplete`.

import { gsap, type ScrollTrigger } from '@yesid/motion/utils/gsap';
import type { BlogAnimation } from '#lib/types.ts';

export interface SvgEntranceOptions {
	animation: BlogAnimation;
	scrollTrigger?: ScrollTrigger.Vars;
	/** Seconds before the entrance starts, e.g. to cascade a group. */
	delay?: number;
	/** Overrides the main step's duration for this entrance. */
	duration?: number;
	/** Overrides the main step's stagger for this entrance. */
	stagger?: number;
	/** Fires once the whole entrance has finished. */
	onComplete?: () => void;
}

export function playSvgEntrance(
	targets: readonly SVGElement[],
	{ animation, scrollTrigger, delay, duration, stagger, onComplete }: SvgEntranceOptions,
): gsap.core.Timeline {
	const elements = targets as SVGElement[];
	const timeline = gsap.timeline({ scrollTrigger, delay, onComplete });

	switch (animation) {
		case 'draw':
			gsap.set(elements, { drawSVG: '0%' });
			timeline.to(elements, {
				drawSVG: '100%',
				duration: duration ?? 1.2,
				stagger: stagger ?? 0.15,
				ease: 'power2.inOut',
			});
			break;
		case 'morph':
			gsap.set(elements, { opacity: 0, scale: 0.3, transformOrigin: 'center center' });
			timeline.to(elements, {
				opacity: 1,
				scale: 1,
				duration: duration ?? 0.8,
				stagger: stagger ?? 0.1,
				ease: 'back.out(1.7)',
			});
			break;
		case 'draw-fill':
			gsap.set(elements, { drawSVG: '0%', fillOpacity: 0 });
			timeline.to(elements, {
				drawSVG: '100%',
				duration: duration ?? 1,
				stagger: stagger ?? 0.12,
				ease: 'power2.inOut',
			});
			timeline.to(
				elements,
				{ fillOpacity: 0.15, duration: 0.6, stagger: 0.08, ease: 'power1.out' },
				'-=0.3',
			);
			break;
	}

	return timeline;
}
