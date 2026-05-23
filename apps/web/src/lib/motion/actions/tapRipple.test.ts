import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tapRipple } from './tapRipple';

const mockIsTouchDevice = vi.fn();
const mockIsPrefersReducedMotion = vi.fn();
vi.mock('$lib/motion/utils/device', () => ({
	isTouchDevice: () => mockIsTouchDevice(),
}));
vi.mock('$lib/motion/stores/reducedMotion', () => ({
	isPrefersReducedMotion: () => mockIsPrefersReducedMotion(),
}));

describe('tapRipple action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsTouchDevice.mockReturnValue(true);
		mockIsPrefersReducedMotion.mockReturnValue(false);
	});

	it('attaches pointerdown listener on touch device', () => {
		const el = document.createElement('button');
		const addSpy = vi.spyOn(el, 'addEventListener');
		tapRipple(el);
		expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
	});

	it('bails on non-touch device — returns destroy no-op', () => {
		mockIsTouchDevice.mockReturnValue(false);
		const el = document.createElement('button');
		const addSpy = vi.spyOn(el, 'addEventListener');
		const result = tapRipple(el);
		expect(addSpy).not.toHaveBeenCalled();
		// Always returns { destroy } for symmetry with sibling actions
		expect(typeof result.destroy).toBe('function');
		result.destroy(); // no-op, should not throw
	});

	it('bails on prefers-reduced-motion — returns destroy no-op', () => {
		mockIsPrefersReducedMotion.mockReturnValue(true);
		const el = document.createElement('button');
		const addSpy = vi.spyOn(el, 'addEventListener');
		const result = tapRipple(el);
		expect(addSpy).not.toHaveBeenCalled();
		expect(typeof result.destroy).toBe('function');
		result.destroy();
	});

	it('appends a ripple span on pointerdown and removes it after animation', async () => {
		const el = document.createElement('button');
		el.style.position = 'relative';
		el.style.overflow = 'hidden';
		document.body.appendChild(el);

		tapRipple(el);

		const event = new Event('pointerdown') as Event & { clientX: number; clientY: number };
		Object.defineProperty(event, 'clientX', { value: 10 });
		Object.defineProperty(event, 'clientY', { value: 10 });
		el.dispatchEvent(event);

		expect(el.querySelectorAll('.tap-ripple').length).toBeGreaterThan(0);

		await new Promise((r) => setTimeout(r, 600));
		expect(el.querySelectorAll('.tap-ripple').length).toBe(0);

		document.body.removeChild(el);
	});

	it('destroy() removes listener', () => {
		const el = document.createElement('button');
		const removeSpy = vi.spyOn(el, 'removeEventListener');
		const result = tapRipple(el);
		result.destroy();
		expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
	});
});
