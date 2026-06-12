// Section magnetism (go2/w5) — gentle ease-to-nearest-section on scroll
// settle for the home page. Desktop AND mobile: the magnet sits on top of
// whatever scroll engine is live (Lenis wheel easing on desktop, native
// touch scroll on mobile) by listening for settle and nudging the window.
//
// SOFT magnet, never hard paging: it only acts when the settle point is
// already within a small attraction radius of a section top (≤ ~22% of the
// viewport, capped). Outside the radius nothing moves — free scrolling is
// untouched, and the hero pin interior (hundreds of vh from any boundary)
// can never be yanked.
//
// Reduced motion (operator-corrected): the magnet is ASSISTIVE, not
// vestibular — reduce users KEEP the alignment but get an instant settle
// (behavior: 'auto') instead of the smooth ease. This is deliberately NOT
// shouldAnimate('motion-gated')-gated off.
//
// Settle detection: debounced scroll events (works for Lenis-driven wheel,
// native touch momentum, scrollbar drags and keyboard scrolling alike).
// A held pointer (scrollbar drag) defers the magnet until release; wheel /
// touchstart cancel a pending settle so an actively-scrolling user is never
// fought.

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';
import { getLenis } from './lenis.js';

export interface SettleTargetOpts {
	/** Attraction radius in px — beyond it the magnet stays off. */
	radius: number;
	/** Document max scroll (scrollHeight - viewport); targets clamp to it. */
	maxScroll: number;
	/** Already-aligned tolerance in px — within it, no nudge (no loops). */
	epsilon?: number;
}

/**
 * Pure settle-target math: nearest section top to `scrollY`, clamped to the
 * scrollable range; null when out of attraction range, already aligned, or
 * no sections exist.
 */
export function findSettleTarget(
	scrollY: number,
	sectionTops: readonly number[],
	{ radius, maxScroll, epsilon = 2 }: SettleTargetOpts,
): number | null {
	let best: number | null = null;
	let bestDist = Infinity;
	for (const top of sectionTops) {
		const clamped = Math.min(Math.max(top, 0), maxScroll);
		const dist = Math.abs(clamped - scrollY);
		if (dist < bestDist) {
			bestDist = dist;
			best = clamped;
		}
	}
	if (best === null) return null;
	if (bestDist > radius) return null;
	if (bestDist <= epsilon) return null;
	return best;
}

export interface SectionMagnetOpts {
	/** Attraction radius as a fraction of viewport height. Default 0.22. */
	radiusVh?: number;
	/** Hard cap on the radius in px. Default 240. */
	maxRadiusPx?: number;
	/** Debounce after the last scroll event before settling. Default 180ms. */
	settleMs?: number;
	/** Smooth-ease duration when Lenis drives the nudge. Default 0.7s. */
	lenisDuration?: number;
}

/**
 * Wire the section magnet. `getSections` is called lazily at each settle so
 * layout changes (hero collapse, pin spacers, resizes) are always measured
 * fresh. Returns a destroy function.
 */
export function initSectionMagnet(
	getSections: () => readonly HTMLElement[],
	opts: SectionMagnetOpts = {},
): () => void {
	const { radiusVh = 0.22, maxRadiusPx = 240, settleMs = 180, lenisDuration = 0.7 } = opts;

	let timer: ReturnType<typeof setTimeout> | null = null;
	let pointerDown = false;

	function clearTimer(): void {
		if (timer !== null) {
			clearTimeout(timer);
			timer = null;
		}
	}

	function schedule(): void {
		clearTimer();
		timer = setTimeout(settle, settleMs);
	}

	function settle(): void {
		timer = null;
		if (pointerDown) return; // scrollbar drag in progress — wait for release

		const viewport = window.innerHeight;
		const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport);
		const scrollY = window.scrollY;
		const tops = getSections().map((el) => el.getBoundingClientRect().top + scrollY);

		const target = findSettleTarget(scrollY, tops, {
			radius: Math.min(viewport * radiusVh, maxRadiusPx),
			maxScroll,
		});
		if (target === null) return;

		if (isPrefersReducedMotion()) {
			// Assistive settle, zero animation.
			window.scrollTo({ top: target, behavior: 'auto' });
			return;
		}

		const lenis = getLenis();
		if (lenis) {
			lenis.scrollTo(target, {
				duration: lenisDuration,
				easing: (t: number) => 1 - Math.pow(1 - t, 3),
			});
			return;
		}

		window.scrollTo({ top: target, behavior: 'smooth' });
	}

	function onScroll(): void {
		schedule();
	}
	function onPointerDown(): void {
		pointerDown = true;
		clearTimer();
	}
	function onPointerUp(): void {
		pointerDown = false;
		schedule();
	}
	function onUserEngage(): void {
		// wheel / touchstart / keydown: the user took over — never fight them.
		clearTimer();
	}

	window.addEventListener('scroll', onScroll, { passive: true });
	window.addEventListener('pointerdown', onPointerDown, { passive: true });
	window.addEventListener('pointerup', onPointerUp, { passive: true });
	window.addEventListener('pointercancel', onPointerUp, { passive: true });
	window.addEventListener('wheel', onUserEngage, { passive: true });
	window.addEventListener('touchstart', onUserEngage, { passive: true });
	window.addEventListener('keydown', onUserEngage);

	return () => {
		clearTimer();
		window.removeEventListener('scroll', onScroll);
		window.removeEventListener('pointerdown', onPointerDown);
		window.removeEventListener('pointerup', onPointerUp);
		window.removeEventListener('pointercancel', onPointerUp);
		window.removeEventListener('wheel', onUserEngage);
		window.removeEventListener('touchstart', onUserEngage);
		window.removeEventListener('keydown', onUserEngage);
	};
}
