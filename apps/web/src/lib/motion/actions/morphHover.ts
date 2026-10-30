// Morph paths on hover/tap, lazily loading MorphSVG; defer conversion until injected SVG is ready.

import { gsap, loadMorphSVG } from '@yesid/motion/utils/gsap';
import { convertSvgToMorphPaths } from '../utils/morphHelpers.js';
import { isViewportAtMost } from '@yesid/motion/utils/device';
import { getMorphShapes, pickRandomShape } from '#lib/utils/shapes.ts';
import type { MorphShape } from '@repo/shared';

export interface MorphHoverParams {
	/** If false, listeners still attach but morphs are no-ops (use while SVG content loads). Default: true */
	enabled?: boolean;
	/** Optional deterministic starting shape index. Default: -1 (random). */
	lastShapeIdx?: number;
	/**
	 * If true, skip the mobile click-to-toggle handler. Useful when applying
	 * morphHover to a clickable parent (e.g. an `<a>` link) where you want
	 * desktop hover-to-morph but still want mobile taps to navigate normally
	 * instead of being intercepted by preventDefault. Default: false.
	 */
	disableClickToggle?: boolean;
}

export function morphHover(node: HTMLElement, params: MorphHoverParams) {
	let currentParams = params;
	let morphed = false;
	let paths: SVGPathElement[] = [];
	let originals: string[] = [];
	let shapes: readonly MorphShape[] = [];
	let lastIdx = params.lastShapeIdx ?? -1;
	let pluginLoaded = false;
	let shapesLoaded = false;

	const isMobile = () => isViewportAtMost(767);

	async function ensureShapes() {
		if (shapesLoaded) return;
		shapes = await getMorphShapes();
		shapesLoaded = true;
	}

	async function ensurePluginAndPaths() {
		if (!pluginLoaded) {
			await loadMorphSVG();
			pluginLoaded = true;
		}
		if (paths.length === 0) {
			// Find SVG root (may be the node itself or a child — SVG can be
			// injected post-mount for async content like HomeServices).
			const svg = node.querySelector('svg') ?? (node as unknown as SVGElement);
			if (!(svg instanceof SVGElement)) return;
			const { paths: p, originals: o } = convertSvgToMorphPaths(svg);
			paths = p;
			originals = o;
		}
	}

	function morphTo(path: string) {
		paths.forEach((p) => gsap.killTweensOf(p));
		gsap.to(paths, {
			morphSVG: path,
			duration: 0.4,
			stagger: 0.03,
			ease: 'power2.inOut',
			overwrite: true,
		});
		morphed = true;
	}

	function morphBack() {
		if (paths.length === 0 || originals.length === 0) return;
		paths.forEach((path, i) => {
			gsap.killTweensOf(path);
			gsap.to(path, {
				morphSVG: originals[i],
				duration: 0.4,
				delay: i * 0.03,
				ease: 'power2.inOut',
				overwrite: true,
			});
		});
		morphed = false;
	}

	async function handleEnter() {
		if (currentParams.enabled === false) return;
		if (isMobile()) return;
		await Promise.all([ensurePluginAndPaths(), ensureShapes()]);
		if (paths.length === 0 || shapes.length === 0) return;
		const { shape, index } = pickRandomShape(shapes, lastIdx);
		lastIdx = index;
		morphTo(shape.path);
	}

	function handleLeave() {
		if (currentParams.enabled === false) return;
		if (isMobile()) return;
		morphBack();
	}

	async function handleTap(e: Event) {
		if (!isMobile()) return;
		if (currentParams.enabled === false) return;
		e.preventDefault();
		e.stopPropagation();
		await Promise.all([ensurePluginAndPaths(), ensureShapes()]);
		if (paths.length === 0 || shapes.length === 0) return;
		if (morphed) {
			morphBack();
		} else {
			const { shape, index } = pickRandomShape(shapes, lastIdx);
			lastIdx = index;
			morphTo(shape.path);
		}
	}

	node.addEventListener('mouseenter', handleEnter);
	node.addEventListener('mouseleave', handleLeave);
	if (!params.disableClickToggle) {
		node.addEventListener('click', handleTap);
	}

	return {
		update(newParams: MorphHoverParams) {
			currentParams = newParams;
		},
		destroy() {
			node.removeEventListener('mouseenter', handleEnter);
			node.removeEventListener('mouseleave', handleLeave);
			if (!params.disableClickToggle) {
				node.removeEventListener('click', handleTap);
			}
		},
	};
}
