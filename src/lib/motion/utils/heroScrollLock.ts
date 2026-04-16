/**
 * heroScrollLock — Prevents scroll during hero typewriter animation.
 * Locks body/html position and blocks touch/wheel/keyboard scroll events.
 * Unlocks after typewriter completes, refreshing ScrollTrigger.
 */
import { ScrollTrigger } from '$lib/motion/utils/gsap.js';

export interface ScrollLockResult {
	shouldLock: boolean;
	unlock: () => void;
}

export function createScrollLock(
	scrollPrompt: HTMLElement | undefined,
	reducedMotion: boolean,
): ScrollLockResult {
	const isReload = performance.getEntriesByType('navigation').some(
		(e) => (e as PerformanceNavigationTiming).type === 'reload'
	);
	const shouldLock = !isReload && !reducedMotion && !!scrollPrompt && window.scrollY < window.innerHeight * 0.3;

	const bodyStyle = document.body.style;
	const htmlStyle = document.documentElement.style;

	if (shouldLock) {
		bodyStyle.position = 'fixed';
		bodyStyle.top = '0';
		bodyStyle.left = '0';
		bodyStyle.right = '0';
		bodyStyle.overflow = 'hidden';
		htmlStyle.overflow = 'hidden';
	}

	const blockScroll = (e: Event) => e.preventDefault();
	const blockKeys = (e: KeyboardEvent) => {
		if (['ArrowDown', 'ArrowUp', 'Space', 'PageDown', 'PageUp'].includes(e.code)) {
			e.preventDefault();
		}
	};

	if (shouldLock) {
		document.addEventListener('touchmove', blockScroll, { passive: false });
		document.addEventListener('wheel', blockScroll, { passive: false });
		document.addEventListener('keydown', blockKeys, { capture: true });
	}

	function unlock() {
		bodyStyle.position = '';
		bodyStyle.top = '';
		bodyStyle.left = '';
		bodyStyle.right = '';
		bodyStyle.overflow = '';
		htmlStyle.overflow = '';
		document.removeEventListener('touchmove', blockScroll);
		document.removeEventListener('wheel', blockScroll);
		document.removeEventListener('keydown', blockKeys, { capture: true });
		ScrollTrigger.refresh();
	}

	return { shouldLock, unlock };
}
