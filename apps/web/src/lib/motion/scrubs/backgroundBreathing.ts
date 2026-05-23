import { gsap } from '$lib/motion/utils/gsap.js';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

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

/**
 * `backgroundBreathing` — ambient scrub factory.
 *
 * Registers a GSAP tween that animates the host element's
 * `--breathing-phase` CSS custom property from 0 to 1 with `yoyo: true`
 * and `repeat: -1`, using a sine.inOut ease for an "is it actually
 * moving?" subtle background pulse.
 *
 * Consumers reference `var(--breathing-phase)` in background gradients
 * or opacity calcs to produce slow ambient motion:
 *
 *   background: radial-gradient(...,
 *     color-mix(in srgb, var(--primary)
 *       calc(var(--breathing-phase, 0) * 3%), transparent),
 *     transparent 60%);
 *
 * Returns `pause / resume / destroy` so the caller can mute breathing
 * during competing motion (e.g. while sectionGlow is updating in the
 * same section) and clean up on component destroy.
 *
 * No-op under `prefers-reduced-motion: reduce` (all three control
 * functions become safe no-ops).
 *
 * Slice-23 Task 7.
 */
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
