import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { get } from 'svelte/store';

// jsdom doesn't implement real scrolling, so we mock the properties manually.
function setScrollState(scrollY: number, scrollHeight: number, innerHeight: number) {
	Object.defineProperty(window, 'scrollY', { writable: true, configurable: true, value: scrollY });
	Object.defineProperty(window, 'innerHeight', {
		writable: true,
		configurable: true,
		value: innerHeight
	});
	Object.defineProperty(document.documentElement, 'scrollHeight', {
		writable: true,
		configurable: true,
		value: scrollHeight
	});
}

describe('scrollProgress store', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Stub requestAnimationFrame to call callback immediately.
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		});
		vi.stubGlobal('cancelAnimationFrame', vi.fn());
		setScrollState(0, 1000, 600);
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.resetModules();
	});

	it('is a readable store with a subscribe method', async () => {
		const { scrollProgress } = await import('./scroll.js');
		expect(typeof scrollProgress.subscribe).toBe('function');
	});

	it('returns a number', async () => {
		const { scrollProgress } = await import('./scroll.js');
		expect(typeof get(scrollProgress)).toBe('number');
	});

	it('returns 0 when at the top of the page', async () => {
		setScrollState(0, 1000, 600);
		vi.resetModules();
		const { scrollProgress } = await import('./scroll.js');
		expect(get(scrollProgress)).toBe(0);
	});

	it('returns 1 when scrolled to the bottom', async () => {
		// scrollable = 1000 - 600 = 400; scrollY = 400 => progress = 1
		setScrollState(400, 1000, 600);
		vi.resetModules();
		const { scrollProgress } = await import('./scroll.js');
		expect(get(scrollProgress)).toBe(1);
	});

	it('returns 0.5 when scrolled halfway', async () => {
		// scrollable = 400; scrollY = 200 => 0.5
		setScrollState(200, 1000, 600);
		vi.resetModules();
		const { scrollProgress } = await import('./scroll.js');
		expect(get(scrollProgress)).toBe(0.5);
	});

	it('returns 0 when content fits viewport (no scroll bar)', async () => {
		// scrollHeight === innerHeight → scrollable = 0
		setScrollState(0, 600, 600);
		vi.resetModules();
		const { scrollProgress } = await import('./scroll.js');
		expect(get(scrollProgress)).toBe(0);
	});

	it('returns a value between 0 and 1', async () => {
		setScrollState(100, 1000, 600);
		vi.resetModules();
		const { scrollProgress } = await import('./scroll.js');
		const value = get(scrollProgress);
		expect(value).toBeGreaterThanOrEqual(0);
		expect(value).toBeLessThanOrEqual(1);
	});

	it('updates when a scroll event fires', async () => {
		setScrollState(0, 1000, 600);
		vi.resetModules();
		const { scrollProgress } = await import('./scroll.js');
		const unsub = scrollProgress.subscribe(() => {});

		// Simulate scrolling to halfway.
		setScrollState(200, 1000, 600);
		window.dispatchEvent(new Event('scroll'));

		expect(get(scrollProgress)).toBeCloseTo(0.5);
		unsub();
	});
});
