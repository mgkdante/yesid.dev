import { describe, it, expect, beforeEach, vi } from 'vitest';
import { gsap } from 'gsap';
import { subscribe, unsubscribe, _resetForTests } from './ticker.js';

describe('motion/utils/ticker', () => {
	let internalCallback: ((time: number, deltaTime: number) => void) | null = null;

	beforeEach(() => {
		_resetForTests();
		internalCallback = null;
		// Intercept the single gsap.ticker.add call the module makes on first subscribe
		vi.spyOn(gsap.ticker, 'add').mockImplementation((cb: any) => {
			internalCallback = cb;
			return cb;
		});
		vi.spyOn(gsap.ticker, 'remove').mockImplementation(() => gsap.ticker as any);
	});

	it('subscribe invokes gsap.ticker.add exactly once even with many subscribers', () => {
		for (let i = 0; i < 10; i++) {
			subscribe(`many-${i}`, vi.fn());
		}
		expect(gsap.ticker.add).toHaveBeenCalledTimes(1);
	});

	it('internal callback fans out to all registered subscribers', () => {
		const a = vi.fn();
		const b = vi.fn();
		subscribe('a', a);
		subscribe('b', b);

		// Simulate one frame
		internalCallback?.(1.0, 16.67);

		expect(a).toHaveBeenCalledTimes(1);
		expect(a).toHaveBeenCalledWith(1.0, 16.67);
		expect(b).toHaveBeenCalledTimes(1);
		expect(b).toHaveBeenCalledWith(1.0, 16.67);
	});

	it('unsubscribe removes callback from subsequent frames', () => {
		const callback = vi.fn();
		subscribe('one-shot', callback);
		unsubscribe('one-shot');

		internalCallback?.(1.0, 16.67);

		expect(callback).not.toHaveBeenCalled();
	});

	it('subscribing with existing id replaces the previous callback', () => {
		const first = vi.fn();
		const second = vi.fn();
		subscribe('id', first);
		subscribe('id', second);

		internalCallback?.(1.0, 16.67);

		expect(first).not.toHaveBeenCalled();
		expect(second).toHaveBeenCalledTimes(1);
	});

	it('subscribe returns an unsubscribe function', () => {
		const callback = vi.fn();
		const stop = subscribe('returned', callback);

		stop();
		internalCallback?.(1.0, 16.67);

		expect(callback).not.toHaveBeenCalled();
	});
});
