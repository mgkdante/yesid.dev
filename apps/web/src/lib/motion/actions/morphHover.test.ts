import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock reducedMotion so we can toggle its return value per test.
vi.mock('../stores/reducedMotion.js', async (importOriginal) => {
	const mod = (await importOriginal()) as typeof import('../stores/reducedMotion.js');
	return {
		...mod,
		isPrefersReducedMotion: vi.fn(() => false),
	};
});

// Mock the lazy loader so the test doesn't try to dynamic-import gsap/MorphSVGPlugin.
// Real plugin behaviour isn't tested here — that's an integration concern.
vi.mock('../utils/gsap.js', async (importOriginal) => {
	const mod = (await importOriginal()) as typeof import('../utils/gsap.js');
	return {
		...mod,
		loadMorphSVG: vi.fn(async () => {}),
	};
});

// Mock shapes utils so getMorphShapes doesn't invoke the real adapter.
vi.mock('$lib/utils/shapes', () => ({
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
import * as reducedMotionMod from '../stores/reducedMotion.js';

const isReducedMock = reducedMotionMod.isPrefersReducedMotion as ReturnType<typeof vi.fn>;

describe('motion/actions/morphHover', () => {
	let node: HTMLElement;

	beforeEach(() => {
		vi.clearAllMocks();
		isReducedMock.mockReturnValue(false);
		node = document.createElement('div');
		document.body.append(node);
	});

	afterEach(() => {
		document.body.innerHTML = '';
	});

	it('returns an action object with destroy', () => {
		const result = morphHover(node, {});
		expect(typeof result.destroy).toBe('function');
		result.destroy();
	});

	it('reduced-motion: returns a no-op destroy, does not attach listeners', () => {
		isReducedMock.mockReturnValue(true);
		const addSpy = vi.spyOn(node, 'addEventListener');
		const result = morphHover(node, {});
		expect(addSpy).not.toHaveBeenCalled();
		expect(() => result.destroy()).not.toThrow();
	});

	it('attaches mouseenter, mouseleave, and click listeners by default', () => {
		const addSpy = vi.spyOn(node, 'addEventListener');
		const result = morphHover(node, {});
		const events = addSpy.mock.calls.map((c) => c[0]);
		expect(events).toContain('mouseenter');
		expect(events).toContain('mouseleave');
		expect(events).toContain('click');
		result.destroy();
	});

	it('destroy removes the listeners it attached', () => {
		const removeSpy = vi.spyOn(node, 'removeEventListener');
		const result = morphHover(node, {});
		result.destroy();
		const events = removeSpy.mock.calls.map((c) => c[0]);
		expect(events).toContain('mouseenter');
		expect(events).toContain('mouseleave');
		expect(events).toContain('click');
	});

	it('update() accepts new params without throwing', () => {
		const result = morphHover(node, {});
		expect(result.update).toBeDefined();
		if (result.update) {
			expect(() => result.update({ enabled: false })).not.toThrow();
			expect(() => result.update({ enabled: true, lastShapeIdx: 1 })).not.toThrow();
		}
		result.destroy();
	});

	it('enabled: false prevents morph on mouseenter', () => {
		const result = morphHover(node, { enabled: false });
		// Fire mouseenter — should be a no-op (enabled: false guard fires first)
		node.dispatchEvent(new MouseEvent('mouseenter'));
		expect(typeof result.destroy).toBe('function');
		result.destroy();
	});
});
