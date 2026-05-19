import { describe, it, expect, vi, beforeEach } from 'vitest';
import { pressBounce } from './pressBounce';

// Mock GSAP to assert calls without running animation
vi.mock('$lib/motion/utils/gsap', () => ({
	gsap: {
		to: vi.fn(),
		killTweensOf: vi.fn(),
	},
}));

// Mock device + reduced-motion
const mockIsTouchDevice = vi.fn();
const mockIsPrefersReducedMotion = vi.fn();
vi.mock('$lib/motion/utils/device', () => ({
	isTouchDevice: () => mockIsTouchDevice(),
}));
vi.mock('$lib/motion/stores/reducedMotion', () => ({
	isPrefersReducedMotion: () => mockIsPrefersReducedMotion(),
}));

describe('pressBounce action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockIsTouchDevice.mockReturnValue(true);
		mockIsPrefersReducedMotion.mockReturnValue(false);
	});

	it('attaches pointerdown + pointerup + pointercancel listeners on touch device', () => {
		const el = document.createElement('button');
		const addSpy = vi.spyOn(el, 'addEventListener');
		pressBounce(el);
		expect(addSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
		expect(addSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));
	});

	it('bails on non-touch device (no listeners attached)', () => {
		mockIsTouchDevice.mockReturnValue(false);
		const el = document.createElement('button');
		const addSpy = vi.spyOn(el, 'addEventListener');
		pressBounce(el);
		expect(addSpy).not.toHaveBeenCalled();
	});

	it('bails on prefers-reduced-motion (no listeners attached)', () => {
		mockIsPrefersReducedMotion.mockReturnValue(true);
		const el = document.createElement('button');
		const addSpy = vi.spyOn(el, 'addEventListener');
		pressBounce(el);
		expect(addSpy).not.toHaveBeenCalled();
	});

	it('destroy() removes listeners', () => {
		const el = document.createElement('button');
		const removeSpy = vi.spyOn(el, 'removeEventListener');
		const result = pressBounce(el);
		result?.destroy?.();
		expect(removeSpy).toHaveBeenCalledWith('pointerdown', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('pointerup', expect.any(Function));
		expect(removeSpy).toHaveBeenCalledWith('pointercancel', expect.any(Function));
	});
});
