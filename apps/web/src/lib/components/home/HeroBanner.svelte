<!--
  Hero banner: scroll-driven SVG metro network animation (Slice A + Slice C).
  Renders the home-page hero band; layered backdrop with the metro-network motion.
  The SVG arrives as the `metroSvg` prop via adapter.content.metroSvg — post-27.2
  the live static adapter inlines static/images/montreal-metro.svg at build time
  (no runtime Directus fetch).

  Phase 1 (0-3%)    — Berri-UQAM dot + "yesid" + "SCROLL DOWN" visible at load
  Phase 1b (3-15%)   — Dot + text pulse (light on/off, opacity)
  Phase 2 (17-45%)   — "yesid" + "SCROLL DOWN" fade out, lines draw outward
  Phase 3 (47-58%)   — Station nodes appear
  Phase 4 (58-65%)   — Labels fade in
  Phase 5 (65-95%)   — Zoom into Berri-UQAM (fills viewport with orange from the node itself)
  Phase 6 (100%)     — Cross-fade SVG out → hero text container in (both orange, seamless)
  Phase 7 (105-140%) — Zoom out hero text container (scale→1), revealing headline
  Phase 8 (110-142%) — Text elements stagger in during zoom-out
  Phase 9 (155%)     — Brief hold, then unpin — SQL panel visible on natural scroll

  Scroll: 800% desktop / 300% mobile. Lenis smooth-scroll site-wide (normalizeScroll removed 17e-1).
-->
<script lang="ts">
	import { onMount, onDestroy, tick, untrack } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import {
		initScrollTriggerConfig,
		loadDrawSVG,
		loadCustomEase,
		ScrollTrigger,
		gsap,
	} from '$lib/motion/utils/gsap.js';
	import { createHeroTimeline } from '$lib/motion/scrubs/index.js';
	import { createTypewriter } from '$lib/motion/utils/heroTypewriter.js';
	import { isViewportAtMost } from '$lib/motion/utils/device.js';
	import {
		forgetHeroIntroCompleted,
		isHeroIntroCompletedToday,
		markHeroIntroCompleted,
	} from '$lib/motion/utils/heroIntroReplay.js';
	import { getLenis } from '$lib/motion/utils/lenis.js';
	import { generateHeroData, siteLabels } from '$lib/content';
	import type { HeroData } from '$lib/content';
	import type { HeroContent, HeroAnimContent } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import MetroNetwork from '$lib/motion/svg/MetroNetwork.svelte';
	import HeroSqlPanel from './HeroSqlPanel.svelte';
	import HeroTextContent from './HeroTextContent.svelte';
	import HeroMobileSql from './HeroMobileSql.svelte';

	// slice-18i Phase 7C: all hero content now flows as props from +page.server.ts
	// → +page.svelte → HomePage → HeroBanner. No static imports for page content.
	interface Props {
		metroSvg: string;
		hero: HeroContent;
		heroAnim: HeroAnimContent;
		initialHeroData: HeroData;
	}
	let { metroSvg, hero: heroContent, heroAnim: heroAnimContent, initialHeroData: INITIAL_HERO_DATA }: Props = $props();

	let pinContainer: HTMLDivElement;
	let svgWrapper: HTMLDivElement;
	let scrollPrompt: HTMLParagraphElement;
	let scrollText: HTMLSpanElement;
	let scrollCursorEl: HTMLSpanElement;
	let reducedMotion = false;

	// $derived so these recompute if the hero props change: a plain const
	// captures only the initial prop value, which Svelte 5 flags
	// (state_referenced_locally).
	const scrollDownLabel = $derived(resolveLocale(heroAnimContent.scrollDown, locale));
	const headlineLine1 = $derived(resolveLocale(heroContent.headline.line1, locale));
	const headlineLine2 = $derived(resolveLocale(heroContent.headline.line2, locale));
	const subheadlineText = $derived(resolveLocale(heroContent.subheadline, locale));
	const subtitleText = $derived(resolveLocale(heroContent.subtitle, locale));
	const identityText = $derived(resolveLocale(heroContent.identity, locale));
	const ctaWorkLabel = $derived(resolveLocale(heroContent.ctaWork, locale));
	const ctaContactLabel = $derived(resolveLocale(heroContent.ctaContact, locale));
	const sqlPrompt = $derived(resolveLocale(heroContent.sqlPanel.prompt, locale));
	const sqlLiveLabel = $derived(resolveLocale(heroContent.sqlPanel.liveLabel, locale));
	const headlineAriaSuffix = $derived(resolveLocale(heroContent.headline.ariaSuffix, locale));
	const sqlColumnRoute = $derived(resolveLocale(heroContent.sqlPanel.columns.route, locale));
	const sqlColumnAvgDelay = $derived(resolveLocale(heroContent.sqlPanel.columns.avgDelayS, locale));
	const sqlColumnVehicles = $derived(resolveLocale(heroContent.sqlPanel.columns.vehicles, locale));
	const sqlMetaTemplate = $derived(resolveLocale(heroContent.sqlPanel.metaTemplate, locale));
	const refreshLabel = $derived(resolveLocale(heroContent.refreshButton.label, locale));
	const refreshHelper = $derived(resolveLocale(heroContent.refreshButton.helper, locale));
	// go2/w5: hero-dot replay button aria from site_labels.
	const replayAriaLabel = resolveLocale(siteLabels.a11y.replayIntro, locale);
	// go2/w5 taste-2: ONE caption names the metro art (the in-frame legend is
	// gone because it overlapped the SVG on mobile). site_labels owns the copy.
	const metroCaption = resolveLocale(siteLabels.ui.metroCaption, locale);

	let heroTextContainer: HTMLDivElement;
	let refreshIcon: HTMLSpanElement;

	// untrack: heroData deliberately seeds from the prop once and then diverges
	// locally via handleRefresh(); it must not follow later prop updates.
	let heroData: HeroData = $state(untrack(() => INITIAL_HERO_DATA));
	// The dashboard card LABEL/SUB copy is CMS truth (siteLabels.heroDashboard);
	// HeroMetrics resolves it per-locale by metric key, and the SQL panels carry
	// no metric labels — so heroData (numbers, units, query rows, the "STM"
	// wordmark) flows to the children unchanged. No localization pass here.
	// Honesty pass (until real KPIs ship, homework #2): the page is prerendered,
	// so any age claim at first paint is fiction. The slot says what the data IS
	// ("demo data"); after a real click of the refresh button, "regenerated just
	// now" is genuinely true and may stand.
	const updatedAgoInitial = locale === 'fr' ? 'données démo' : 'demo data';
	const updatedAgoJustNow = locale === 'fr' ? "régénéré à l'instant" : 'regenerated just now';
	let updatedAgo: string = $state(updatedAgoInitial);
	// Section min-height reserves scroll space for the pin + trailing content.
	// Desktop pin is 800% → 900svh matches exactly (100% + 800% = 900svh, no
	// trailing content because SQL is in-grid). Mobile pin is 300% → need
	// only 100% + 300% + ~150svh HeroMobileSql + a small buffer = 600svh.
	// Applied via CSS media query below so SSR renders correctly; inline
	// style remains for reduced-motion (collapses to a single viewport).

	function handleRefresh() {
		heroData = generateHeroData();
		updatedAgo = updatedAgoJustNow;
		if (refreshIcon) {
			refreshIcon.style.transition = 'transform 0.6s ease';
			refreshIcon.style.transform = 'rotate(360deg)';
			setTimeout(() => {
				refreshIcon.style.transition = 'none';
				refreshIcon.style.transform = 'rotate(0deg)';
			}, 600);
		}
	}

	let cleanup: (() => void) | undefined;
	onDestroy(() => cleanup?.());

	// go2/w5 replayable intro (taste-2 geometry):
	//   - introCompleted arms the pulsing hero-dot replay button (set when the
	//     visitor scrolls the intro through, or on a same-day skipped reload).
	//   - introCollapsed is the GEOMETRY state: the intro's scroll allowance is
	//     collapsed in place (.hero-intro-done — reserve → 100svh, pin killed,
	//     metro art hidden, hero text natural top-of-page). Applied LIVE the
	//     moment the intro completes AND on same-day skipped reloads, so a
	//     reload after completion lands in exactly the same geometry — zero
	//     displacement. Removed (track re-enlarged) only while a replay runs.
	// localStorage is only touched inside onMount/handlers — never at render
	// time, so SSR stays clean.
	let introCompleted = $state(false);
	let introCollapsed = $state(false);
	let replayArming = false;

	async function setupIntro(opts: { replayRebuild?: boolean } = {}): Promise<void> {
		await tick();
		// Initial mount: give layout a beat to settle before measuring. The
		// replay rebuild skips it — fonts/layout are long settled, and keeping
		// every await microtask-sized makes the rebuild paint-atomic (no
		// intermediate frame can show the reset intro states).
		if (!opts.replayRebuild) {
			await new Promise((r) => setTimeout(r, 300));
		}

		const svg = pinContainer?.querySelector('[data-testid="metro-network"]');
		if (!svg) return;

		// Resolve heroDot from DOM — inside HeroTextContent child component
		const heroDot = heroTextContainer.querySelector('.hero-dot') as SVGSVGElement;

		// Preload lazy plugins used inside createHeroTimeline (DrawSVG stroke
		// scrub in Phase 2, CustomEase 'networkDraw' on the line draws).
		// Register ScrollTrigger + apply its site-wide config.
		await Promise.all([loadDrawSVG(), loadCustomEase()]);
		initScrollTriggerConfig();

		// Typewriter: pure ambient per D264 — plays every visit, no scroll lock.
		// If the user scrolls past mid-animation, the type-sequence cuts off and
		// the blink picks up; the intro is not narrative-critical.
		const typewriter = createTypewriter(scrollPrompt, scrollText, scrollCursorEl, scrollDownLabel);
		typewriter.type(() => {});

		// Ensure fonts are loaded before glyph measurements
		await document.fonts.ready;

		// Mobile pin length branch per design spec §5.1 + plan decision A1.
		// Single mount-time matchMedia check; no gsap.matchMedia rebuild on
		// resize across 1024px — accepted trade-off for simpler architecture.
		const isMobile = isViewportAtMost(1023);

		const destroyHero = createHeroTimeline(pinContainer, {
			svgWrapper,
			heroTextContainer,
			heroDot,
			scrollPrompt,
			startBlink: typewriter.startBlink,
			stopBlink: typewriter.stopBlink,
			pinLength: isMobile ? '300%' : '800%',
			// Replay rebuilds refresh explicitly before their rewind starts —
			// the factory's deferred refresh would land mid-rewind and its
			// scroll restoration would cancel the native smooth scroll.
			skipDeferredRefresh: opts.replayRebuild === true,
			// Scrolled through once → persist the day-key, arm the replay dot,
			// and collapse the intro's scroll allowance in place (taste-2).
			// Deferred a frame: never tear the trigger down from inside its
			// own onUpdate.
			onIntroComplete: () => {
				introCompleted = true;
				markHeroIntroCompleted();
				requestAnimationFrame(() => {
					void collapseIntroTrack();
				});
			},
		});

		// Sleep/wake: refresh ScrollTrigger when tab becomes visible again
		function onVisibilityChange() {
			if (!document.hidden) {
				ScrollTrigger.refresh();
			}
		}
		document.addEventListener('visibilitychange', onVisibilityChange);

		cleanup = () => {
			typewriter.destroy();
			destroyHero();
			document.removeEventListener('visibilitychange', onVisibilityChange);
		};
	}

	function scrollBackToTop(): void {
		const lenis = getLenis();
		if (lenis) {
			// Film-rewind pace: quick out of the gate, soft landing at the top.
			lenis.scrollTo(0, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	// Reset every inline style the intro wrote (timeline tweens, build-time
	// gsap.set()s, manual transform-origins, MetroNetwork's onMount opacity
	// seeds) back to the stylesheet state. After this, .hero-intro-done
	// renders the finished hero (text forced visible, art display:none), and
	// a replay rebuild starts from EXACTLY the same baseline as a fresh
	// mount — the e2e-verified skip-path rebuild.
	function clearIntroSceneStyles(): void {
		const pieces = pinContainer.querySelectorAll(
			'.metro-line, .metro-station, .metro-bg, .metro-label, .metro-caption',
		);
		const staggers = heroTextContainer.querySelectorAll('[data-hero-stagger]');
		gsap.set(
			[svgWrapper, scrollPrompt, heroTextContainer, ...Array.from(staggers), ...Array.from(pieces)],
			{ clearProps: 'all' },
		);
		svgWrapper.style.transformOrigin = '';
		heroTextContainer.style.transformOrigin = '';
	}

	// Taste-2 core: on intro completion, the intro's scroll allowance
	// COLLAPSES IN PLACE. The pin dies (spacer removed), .hero-intro-done
	// shrinks the section reserve to one viewport, and the scroll position is
	// re-anchored by exactly the removed height — the settled hero becomes the
	// natural top of the page with zero visual displacement (the pinned final
	// frame and the collapsed hero are the same pixels). Same-day reloads then
	// land in identical geometry, so restored scroll positions match 1:1.
	async function collapseIntroTrack(): Promise<void> {
		if (introCollapsed) return;
		const beforeHeight = document.documentElement.scrollHeight;
		const beforeY = window.scrollY;
		cleanup?.(); // kills the pin (ScrollTrigger.kill() reverts the spacer) + timeline + typewriter
		cleanup = undefined;
		clearIntroSceneStyles();
		introCollapsed = true;
		await tick();
		const delta = Math.max(0, beforeHeight - document.documentElement.scrollHeight);
		jumpTo(Math.max(0, beforeY - delta));
		// Downstream triggers (manifesto, closer…) measured against the full
		// reserve — re-measure against the collapsed geometry.
		ScrollTrigger.refresh();
	}

	/** Instant scroll that keeps Lenis' internal position AND limits in sync. */
	function jumpTo(top: number): void {
		const lenis = getLenis();
		if (lenis) {
			// Lenis CLAMPS scrollTo targets to its cached dimensions, and that
			// cache refreshes through a 250ms-DEBOUNCED ResizeObserver. Every
			// jumpTo here runs right after a geometry flip (collapse/re-enlarge),
			// i.e. inside that debounce window — without a synchronous re-measure
			// the replay pre-position silently lands at the stale collapsed-track
			// limit, the rebuilt scrub never renders its top segment, and the
			// 200×-scaled hero text paints the viewport solid orange (the
			// replay-rewind orange-wall bug).
			lenis.resize();
			lenis.scrollTo(top, { immediate: true, force: true });
		} else {
			window.scrollTo({ top, behavior: 'auto' });
		}
	}

	// Click on the armed dot (taste-2): RE-ENLARGE the scroll track, place the
	// viewport (invisibly — identical settled pixels) at the END of the
	// rebuilt intro, then Lenis-ease back to the top so the whole intro scrubs
	// BACKWARD through the viewport — a film rewind, never a jump. Scrolling
	// it through again re-fires onIntroComplete, so the collapse re-applies.
	//
	// Ordering is load-bearing:
	//   1. plugins preload FIRST — afterwards every await in the chain is a
	//      microtask (settle delay skipped), so no frame can paint the
	//      intermediate states: the first painted frame after the click is
	//      the settled hero at the end of the re-enlarged track;
	//   2. the pre-jump OVERSHOOTS the approximate end before the rebuild so
	//      the new trigger's very first render is already at/past its end —
	//      the armed-crossing latch in createHeroTimeline therefore stays
	//      silent (the jump must never read as "scrolled the intro through");
	//   3. the global refresh runs AFTER the rebuild — it materializes the
	//      new pin's start/end (creation alone leaves them undefined) and
	//      performs the timeline's first render, at progress 1;
	//   4. the corrective jump dials in the exact pin end and renders it
	//      before the next paint, then the rewind starts.
	async function handleReplay(): Promise<void> {
		if (replayArming || !introCompleted) return;
		replayArming = true;
		// Operator: clicking the dot un-completes the intro for the day — a
		// refresh from here on lands on the animation again ("still to do").
		// Scrolling the replay through re-fires completion and re-persists.
		forgetHeroIntroCompleted();
		try {
			if (introCollapsed) {
				// Preload the timeline's lazy plugins BEFORE touching geometry.
				// On a same-day skipped load they were never imported, and a
				// chunk fetch inside the rebuild would break the paint-atomic
				// microtask chain (frames would paint the half-rebuilt scene).
				// Idempotent: instant when already loaded.
				await Promise.all([loadDrawSVG(), loadCustomEase()]);
				const beforeHeight = document.documentElement.scrollHeight;
				const beforeY = window.scrollY;
				// Shield: the base markup is opacity-0; keep the settled hero
				// text painted across the class flip + rebuild. The rebuilt
				// timeline's first render (at the end, Phase 6 fromTo end = 1)
				// takes ownership of the same value.
				heroTextContainer.style.opacity = '1';
				introCollapsed = false; // re-enlarge the track
				await tick();
				// Pre-position at the re-enlarge height delta PLUS one viewport
				// of overshoot so the rebuilt pin's first render is already
				// AT/PAST its end. The delta alone can land a hair SHORT of the
				// pin end (the section reserve holds more than the pin), and a
				// first render below the 0.99 threshold would arm the
				// completion latch — the corrective end render would then read
				// as "scrolled through" and instantly re-collapse the track
				// mid-replay.
				jumpTo(
					beforeY +
						Math.max(0, document.documentElement.scrollHeight - beforeHeight) +
						window.innerHeight,
				);
				await setupIntro({ replayRebuild: true });
				// Release the shield BEFORE the rebuilt timeline's first render
				// (same synchronous block as the refresh below — no frame can
				// paint the gap). GSAP records a tween target's PRE-tween value
				// at init and reverts to it whenever the playhead scrubs back
				// below the tween's start: the Phase 6 fromTo must therefore
				// init against the stylesheet state (class opacity-0), not the
				// shield — otherwise the rewind passing below Phase 6 reverts
				// the 200×-scaled hero text back to the shield's opacity 1 and
				// its giant dot glyph paints the viewport solid orange.
				heroTextContainer.style.opacity = '';
				// Global re-measure, load-bearing twice over: downstream
				// triggers (manifesto, closer…) shifted by the re-enlarge, AND
				// the new pin's start/end only materialize here —
				// ScrollTrigger.create() does NOT fully refresh synchronously,
				// so without this pass st.end below reads undefined and the
				// corrective jump degenerates to scrollTo(NaN) (which Lenis
				// turns into a scroll-to-0 and a poisoned internal position).
				// This is also the timeline's FIRST render: at the overshot
				// scroll it lands at progress 1 — tween starts + zoom getters
				// init from the clean build state, and the latch stays silent.
				ScrollTrigger.refresh();
				// Correct to the EXACT pin end (+ whatever the visitor had
				// scrolled within the collapsed hero) — identical pixels.
				const st = ScrollTrigger.getAll().find(
					(t) => t.trigger === pinContainer && Boolean(t.vars.pin),
				);
				if (st) {
					jumpTo(st.end + Math.max(0, beforeY - st.start));
					// Render the corrected position before the next paint.
					ScrollTrigger.update();
				}
			}
			scrollBackToTop();
		} finally {
			replayArming = false;
		}
	}

	onMount(async () => {
		reducedMotion = isPrefersReducedMotion();

		// The app.html pre-paint script may have set html[data-hero-intro-done]
		// from the day-key so a same-day reload paints the hero COLLAPSED from
		// frame 0 (no flash of the 900svh metro intro before this component
		// mounts). That attribute is a FRAME-0 BRIDGE ONLY: once this component
		// is alive, the `introCollapsed`-driven `.hero-intro-done` CLASS owns the
		// geometry, so the bridge must be cleared. Its global collapse rules
		// (reserve→100svh, pin height:auto, metro display:none) are NOT scoped to
		// introCollapsed — left on, they outlive the bridge and permanently pin
		// the section, so a later replay (introCollapsed=false drops the class)
		// can't re-enlarge the track and the rebuilt intro paints a broken/popped
		// frame. (operator-reported regression from the no-flash change.)
		const clearHeroIntroBridge = () =>
			document.documentElement.removeAttribute('data-hero-intro-done');

		// Reduced motion (slice-23): the entire metro-network sequence is
		// gated off — no scroll-pin, no typewriter, no GSAP timeline. The
		// hero loads straight up via @media (prefers-reduced-motion: reduce)
		// rules in the stylesheet below: metro wrapper hidden, hero text
		// forced visible, scroll prompt hidden, section reservation
		// collapsed to a single viewport. No JS setup required. (There is
		// nothing to replay either, so the dot stays dormant.)
		if (reducedMotion) {
			// The @media(prefers-reduced-motion) rules hold the collapse alone;
			// drop the bridge so no global attribute lingers.
			clearHeroIntroBridge();
			return;
		}

		// go2/w5: already scrolled the intro through today — land in the
		// completed state (hero-intro-done CSS collapses the reserve, hides
		// the metro art, shows the hero text) and arm the replay dot. Since
		// taste-2 the LIVE completion collapses the same way, so the reload
		// geometry matches the pre-reload geometry exactly.
		if (isHeroIntroCompletedToday()) {
			introCollapsed = true;
			introCompleted = true;
			// Downstream ScrollTriggers (manifesto, closer…) may have measured
			// against the un-collapsed 900svh reserve — re-measure once layout
			// settles.
			initScrollTriggerConfig();
			requestAnimationFrame(() => {
				// Hand off from the pre-paint attribute to the now-painted
				// `.hero-intro-done` class (Svelte has flushed introCollapsed to
				// the DOM by this frame); both render identical geometry, so the
				// swap is seamless — no frame repaints the intro.
				clearHeroIntroBridge();
				ScrollTrigger.refresh();
			});
			return;
		}

		// Not completed today → the intro plays. If the bridge was set despite
		// that (the local day rolled over between the pre-paint read and now),
		// clear it so it can't collapse the very intro we're about to build.
		clearHeroIntroBridge();
		await setupIntro();
	});
</script>

<section
	class="hero-section-reserve relative {introCollapsed ? 'hero-intro-done' : ''}"
	data-testid="hero-banner"
>
	<div
		bind:this={pinContainer}
		class="hero-pin relative flex w-full items-center justify-center overflow-hidden"
		style="padding-bottom: env(safe-area-inset-bottom, 0px);"
	>
		<!-- SVG wrapper — zooms into Berri-UQAM. Hidden under reduced-motion
		     via @media rule in the stylesheet. -->
		<div
			bind:this={svgWrapper}
			class="hero-metro-wrapper absolute inset-0 flex items-center justify-center md:px-4 md:pr-20"
		>
			<!-- Sodium lamp — lives INSIDE the metro wrapper, so it exists only
			     while the animation does: on from the first intro frame, zooms
			     away with the art in Phase 5, display:none'd by hero-intro-done
			     (settled hero + same-day reloads) and by reduced motion. Sized
			     by the 100lvh pin, never by the document — no geometry flip can
			     re-scale it (the page-wrapper and sticky variants both
			     glitched; operator-rejected). -->
			<div class="hero-lamp" aria-hidden="true"></div>
			<MetroNetwork svg={metroSvg} />
			<!-- go2/w5 taste-2: ONE unobtrusive caption names the art (the
			     in-frame legend is gone). Anchored to the wrapper's bottom
			     strip — the metro frame is capped at 80dvh and centered, so
			     the wrapper's bottom band is art-free at every breakpoint:
			     the caption can never overlap the SVG. Part of the art
			     (aria-hidden, fades in with Phase 4, zooms away with the
			     wrapper in Phase 5). -->
			{#if metroCaption}
				<p class="metro-caption" data-testid="metro-caption" aria-hidden="true">
					{metroCaption}
				</p>
			{/if}
		</div>

		<!-- Hero text reveal layer — initially hidden, revealed during zoom-out -->
		<div
			bind:this={heroTextContainer}
			class="absolute inset-0 flex items-start justify-center pt-20 opacity-0 md:items-center md:py-[max(5svh,2.5rem)]"
			data-testid="hero-text-container"
		>
			<div class="w-full px-[var(--space-page-x)]">
				<div class="hero-grid">
					<!-- LEFT COLUMN: text content -->
					<HeroTextContent
						{headlineLine1}
						{headlineLine2}
						{headlineAriaSuffix}
						{subheadlineText}
						{subtitleText}
						{identityText}
						{ctaWorkLabel}
						{ctaContactLabel}
						heroData={heroData}
						{introCompleted}
						beaconSettled={introCompleted && introCollapsed}
						{replayAriaLabel}
						onReplay={handleReplay}
					/>

					<!-- VERTICAL DIVIDER (desktop only) -->
					<div
						class="hidden self-stretch md:block"
						data-hero-stagger="5"
					>
						<div class="hero-divider"></div>
					</div>

					<!-- RIGHT COLUMN: desktop only (mobile gets its own section below pin) -->
					<div class="hero-viewport-sql hidden md:block">
						<div data-hero-stagger="4">
							<HeroSqlPanel
								rows={heroData.queryRows}
								queryTime={heroData.queryTime}
								prompt={sqlPrompt}
								liveLabel={sqlLiveLabel}
								columnRoute={sqlColumnRoute}
								columnAvgDelay={sqlColumnAvgDelay}
								columnVehicles={sqlColumnVehicles}
								metaTemplate={sqlMetaTemplate}
								{updatedAgo}
							/>
						</div>

						<div class="mt-8 text-center" data-hero-stagger="7">
							<button
								class="refresh-btn tap-press"
								data-testid="hero-refresh"
								onclick={handleRefresh}
							>
								<span bind:this={refreshIcon} class="text-xl">&#x21bb;</span>
								{refreshLabel}
							</button>
							<div class="mt-2 font-mono text-caption text-[var(--muted-foreground)]">
								{refreshHelper}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- "NEXT STOP: SCROLL DOWN" — full-width billboard flush to bottom -->
		<p
			bind:this={scrollPrompt}
			class="scroll-prompt pointer-events-none absolute left-0 w-full text-center font-mono font-black uppercase leading-[0.95] text-primary md:whitespace-nowrap md:leading-none"
		>
			<span bind:this={scrollText}></span><span bind:this={scrollCursorEl} class="scroll-block-cursor typewriter-cursor" aria-hidden="true">&#x2588;</span>
		</p>
	</div>

	<!-- Mobile SQL section — outside the pin, scrolls naturally after hero text -->
	<HeroMobileSql
		heroData={heroData}
		{sqlPrompt}
		{sqlLiveLabel}
		{sqlColumnRoute}
		{sqlColumnAvgDelay}
		{sqlColumnVehicles}
		{sqlMetaTemplate}
		{updatedAgo}
		{refreshLabel}
		{refreshHelper}
		onRefresh={handleRefresh}
	/>
</section>

<style>
	/* Section scroll reservation — matches the pin-length per breakpoint.
	   Mobile pin = 300% → 100lvh trigger + 300lvh pin extension = 400lvh +
	   ~150lvh HeroMobileSql natural-flow content + 50lvh buffer = 600lvh.
	   Desktop pin = 800% → 100lvh + 800lvh = 900lvh, no trailing content
	   (SQL panel is in-grid inside the pin). */
	.hero-section-reserve {
		min-height: 600svh;
	}

	@media (min-width: 1024px) {
		.hero-section-reserve {
			min-height: 900svh;
		}
	}

	/* Hero pin container — full viewport for the animation */
	.hero-pin {
		height: 100lvh;
	}

	/* The intro's sodium lamp: a top-anchored radial filling the metro
	   wrapper (inset-0 of the 100lvh pin). DOM-first inside the wrapper =
	   painted under the metro art; no z-index games. */
	.hero-lamp {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image: radial-gradient(120vw 100% at 50% 0%, color-mix(in srgb, var(--glow) 12%, transparent), transparent 60%);
	}

	/* ─────────────────────────────────────────────────────────────────
	   Reduced motion: the metro-network scroll-pin sequence is entirely
	   gated off. Operator policy (slice-23): no metro map background, no
	   typing animation, hero text visible immediately, no oversized scroll
	   reservation. CSS-only (not JS-toggled) so the server renders the
	   correct layout — no flash between SSR and hydration.
	   ─────────────────────────────────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.hero-section-reserve {
			min-height: 100svh;
		}

		.hero-pin {
			height: auto;
			min-height: 100svh;
		}

		/* Kill the metro map entirely. */
		.hero-metro-wrapper {
			display: none;
		}

		/* Hide the "SCROLL DOWN" typewriter prompt. */
		.scroll-prompt {
			display: none;
		}

		/* Hero text container is opacity-0 in the base markup so the GSAP
		   pin sequence can fade it in. Under reduced motion the sequence
		   never runs — force it visible from the first paint. */
		:global(.hero-section-reserve [data-testid='hero-text-container']) {
			opacity: 1 !important;
			position: relative !important;
		}
	}

	/* ─────────────────────────────────────────────────────────────────
	   go2/w5 replayable intro — collapsed (completed) geometry. Mirrors the
	   reduced-motion block above: the finished hero (text visible, no metro
	   art, no 900svh scroll reservation). Applied LIVE the moment the intro
	   completes (taste-2: the scroll allowance collapses in place) AND on
	   same-day reloads, so both land in identical geometry. Removed only
	   while the pulsing dot replays the intro.
	   ─────────────────────────────────────────────────────────────────── */
	.hero-section-reserve.hero-intro-done {
		min-height: 100svh;
	}

	.hero-intro-done .hero-pin {
		height: auto;
		min-height: 100svh;
	}

	.hero-intro-done .hero-metro-wrapper {
		display: none;
	}

	.hero-intro-done .scroll-prompt {
		display: none;
	}

	:global(.hero-section-reserve.hero-intro-done [data-testid='hero-text-container']) {
		opacity: 1 !important;
		position: relative !important;
		transform: none !important;
	}

	/* go2/w5 — same-day-reload pre-paint collapse. The app.html pre-paint script
	   sets html[data-hero-intro-done] from the day-key BEFORE first paint, so a hero
	   already scrolled-through today lands collapsed from frame 0 — no flash of the
	   intro before onMount sets introCollapsed. Mirrors the .hero-intro-done rules
	   above, keyed on the document attribute instead of the (post-mount) class. */
	:global(html[data-hero-intro-done]) .hero-section-reserve {
		min-height: 100svh;
	}
	:global(html[data-hero-intro-done]) .hero-pin {
		height: auto;
		min-height: 100svh;
	}
	:global(html[data-hero-intro-done]) .hero-metro-wrapper {
		display: none;
	}
	:global(html[data-hero-intro-done]) .scroll-prompt {
		display: none;
	}
	:global(html[data-hero-intro-done] [data-testid='hero-text-container']) {
		opacity: 1 !important;
		position: relative !important;
		transform: none !important;
	}

	/* go2/w5 taste-2: metro caption — ONE small line naming the art. Lives in
	   the wrapper's bottom strip: the frame is capped at 80dvh and vertically
	   centered, so ≥10% of the wrapper's height below it is always art-free —
	   no overlap at any breakpoint. Starts at opacity 0; createHeroTimeline
	   fades it in with the Phase 4 station labels. Visually uppercase via CSS
	   (the LocalizedString stays operator-cased: 'STM métro + REM'). */
	.metro-caption {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: clamp(10px, 2.5vh, 28px);
		margin: 0;
		/* Shrink-wrapped to the text — the caption's box is exactly the ink it
		   draws, so it occupies nothing it doesn't paint. */
		width: max-content;
		max-width: calc(100vw - 32px);
		text-align: center;
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--secondary-foreground);
		opacity: 0;
		pointer-events: none;
	}

	@media (min-width: 768px) {
		.metro-caption {
			font-size: var(--text-micro);
		}
	}

	/* Two-column hero grid: text | divider | SQL panel */
	.hero-grid {
		display: grid;
		grid-template-columns: 1fr 1px 1fr;
		gap: 32px;
		align-items: start;
	}

	/* Vertical divider — amber rule (matches the footer's accent rule), faded ends */
	.hero-divider {
		width: 1px;
		height: 100%;
		background: linear-gradient(
			180deg,
			transparent 0%,
			var(--border-rule-accent) 15%,
			var(--border-rule-accent) 85%,
			transparent 100%
		);
	}

	/* Refresh button — orange gradient, glow, JetBrains Mono */
	.refresh-btn {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
		color: var(--background);
		border: none;
		padding: 16px 48px;
		border-radius: 10px;
		font-size: var(--text-control);
		font-weight: 800;
		font-family: var(--font-mono);
		letter-spacing: 2px;
		cursor: pointer;
		box-shadow: var(--shadow-cta);
		transition: box-shadow var(--duration-normal), transform var(--duration-normal);
	}
	.refresh-btn:hover {
		box-shadow: var(--shadow-cta-hover);
		transform: translateY(-1px);
	}

	/* Full-width billboard text */
	.scroll-prompt {
		font-size: 11.5vw;
		letter-spacing: -0.3vw;
		bottom: calc(100lvh - 100dvh);
	}
	/* .scroll-block-cursor moved to app.css so the global .typewriter-cursor
	   class can override its opacity when the typewriter is active (17e-4). */

	@media (min-width: 768px) {
		.scroll-prompt {
			font-size: 6.8vw;
			letter-spacing: -0.5vw;
			bottom: 0;
		}
		/* The FR billboard ("PROCHAIN ARRÊT : FAIS DÉFILER") is ~27% longer than
		   EN ("NEXT STOP: SCROLL DOWN"); at 6.8vw it spans ~103% of the viewport
		   and clips the end on the single-line (md:whitespace-nowrap) desktop
		   billboard. Shrink ONLY the FR locale so it fits with margin (~91% at
		   6vw); EN is unchanged. Mobile (<768px) wraps, so no clip there. */
		:global(html[lang='fr']) .scroll-prompt {
			font-size: 6vw;
		}
	}

	/* Mobile: single-column grid */
	@media (max-width: 768px) {
		.hero-grid {
			grid-template-columns: 1fr;
			gap: 0;
		}
		.refresh-btn {
			width: 100%;
			justify-content: center;
			padding: 16px 14px;
			min-height: 44px;
			font-size: var(--text-mono);
		}
	}
</style>
