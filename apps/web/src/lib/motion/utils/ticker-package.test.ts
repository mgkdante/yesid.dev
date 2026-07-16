import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gsap } from 'gsap';
import { _resetForTests, subscribe } from '@yesid/motion/utils/ticker';

describe('@yesid/motion ticker app contract', () => {
	let internalCallback: Parameters<typeof gsap.ticker.add>[0] | null = null;

	beforeEach(() => {
		_resetForTests();
		internalCallback = null;
		vi.restoreAllMocks();
		vi.clearAllMocks();
		vi.spyOn(gsap.ticker, 'add').mockImplementation((callback) => {
			internalCallback = callback;
			return callback;
		});
		vi.spyOn(gsap.ticker, 'remove').mockImplementation(() => gsap.ticker);
	});

	it('fans a frame out exactly once per subscriber', () => {
		const first = vi.fn();
		const second = vi.fn();
		subscribe('first', first);
		subscribe('second', second);

		internalCallback?.(1, 16.67, 1, 16.67);

		expect(first).toHaveBeenCalledTimes(1);
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('invokes a duplicate id replacement exactly once', () => {
		const original = vi.fn();
		const replacement = vi.fn();
		subscribe('same', original);
		subscribe('same', replacement);

		internalCallback?.(2, 16.67, 2, 16.67);

		expect(original).not.toHaveBeenCalled();
		expect(replacement).toHaveBeenCalledTimes(1);
	});
});
