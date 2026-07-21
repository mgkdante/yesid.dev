import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { gsap } from '$lib/motion/utils/gsap.js';
import { backgroundBreathing } from './backgroundBreathing.js';
import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';

// Slice-23 Task 7. `backgroundBreathing` is a GSAP scrub factory that
// animates a CSS custom property `--breathing-phase` between 0 and 1
// over ~10s with `yoyo: true`. Consumers reference the var in background
// layers (e.g. gradient opacity) for subtle ambient motion. Returns
// `{ pause, resume, destroy }` so callers can mute breathing transiently
// (e.g. while a sectionGlow is active).

vi.mock('@yesid/motion/stores/reducedMotion', async (importOriginal) => {
	const mod = (await importOriginal()) as typeof import('@yesid/motion/stores/reducedMotion');
	return {
		...mod,
		isPrefersReducedMotion: vi.fn(() => false),
	};
});

describe('motion/scrubs/backgroundBreathing', () => {
	let node: HTMLElement;
	let toSpy: ReturnType<typeof vi.spyOn>;

	beforeEach(() => {
		node = document.createElement('div');
		document.body.appendChild(node);
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);
		toSpy = vi.spyOn(gsap, 'to');
	});

	afterEach(() => {
		toSpy.mockRestore();
		document.body.innerHTML = '';
		vi.clearAllMocks();
	});

	it('registers a gsap tween animating --breathing-phase 0 → 1 with yoyo', () => {
		const controls = backgroundBreathing(node);
		expect(toSpy).toHaveBeenCalledTimes(1);
		const [target, vars] = toSpy.mock.calls[0];
		expect(target).toBe(node);
		expect(vars).toMatchObject({
			'--breathing-phase': 1,
			duration: 10,
			repeat: -1,
			yoyo: true,
			ease: 'sine.inOut',
		});
		controls.destroy();
	});

	it('accepts a custom duration option', () => {
		const controls = backgroundBreathing(node, { duration: 8 });
		expect(toSpy.mock.calls[0][1]).toMatchObject({ duration: 8 });
		controls.destroy();
	});

	it('returns destroy / pause / resume functions', () => {
		const controls = backgroundBreathing(node);
		expect(typeof controls.destroy).toBe('function');
		expect(typeof controls.pause).toBe('function');
		expect(typeof controls.resume).toBe('function');
		controls.destroy();
	});

	it('pause + resume delegate to the underlying tween', () => {
		const fakeTween = {
			pause: vi.fn(),
			resume: vi.fn(),
			kill: vi.fn(),
		} as unknown as gsap.core.Tween;
		toSpy.mockReturnValueOnce(fakeTween);
		const controls = backgroundBreathing(node);
		controls.pause();
		expect(fakeTween.pause).toHaveBeenCalled();
		controls.resume();
		expect(fakeTween.resume).toHaveBeenCalled();
		controls.destroy();
		expect(fakeTween.kill).toHaveBeenCalled();
	});

	it('destroy clears the --breathing-phase CSS var on the node', () => {
		node.style.setProperty('--breathing-phase', '0.5');
		const controls = backgroundBreathing(node);
		controls.destroy();
		expect(node.style.getPropertyValue('--breathing-phase')).toBe('');
	});

	it('reduced-motion: skips tween creation, returns no-op controls', () => {
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const controls = backgroundBreathing(node);
		expect(toSpy).not.toHaveBeenCalled();
		// All three controls should be safe no-ops.
		expect(() => controls.pause()).not.toThrow();
		expect(() => controls.resume()).not.toThrow();
		expect(() => controls.destroy()).not.toThrow();
	});
});
