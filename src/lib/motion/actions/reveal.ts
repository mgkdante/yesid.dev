// use:reveal — scroll-triggered entrance animation using GSAP ScrollTrigger.
//
// WHY this instead of CSS animations:
//   CSS animations fire on page load regardless of whether the element is visible.
//   ScrollTrigger fires exactly when the element enters the viewport — implementing the
//   "earned, not free" principle from MOTION.md section 2.
//
// Usage: <div use:reveal={{ direction: 'up', delay: 200 }}>

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';
import { registerGsapPlugins, gsap } from '../utils/gsap.js';

export interface RevealParams {
	/** Direction the element enters from. Default: 'up' */
	direction?: 'up' | 'down' | 'left' | 'right';
	/** Delay in ms before the animation starts. Default: 0 */
	delay?: number;
	/** Duration in seconds. Default: 0.7 (700ms, per MOTION.md 600-800ms range) */
	duration?: number;
}

const OFFSET = 20; // px for up/down
const OFFSET_X = 30; // px for left/right

function getFromVars(direction: NonNullable<RevealParams['direction']>): gsap.TweenVars {
	switch (direction) {
		case 'up':
			return { y: OFFSET };
		case 'down':
			return { y: -OFFSET };
		case 'left':
			return { x: -OFFSET_X };
		case 'right':
			return { x: OFFSET_X };
	}
}

export function reveal(node: HTMLElement, params: RevealParams = {}) {
	const { direction = 'up', delay = 0, duration = 0.7 } = params;

	// When reduced motion is on, skip the animation entirely and ensure the element
	// is immediately visible (not left at opacity 0 or translated off-screen).
	if (isPrefersReducedMotion()) {
		node.style.opacity = '1';
		node.style.transform = '';
		return { update() {}, destroy() {} };
	}

	registerGsapPlugins();

	const fromVars = getFromVars(direction);
	const tween = gsap.from(node, {
		...fromVars,
		opacity: 0,
		duration,
		delay: delay / 1000, // Convert ms to seconds for GSAP.
		ease: 'back.out(1.4)',
		scrollTrigger: {
			trigger: node,
			start: 'top 80%',
			once: true
		}
	});

	return {
		update() {
			// Params are applied at creation time. Recreating the tween on update would
			// re-trigger the animation. For now, update is a no-op.
		},
		destroy() {
			tween.kill();
		}
	};
}
