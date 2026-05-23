// tapRipple — radial ripple from touch point. Lightweight CSS-only animation
// (no GSAP) to keep mobile cost low. Each ripple is a single span appended to
// the node; cleaned up after the animation timeout.
//
// Requires the node to have position: relative (or absolute) + overflow: hidden
// — the ripple is absolutely positioned within the node.
//
// Pair with class="tap-press" (Layer 1 CSS baseline) for layered feedback.

import { isTouchDevice } from '$lib/motion/utils/device';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion';

type ActionReturn = { destroy(): void };

const RIPPLE_DURATION_MS = 500;

export function tapRipple(node: HTMLElement): ActionReturn {
	if (!isTouchDevice() || isPrefersReducedMotion()) {
		return { destroy() {} };
	}

	const onDown = (event: Event) => {
		// PointerEvent has clientX/clientY; fall back to 0 if unavailable (test env)
		const e = event as PointerEvent;
		const rect = node.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height) * 2;
		const x = (e.clientX ?? 0) - rect.left - size / 2;
		const y = (e.clientY ?? 0) - rect.top - size / 2;

		const ripple = document.createElement('span');
		ripple.className = 'tap-ripple';
		ripple.style.cssText = `
			position: absolute;
			left: ${x}px;
			top: ${y}px;
			width: ${size}px;
			height: ${size}px;
			border-radius: 50%;
			background: currentColor;
			opacity: 0.25;
			pointer-events: none;
			transform: scale(0);
			animation: tap-ripple-expand ${RIPPLE_DURATION_MS}ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
		`;
		node.appendChild(ripple);
		setTimeout(() => ripple.remove(), RIPPLE_DURATION_MS);
	};

	node.addEventListener('pointerdown', onDown);

	return {
		destroy() {
			node.removeEventListener('pointerdown', onDown);
		},
	};
}
