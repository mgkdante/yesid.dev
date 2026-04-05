import { describe, it, expect, vi, beforeEach } from 'vitest';

// Helper: override matchMedia to control reduced-motion in tests
function mockMatchMedia(reducedMotion: boolean) {
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: (query: string) => ({
			matches: query.includes('reduced-motion') ? reducedMotion : false,
			media: query,
			addEventListener: vi.fn(),
			removeEventListener: vi.fn()
		})
	});
}

// Helper: override maxTouchPoints to simulate touch/non-touch
function mockTouchDevice(isTouch: boolean) {
	Object.defineProperty(navigator, 'maxTouchPoints', {
		writable: true,
		configurable: true,
		value: isTouch ? 1 : 0
	});
}

describe('tilt action', () => {
	beforeEach(() => {
		vi.resetModules();
		mockMatchMedia(false);
		mockTouchDevice(false);
	});

	async function loadTilt() {
		return (await import('./tilt.js')).tilt;
	}

	it('returns update and destroy functions', async () => {
		const tilt = await loadTilt();
		const node = document.createElement('div');
		const result = tilt(node);
		expect(typeof result.update).toBe('function');
		expect(typeof result.destroy).toBe('function');
	});

	it('applies 3D transform on mousemove', async () => {
		const tilt = await loadTilt();
		const node = document.createElement('div');
		// Give the element dimensions for getBoundingClientRect
		Object.defineProperty(node, 'getBoundingClientRect', {
			value: () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 })
		});

		tilt(node);

		// Simulate mousemove at element center-right (positive X offset)
		node.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }));

		expect(node.style.transform).toContain('perspective');
		expect(node.style.transform).toContain('rotateX');
		expect(node.style.transform).toContain('rotateY');
	});

	it('resets transform on mouseleave', async () => {
		const tilt = await loadTilt();
		const node = document.createElement('div');
		Object.defineProperty(node, 'getBoundingClientRect', {
			value: () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 })
		});

		tilt(node);

		// Apply tilt then leave
		node.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }));
		node.dispatchEvent(new MouseEvent('mouseleave'));

		expect(node.style.transform).toBe('');
	});

	it('clears transform on destroy', async () => {
		const tilt = await loadTilt();
		const node = document.createElement('div');
		Object.defineProperty(node, 'getBoundingClientRect', {
			value: () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 })
		});

		const result = tilt(node);
		node.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }));

		result.destroy();
		expect(node.style.transform).toBe('');
	});

	it('no-ops when prefers-reduced-motion is set', async () => {
		mockMatchMedia(true);
		vi.resetModules();
		const tilt = (await import('./tilt.js')).tilt;
		const node = document.createElement('div');
		Object.defineProperty(node, 'getBoundingClientRect', {
			value: () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 })
		});

		tilt(node);
		node.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }));

		// Transform should NOT be applied
		expect(node.style.transform).toBe('');
	});

	it('no-ops on touch devices', async () => {
		mockTouchDevice(true);
		vi.resetModules();
		const tilt = (await import('./tilt.js')).tilt;
		const node = document.createElement('div');
		Object.defineProperty(node, 'getBoundingClientRect', {
			value: () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 })
		});

		tilt(node);
		node.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 100 }));

		expect(node.style.transform).toBe('');
	});

	it('respects maxDeg parameter', async () => {
		const tilt = await loadTilt();
		const node = document.createElement('div');
		Object.defineProperty(node, 'getBoundingClientRect', {
			value: () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 })
		});

		// Max tilt of 5 degrees, cursor at far right edge → rotateY should be ~5
		tilt(node, { maxDeg: 5 });
		node.dispatchEvent(new MouseEvent('mousemove', { clientX: 200, clientY: 100 }));

		expect(node.style.transform).toContain('rotateY(5deg)');
	});

	it('dead zone: cursor at center produces no transform', async () => {
		const tilt = await loadTilt();
		const node = document.createElement('div');
		Object.defineProperty(node, 'getBoundingClientRect', {
			value: () => ({ left: 0, top: 0, width: 200, height: 200, right: 200, bottom: 200 })
		});

		tilt(node);

		// Cursor at exact center (100, 100) → normalized (0, 0) → inside dead zone
		node.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100 }));

		expect(node.style.transform).toBe('');
	});
});
