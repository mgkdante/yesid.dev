// Lenis smooth scroll initialization with GSAP ScrollTrigger bridge.
// Initialized once at layout level. All ScrollTrigger instances automatically
// use Lenis scroll position instead of native scroll.

import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './gsap.js';

let instance: Lenis | null = null;

export function initLenis(): Lenis {
	if (instance) return instance;

	instance = new Lenis({
		duration: 1.2,
		easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
		touchMultiplier: 2,
	});

	// Bridge: Lenis scroll events update GSAP ScrollTrigger
	instance.on('scroll', ScrollTrigger.update);

	// Drive Lenis from GSAP's RAF ticker for frame-perfect sync
	gsap.ticker.add((time: number) => {
		instance?.raf(time * 1000);
	});
	gsap.ticker.lagSmoothing(0);

	return instance;
}

export function destroyLenis(): void {
	if (!instance) return;
	gsap.ticker.remove(instance.raf);
	instance.destroy();
	instance = null;
}

export function getLenis(): Lenis | null {
	return instance;
}
