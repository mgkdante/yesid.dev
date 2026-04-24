import { describe, it, expect } from 'bun:test';
import { withRateLimit } from './bottleneck';

describe('scripts/lib/bottleneck.ts', () => {
	it('invokes wrapped function with correct args + result', async () => {
		const add = withRateLimit(async (a: number, b: number) => a + b);
		expect(await add(2, 3)).toBe(5);
	});

	it('serializes calls when maxConcurrent=1', async () => {
		const events: string[] = [];
		const slow = withRateLimit(
			async (id: string) => {
				events.push(`start-${id}`);
				await Bun.sleep(20);
				events.push(`end-${id}`);
			},
			{ maxConcurrent: 1, minTime: 1 },
		);
		await Promise.all([slow('a'), slow('b')]);
		expect(events).toEqual(['start-a', 'end-a', 'start-b', 'end-b']);
	});

	it('propagates errors from wrapped function', async () => {
		const boom = withRateLimit(async () => {
			throw new Error('inner fail');
		});
		await expect(boom()).rejects.toThrow(/inner fail/);
	});

	it('respects minTime spacing between calls', async () => {
		const ticks: number[] = [];
		const limited = withRateLimit(
			async () => {
				ticks.push(Date.now());
			},
			{ maxConcurrent: 1, minTime: 50 },
		);
		await Promise.all([limited(), limited(), limited()]);
		expect(ticks).toHaveLength(3);
		// Gap between 2nd and 1st call should be >= ~45ms (50ms minus jitter).
		expect(ticks[1] - ticks[0]).toBeGreaterThanOrEqual(45);
	});
});
