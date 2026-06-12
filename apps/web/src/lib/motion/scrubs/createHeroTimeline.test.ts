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

	// go2/w5 taste-2: the metro caption (ONE small line naming the art at the
	// wrapper's bottom strip — the in-frame legend is gone) fades in with the
	// Phase 4 labels — by the end of the scrub it must be fully readable.
	it('fades the .metro-caption overlay in with the labels', () => {
		const caption = document.createElement('p');
		caption.classList.add('metro-caption');
		refs.pinContainer.append(caption);

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
		// mock timeline's call record: a `.to()` targeting the caption, to full
		// opacity (informative text, AA — unlike the 0.6 decorative labels),
		// at the Phase 4 label slot (0.58).
		const tl = pinCall![0].animation as unknown as { to: ReturnType<typeof vi.fn> };
		const captionCall = tl.to.mock.calls.find((c) => {
			const targets = c[0] as Element | ArrayLike<Element>;
			if (targets === caption) return true;
			return (
				typeof (targets as ArrayLike<Element>).length === 'number' &&
				Array.from(targets as ArrayLike<Element>).includes(caption)
			);
		});
		expect(captionCall, 'no tween targets the .metro-caption overlay').toBeDefined();
		expect(captionCall![1].opacity).toBe(1);
		expect(captionCall![2]).toBe(0.58);
		destroy();
	});

	// go2/w5 taste-2: the Phase 6 hero-text cross-fade must be an explicit
	// fromTo(0→1, immediateRender:false). The replay path first renders a
	// freshly rebuilt timeline at the END of the track while a temporary
	// inline opacity:1 shield keeps the settled text painted — a lazy .to()
	// would capture that shield as its start and the cross-fade would
	// degenerate to 1→1 on rewind.
	it('cross-fades the hero text container via shield-proof fromTo at Phase 6', () => {
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
		const tl = pinCall![0].animation as unknown as { fromTo: ReturnType<typeof vi.fn> };
		const fadeCall = tl.fromTo.mock.calls.find((c) => c[0] === refs.heroTextContainer);
		expect(fadeCall, 'no fromTo targets the hero text container').toBeDefined();
		expect(fadeCall![1].opacity).toBe(0);
		expect(fadeCall![2].opacity).toBe(1);
		expect(fadeCall![2].immediateRender).toBe(false);
		expect(fadeCall![3]).toBe(1.0);
		destroy();
	});

	// go2/w5 taste-2: the replayable-intro persistence hook with ARMED-
	// CROSSING semantics. A genuine below-threshold render arms the latch and
	// crossing into the end fires it; a first render already AT the end stays
	// silent (the replay path jumps a rebuilt pin straight to its end — that
	// must never read as a completion); a rewind below the threshold re-arms
	// so a replayed completion fires again (the collapse re-applies).
	it('fires onIntroComplete on armed end-crossings only', () => {
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

		// First render already at the end (the replay jump): silent.
		onUpdate({ progress: 1, direction: 1 });
		expect(onIntroComplete).not.toHaveBeenCalled();

		// Genuine pass: a below-threshold render arms, the crossing fires.
		onUpdate({ progress: 0.5, direction: 1 });
		expect(onIntroComplete).not.toHaveBeenCalled();
		onUpdate({ progress: 0.999, direction: 1 });
		expect(onIntroComplete).toHaveBeenCalledTimes(1);

		// Holding at the end does not re-fire.
		onUpdate({ progress: 1, direction: 1 });
		expect(onIntroComplete).toHaveBeenCalledTimes(1);

		// Rewind re-arms; the replayed completion fires again.
		onUpdate({ progress: 0.2, direction: -1 });
		onUpdate({ progress: 1, direction: 1 });
		expect(onIntroComplete).toHaveBeenCalledTimes(2);
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
