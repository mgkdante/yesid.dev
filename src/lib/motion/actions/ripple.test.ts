import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

describe('ripple action', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		// Stub rAF to execute immediately so the span's styles update synchronously.
		vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
			cb(0);
			return 0;
		});
		mockMatchMedia(false);
		vi.resetModules();
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it('returns update and destroy methods', async () => {
		const { ripple } = await import('./ripple.js');
		const el = document.createElement('button');
		const result = ripple(el);
		expect(typeof result.update).toBe('function');
		expect(typeof result.destroy).toBe('function');
	});

	it('sets position and overflow on the host element', async () => {
		const { ripple } = await import('./ripple.js');
		const el = document.createElement('button');
		ripple(el);
		expect(el.style.position).toBe('relative');
		expect(el.style.overflow).toBe('hidden');
	});

	it('appends a span child on click', async () => {
		const { ripple } = await import('./ripple.js');
		const el = document.createElement('button');
		document.body.appendChild(el);

		vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
			left: 0, top: 0, width: 120, height: 40,
			right: 120, bottom: 40, x: 0, y: 0, toJSON: () => ({})
		});

		ripple(el);
		el.dispatchEvent(new MouseEvent('click', { clientX: 60, clientY: 20 }));

		expect(el.querySelector('span')).not.toBeNull();
		document.body.removeChild(el);
	});

	it('removes the span after the duration', async () => {
		const { ripple } = await import('./ripple.js');
		const el = document.createElement('button');
		document.body.appendChild(el);

		vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
			left: 0, top: 0, width: 120, height: 40,
			right: 120, bottom: 40, x: 0, y: 0, toJSON: () => ({})
		});

		ripple(el, { duration: 400 });
		el.dispatchEvent(new MouseEvent('click', { clientX: 60, clientY: 20 }));

		vi.advanceTimersByTime(400);

		expect(el.querySelector('span')).toBeNull();
		document.body.removeChild(el);
	});

	it('does not append a span when reduced motion is on', async () => {
		mockMatchMedia(true);
		vi.resetModules();
		const { ripple } = await import('./ripple.js');
		const el = document.createElement('button');
		ripple(el);
		el.dispatchEvent(new MouseEvent('click', { clientX: 0, clientY: 0 }));
		expect(el.querySelector('span')).toBeNull();
	});

	it('uses the brand orange color by default', async () => {
		const { ripple } = await import('./ripple.js');
		const el = document.createElement('button');
		document.body.appendChild(el);

		vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
			left: 0, top: 0, width: 120, height: 40,
			right: 120, bottom: 40, x: 0, y: 0, toJSON: () => ({})
		});

		ripple(el);
		el.dispatchEvent(new MouseEvent('click', { clientX: 60, clientY: 20 }));

		const span = el.querySelector('span');
		// jsdom normalizes hex to rgb when reading computed values. Accept either form.
		const color = span?.style.backgroundColor ?? '';
		const isOrange = color.includes('#E07800') || color.includes('rgb(224, 120, 0)');
		expect(isOrange).toBe(true);
		document.body.removeChild(el);
	});
});
