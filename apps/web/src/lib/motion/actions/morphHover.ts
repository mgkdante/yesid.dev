// use:morphHover — SVG path morphing on hover/tap.
//
// Slice 18 18f Phase 11: shapes are now CMS-managed via the morph_shapes
// collection. Action fetches shapes internally from getMorphShapes() with
// a shared module-level cache. Caller no longer needs to pass shapes.
//
// Desktop hover → paths morph to a random shape from the adapter.
// mouseleave   → paths morph back to their original `d`.
// Mobile tap   → toggle morphed / unmorphed.
// Reduced-motion → KEPT ACTIVE per operator policy (slice-23). SVG path
//   morphing is a visual transformation, not a translation/scale motion,
//   and isn't a vestibular trigger. User-initiated, brief (~400ms).
//
// MorphSVG plugin is lazy-loaded on first hover via loadMorphSVG() so pages
// that never hover a morph-capable element never ship the plugin.
//
// The node passed to the action should be a clickable parent that contains
// <path> elements (or SVG primitives — convertSvgToMorphPaths coerces them).
// SVG may be injected after mount (e.g. HomeServices' async fetch); the
// action defers path conversion until `enabled` is true AND the first
// interaction fires.
//
// Usage:
//   <button use:morphHover={{ enabled: svgReady[i] }}>...</button>

import { gsap, loadMorphSVG } from '../utils/gsap.js';
import { convertSvgToMorphPaths } from '../utils/morphHelpers.js';
import { getMorphShapes, pickRandomShape } from '$lib/utils/shapes';
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

	function isMobile(): boolean {
		if (typeof window === 'undefined') return false;
		return window.matchMedia('(max-width: 767px)').matches;
	}

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
