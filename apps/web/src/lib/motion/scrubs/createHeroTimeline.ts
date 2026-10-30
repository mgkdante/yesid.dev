// Synchronous pinned hero timeline; callers preload DrawSVG and CustomEase before construction.

import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
import { gsap, ScrollTrigger } from '@yesid/motion/utils/gsap';
// CustomEase imported directly — plugin is runtime-registered by loadCustomEase()
// at HeroBanner mount; this import only provides the symbol for CustomEase.create().
import { CustomEase } from 'gsap/CustomEase';

export interface HeroTimelineOpts {

	svgWrapper: HTMLElement;
	/** Hero text + SQL panel container — initially scaled up, zooms back to 1. */
	heroTextContainer: HTMLElement;
	/** Inline SVG dot inside heroTextContainer — provides zoom transform-origin. */
	heroDot: SVGSVGElement;

	scrollPrompt: HTMLElement;
	/** Typewriter blink restart callback (onUpdate progress <= 0.005). */
	startBlink: () => void;
	/** Typewriter blink stop callback (onUpdate progress > 0.005). */
	stopBlink: () => void;
	/** Pin length as a GSAP-compatible percent string. Default '800%'. Mobile callers pass '300%'. */
	pinLength?: string;
	/* Replay refreshes before rewinding; a deferred refresh would cancel native smooth scrolling. */
	skipDeferredRefresh?: boolean;
	/* Complete only when crossing the pin end from below; first rendering at the end must stay silent. */
	onIntroComplete?: () => void;
	/** The final small-scale approach may resume the dot heartbeat before release. */
	onHeroApproach?: (approaching: boolean) => void;
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

/**
 * Ensure the Berri-UQAM zoom target is tagged `.metro-berri`. MetroNetwork tags
 * it at mount (the biggest `#E07800` station, found via getBBox), but getBBox
 * returns a ZERO box when the metro is `display:none` at that instant — exactly
 * the case on a same-day reload, where the hero paints collapsed (the wrapper is
 * hidden) before MetroNetwork measures, so `.metro-berri` is never applied. This
 * factory only ever runs with the metro visible (first visit, or a replay after
 * the track re-enlarges), so re-derive + tag Berri here when it is missing —
 * otherwise the `!berri` guard below would silently build NO pin and the dot
 * replay would do nothing. The `.metro-station` set is tagged by fill colour, so
 * it is reliable even when the reload classification ran while hidden.
 */
function ensureBerriTagged(svg: Element): void {
	if (svg.querySelector('.metro-berri')) return;
	let biggest: Element | null = null;
	let biggestSize = 0;
	svg.querySelectorAll('.metro-station').forEach((station) => {
		try {
			const bbox = (station as SVGGraphicsElement).getBBox();
			const size = bbox.width * bbox.height;
			if (size > biggestSize) {
				biggestSize = size;
				biggest = station;
			}
		} catch {
			/* not measurable yet — skip; the !berri guard still handles a total miss */
		}
	});
	if (biggest) (biggest as Element).classList.add('metro-berri');
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
		onHeroApproach,
		skipDeferredRefresh = false,
	} = opts;

	const svg = pinContainer.querySelector('[data-testid="metro-network"]');
	if (!svg) {
		// SVG hasn't mounted yet (or this container isn't the hero) — no-op.
		return () => {};
	}

	// A same-day reload paints the hero collapsed, so MetroNetwork may have
	// classified the metro while it was display:none and failed to tag Berri
	// (getBBox → 0). The metro is visible by the time we build the timeline, so
	// re-tag it here if needed — otherwise the `!berri` guard below no-ops the
	// whole pin and the replay does nothing.
	ensureBerriTagged(svg);

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

	(berri as HTMLElement).style.opacity = '1';

	CustomEase.create('networkDraw', 'M0,0 C0.2,0.6 0.4,1 1,1');

	// Measure origins BEFORE applying scale — HeroBanner reverts transforms
	// before calling this, so heroTextContainer is at natural scale=1.
	updateZoomOrigin(pinContainer, svgWrapper);
	updateHeroTextOrigin(heroDot, heroTextContainer);

	const staggerEls = heroTextContainer.querySelectorAll('[data-hero-stagger]');
	gsap.set(staggerEls, { opacity: 0 });
	const refreshEl = heroTextContainer.querySelector('[data-hero-stagger="7"]');
	if (refreshEl) gsap.set(refreshEl, { y: 12 });

	// Initial hero text scale — uses gsap.set so the ScrollTrigger can revert it.
	gsap.set(heroTextContainer, { scale: calcHeroTextScale(heroDot) });

	let introCompleteArmed = false;
	const tl = gsap.timeline({
		onUpdate: () => onHeroApproach?.(introCompleteArmed && tl.time() >= 1.36),
	});

	tl.to(berri, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);
	tl.to(bg, { opacity: 1, duration: 0.03, ease: 'power2.out' }, 0);

	// Hide the billboard promptly while its typewriter continues off-screen.
	tl.to(scrollPrompt, { opacity: 0, duration: 0.01, ease: 'power2.in' }, 0.005);

	tl.to(berri, { opacity: 0.2, duration: 0.02, ease: 'power1.out' }, 0.03);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.05);
	tl.to(berri, { opacity: 0.15, duration: 0.02, ease: 'power1.out' }, 0.08);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.1);
	tl.to(berri, { opacity: 0.1, duration: 0.02, ease: 'power1.out' }, 0.13);
	tl.to(berri, { opacity: 1, duration: 0.02, ease: 'power1.in' }, 0.15);

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

	tl.to(
		stations,
		{ opacity: 1, duration: 0.08, stagger: 0.002, ease: 'power1.out' },
		0.47,
	);

	tl.to(
		labels,
		{ opacity: 0.6, duration: 0.07, stagger: 0.001, ease: 'power1.out' },
		0.58,
	);

	// The caption is informative text and needs full opacity, unlike decorative station labels.
	const caption = pinContainer.querySelectorAll('.metro-caption');
	if (caption.length > 0) {
		tl.to(caption, { opacity: 1, duration: 0.07, ease: 'power1.out' }, 0.58);
	}

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

	tl.to(svgWrapper, { opacity: 0, duration: 0.05, ease: 'power2.inOut' }, 1.0);
	// An explicit start avoids capturing the replay opacity shield; defer rendering until the cross-fade begins.
	tl.fromTo(
		heroTextContainer,
		{ opacity: 0 },
		{ opacity: 1, duration: 0.05, ease: 'power2.inOut', immediateRender: false },
		1.0,
	);

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
	tl.to(s6, { opacity: 1, duration: 0.1, stagger: 0.02, ease: 'power1.out' }, 1.28);
	tl.to(s7, { opacity: 1, y: 0, duration: 0.1, ease: 'power1.out' }, 1.30);

	// Desktop (Lenis): scrub:true = 1:1 tracking, Lenis provides smoothing.
	// Mobile (native touch): scrub:0.5 = small buffer for stable touch feel.
	const isTouch = ScrollTrigger.isTouch > 0;

	// A first render at the end must not complete; crossing from below arms completion and rewind re-arms it.
	function finishIntro(self: { progress: number }): void {
		if (self.progress === 1 && introCompleteArmed) {
			introCompleteArmed = false;
			onIntroComplete?.();
		}
	}

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
			if (self.progress < 1) {
				introCompleteArmed = true;
			} else if (!isTouch) {
				finishIntro(self);
			}
		},
		onScrubComplete: finishIntro,
	});

	// Force-sync timeline to current scroll position after layout settles.
	// Skipped for the replay rebuild — see skipDeferredRefresh docs above.
	if (!skipDeferredRefresh) {
		requestAnimationFrame(() => {
			ScrollTrigger.refresh();
		});
	}

	return () => {
		st.kill();
		tl.kill();
	};
}
