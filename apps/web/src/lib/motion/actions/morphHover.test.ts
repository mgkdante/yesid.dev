import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gsap } from '@yesid/motion/utils/gsap';

// Mock the lazy loader so the test doesn't try to dynamic-import gsap/MorphSVGPlugin.
// Real plugin behaviour isn't tested here; tests/svg-morph.spec.ts covers it in a browser.
vi.mock('@yesid/motion/utils/gsap', async (importOriginal) => {
	const mod = (await importOriginal()) as typeof import('@yesid/motion/utils/gsap');
	return {
		...mod,
		loadMorphSVG: vi.fn(async () => {}),
	};
});

// Mock shapes utils so getMorphShapes doesn't invoke the real adapter.
vi.mock('#lib/utils/shapes.ts', () => ({
	getMorphShapes: vi.fn(async () => [
		{ id: 'triangle', label: 'Triangle', path: 'M24 8 L40 38 L8 38 Z', viewbox: '0 0 48 48', sort: 1 },
		{ id: 'circle', label: 'Circle', path: 'M24 8 A16 16 0 1 1 23.99 8 Z', viewbox: '0 0 48 48', sort: 2 },
	]),
	pickRandomShape: vi.fn((shapes: { path: string }[], _lastIdx: number) => ({
		shape: shapes[0],
		index: 0,
	})),
}));

import { morphHover } from './morphHover.js';
import { loadMorphSVG } from '@yesid/motion/utils/gsap';
import { pickRandomShape } from '#lib/utils/shapes.ts';

const ORIGINAL_D = 'M0 0 L10 10';
const SHAPE_D = 'M24 8 L40 38 L8 38 Z';

const pointer = (type: string, pointerType = 'mouse') => new PointerEvent(type, { pointerType });
const tweenCalls = () => vi.mocked(gsap.to).mock.calls;
const flush = () => new Promise((resolve) => setTimeout(resolve));

/** Resolve one per-path morph target from the most recent tween. */
function lastTarget(): string {
	const vars = tweenCalls().at(-1)![1] as unknown as { morphSVG: (index: number) => string };
	return vars.morphSVG(0);
}

/** Finish the most recent tween, the way GSAP does after the whole stagger. */
function finishLastTween() {
	(tweenCalls().at(-1)![1] as { onComplete: () => void }).onComplete();
}

describe('motion/actions/morphHover', () => {
	let node: HTMLElement;

	beforeEach(() => {
		vi.clearAllMocks();
		node = document.createElement('div');
		node.innerHTML = `<svg><path d="${ORIGINAL_D}"></path></svg>`;
		document.body.append(node);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('morphs to a shape on mouse hover', async () => {
		const action = morphHover(node, {});

		node.dispatchEvent(pointer('pointerenter'));
		await flush();

		expect(tweenCalls()).toHaveLength(1);
		expect(lastTarget()).toBe(SHAPE_D);
		action.destroy();
	});

	it('finishes the running morph before morphing back when the pointer leaves', async () => {
		const action = morphHover(node, {});

		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		node.dispatchEvent(pointer('pointerleave'));
		await flush();
		expect(tweenCalls()).toHaveLength(1);

		finishLastTween();
		await flush();
		expect(tweenCalls()).toHaveLength(2);
		expect(lastTarget()).toBe(ORIGINAL_D);
		action.destroy();
	});

	it('never kills a running tween to start another', async () => {
		const action = morphHover(node, {});

		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		node.dispatchEvent(pointer('pointerleave'));
		node.dispatchEvent(pointer('pointerenter'));
		await flush();

		expect(gsap.killTweensOf).not.toHaveBeenCalled();
		expect(vi.mocked(gsap.to).mock.results[0]!.value.kill).not.toHaveBeenCalled();
		action.destroy();
	});

	it('holds a hover while disabled, then morphs once enabled if the pointer stayed', async () => {
		const action = morphHover(node, { enabled: false });

		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		expect(tweenCalls()).toHaveLength(0);

		action.update({ enabled: true });
		await flush();
		expect(tweenCalls()).toHaveLength(1);
		expect(lastTarget()).toBe(SHAPE_D);
		action.destroy();
	});

	it('skips the morph when the pointer left before the entrance finished', async () => {
		const action = morphHover(node, { enabled: false });

		node.dispatchEvent(pointer('pointerenter'));
		node.dispatchEvent(pointer('pointerleave'));
		action.update({ enabled: true });
		await flush();

		expect(tweenCalls()).toHaveLength(0);
		action.destroy();
	});

	it('follows hover owned by a parent surface', async () => {
		const action = morphHover(node, { hovered: true });
		await flush();
		expect(tweenCalls()).toHaveLength(1);

		finishLastTween();
		action.update({ hovered: false });
		await flush();
		expect(tweenCalls()).toHaveLength(2);
		expect(lastTarget()).toBe(ORIGINAL_D);
		action.destroy();
	});

	it('stays morphed while the parent is hovered even after the pointer leaves the icon', async () => {
		const action = morphHover(node, { hovered: true });
		await flush();
		finishLastTween();

		node.dispatchEvent(pointer('pointerenter'));
		node.dispatchEvent(pointer('pointerleave'));
		await flush();

		expect(tweenCalls()).toHaveLength(1);
		action.destroy();
	});

	it('toggles on tap without touch hover double-driving it', async () => {
		const action = morphHover(node, {});

		node.dispatchEvent(pointer('pointerenter', 'touch'));
		node.dispatchEvent(new MouseEvent('click'));
		await flush();
		expect(tweenCalls()).toHaveLength(1);
		expect(lastTarget()).toBe(SHAPE_D);

		finishLastTween();
		node.dispatchEvent(new MouseEvent('click'));
		await flush();
		expect(tweenCalls()).toHaveLength(2);
		expect(lastTarget()).toBe(ORIGINAL_D);
		action.destroy();
	});

	it('leaves the tap default alone so icons inside links still navigate', () => {
		const action = morphHover(node, {});
		const click = new MouseEvent('click', { cancelable: true, bubbles: true });

		node.dispatchEvent(click);

		expect(click.defaultPrevented).toBe(false);
		action.destroy();
	});

	it('disableClickToggle ignores taps', async () => {
		const action = morphHover(node, { disableClickToggle: true });

		node.dispatchEvent(new MouseEvent('click'));
		await flush();

		expect(tweenCalls()).toHaveLength(0);
		action.destroy();
	});

	it('keeps a tapped morph when an unrelated update arrives', async () => {
		const action = morphHover(node, { enabled: true });

		node.dispatchEvent(new MouseEvent('click'));
		await flush();
		finishLastTween();
		action.update({ enabled: true });
		await flush();

		expect(tweenCalls()).toHaveLength(1);
		action.destroy();
	});

	it('finds an SVG injected after mount', async () => {
		node.innerHTML = '';
		const action = morphHover(node, {});
		node.innerHTML = `<svg><path d="${ORIGINAL_D}"></path></svg>`;

		node.dispatchEvent(pointer('pointerenter'));
		await flush();

		expect(tweenCalls()).toHaveLength(1);
		action.destroy();
	});

	it('recovers when the morph plugin fails to load', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.mocked(loadMorphSVG).mockRejectedValueOnce(new Error('offline'));
		const action = morphHover(node, {});

		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		expect(warn).toHaveBeenCalled();
		expect(tweenCalls()).toHaveLength(0);

		node.dispatchEvent(pointer('pointerleave'));
		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		expect(tweenCalls()).toHaveLength(1);
		expect(lastTarget()).toBe(SHAPE_D);

		warn.mockRestore();
		action.destroy();
	});

	it('stays responsive when building a morph throws', async () => {
		const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
		vi.mocked(pickRandomShape).mockImplementationOnce(() => {
			throw new Error('bad shape');
		});
		const action = morphHover(node, {});

		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		expect(warn).toHaveBeenCalled();
		expect(tweenCalls()).toHaveLength(0);

		node.dispatchEvent(pointer('pointerleave'));
		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		expect(tweenCalls()).toHaveLength(1);
		expect(lastTarget()).toBe(SHAPE_D);

		warn.mockRestore();
		action.destroy();
	});

	it('destroy kills the running tween and stops responding', async () => {
		const action = morphHover(node, {});

		node.dispatchEvent(pointer('pointerenter'));
		await flush();
		const tween = vi.mocked(gsap.to).mock.results[0]!.value;

		action.destroy();
		expect(tween.kill).toHaveBeenCalled();

		node.dispatchEvent(pointer('pointerleave'));
		await flush();
		expect(tweenCalls()).toHaveLength(1);
	});
});
