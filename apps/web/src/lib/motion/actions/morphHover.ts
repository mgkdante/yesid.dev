// The one way SVG art morphs to a random shape on hover or tap. Timing rules live in
// morphGate; MorphSVG loads lazily and conversion waits until the SVG has been injected.

import { loadMorphSVG } from '@yesid/motion/utils/gsap';
import { getMorphShapes, pickRandomShape } from '#lib/utils/shapes.ts';
import { createMorphGate } from '../utils/morphGate.js';
import { convertSvgToMorphPaths, tweenPathsTo } from '../utils/morphHelpers.js';
import { pointerHover } from './pointerHover.js';
import type { MorphShape } from '@repo/shared';

export interface MorphHoverParams {
	/** False holds morphs until true, e.g. while the SVG loads or its entrance plays. Default: true. */
	enabled?: boolean;
	/** Hover owned by a parent surface, such as the card around an icon. */
	hovered?: boolean;
	/** Skip tap-to-toggle where taps belong to a clickable parent. Default: false. */
	disableClickToggle?: boolean;
}

export function morphHover(node: HTMLElement, params: MorphHoverParams = {}) {
	let currentParams = params;
	let pointerOver = false;
	let isMorphed = false;
	let destroyed = false;
	let paths: SVGPathElement[] = [];
	let originals: string[] = [];
	let shapes: readonly MorphShape[] = [];
	let lastIdx = -1;
	let tween: gsap.core.Tween | undefined;

	async function prepare() {
		const [, loadedShapes] = await Promise.all([loadMorphSVG(), getMorphShapes()]);
		shapes = loadedShapes;
		if (paths.length > 0) return;
		// The SVG root may be the node itself or a child injected after mount.
		const svg = node.querySelector('svg') ?? (node as unknown as SVGElement);
		if (!(svg instanceof SVGElement)) return;
		({ paths, originals } = convertSvgToMorphPaths(svg));
	}

	function nextTarget(toMorphed: boolean): ((index: number) => string) | null {
		if (paths.length === 0) return null;
		if (!toMorphed) return isMorphed ? (index) => originals[index] ?? '' : null;
		if (shapes.length === 0) return null;
		const { shape, index } = pickRandomShape(shapes, lastIdx);
		lastIdx = index;
		return () => shape.path;
	}

	async function play(toMorphed: boolean, done: () => void) {
		// Every path must reach `done`, or the gate would ignore this icon until it remounts.
		try {
			await prepare();
			if (destroyed) return;

			const target = nextTarget(toMorphed);
			if (!target) {
				done();
				return;
			}
			tween = tweenPathsTo(paths, target, () => {
				isMorphed = toMorphed;
				done();
			});
		} catch (error) {
			console.warn('[morph-hover] Morph failed; keeping the current art.', error);
			done();
		}
	}

	const gate = createMorphGate({ play, ready: params.enabled !== false });
	const syncHover = () => gate.set(pointerOver || currentParams.hovered === true);
	const handleTap = () => gate.toggle();

	const hover = pointerHover(node, (hovering) => {
		pointerOver = hovering;
		syncHover();
	});
	if (!params.disableClickToggle) node.addEventListener('click', handleTap);
	syncHover();

	return {
		update(next: MorphHoverParams) {
			const hoverChanged = next.hovered !== currentParams.hovered;
			currentParams = next;
			gate.setReady(next.enabled !== false);
			// Only a real hover change may reset the request, or an unrelated update would undo a tap.
			if (hoverChanged) syncHover();
		},
		destroy() {
			destroyed = true;
			gate.destroy();
			hover.destroy();
			node.removeEventListener('click', handleTap);
			tween?.kill();
		},
	};
}
