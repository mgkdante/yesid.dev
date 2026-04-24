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
		const result = morphHover(node, { shapes: { a: 'M0 0 L10 10' } });
		expect(typeof result.destroy).toBe('function');
		result.destroy();
	});

	it('reduced-motion: returns a no-op destroy, does not attach listeners', () => {
		isReducedMock.mockReturnValue(true);
		const addSpy = vi.spyOn(node, 'addEventListener');
		const result = morphHover(node, { shapes: { a: 'M0 0' } });
		expect(addSpy).not.toHaveBeenCalled();
		expect(() => result.destroy()).not.toThrow();
	});

	it('attaches mouseenter, mouseleave, and click listeners by default', () => {
		const addSpy = vi.spyOn(node, 'addEventListener');
		const result = morphHover(node, { shapes: { a: 'M0 0' } });
		const events = addSpy.mock.calls.map((c) => c[0]);
		expect(events).toContain('mouseenter');
		expect(events).toContain('mouseleave');
		expect(events).toContain('click');
		result.destroy();
	});

	it('destroy removes the listeners it attached', () => {
		const removeSpy = vi.spyOn(node, 'removeEventListener');
		const result = morphHover(node, { shapes: { a: 'M0 0' } });
		result.destroy();
		const events = removeSpy.mock.calls.map((c) => c[0]);
		expect(events).toContain('mouseenter');
		expect(events).toContain('mouseleave');
		expect(events).toContain('click');
	});

	it('update() accepts a new shape set without throwing', () => {
		const result = morphHover(node, { shapes: { a: 'M0 0' } });
		expect(result.update).toBeDefined();
		if (result.update) {
			expect(() => result.update({ shapes: { b: 'M5 5' } })).not.toThrow();
		}
		result.destroy();
	});
});
