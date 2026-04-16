import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('isTouchDevice', () => {
	let isTouchDevice: () => boolean;

	beforeEach(async () => {
		// Re-import each test to get fresh module
		const mod = await import('./device.js');
		isTouchDevice = mod.isTouchDevice;
	});

	it('returns false when maxTouchPoints is 0', () => {
		Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });
		expect(isTouchDevice()).toBe(false);
	});

	it('returns true when maxTouchPoints is > 0', () => {
		Object.defineProperty(navigator, 'maxTouchPoints', { value: 1, configurable: true });
		expect(isTouchDevice()).toBe(true);
	});

	it('returns false when window is undefined', () => {
		const originalWindow = globalThis.window;
		// @ts-expect-error — simulating SSR
		delete globalThis.window;
		expect(isTouchDevice()).toBe(false);
		globalThis.window = originalWindow;
	});
});
