import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createDrawScrub } from './createDrawScrub.js';
import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';

vi.mock('@yesid/motion/stores/reducedMotion', async (importOriginal) => {
	const mod = (await importOriginal()) as typeof import('@yesid/motion/stores/reducedMotion');
	return {
		...mod,
		isPrefersReducedMotion: vi.fn(() => false),
	};
});

describe('motion/scrubs/createDrawScrub', () => {
	let svg: SVGSVGElement;
	let section: HTMLElement;

	beforeEach(() => {
		ScrollTrigger.getAll().forEach((st) => st.kill());
		vi.clearAllMocks();
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);

		svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		const p1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		p1.setAttribute('d', 'M0 0 L10 10');
		const p2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		p2.setAttribute('d', 'M10 10 L20 20');
		svg.append(p1, p2);

		section = document.createElement('section');
		document.body.append(section, svg);
	});

	afterEach(() => {
		ScrollTrigger.getAll().forEach((st) => st.kill());
		document.body.innerHTML = '';
	});

	it('returns a destroy function', () => {
		const destroy = createDrawScrub(svg, { section });
		expect(typeof destroy).toBe('function');
		destroy();
	});

	it('registers a ScrollTrigger on the given section with scrub: true', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createDrawScrub(svg, { section });
		expect(createSpy).toHaveBeenCalledTimes(1);
		const call = createSpy.mock.calls[0][0];
		expect(call.trigger).toBe(section);
		expect(call.scrub).toBe(true);
		destroy();
	});

	it('returns a no-op destroy when the svg has no matching paths', () => {
		const emptySvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		document.body.append(emptySvg);
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createDrawScrub(emptySvg, { section });
		expect(createSpy).not.toHaveBeenCalled();
		expect(() => destroy()).not.toThrow();
	});

	it('respects a custom pathSelector without throwing', () => {
		const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		g.setAttribute('data-draw', '');
		const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		path.setAttribute('d', 'M0 0 L5 5');
		g.append(path);
		svg.append(g);

		const destroy = createDrawScrub(svg, {
			section,
			pathSelector: '[data-draw] path',
		});
		expect(typeof destroy).toBe('function');
		destroy();
	});

	it('reduced-motion: skips ScrollTrigger, destroy is a no-op', () => {
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createDrawScrub(svg, { section });
		expect(createSpy).not.toHaveBeenCalled();
		expect(() => destroy()).not.toThrow();
	});

	it('destroy kills the registered ScrollTrigger without throwing', () => {
		const destroy = createDrawScrub(svg, { section });
		expect(() => destroy()).not.toThrow();
	});
});
