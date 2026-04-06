// use:cursorGlow — pointer-following radial glow on cards.
//
// WHY: Static hover glows feel flat. Tracking the cursor creates a spotlight effect
// that makes cards feel interactive and spatial — like light reacting to your hand.
//
// Pattern: same as tilt.ts — event listeners, cleanup in destroy().
// Disabled on touch devices and reduced-motion.
//
// Usage: <div use:cursorGlow={{ radius: 200, intensity: 0.12 }}>
//   Then in CSS: background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), ...)

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';

export interface CursorGlowParams {
	/** Glow radius in px (informational — used by CSS, not JS). Default: 200 */
	radius?: number;
	/** Glow intensity 0-1 (informational — used by CSS, not JS). Default: 0.12 */
	intensity?: number;
}

function isTouchDevice(): boolean {
	return typeof window !== 'undefined' && navigator.maxTouchPoints > 0;
}

export function cursorGlow(node: HTMLElement, params: CursorGlowParams = {}) {
	if (isPrefersReducedMotion() || isTouchDevice()) {
		return { update() {}, destroy() {} };
	}

	function onPointerMove(e: PointerEvent) {
		const rect = node.getBoundingClientRect();
		const x = e.clientX - rect.left;
		const y = e.clientY - rect.top;
		node.style.setProperty('--glow-x', `${x}px`);
		node.style.setProperty('--glow-y', `${y}px`);
	}

	function onPointerLeave() {
		node.style.removeProperty('--glow-x');
		node.style.removeProperty('--glow-y');
	}

	node.addEventListener('pointermove', onPointerMove);
	node.addEventListener('pointerleave', onPointerLeave);

	return {
		update(_newParams: CursorGlowParams) {
			// Params are CSS-side; no JS update needed.
		},
		destroy() {
			node.removeEventListener('pointermove', onPointerMove);
			node.removeEventListener('pointerleave', onPointerLeave);
			node.style.removeProperty('--glow-x');
			node.style.removeProperty('--glow-y');
		}
	};
}
