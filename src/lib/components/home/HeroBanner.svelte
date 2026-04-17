<!--
  Hero banner: scroll-driven SVG metro network animation (Slice A + Slice C).
  Uses Yesid's hand-built montreal_map.svg.

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
	import { onMount, onDestroy, tick } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import {
		initScrollTriggerConfig,
		loadDrawSVG,
		loadCustomEase,
		ScrollTrigger,
	} from '$lib/motion/utils/gsap.js';
	import { createHeroTimeline } from '$lib/motion/scrubs/index.js';
	import { createTypewriter } from '$lib/motion/utils/heroTypewriter.js';
	import { heroAnimContent, heroContent, INITIAL_HERO_DATA, generateHeroData } from '$lib/data';
	import type { HeroData } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import MetroNetwork from '$lib/motion/svg/MetroNetwork.svelte';
	import HeroSqlPanel from './HeroSqlPanel.svelte';
	import HeroTextContent from './HeroTextContent.svelte';
	import HeroMobileSql from './HeroMobileSql.svelte';
	import { Button } from '$lib/components/ui/button';

	let pinContainer: HTMLDivElement;
	let svgWrapper: HTMLDivElement;
	let scrollPrompt: HTMLParagraphElement;
	let scrollText: HTMLSpanElement;
	let scrollCursorEl: HTMLSpanElement;
	let networkComponent: ReturnType<typeof MetroNetwork>;
	let reducedMotion = false;

	const scrollDownLabel = resolveLocale(heroAnimContent.scrollDown, 'en');
	const headlineLine1 = resolveLocale(heroContent.headline.line1, 'en');
	const subheadlineText = resolveLocale(heroContent.subheadline, 'en');
	const subtitleText = resolveLocale(heroContent.subtitle, 'en');
	const ctaWorkLabel = resolveLocale(heroContent.ctaWork, 'en');
	const ctaContactLabel = resolveLocale(heroContent.ctaContact, 'en');
	const sqlPrompt = resolveLocale(heroContent.sqlPanel.prompt, 'en');
	const sqlLiveLabel = resolveLocale(heroContent.sqlPanel.liveLabel, 'en');
	const refreshLabel = resolveLocale(heroContent.refreshButton.label, 'en');
	const refreshHelper = resolveLocale(heroContent.refreshButton.helper, 'en');

	let heroTextContainer: HTMLDivElement;
	let refreshIcon: HTMLSpanElement;

	let heroData: HeroData = $state(INITIAL_HERO_DATA);
	let updatedAgo: string = $state('30s ago');
	const sectionMinHeight = '900svh';

	function handleRefresh() {
		heroData = generateHeroData();
		updatedAgo = 'just now';
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

	onMount(async () => {
		reducedMotion = isPrefersReducedMotion();

		await tick();
		await new Promise((r) => setTimeout(r, 300));

		const svg = pinContainer?.querySelector('[data-testid="metro-network"]');
		if (!svg) return;

		// Resolve heroDot from DOM — inside HeroTextContent child component
		const heroDot = heroTextContainer.querySelector('.hero-dot') as SVGSVGElement;

		// Reduced motion: factory renders the static preview (network dimmed,
		// heroTextContainer snapped to scale=1 visible) and no-ops. Skip the
		// typewriter animation and the ScrollTrigger.refresh listener.
		if (reducedMotion) {
			createHeroTimeline(pinContainer, {
				svgWrapper,
				heroTextContainer,
				heroDot,
				scrollPrompt,
				startBlink: () => {},
				stopBlink: () => {},
			});
			return;
		}

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
		const isMobile = window.matchMedia('(max-width: 1023px)').matches;

		const destroyHero = createHeroTimeline(pinContainer, {
			svgWrapper,
			heroTextContainer,
			heroDot,
			scrollPrompt,
			startBlink: typewriter.startBlink,
			stopBlink: typewriter.stopBlink,
			pinLength: isMobile ? '300%' : '800%',
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
	});
</script>

<section
	class="relative"
	data-testid="hero-banner"
	style="min-height: {reducedMotion ? '100svh' : sectionMinHeight};"
>
	<div
		bind:this={pinContainer}
		class="hero-pin relative flex w-full items-center justify-center overflow-hidden"
		style="padding-bottom: env(safe-area-inset-bottom, 0px);"
	>
		<!-- SVG wrapper — zooms into Berri-UQAM -->
		<div
			bind:this={svgWrapper}
			class="absolute inset-0 flex items-center justify-center md:px-4 md:pr-20"
		>
			<MetroNetwork bind:this={networkComponent} />
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
						{subheadlineText}
						{subtitleText}
						{ctaWorkLabel}
						{ctaContactLabel}
						{heroData}
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
								{updatedAgo}
							/>
						</div>

						<div class="mt-8 text-center" data-hero-stagger="7">
							<button
								class="refresh-btn"
								data-testid="hero-refresh"
								onclick={handleRefresh}
							>
								<span bind:this={refreshIcon} class="text-xl">&#x21bb;</span>
								{refreshLabel}
							</button>
							<div class="mt-2 font-mono text-caption text-[var(--dim-foreground)]">
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
			<span bind:this={scrollText}></span><span bind:this={scrollCursorEl} class="scroll-block-cursor" aria-hidden="true">&#x2588;</span>
		</p>
	</div>

	<!-- Mobile SQL section — outside the pin, scrolls naturally after hero text -->
	<HeroMobileSql
		{heroData}
		{sqlPrompt}
		{sqlLiveLabel}
		{updatedAgo}
		{refreshLabel}
		{refreshHelper}
		onRefresh={handleRefresh}
	/>
</section>

<style>
	/* Hero pin container — full viewport for the animation */
	.hero-pin {
		height: 100lvh;
	}

	/* Two-column hero grid: text | divider | SQL panel */
	.hero-grid {
		display: grid;
		grid-template-columns: 1fr 1px 1fr;
		gap: 32px;
		align-items: start;
	}

	/* Vertical divider with faded ends */
	.hero-divider {
		width: 1px;
		height: 100%;
		background: linear-gradient(
			180deg,
			transparent 0%,
			var(--border) 15%,
			var(--border) 85%,
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
		font-size: 15px;
		font-weight: 800;
		font-family: var(--font-mono);
		letter-spacing: 2px;
		cursor: pointer;
		box-shadow:
			0 0 24px color-mix(in srgb, var(--primary) 30%, transparent),
			0 4px 12px rgba(0, 0, 0, 0.4);
		transition: box-shadow var(--duration-normal), transform var(--duration-normal);
	}
	.refresh-btn:hover {
		box-shadow:
			0 0 40px color-mix(in srgb, var(--primary) 50%, transparent),
			0 6px 20px rgba(0, 0, 0, 0.5);
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
			padding: 14px;
			font-size: 14px;
		}
	}
</style>
