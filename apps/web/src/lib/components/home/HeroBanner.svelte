<!-- Scroll-driven metro intro with an in-place collapse and reversible replay. -->
<script lang="ts">
	import { onMount, onDestroy, tick, untrack } from 'svelte';
	import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
	import { clock } from '@yesid/ui/state';
	import { homeIntroStore } from '#lib/state/home-intro.svelte.ts';
	import {
		initScrollTriggerConfig,
		loadDrawSVG,
		loadCustomEase,
		ScrollTrigger,
		gsap,
	} from '@yesid/motion/utils/gsap';
	import { createHeroTimeline } from '#lib/motion/scrubs/index.ts';
	import { createTypewriter } from '#lib/motion/utils/heroTypewriter.ts';
	import { isViewportAtMost } from '@yesid/motion/utils/device';
	import { getLenis } from '@yesid/motion/utils/lenis';
	import { siteLabels } from '#lib/content/index.ts';
	import {
		fetchLiveKpis,
		generateHeroData,
		startLiveKpiPolling,
		type HeroData,
		type LiveHeroSnapshot,
	} from '#lib/live/index.ts';
	import type { HeroContent, HeroAnimContent } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import MetroNetwork from '#lib/motion/svg/MetroNetwork.svelte';
	import HeroSqlPanel from './HeroSqlPanel.svelte';
	import HeroTextContent from './HeroTextContent.svelte';
	import HeroMobileSql from './HeroMobileSql.svelte';

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

	const scrollDownLabel = $derived(resolveLocale(heroAnimContent.scrollDown, locale));
	// Fit a nowrap mono line to 90vw; budget one extra character for the cursor.
	const billboardVw = $derived.by(() => {
		const len = scrollDownLabel.length + 1;
		const size = (90 / len + 0.5) / 0.6;
		return Math.min(8, Math.max(4, size)).toFixed(2);
	});
	const headlineLine1 = $derived(resolveLocale(heroContent.headline.line1, locale));
	const headlineLine2 = $derived(resolveLocale(heroContent.headline.line2, locale));
	const subheadlineText = $derived(resolveLocale(heroContent.subheadline, locale));
	const subtitleText = $derived(resolveLocale(heroContent.subtitle, locale));
	const ctaWorkLabel = $derived(resolveLocale(heroContent.ctaWork, locale));
	const ctaContactLabel = $derived(resolveLocale(heroContent.ctaContact, locale));
	// LIVE labels require real transit data; simulated values must retain DEMO labels.
	let live = $state(false);
	const sqlLabels = $derived({
		prompt: resolveLocale(heroContent.sqlPanel.prompt, locale),
		liveLabel: resolveLocale(live ? heroContent.sqlPanel.liveBadge : heroContent.sqlPanel.liveLabel, locale),
		columnRoute: resolveLocale(heroContent.sqlPanel.columns.route, locale),
		columnAvgDelay: resolveLocale(heroContent.sqlPanel.columns.avgDelayS, locale),
		columnVehicles: resolveLocale(heroContent.sqlPanel.columns.vehicles, locale),
		metaTemplate: resolveLocale(heroContent.sqlPanel.metaTemplate, locale),
	});
	const headlineAriaSuffix = $derived(resolveLocale(heroContent.headline.ariaSuffix, locale));
	const refreshLabel = $derived(resolveLocale(heroContent.refreshButton.label, locale));
	const refreshHelper = $derived(
		resolveLocale(live ? heroContent.refreshButton.helperLive : heroContent.refreshButton.helper, locale),
	);

	const replayAriaLabel = resolveLocale(siteLabels.a11y.replayIntro, locale);

	const metroCaption = resolveLocale(siteLabels.ui.metroCaption, locale);

	let heroTextContainer: HTMLDivElement;
	let refreshIcon: HTMLSpanElement;

	// Seed once from the prop, then let refreshes own the local data.
	let heroData: HeroData = $state(untrack(() => INITIAL_HERO_DATA));
	// Prerendered demo data has no meaningful age; only a user refresh can claim it was regenerated just now.
	const updatedAgoInitial = resolveLocale(
		{ en: 'demo data', fr: 'données démo', es: 'datos de demo' },
		locale,
	);
	const updatedAgoJustNow = resolveLocale(
		{ en: 'regenerated just now', fr: "régénéré à l'instant", es: 'regenerado recién' },
		locale,
	);
	let demoStamp: string = $state(updatedAgoInitial);

	function spinRefreshIcon() {
		if (refreshIcon) {
			refreshIcon.style.transition = 'transform 0.6s ease';
			refreshIcon.style.transform = 'rotate(360deg)';
			setTimeout(() => {
				refreshIcon.style.transition = 'none';
				refreshIcon.style.transform = 'rotate(0deg)';
			}, 600);
		}
	}

	// The shared clock advances server-provided freshness between polls.
	let liveBase = $state<{ freshnessS: number; receivedAt: number } | null>(null);
	$effect(() => clock.subscribe());
	const updatedAgo = $derived(
		liveBase
			? liveStamp(liveBase.freshnessS + Math.max(0, Math.round((clock.now - liveBase.receivedAt) / 1000)))
			: demoStamp,
	);

	function liveStamp(seconds: number): string {
		if (locale === 'fr') return `il y a ${seconds} s`;
		if (locale === 'es') return `hace ${seconds} s`;
		return `${seconds}s ago`;
	}

	function applyLiveSnapshot(snapshot: LiveHeroSnapshot) {
		heroData = snapshot.data;
		live = true;
		liveBase = { freshnessS: snapshot.freshnessS, receivedAt: Date.now() };
	}

	function dropToDemo(stamp: string) {
		live = false;
		liveBase = null;
		heroData = generateHeroData();
		demoStamp = stamp;
	}

	function handleRefresh() {
		spinRefreshIcon();
		if (!liveEnabled) {
			heroData = generateHeroData();
			demoStamp = updatedAgoJustNow;
			return;
		}
		void fetchLiveKpis().then((snapshot) => {
			if (snapshot) applyLiveSnapshot(snapshot);
			else dropToDemo(updatedAgoJustNow);
		});
	}

	// Automated browsers use deterministic demo data so E2E runs do not depend on the transit service.
	let liveEnabled = false;
	onMount(() => {
		if (navigator.webdriver) return;
		liveEnabled = true;
		const tickLive = async () => {
			const snapshot = await fetchLiveKpis();
			if (snapshot) applyLiveSnapshot(snapshot);
			else if (live) dropToDemo(updatedAgoInitial);
		};
		const stopLivePolling = startLiveKpiPolling(tickLive);
		return stopLivePolling;
	});

	let cleanup: (() => void) | undefined;
	let destroyed = false;
	onDestroy(() => {
		destroyed = true;
		cleanup?.();
		homeIntroStore.reset();
	});

	let replayEnabled = $state(false);
	let introCollapsed = $state(true);
	let heroApproaching = $state(false);
	let replayArming = false;
	let restoreReplayFocus = false;

	async function setupIntro(): Promise<void> {
		await tick();
		if (destroyed) return;

		const svg = pinContainer?.querySelector('[data-testid="metro-network"]');
		if (!svg) {
			homeIntroStore.settle();
			return;
		}

		const heroDot = heroTextContainer.querySelector('.hero-dot') as SVGSVGElement;

		await Promise.all([loadDrawSVG(), loadCustomEase()]);
		if (destroyed) return;
		initScrollTriggerConfig();

		// Scrolling past the intro cuts off typing and leaves the cursor blinking.
		const typewriter = createTypewriter(scrollPrompt, scrollText, scrollCursorEl, scrollDownLabel);
		typewriter.type(() => {});

		await document.fonts.ready;
		if (destroyed) return;

		// Choose pin length once at mount; resizing across the breakpoint does not rebuild the timeline.
		const isMobile = isViewportAtMost(1023);

		const destroyHero = createHeroTimeline(pinContainer, {
			svgWrapper,
			heroTextContainer,
			heroDot,
			scrollPrompt,
			startBlink: typewriter.startBlink,
			stopBlink: typewriter.stopBlink,
			pinLength: isMobile ? '300%' : '800%',
			onHeroApproach: approaching => { heroApproaching = approaching; },
			// Refresh before rewind because a deferred refresh would restore scroll and cancel native smooth scrolling.
			skipDeferredRefresh: true,
			// Defer teardown until outside the timeline update.
			onIntroComplete: () => {
				requestAnimationFrame(() => {
					void collapseIntroTrack();
				});
			},
		});

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

			lenis.scrollTo(0, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
		} else {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	// Clear all intro inline styles so replay starts from the same CSS baseline as a fresh mount.
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

	// Collapse the track and subtract its removed height so the settled hero stays in place.
	async function collapseIntroTrack(): Promise<void> {
		if (destroyed || introCollapsed) return;
		const beforeHeight = document.documentElement.scrollHeight;
		const beforeY = window.scrollY;
		cleanup?.();
		cleanup = undefined;
		clearIntroSceneStyles();
		introCollapsed = true;
		await tick();
		if (destroyed) return;
		const delta = Math.max(0, beforeHeight - document.documentElement.scrollHeight);
		jumpTo(Math.max(0, beforeY - delta));
		ScrollTrigger.refresh();
		homeIntroStore.settle();
		if (restoreReplayFocus && document.activeElement === document.body) {
			heroTextContainer.querySelector<HTMLButtonElement>('[data-testid="hero-dot-replay"]')?.focus({ preventScroll: true });
		}
		restoreReplayFocus = false;
	}

	function jumpTo(top: number): void {
		const lenis = getLenis();
		if (lenis) {
			// Resize Lenis before jumping; its debounced geometry cache otherwise clamps against the old track height.
			lenis.resize();
			lenis.scrollTo(top, { immediate: true, force: true });
		} else {
			window.scrollTo({ top, behavior: 'auto' });
		}
	}

	// Rebuild and correct the pin end before paint, then rewind; jumping directly to the end must not arm completion.
	async function handleReplay(): Promise<void> {
		if (destroyed || replayArming || !replayEnabled || isPrefersReducedMotion()) return;
		heroApproaching = false;
		restoreReplayFocus = document.activeElement === heroTextContainer.querySelector('[data-testid="hero-dot-replay"]');
		homeIntroStore.begin();
		replayArming = true;
		try {
			if (introCollapsed) {
				// Preload before geometry changes so chunk fetching cannot expose an intermediate frame.
				await Promise.all([loadDrawSVG(), loadCustomEase()]);
				if (destroyed) return;
				const beforeHeight = document.documentElement.scrollHeight;
				const beforeY = window.scrollY;
				// Shield the settled text across the class flip until the rebuilt timeline owns opacity.
				heroTextContainer.style.opacity = '1';
				introCollapsed = false; // re-enlarge the track
				await tick();
				if (destroyed) return;
				// Overshoot by one viewport so the first render cannot arm completion and collapse the rebuilt track.
				jumpTo(
					beforeY +
						Math.max(0, document.documentElement.scrollHeight - beforeHeight) +
						window.innerHeight,
				);
				await setupIntro();
				if (destroyed) return;
				// Remove the shield before tween initialization so backward scrubbing restores CSS opacity instead of the shield.
				heroTextContainer.style.opacity = '';
				// Refresh materializes pin bounds and updates downstream triggers before the corrective jump.
				ScrollTrigger.refresh();

				const st = ScrollTrigger.getAll().find(
					(t) => t.trigger === pinContainer && Boolean(t.vars.pin),
				);
				if (st) {
					jumpTo(st.end + Math.max(0, beforeY - st.start));

					ScrollTrigger.update();
				}
			}
			scrollBackToTop();
		} finally {
			replayArming = false;
		}
	}

	onMount(() => {
		replayEnabled = !isPrefersReducedMotion();
		homeIntroStore.settle();
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

		<div
			bind:this={svgWrapper}
			class="hero-metro-wrapper absolute inset-0 flex items-center justify-center md:px-4 md:pr-20"
		>
			<!-- Size the lamp against the pin viewport so track-height changes cannot rescale it. -->
			<div class="hero-lamp" aria-hidden="true"></div>
			<MetroNetwork svg={metroSvg} />
			<!-- The caption occupies the art-free bottom strip outside the centered metro frame. -->
			{#if metroCaption}
				<p class="metro-caption" data-testid="metro-caption" aria-hidden="true">
					{metroCaption}
				</p>
			{/if}
		</div>

		<div
			bind:this={heroTextContainer}
			class="hero-text-layer absolute inset-0 flex items-start justify-center opacity-0 md:items-center md:pb-[max(5svh,2.5rem)]"
			data-testid="hero-text-container"
		>
			<div class="w-full px-[var(--space-page-x)]">
				<div class="hero-grid">

					<HeroTextContent
						{headlineLine1}
						{headlineLine2}
						{headlineAriaSuffix}
						{subheadlineText}
						{subtitleText}
						{ctaWorkLabel}
						{ctaContactLabel}
						heroData={heroData}
						{live}
						{replayEnabled}
						beaconSettled={introCollapsed}
						beaconPulsing={introCollapsed || heroApproaching}
						{replayAriaLabel}
						onReplay={handleReplay}
					/>

					<div
						class="hidden self-stretch lg:block"
						data-hero-stagger="5"
					>
						<div class="hero-divider"></div>
					</div>

					<div class="hero-viewport-sql hidden lg:block">
						<div data-hero-stagger="4">
							<HeroSqlPanel
								rows={heroData.queryRows}
								queryTime={heroData.queryTime}
								{...sqlLabels}
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

		<p
			bind:this={scrollPrompt}
			class="scroll-prompt pointer-events-none absolute left-0 w-full text-center font-mono font-black uppercase leading-[0.95] text-primary md:whitespace-nowrap md:leading-none"
			style="--billboard-vw: {billboardVw}vw"
		>
			<span bind:this={scrollText}></span><span bind:this={scrollCursorEl} class="scroll-block-cursor typewriter-cursor" aria-hidden="true">&#x2588;</span>
		</p>
	</div>

	<HeroMobileSql
		heroData={heroData}
		labels={{ ...sqlLabels, updatedAgo, refreshLabel, refreshHelper }}
		onRefresh={handleRefresh}
	/>
</section>

<style>
	/* Reserve the trigger height plus its pin extension; mobile also needs the SQL tab and trailing buffer. */
	.hero-section-reserve {
		min-height: 450svh;
	}

	@media (--desktop-min) {
		.hero-section-reserve {
			min-height: 900svh;
		}
	}

	.hero-pin {
		height: 100lvh;
	}

	.hero-lamp {
		position: absolute;
		inset: 0;
		pointer-events: none;
		background-image: radial-gradient(120vw 100% at 50% 0%, color-mix(in srgb, var(--glow) 12%, transparent), transparent 60%);
	}

	/* CSS disables the intro and scroll reserve under reduced motion before hydration. */
	@media (prefers-reduced-motion: reduce) {
		.hero-section-reserve {
			min-height: 100svh;
		}

		.hero-pin {
			height: auto;
			min-height: 100svh;
		}

		.hero-metro-wrapper {
			display: none;
		}

		.scroll-prompt {
			display: none;
		}

		:global(.hero-section-reserve [data-testid='hero-text-container']) {
			opacity: 1 !important;
			position: relative !important;
		}
	}

	/* The collapsed hero is the SSR default; replay temporarily restores the full intro track. */
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

	/* Keep the caption in the wrapper's art-free bottom strip to prevent overlap at every breakpoint. */
	.metro-caption {
		position: absolute;
		left: 50%;
		transform: translateX(-50%);
		bottom: clamp(10px, 2.5vh, 28px);
		margin: 0;

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

	@media (--tablet-min) {
		.metro-caption {
			font-size: var(--text-micro);
		}
	}

	.hero-text-layer {
		width: 100%;
		padding-top: calc(var(--nav-clearance) + 1rem);
	}

	.hero-grid {
		display: grid;
		/* minmax(0, 1fr) removes the min-content floor that would clip the SQL panel on small laptops. */
		grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
		gap: 32px;
		align-items: start;
	}

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

	.scroll-prompt {
		font-size: 11.5vw;
		letter-spacing: -0.3vw;
		bottom: calc(100lvh - 100dvh);
	}

	@media (--tablet-min) {
		.scroll-prompt {

			font-size: var(--billboard-vw, 6.8vw);
			letter-spacing: -0.5vw;
			bottom: 0;
		}
	}

	@media (--desktop-max) {
		.hero-intro-done .hero-pin {
			min-height: 100svh;
		}
		.hero-text-layer {
			padding-bottom: 2rem;
		}
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
