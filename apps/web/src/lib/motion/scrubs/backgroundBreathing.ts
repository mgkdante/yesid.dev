import { gsap } from '@yesid/motion/utils/gsap';
import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';

/**
 * Options for `backgroundBreathing`.
 */
export interface BreathingOpts {
	/** Half-cycle duration in seconds (0 → 1 takes this long, 1 → 0 yoyo back). Default: 10. */
	duration?: number;
}

/**
 * Controls returned from `backgroundBreathing`. Callers can pause the
 * breathing transiently (e.g. while a sectionGlow is active in the same
 * section to avoid visual competition) and resume later.
 */
export interface BreathingControls {
	pause: () => void;
	resume: () => void;
	destroy: () => void;
}

/* Animate the breathing phase for background layers; reduced motion returns inert controls. */
export function backgroundBreathing(
	node: HTMLElement,
	opts: BreathingOpts = {},
): BreathingControls {
	const noop: BreathingControls = {
		pause: () => {},
		resume: () => {},
		destroy: () => {},
	};

	if (typeof window === 'undefined') return noop;
	if (isPrefersReducedMotion()) return noop;

	const duration = opts.duration ?? 10;

	const tween = gsap.to(node, {
		'--breathing-phase': 1,
		duration,
		repeat: -1,
		yoyo: true,
		ease: 'sine.inOut',
	});

	return {
		pause() {
			tween.pause();
		},
		resume() {
			tween.resume();
		},
		destroy() {
			tween.kill();
			node.style.removeProperty('--breathing-phase');
		},
	};
}
