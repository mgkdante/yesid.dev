/**
 * heroTimeline — Build the complete hero scroll-driven timeline.
 * Pure functions with explicit DOM ref params. No Svelte state.
 */
import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';

export interface HeroTimelineRefs {
	pinContainer: HTMLDivElement;
	svgWrapper: HTMLDivElement;
	heroTextContainer: HTMLDivElement;
	heroDot: SVGSVGElement;
	scrollPrompt: HTMLParagraphElement;
}

export interface HeroTimelineCallbacks {
	startBlink: () => void;
	stopBlink: () => void;
}

// ---- Measurement utilities ----

/** Calculate Berri-UQAM position relative to svgWrapper for transform-origin */
export function updateZoomOrigin(pinContainer: HTMLElement, svgWrapper: HTMLElement): void {
	const berri = pinContainer.querySelector('.metro-berri');
	if (!berri) return;
	const berriRect = berri.getBoundingClientRect();
	const wrapperRect = svgWrapper.getBoundingClientRect();
	const berriCenterX = berriRect.x + berriRect.width / 2 - wrapperRect.x;
	const berriCenterY = berriRect.y + berriRect.height / 2 - wrapperRect.y;
	const pctX = (berriCenterX / wrapperRect.width) * 100;
	const pctY = (berriCenterY / wrapperRect.height) * 100;
	svgWrapper.style.transformOrigin = `${pctX}% ${pctY}%`;
}

/**
 * The dot is an inline SVG circle — its getBoundingClientRect gives
 * the exact geometric center with zero measurement error.
 */
export function getDotGlyphCenter(heroDot: SVGSVGElement): { x: number; y: number; size: number } {
	const rect = heroDot.getBoundingClientRect();
	return {
		x: rect.x + rect.width / 2,
		y: rect.y + rect.height / 2,
		size: Math.max(rect.width, rect.height),
	};
}

export function calcHeroTextScale(heroDot: SVGSVGElement): number {
	const glyph = getDotGlyphCenter(heroDot);
	const screen = Math.max(window.innerWidth, window.innerHeight);
	if (glyph.size === 0) return 250;
	// 2.5x headroom covers mobile browser chrome hide/show (lvh vs svh gap)
	return Math.ceil((screen / glyph.size) * 2.5);
}

export function calcZoomScale(pinContainer: HTMLElement): number {
	const berri = pinContainer.querySelector('.metro-berri');
	if (!berri) return 100;
	const rect = berri.getBoundingClientRect();
	const screen = Math.max(window.innerWidth, window.innerHeight);
	const node = Math.max(rect.width, rect.height);
	return Math.ceil((screen / node) * 2.5);
}

export function updateHeroTextOrigin(heroDot: SVGSVGElement, heroTextContainer: HTMLElement): void {
	const glyph = getDotGlyphCenter(heroDot);
	const containerRect = heroTextContainer.getBoundingClientRect();
	const pctX = ((glyph.x - containerRect.x) / containerRect.width) * 100;
	const pctY = ((glyph.y - containerRect.y) / containerRect.height) * 100;
	heroTextContainer.style.transformOrigin = `${pctX}% ${pctY}%`;
}

// ---- Timeline builder ----

/**
 * Build the complete hero scroll-driven timeline.
 * Called by gsap.matchMedia() — once per breakpoint match.
 * All GSAP objects created here are auto-reverted by matchMedia on breakpoint exit.
 */
export function buildHeroTimeline(refs: HeroTimelineRefs, callbacks: HeroTimelineCallbacks): void {
	const { pinContainer, svgWrapper, heroTextContainer, heroDot, scrollPrompt } = refs;
	const { startBlink, stopBlink } = callbacks;

	const svg = pinContainer.querySelector('[data-testid="metro-network"]');
	if (!svg) return;

	const lines = svg.querySelectorAll('.metro-line');
	const stations = svg.querySelectorAll('.metro-station:not(.metro-berri)');
	const berri = svg.querySelector('.metro-berri');
	const bg = svg.querySelectorAll('.metro-bg');
	const labels = svg.querySelectorAll('.metro-label');
	if (!berri) return;

	// Show Berri-UQAM dot immediately
	(berri as HTMLElement).style.opacity = '1';

	// Measure origins BEFORE applying scale — matchMedia reverts all styles
	// before calling this, so heroTextContainer is at natural scale=1.
	updateZoomOrigin(pinContainer, svgWrapper);
	updateHeroTextOrigin(heroDot, heroTextContainer);

	// All text elements start invisible
	const staggerEls = heroTextContainer.querySelectorAll('[data-hero-stagger]');
	gsap.set(staggerEls, { opacity: 0 });

	// Refresh button starts slightly below for fade-up entrance
	const refreshEl = heroTextContainer.querySelector('[data-hero-stagger="7"]');
	if (refreshEl) gsap.set(refreshEl, { y: 12 });

	// Set initial hero text scale — use gsap.set so matchMedia can revert
	gsap.set(heroTextContainer, { scale: calcHeroTextScale(heroDot) });

	const tl = gsap.timeline();

	// === Phase 1 (0-3%): Berri-UQAM + background appear ===
	tl.to(berri, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);
	tl.to(bg, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);

	// === Phase 1b (3-15%): Light on/off pulse ===
	tl.to(berri, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
	tl.to(scrollPrompt, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
	tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
	tl.to(berri, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
	tl.to(scrollPrompt, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.10);
	tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.10);
	tl.to(berri, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
	tl.to(scrollPrompt, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);
	tl.to(scrollPrompt, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);

	// === Phase 2 (17-45%): "SCROLL DOWN" fades out, lines draw ===
	tl.to(scrollPrompt, { opacity: 0, duration: 0.04, ease: 'power2.in' }, 0.17);
	lines.forEach((line, i) => {
		const stagger = i * 0.02;
		tl.set(line, { opacity: 1 }, 0.17 + stagger);
		tl.fromTo(line,
			{ drawSVG: '0%' },
			{ drawSVG: '100%', duration: 0.22, ease: 'networkDraw' },
			0.17 + stagger
		);
	});

	// === Phase 3 (47-58%): Station nodes appear ===
	tl.to(stations, {
		opacity: 1, duration: 0.08, stagger: 0.002, ease: 'power1.out'
	}, 0.47);

	// === Phase 4 (58-65%): Labels fade in ===
	tl.to(labels, {
		opacity: 0.6, duration: 0.07, stagger: 0.001, ease: 'power1.out'
	}, 0.58);

	// === Phase 5 (65-95%): Zoom into Berri-UQAM ===
	tl.to(svgWrapper, {
		scale: () => { updateZoomOrigin(pinContainer, svgWrapper); return calcZoomScale(pinContainer); },
		duration: 0.3,
		ease: 'power2.inOut',
	}, 0.65);

	// === Phase 6: Cross-fade SVG → hero text container ===
	tl.to(svgWrapper, { opacity: 0, duration: 0.05, ease: 'power2.inOut' }, 1.0);
	tl.to(heroTextContainer, { opacity: 1, duration: 0.05, ease: 'power2.inOut' }, 1.0);

	// === Phase 7: Zoom out hero text container to scale=1 ===
	tl.to(heroTextContainer, {
		scale: () => { updateHeroTextOrigin(heroDot, heroTextContainer); return 1; },
		duration: 0.35,
		ease: 'power2.out',
	}, 1.05);

	// === Phase 8: Text elements stagger in during zoom-out ===
	const s1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]');
	const s2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]');
	const s3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]');
	const s4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]');
	const s5 = heroTextContainer.querySelectorAll('[data-hero-stagger="5"]');
	const s6 = heroTextContainer.querySelectorAll('[data-hero-stagger="6"]');
	const s7 = heroTextContainer.querySelectorAll('[data-hero-stagger="7"]');

	tl.to(s1, { opacity: 1, duration: 0.15, stagger: 0.02, ease: 'power1.out' }, 1.10);
	tl.to(s2, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.18);
	tl.to(s3, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.22);
	tl.to(s4, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.26);
	tl.to(s5, { opacity: 1, duration: 0.10, ease: 'power1.out' }, 1.30);
	tl.to(s6, { opacity: 1, duration: 0.10, stagger: 0.02, ease: 'power1.out' }, 1.32);
	tl.to(s7, { opacity: 1, y: 0, duration: 0.10, ease: 'power1.out' }, 1.38);

	// === Phase 9: Brief hold — let user read headline before unpin ===
	tl.set({}, {}, 1.55);

	// matchMedia rebuilds happen after typing — always allow blink restart
	const typingDone = true;

	// Desktop (Lenis): scrub: true = 1:1 tracking, Lenis provides smoothing.
	// Mobile (normalizeScroll): scrub: 0.5 = small buffer for stable touch feel.
	const isTouch = ScrollTrigger.isTouch > 0;

	ScrollTrigger.create({
		trigger: pinContainer,
		start: 'top top',
		end: '+=800%',
		pin: true,
		scrub: isTouch ? 0.5 : true,
		animation: tl,
		invalidateOnRefresh: true,
		onUpdate: (self: { progress: number; direction: number }) => {
			if (self.progress > 0.005) {
				stopBlink();
			} else if (self.progress <= 0.005 && self.direction === -1 && typingDone) {
				startBlink();
			}
		},
	});

	// Force-sync timeline to current scroll position
	requestAnimationFrame(() => {
		ScrollTrigger.refresh();
	});
}
