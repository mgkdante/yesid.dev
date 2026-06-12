// Hero timeline scroll-scrub factory — the site's only pinned scroll-scrub.
//
// Composes ScrollTrigger + pin + DrawSVG stroke-scrub + station/label fades +
// Phase 5 Berri-UQAM zoom + Phase 6 cross-fade + Phase 7 hero text zoom-out
// into a single self-contained factory. Does NOT delegate to createDrawScrub —
// the hero's multi-phase choreography is specialized and composes GSAP
// primitives directly (design spec §4.3).
//
// Phase map (normalized timeline 0–1.55):
//   Phase 1  (0–0.03):     Berri + background appear
//   Phase 1b (0.03–0.15):  Light on/off pulse on Berri + scrollPrompt
//   Phase 2  (0.17–0.45):  SCROLL DOWN fades out, lines drawSVG 0% → 100%
//   Phase 3  (0.47–0.58):  Station nodes stagger-fade in
//   Phase 4  (0.58–0.65):  Labels stagger-fade in
//   Phase 5  (0.65–0.95):  Zoom svgWrapper to Berri-UQAM
//   Phase 6  (1.00–1.05):  Cross-fade svgWrapper out / heroTextContainer in
//   Phase 7  (1.05–1.40):  Zoom heroTextContainer back to scale=1
//   Phase 8  (1.10–1.48):  Hero text elements stagger in
//   Phase 9  (1.55):       Brief hold before unpin
//
// Precondition: caller must `await loadDrawSVG()` + `await loadCustomEase()`
// at route setup before invoking. Factory is synchronous.
//
// Reduced-motion: SVG network dimmed to 0.2 opacity, heroTextContainer
// snapped to scale=1 + opacity=1; no ScrollTrigger is created; destroy is
// a no-op.
//
// Mobile branch: pinLength compressed to '300%' (vs '800%' desktop). Full
// network + Phase 5 zoom preserved — see design spec §5.1.
//
// Usage:
//   import { loadDrawSVG, loadCustomEase } from '$lib/motion/utils/gsap.js';
//   import { createHeroTimeline } from '$lib/motion/scrubs/index.js';
//   onMount(async () => {
//     await Promise.all([loadDrawSVG(), loadCustomEase()]);
//     const isMobile = window.matchMedia('(max-width: 1023px)').matches;
//     destroy = createHeroTimeline(pinContainer, {
//       svgWrapper, heroTextContainer, heroDot, scrollPrompt,
//       startBlink: typewriter.startBlink,
//       stopBlink: typewriter.stopBlink,
//       pinLength: isMobile ? '300%' : '800%',
//     });
//   });
//   onDestroy(() => destroy?.());

import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
// CustomEase imported directly — plugin is runtime-registered by loadCustomEase()
// at HeroBanner mount; this import only provides the symbol for CustomEase.create().
import { CustomEase } from 'gsap/CustomEase';

export interface HeroTimelineOpts {
	/** Wrapper around the metro SVG — receives the Phase 5 zoom transform. */
	svgWrapper: HTMLElement;
	/** Hero text + SQL panel container — initially scaled up, zooms back to 1. */
	heroTextContainer: HTMLElement;
	/** Inline SVG dot inside heroTextContainer — provides zoom transform-origin. */
	heroDot: SVGSVGElement;
	/** NEXT STOP: SCROLL DOWN billboard — fades out in Phase 2. */
	scrollPrompt: HTMLElement;
	/** Typewriter blink restart callback (onUpdate progress <= 0.005). */
	startBlink: () => void;
	/** Typewriter blink stop callback (onUpdate progress > 0.005). */
	stopBlink: () => void;
	/** Pin length as a GSAP-compatible percent string. Default '800%'. Mobile callers pass '300%'. */
	pinLength?: string;
	/**
	 * go2/w5 replayable intro: fired ONCE when the scrub progress first
	 * reaches the end of the pin (the visitor scrolled the intro through).
	 * HeroBanner persists the localStorage day-key here.
	 */
	onIntroComplete?: () => void;
}

// ---- Measurement utilities ----

function updateZoomOrigin(pinContainer: HTMLElement, svgWrapper: HTMLElement): void {
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

function getDotGlyphCenter(heroDot: SVGSVGElement): { x: number; y: number; size: number } {
	const rect = heroDot.getBoundingClientRect();
	return {
		x: rect.x + rect.width / 2,
		y: rect.y + rect.height / 2,
		size: Math.max(rect.width, rect.height),
	};
}

function calcHeroTextScale(heroDot: SVGSVGElement): number {
	const glyph = getDotGlyphCenter(heroDot);
	const screen = Math.max(window.innerWidth, window.innerHeight);
	if (glyph.size === 0) return 250;
	// 2.5x headroom covers mobile browser chrome hide/show (lvh vs svh gap)
	return Math.ceil((screen / glyph.size) * 2.5);
}

function calcZoomScale(pinContainer: HTMLElement): number {
	const berri = pinContainer.querySelector('.metro-berri');
	if (!berri) return 100;
	const rect = berri.getBoundingClientRect();
	const screen = Math.max(window.innerWidth, window.innerHeight);
	const node = Math.max(rect.width, rect.height);
	return Math.ceil((screen / node) * 2.5);
}

function updateHeroTextOrigin(heroDot: SVGSVGElement, heroTextContainer: HTMLElement): void {
	const glyph = getDotGlyphCenter(heroDot);
	const containerRect = heroTextContainer.getBoundingClientRect();
	const pctX = ((glyph.x - containerRect.x) / containerRect.width) * 100;
	const pctY = ((glyph.y - containerRect.y) / containerRect.height) * 100;
	heroTextContainer.style.transformOrigin = `${pctX}% ${pctY}%`;
}

// ---- Factory ----

/**
 * Build the hero's scroll-driven timeline: pin the container, draw the metro
 * lines, fade labels + stations, zoom to Berri-UQAM, cross-fade to the hero
 * text, zoom text back to scale=1, then release.
 *
 * **Precondition:** caller must `await loadDrawSVG()` + `await loadCustomEase()`
 * before invoking.
 */
export function createHeroTimeline(
	pinContainer: HTMLElement,
	opts: HeroTimelineOpts,
): () => void {
	const {
		svgWrapper,
		heroTextContainer,
		heroDot,
		scrollPrompt,
		startBlink,
		stopBlink,
		pinLength = '800%',
		onIntroComplete,
	} = opts;

	const svg = pinContainer.querySelector('[data-testid="metro-network"]');
	if (!svg) {
		// SVG hasn't mounted yet (or this container isn't the hero) — no-op.
		return () => {};
	}

	const lines = svg.querySelectorAll('.metro-line');
	const stations = svg.querySelectorAll('.metro-station:not(.metro-berri)');
	const berri = svg.querySelector('.metro-berri');
	const bg = svg.querySelectorAll('.metro-bg');
	const labels = svg.querySelectorAll('.metro-label');
	if (!berri) return () => {};

	// Reduced-motion static preview — matches the existing HeroBanner
	// reduced-motion branch so the hero is readable without scroll.
	if (isPrefersReducedMotion()) {
		svg.querySelectorAll(
			'.metro-line, .metro-station, .metro-bg, .metro-label, .metro-berri',
		).forEach((el) => {
			(el as HTMLElement).style.opacity = '0.2';
		});
		heroTextContainer.style.opacity = '1';
		heroTextContainer.style.transform = 'scale(1)';
		return () => {};
	}

	// Show Berri-UQAM dot immediately — Phase 1 starts from "dot already lit".
	(berri as HTMLElement).style.opacity = '1';

	// CustomEase used by Phase 2 line draws. Idempotent — safe to re-create.
	CustomEase.create('networkDraw', 'M0,0 C0.2,0.6 0.4,1 1,1');

	// Measure origins BEFORE applying scale — HeroBanner reverts transforms
	// before calling this, so heroTextContainer is at natural scale=1.
	updateZoomOrigin(pinContainer, svgWrapper);
	updateHeroTextOrigin(heroDot, heroTextContainer);

	// All text elements start invisible; the refresh button starts slightly
	// below for a fade-up entrance in Phase 8.
	const staggerEls = heroTextContainer.querySelectorAll('[data-hero-stagger]');
	gsap.set(staggerEls, { opacity: 0 });
	const refreshEl = heroTextContainer.querySelector('[data-hero-stagger="7"]');
	if (refreshEl) gsap.set(refreshEl, { y: 12 });

	// Initial hero text scale — uses gsap.set so the ScrollTrigger can revert it.
	gsap.set(heroTextContainer, { scale: calcHeroTextScale(heroDot) });

	const tl = gsap.timeline();

	// === Phase 1 (0–0.03): Berri + background appear ===
	tl.to(berri, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);
	tl.to(bg, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);

	// === Phase 1a (0.005–0.015): Snap-fade scrollPrompt out on first scroll ===
	// Pre-Snappy: scrollPrompt stayed visible through Phase 1b pulses (0.03–0.15)
	// and only faded in Phase 2 (0.17). That left the typewriter billboard on
	// screen for ~136vh of scroll. Now fades within ~8vh of scroll so the
	// typewriter animation keeps running but is no longer visible.
	tl.to(scrollPrompt, { opacity: 0, duration: 0.01, ease: 'power2.in' }, 0.005);

	// === Phase 1b (0.03–0.15): Light on/off pulse — berri only ===
	// scrollPrompt removed from this pulse; it's already hidden by Phase 1a on
	// any scroll > 0. The pulse still reads on berri as an "idle pre-scroll"
	// cue for users who haven't scrolled yet.
	tl.to(berri, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
	tl.to(berri, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.1);
	tl.to(berri, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);

	// === Phase 2 (0.17–0.45): Lines draw ===
	lines.forEach((line, i) => {
		const stagger = i * 0.02;
		tl.set(line, { opacity: 1 }, 0.17 + stagger);
		tl.fromTo(
			line,
			{ drawSVG: '0%' },
			{ drawSVG: '100%', duration: 0.22, ease: 'networkDraw' },
			0.17 + stagger,
		);
	});

	// === Phase 3 (0.47–0.58): Station nodes stagger in ===
	tl.to(
		stations,
		{ opacity: 1, duration: 0.08, stagger: 0.002, ease: 'power1.out' },
		0.47,
	);

	// === Phase 4 (0.58–0.65): Labels stagger in ===
	tl.to(
		labels,
		{ opacity: 0.6, duration: 0.07, stagger: 0.001, ease: 'power1.out' },
		0.58,
	);

	// go2/w5: the STM/REM legend (HTML overlay inside the metro frame) joins
	// the label fade — to full opacity, it is informative text (AA), unlike
	// the decorative 0.6-opacity station-name paths.
	const legend = pinContainer.querySelectorAll('.metro-legend');
	if (legend.length > 0) {
		tl.to(legend, { opacity: 1, duration: 0.07, ease: 'power1.out' }, 0.58);
	}

	// === Phase 5 (0.65–0.95): Zoom into Berri-UQAM ===
	tl.to(
		svgWrapper,
		{
			scale: () => {
				updateZoomOrigin(pinContainer, svgWrapper);
				return calcZoomScale(pinContainer);
			},
			duration: 0.3,
			ease: 'power2.inOut',
		},
		0.65,
	);

	// === Phase 6 (1.00–1.05): Cross-fade SVG → hero text container ===
	tl.to(svgWrapper, { opacity: 0, duration: 0.05, ease: 'power2.inOut' }, 1.0);
	tl.to(heroTextContainer, { opacity: 1, duration: 0.05, ease: 'power2.inOut' }, 1.0);

	// === Phase 7 (1.05–1.40): Zoom hero text container back to scale=1 ===
	tl.to(
		heroTextContainer,
		{
			scale: () => {
				updateHeroTextOrigin(heroDot, heroTextContainer);
				return 1;
			},
			duration: 0.35,
			ease: 'power2.out',
		},
		1.05,
	);

	// === Phase 8 (1.10–1.48): Hero text stagger in during zoom-out ===
	const s1 = heroTextContainer.querySelectorAll('[data-hero-stagger="1"]');
	const s2 = heroTextContainer.querySelectorAll('[data-hero-stagger="2"]');
	const s3 = heroTextContainer.querySelectorAll('[data-hero-stagger="3"]');
	const s4 = heroTextContainer.querySelectorAll('[data-hero-stagger="4"]');
	const s5 = heroTextContainer.querySelectorAll('[data-hero-stagger="5"]');
	const s6 = heroTextContainer.querySelectorAll('[data-hero-stagger="6"]');
	const s7 = heroTextContainer.querySelectorAll('[data-hero-stagger="7"]');

	tl.to(s1, { opacity: 1, duration: 0.15, stagger: 0.02, ease: 'power1.out' }, 1.1);
	tl.to(s2, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.18);
	tl.to(s3, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.22);
	tl.to(s4, { opacity: 1, duration: 0.12, ease: 'power1.out' }, 1.26);
	tl.to(s5, { opacity: 1, duration: 0.1, ease: 'power1.out' }, 1.3);
	tl.to(s6, { opacity: 1, duration: 0.1, stagger: 0.02, ease: 'power1.out' }, 1.32);
	tl.to(s7, { opacity: 1, y: 0, duration: 0.1, ease: 'power1.out' }, 1.38);

	// === Phase 9 (1.55): Brief hold before unpin ===
	tl.set({}, {}, 1.55);

	// Desktop (Lenis): scrub:true = 1:1 tracking, Lenis provides smoothing.
	// Mobile (native touch): scrub:0.5 = small buffer for stable touch feel.
	const isTouch = ScrollTrigger.isTouch > 0;

	// go2/w5: persist-once latch — the visitor "scrolled it through" when
	// progress first reaches the end of the pin (0.99 tolerates scrub
	// smoothing never emitting exactly 1).
	let introCompleteFired = false;

	const st = ScrollTrigger.create({
		trigger: pinContainer,
		start: 'top top',
		end: `+=${pinLength}`,
		pin: true,
		scrub: isTouch ? 0.5 : true,
		animation: tl,
		invalidateOnRefresh: true,
		onUpdate: (self: { progress: number; direction: number }) => {
			if (self.progress > 0.005) {
				stopBlink();
			} else if (self.progress <= 0.005 && self.direction === -1) {
				startBlink();
			}
			if (!introCompleteFired && self.progress >= 0.99) {
				introCompleteFired = true;
				onIntroComplete?.();
			}
		},
	});

	// Force-sync timeline to current scroll position after layout settles.
	requestAnimationFrame(() => {
		ScrollTrigger.refresh();
	});

	return () => {
		st.kill();
		tl.kill();
	};
}
