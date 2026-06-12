import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createHeroTimeline } from './createHeroTimeline.js';
import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

vi.mock('$lib/motion/stores/reducedMotion.js', async (importOriginal) => {
	const mod = (await importOriginal()) as typeof import('$lib/motion/stores/reducedMotion.js');
	return {
		...mod,
		isPrefersReducedMotion: vi.fn(() => false),
	};
});

/**
 * Build a minimal DOM that mirrors what HeroBanner + MetroNetwork render:
 *   pinContainer
 *     svgWrapper
 *       svg[data-testid=metro-network]
 *         .metro-line × 2   (stroke paths)
 *         .metro-station × 3 (one is .metro-berri)
 *         .metro-bg × 1
 *         .metro-label × 2
 *     heroTextContainer
 *       [data-hero-stagger=1..7]
 *       heroDot (svg)
 *     scrollPrompt
 */
interface TestRefs {
	pinContainer: HTMLDivElement;
	svgWrapper: HTMLDivElement;
	heroTextContainer: HTMLDivElement;
	heroDot: SVGSVGElement;
	scrollPrompt: HTMLParagraphElement;
}

function buildHeroDom(): TestRefs {
	const pinContainer = document.createElement('div');

	const svgWrapper = document.createElement('div');
	const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
	svg.setAttribute('data-testid', 'metro-network');

	const makePath = (cls: string) => {
		const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		p.setAttribute('d', 'M0 0 L10 10');
		p.classList.add(cls);
		return p;
	};

	svg.append(makePath('metro-line'));
	svg.append(makePath('metro-line'));
	svg.append(makePath('metro-station'));
	svg.append(makePath('metro-station'));
	const berri = makePath('metro-station');
	berri.classList.add('metro-berri');
	svg.append(berri);
	svg.append(makePath('metro-bg'));
	svg.append(makePath('metro-label'));
	svg.append(makePath('metro-label'));

	svgWrapper.append(svg);

	const heroTextContainer = document.createElement('div');
	for (let i = 1; i <= 7; i++) {
		const el = document.createElement('div');
		el.setAttribute('data-hero-stagger', String(i));
		heroTextContainer.append(el);
	}
	const heroDot = document.createElementNS('http://www.w3.org/2000/svg', 'svg') as SVGSVGElement;
	heroDot.classList.add('hero-dot');
	heroTextContainer.append(heroDot);

	const scrollPrompt = document.createElement('p');

	pinContainer.append(svgWrapper, heroTextContainer, scrollPrompt);
	document.body.append(pinContainer);

	return { pinContainer, svgWrapper, heroTextContainer, heroDot, scrollPrompt };
}

describe('motion/scrubs/createHeroTimeline', () => {
	let refs: TestRefs;

	beforeEach(() => {
		ScrollTrigger.getAll().forEach((st) => st.kill());
		vi.clearAllMocks();
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false);
		refs = buildHeroDom();
	});

	afterEach(() => {
		ScrollTrigger.getAll().forEach((st) => st.kill());
		document.body.innerHTML = '';
	});

	it('returns a destroy function', () => {
		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
		});
		expect(typeof destroy).toBe('function');
		destroy();
	});

	it('registers a ScrollTrigger with pin on the container', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
		});
		expect(createSpy).toHaveBeenCalled();
		const pinCall = createSpy.mock.calls.find((c) => c[0].pin !== undefined);
		expect(pinCall, 'no ScrollTrigger with pin option registered').toBeDefined();
		expect(pinCall![0].pin).toBe(true);
		expect(pinCall![0].trigger).toBe(refs.pinContainer);
		destroy();
	});

	it('destroy kills registered ScrollTriggers without throwing', () => {
		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
		});
		expect(() => destroy()).not.toThrow();
	});

	it('reduced-motion: skips ScrollTrigger and renders a static state', () => {
		(isPrefersReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true);
		const createSpy = vi.spyOn(ScrollTrigger, 'create');

		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
		});

		expect(createSpy).not.toHaveBeenCalled();
		// Reduced-motion static preview: heroTextContainer becomes visible at scale=1
		expect(refs.heroTextContainer.style.opacity).toBe('1');
		expect(() => destroy()).not.toThrow();
	});

	it('accepts a custom pinLength option', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
			pinLength: '300%',
		});
		const pinCall = createSpy.mock.calls.find((c) => c[0].pin !== undefined);
		expect(pinCall!).toBeDefined();
		expect(pinCall![0].end).toBe('+=300%');
		destroy();
	});

	// go2/w5: the STM/REM legend (HTML overlay inside the pin container)
	// fades in with the Phase 4 labels — by the end of the scrub it must be
	// fully readable.
	it('fades the .metro-legend overlay in with the labels', () => {
		const legend = document.createElement('div');
		legend.classList.add('metro-legend');
		refs.pinContainer.append(legend);

		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
		});
		const pinCall = createSpy.mock.calls.find((c) => c[0].pin !== undefined);
		// gsap is mocked in the dom tier (setup.dom.ts) — assert through the
		// mock timeline's call record: a `.to()` targeting the legend, to full
		// opacity (informative text, AA — unlike the 0.6 decorative labels),
		// at the Phase 4 label slot (0.58).
		const tl = pinCall![0].animation as unknown as { to: ReturnType<typeof vi.fn> };
		const legendCall = tl.to.mock.calls.find((c) => {
			const targets = c[0] as Element | ArrayLike<Element>;
			if (targets === legend) return true;
			return (
				typeof (targets as ArrayLike<Element>).length === 'number' &&
				Array.from(targets as ArrayLike<Element>).includes(legend)
			);
		});
		expect(legendCall, 'no tween targets the .metro-legend overlay').toBeDefined();
		expect(legendCall![1].opacity).toBe(1);
		expect(legendCall![2]).toBe(0.58);
		destroy();
	});

	// go2/w5: the replayable-intro persistence hook. The ScrollTrigger's
	// onUpdate drives it: crossing ~the end of the scrub fires the callback
	// exactly once (HeroBanner persists the day-key there).
	it('fires onIntroComplete once when scrub progress reaches the end', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const onIntroComplete = vi.fn();
		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
			onIntroComplete,
		});
		const pinCall = createSpy.mock.calls.find((c) => c[0].pin !== undefined);
		const onUpdate = pinCall![0].onUpdate as (self: {
			progress: number;
			direction: number;
		}) => void;

		onUpdate({ progress: 0.5, direction: 1 });
		expect(onIntroComplete).not.toHaveBeenCalled();

		onUpdate({ progress: 0.999, direction: 1 });
		expect(onIntroComplete).toHaveBeenCalledTimes(1);

		// Re-crossing the threshold (replay) does not re-fire.
		onUpdate({ progress: 0.2, direction: -1 });
		onUpdate({ progress: 1, direction: 1 });
		expect(onIntroComplete).toHaveBeenCalledTimes(1);
		destroy();
	});

	it('omitting onIntroComplete keeps onUpdate safe at full progress', () => {
		const createSpy = vi.spyOn(ScrollTrigger, 'create');
		const destroy = createHeroTimeline(refs.pinContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
		});
		const pinCall = createSpy.mock.calls.find((c) => c[0].pin !== undefined);
		const onUpdate = pinCall![0].onUpdate as (self: {
			progress: number;
			direction: number;
		}) => void;
		expect(() => onUpdate({ progress: 1, direction: 1 })).not.toThrow();
		destroy();
	});

	it('returns a no-op destroy when the container has no metro network SVG', () => {
		const bareContainer = document.createElement('div');
		document.body.append(bareContainer);
		const createSpy = vi.spyOn(ScrollTrigger, 'create');

		const destroy = createHeroTimeline(bareContainer, {
			svgWrapper: refs.svgWrapper,
			heroTextContainer: refs.heroTextContainer,
			heroDot: refs.heroDot,
			scrollPrompt: refs.scrollPrompt,
			startBlink: () => {},
			stopBlink: () => {},
		});
		expect(createSpy).not.toHaveBeenCalled();
		expect(() => destroy()).not.toThrow();
	});
});
