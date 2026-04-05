// use:ripple — orange ripple that emanates from the click point, then fades.
//
// WHY: Click feedback makes interactive elements feel more physical and confirms the
// action registered. The brand orange ripple ties the interaction directly to the brand.
//
// Usage: <button use:ripple={{ color: '#E07800' }}>

import { isPrefersReducedMotion } from '../stores/reducedMotion.js';

export interface RippleParams {
	/** Ripple colour. Default: '#E07800' (brand orange) */
	color?: string;
	/** Duration of the ripple animation in ms. Default: 400 */
	duration?: number;
}

export function ripple(node: HTMLElement, params: RippleParams = {}) {
	if (isPrefersReducedMotion()) return { update() {}, destroy() {} };

	let { color = '#E07800', duration = 400 } = params;

	// The host element needs relative positioning and overflow hidden so the circular
	// ripple is clipped to the button's bounds.
	node.style.position = 'relative';
	node.style.overflow = 'hidden';

	function onClick(e: MouseEvent) {
		const rect = node.getBoundingClientRect();
		const size = Math.max(rect.width, rect.height) * 2;
		const x = e.clientX - rect.left - size / 2;
		const y = e.clientY - rect.top - size / 2;

		const span = document.createElement('span');
		span.style.position = 'absolute';
		span.style.borderRadius = '50%';
		span.style.width = `${size}px`;
		span.style.height = `${size}px`;
		span.style.left = `${x}px`;
		span.style.top = `${y}px`;
		span.style.backgroundColor = color;
		span.style.opacity = '0.3';
		span.style.transform = 'scale(0)';
		span.style.pointerEvents = 'none';
		span.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

		node.appendChild(span);

		// Trigger the animation on the next frame so the initial state is painted first.
		requestAnimationFrame(() => {
			span.style.transform = 'scale(1)';
			span.style.opacity = '0';
		});

		setTimeout(() => span.remove(), duration);
	}

	node.addEventListener('click', onClick);

	return {
		update(newParams: RippleParams) {
			color = newParams.color ?? '#E07800';
			duration = newParams.duration ?? 400;
		},
		destroy() {
			node.removeEventListener('click', onClick);
		}
	};
}
