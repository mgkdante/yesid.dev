// Lenis smooth scroll initialization with GSAP ScrollTrigger bridge.
// Initialized once at layout level. All ScrollTrigger instances automatically
// use Lenis scroll position instead of native scroll.
//
// Strategy: Lenis on desktop, normalizeScroll on mobile.
// Both are scroll-jacking solutions — they conflict if used together.
// Desktop: Lenis provides buttery easing for wheel scroll.
// Mobile:  normalizeScroll prevents browser chrome interference and
//          gives stable pin calculations without touch conflicts.

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';

let instance: Lenis | null = null;
let tickerCallback: ((time: number) => void) | null = null;
let isTouchDevice = false;

export function initLenis(): void {
	if (instance) return;

	// ScrollTrigger.isTouch: 0 = no touch, 1 = touch only, 2 = touch + pointer
	isTouchDevice = ScrollTrigger.isTouch > 0;

	if (isTouchDevice) {
		// Mobile: normalizeScroll handles scroll, prevents browser chrome
		// from interfering with ScrollTrigger pin calculations.
		ScrollTrigger.normalizeScroll({
			allowNestedScroll: true,
		});
		return;
	}

	// Desktop: Lenis for smooth wheel scroll
	instance = new Lenis({
		autoRaf: false, // We drive RAF via GSAP ticker — prevent double-update
		duration: 1.2,
		easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
	});

	// Bridge: Lenis scroll events update GSAP ScrollTrigger
	instance.on('scroll', ScrollTrigger.update);

	// Drive Lenis from GSAP's RAF ticker for frame-perfect sync
	tickerCallback = (time: number) => {
		instance?.raf(time * 1000);
	};
	gsap.ticker.add(tickerCallback);
	gsap.ticker.lagSmoothing(0);
}

export function destroyLenis(): void {
	if (isTouchDevice) {
		ScrollTrigger.normalizeScroll(false);
		return;
	}
	if (!instance) return;
	if (tickerCallback) {
		gsap.ticker.remove(tickerCallback);
		tickerCallback = null;
	}
	instance.destroy();
	instance = null;
}

export function getLenis(): Lenis | null {
	return instance;
}
