import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { captureFlipState, animateFlipTransition } from './flip.js';

describe('motion/utils/flip', () => {
	beforeEach(() => {
		document.body.innerHTML = '';
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('captureFlipState', () => {
		it('returns null when no [data-flip-id] elements exist', () => {
			expect(captureFlipState()).toBeNull();
		});

		// Note: the "with elements" case is covered by E2E / Playwright because
		// GSAP's Flip.getState needs real layout measurement that happy-dom
		// does not provide. Unit scope = null-path + safety.
	});

	describe('animateFlipTransition', () => {
		it('is a no-op when batchFired is false', () => {
			const onDone = vi.fn();
			animateFlipTransition('[data-batch="test"]', null, false, onDone);
			// tick() hasn't fired — onDone should not have been called synchronously
			expect(onDone).not.toHaveBeenCalled();
		});

		it('accepts a null flipState and does not throw', () => {
			const onDone = vi.fn();
			expect(() =>
				animateFlipTransition('[data-batch="test"]', null, true, onDone),
			).not.toThrow();
		});
	});
});
