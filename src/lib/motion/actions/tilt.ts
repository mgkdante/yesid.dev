// use:tilt — subtle 3D card tilt following cursor position on desktop.
//
// WHY: Hovering a station card should feel physical, like tilting a thick metal sign.
// The effect is very small (max 1.5 degrees) — enough to notice, not enough to distract.
// A 30% dead zone in the center prevents jitter from small cursor movements.
//
// Disabled on:
//   - Touch devices (no cursor to track)
//   - Reduced-motion preference
//
// Usage: <div use:tilt={{ maxDeg: 1.5, perspective: 800 }}>

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';

export interface TiltParams {
	/** Maximum tilt angle in degrees. Default: 1.5 */
	maxDeg?: number;
	/** CSS perspective value in px. Default: 800 */
	perspective?: number;
}

function isTouchDevice(): boolean {
	return typeof window !== 'undefined' && navigator.maxTouchPoints > 0;
}

export function tilt(node: HTMLElement, params: TiltParams = {}) {
	if (isPrefersReducedMotion() || isTouchDevice()) {
		return { update() {}, destroy() {} };
	}

	let { maxDeg = 1.5, perspective = 800 } = params;

	// Dead zone: cursor within the center 30% of the card produces zero tilt.
	// This prevents jitter from small movements and makes the tilt feel intentional.
	const DEAD_ZONE = 0.3;

	function onMouseMove(e: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const centreX = rect.left + rect.width / 2;
		const centreY = rect.top + rect.height / 2;

		// Normalize offset to -1..1 range
		const nx = (e.clientX - centreX) / (rect.width / 2);
		const ny = (e.clientY - centreY) / (rect.height / 2);

		// Clamp to prevent extreme angles when cursor is at element edge
		const cx = Math.max(-1, Math.min(1, nx));
		const cy = Math.max(-1, Math.min(1, ny));

		// Dead zone: no tilt when cursor is near center
		if (Math.abs(cx) < DEAD_ZONE && Math.abs(cy) < DEAD_ZONE) {
			node.style.transition = 'transform 0.3s ease-out';
			node.style.transform = '';
			return;
		}

		// rotateY follows horizontal offset, rotateX follows vertical (inverted)
		const rotateY = cx * maxDeg;
		const rotateX = -cy * maxDeg;

		node.style.transition = 'transform 0.3s ease-out';
		node.style.transform = `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
	}

	function onMouseLeave() {
		node.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
		node.style.transform = '';
	}

	node.addEventListener('mousemove', onMouseMove);
	node.addEventListener('mouseleave', onMouseLeave);

	return {
		update(newParams: TiltParams) {
			maxDeg = newParams.maxDeg ?? 1.5;
			perspective = newParams.perspective ?? 800;
		},
		destroy() {
			node.removeEventListener('mousemove', onMouseMove);
			node.removeEventListener('mouseleave', onMouseLeave);
			node.style.transform = '';
		}
	};
}
