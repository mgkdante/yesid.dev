import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createCrescendoScrub } from './createCrescendoScrub.js';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

// Mock the reduced-motion helper so tests can flip the branch deterministically.
vi.mock('$lib/motion/stores/reducedMotion.js', async (importOriginal) => {
	const mod = (await importOriginal()) as typeof import('$lib/motion/stores/reducedMotion.js');
	return {
		...mod,
		isPrefersReducedMotion: vi.fn(() => false),
	};
});

describe('motion/scrubs/createCrescendoScrub', () => {
	let target: HTMLElement;
	let section: HTMLElement;

	beforeEach(() => {
		// Isolate ScrollTriggers and spy call counts between tests
		ScrollTrigger.getAll().forEach((st) => st.kill());
		vi.clearAllMocks();
		// Reset reduced-motion mock to default (false)
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);

		target = document.createElement('div');
		section = document.createElement('section');
		document.body.append(section, target);
	});

	afterEach(() => {
		ScrollTrigger.getAll().forEach((st) => st.kill());
		document.body.innerHTML = '';
	});

	it('returns a destroy function', () => {
		const destroy = createCrescendoScrub(target, { section });
		expect(typeof destroy).toBe('function');
		destroy();
	});

	it('registers a ScrollTrigger with the given section as trigger', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createCrescendoScrub(target, { section });
		expect(createSpy).toHaveBeenCalledTimes(1);
		const call = createSpy.mock.calls[0][0];
		expect(call.trigger).toBe(section);
		expect(call.scrub).toBe(true);
		destroy();
	});

	it('destroy kills the registered ScrollTrigger without throwing', () => {
		const destroy = createCrescendoScrub(target, { section });
		expect(() => destroy()).not.toThrow();
	});

	it('reduced-motion: sets target to maxScale and skips ScrollTrigger', () => {
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const createSpy = vi.spyOn(ScrollTrigger, 'create');

		const destroy = createCrescendoScrub(target, { section, maxScale: 1.4 });

		expect(createSpy).not.toHaveBeenCalled();
		// Slice-23 Task 4: scale is applied via the individual `scale` property
		// (not `transform: scale()`) to avoid disturbing sticky positioning.
		expect(target.style.scale).toBe('1.4');
		destroy(); // no-op
	});

	it('reduced-motion: destroy is a no-op that does not throw', () => {
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const destroy = createCrescendoScrub(target, { section });
		expect(() => destroy()).not.toThrow();
	});

	it('accepts custom minScale, maxScale, ease without throwing', () => {
		const destroy = createCrescendoScrub(target, {
			section,
			minScale: 0.5,
			maxScale: 1.5,
			ease: 'out',
		});
		destroy();
	});
});
