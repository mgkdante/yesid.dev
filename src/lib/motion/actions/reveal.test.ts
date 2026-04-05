import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// gsap and ScrollTrigger are mocked globally in src/tests/setup.ts.

function mockMatchMedia(matches: boolean) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockReturnValue({
			matches,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		})
	});
}

describe('reveal action', () => {
	beforeEach(() => {
		vi.clearAllMocks(); // Reset mock call counts before each test.
		mockMatchMedia(false);
		vi.resetModules();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it('returns update and destroy methods', async () => {
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		const result = reveal(el);
		expect(typeof result.update).toBe('function');
		expect(typeof result.destroy).toBe('function');
	});

	it('calls gsap.from when the action is applied', async () => {
		const { gsap } = await import('gsap');
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el, { direction: 'up' });
		expect(gsap.from).toHaveBeenCalledWith(el, expect.any(Object));
	});

	it('passes y offset for direction "up"', async () => {
		const { gsap } = await import('gsap');
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el, { direction: 'up' });
		const [, vars] = (gsap.from as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
		expect(vars.y).toBeGreaterThan(0);
	});

	it('passes y offset for direction "down"', async () => {
		const { gsap } = await import('gsap');
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el, { direction: 'down' });
		const [, vars] = (gsap.from as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
		expect(vars.y).toBeLessThan(0);
	});

	it('passes x offset for direction "left"', async () => {
		const { gsap } = await import('gsap');
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el, { direction: 'left' });
		const [, vars] = (gsap.from as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
		expect(vars.x).toBeLessThan(0);
	});

	it('passes x offset for direction "right"', async () => {
		const { gsap } = await import('gsap');
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el, { direction: 'right' });
		const [, vars] = (gsap.from as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
		expect(vars.x).toBeGreaterThan(0);
	});

	it('converts delay from ms to seconds for GSAP', async () => {
		const { gsap } = await import('gsap');
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el, { delay: 400 });
		const [, vars] = (gsap.from as ReturnType<typeof vi.fn>).mock.calls.at(-1)!;
		expect(vars.delay).toBeCloseTo(0.4);
	});

	it('calls tween.kill() on destroy', async () => {
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		const action = reveal(el);
		action.destroy();
		// The mock tween returned by gsap.from has a kill() method.
		// We verify it was called by checking the mock's calls.
		// Since gsap.from returns { kill: vi.fn() }, we check via the from mock's return.
		const { gsap } = await import('gsap');
		const tween = (gsap.from as ReturnType<typeof vi.fn>).mock.results.at(-1)!.value;
		expect(tween.kill).toHaveBeenCalled();
	});

	it('skips gsap.from when reduced motion is on', async () => {
		mockMatchMedia(true);
		vi.resetModules();
		const { gsap } = await import('gsap');
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el);
		expect(gsap.from).not.toHaveBeenCalled();
	});

	it('sets element visible when reduced motion is on', async () => {
		mockMatchMedia(true);
		vi.resetModules();
		const { reveal } = await import('./reveal.js');
		const el = document.createElement('div');
		reveal(el);
		expect(el.style.opacity).toBe('1');
	});
});
