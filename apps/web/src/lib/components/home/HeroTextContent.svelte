<!--
  HeroTextContent — Left column of the hero grid: headline, metrics, subheadline, CTAs.
  Parent coordinates scroll-driven animation via data-hero-stagger attributes.
-->
<script lang="ts">
	import { desktop } from '@yesid/ui/state';
	import { onMount } from 'svelte';
	import HeroMetrics from './HeroMetrics.svelte';
	import HeroDotAnnotation from './HeroDotAnnotation.svelte';
	import { CLICK_ME, getLettering } from './annotation-lettering';
	import { Button } from '@yesid/ui/button';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { trackAnalyticsEvent } from '#lib/analytics/client.ts';

	const locale = getLocale();
	import { pressBounce } from '@yesid/motion/actions';
	import type { HeroData } from '#lib/live/index.ts';
	let {
		headlineLine1,
		headlineLine2,
		headlineAriaSuffix,
		subheadlineText,
		subtitleText,
		ctaWorkLabel,
		ctaContactLabel,
		heroData,
		live = false,
		replayEnabled = false,
		beaconSettled = false,
		beaconPulsing = beaconSettled,
		replayAriaLabel = 'Replay intro',
		onReplay,
	}: {
		headlineLine1: string;
		headlineLine2: string;
		headlineAriaSuffix: string;
		subheadlineText: string;
		subtitleText: string;
		ctaWorkLabel: string;
		ctaContactLabel: string;
		heroData: HeroData;

		live?: boolean;
		replayEnabled?: boolean;
		/** Final geometry enables annotation positioning and redraw. */
		beaconSettled?: boolean;
		/** Pulse only when settled or approaching at small scale, never at full-screen zoom. */
		beaconPulsing?: boolean;
		/** aria-label for the armed dot (site_labels a11y.replayIntro). */
		replayAriaLabel?: string;
		/** Fired when the armed dot is clicked — HeroBanner replays the intro. */
		onReplay?: () => void;
	} = $props();
	const lettering = getLettering(CLICK_ME[locale]);
	const lastWordIndex = $derived(headlineLine1.lastIndexOf(' '));
	const headlineLead = $derived(headlineLine1.slice(0, lastWordIndex + 1));
	const headlineLastWord = $derived(headlineLine1.slice(lastWordIndex + 1));
	const finalWordIndex = $derived(headlineLine2.lastIndexOf(' '));
	const finalLineLead = $derived(headlineLine2.slice(0, finalWordIndex + 1));
	const finalWord = $derived(headlineLine2.slice(finalWordIndex + 1));
	let heading: HTMLDivElement;
	let headingWidth = $state(0);
	let headingHeight = $state(0);
	let arrow = $state('');
	let arrowHead = $state('');
	let annotationX = $state(0);
	let annotationY = $state(25);
	let annotationSlot: HTMLSpanElement;
	let annotationReady = $state(false);

	function alignArrow() {
		if (!heading || !beaconSettled) return;
		const box = heading.getBoundingClientRect();
		const dot = heading.querySelector('[data-testid="hero-dot"]')!.getBoundingClientRect();
		const x = dot.right - box.left + 8;
		const y = dot.top + dot.height / 2 - box.top;
		const inkRight = Math.max(...['hero-line1', 'hero-line2'].flatMap((id) => {
			const range = document.createRange();
			const text = document.createTreeWalker(heading.querySelector(`[data-testid="${id}"]`)!, NodeFilter.SHOW_TEXT);
			const rights: number[] = [];
			while (text.nextNode()) {
				if (!text.currentNode.textContent?.trim()) continue;
				range.selectNodeContents(text.currentNode);
				rights.push(...Array.from(range.getClientRects(), rect => rect.right - box.left));
			}
			return rights;
		}));
		let edge = Math.min(headingWidth - 8, Math.max(inkRight + 24, x + 48));
		if (!desktop.current) {
			const slot = annotationSlot.getBoundingClientRect();
			const lastWord = heading.querySelector('[data-testid="hero-line1-last"]')!.getBoundingClientRect();
			annotationX = Math.max(lastWord.right - box.left + 12,
				Math.min(headingWidth - lettering.width - 4, x - lettering.width - 12));
			annotationY = slot.top - box.top;
		} else {
			annotationX = Math.max(0, edge - lettering.width - 40);
			annotationY = 25;
		}
		const startX = annotationX + lettering.end.x + 1;
		const startY = annotationY + lettering.end.y;
		edge = Math.min(headingWidth - 8, Math.max(edge, startX + 20));
		const bendY = Math.max(startY + 18, y - 12);
		arrow = `M${startX} ${startY} C${Math.max(startX, edge - 16)} ${startY} ${edge} ${startY} ${edge} ${startY + 16} C${edge + 6} ${startY + 32} ${edge + 6} ${bendY - 16} ${edge} ${bendY} C${edge} ${y + 24} ${x + 25} ${y} ${x} ${y}`;
		arrowHead = `M${x + 9} ${y - 5} L${x} ${y} L${x + 9} ${y + 5}`;
	}

	$effect(() => {
		headingWidth; headingHeight; beaconSettled;
		alignArrow();
	});
	onMount(() => {
		const resize = () => { alignArrow(); };
		void (document.fonts?.ready ?? Promise.resolve()).then(() => { resize(); annotationReady = true; });
		window.addEventListener('resize', resize);
		return () => window.removeEventListener('resize', resize);
	});
</script>

<div class="hero-viewport-text">
	<div class="hero-heading" bind:this={heading} bind:clientWidth={headingWidth} bind:clientHeight={headingHeight}>
	<h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]" aria-label="{headlineLine1} {headlineAriaSuffix}">
		<span
			class="block text-[var(--foreground)]"
			data-testid="hero-line1"
			data-hero-stagger="1"
		>
			{headlineLead}<span class="hero-title-tail"><span data-testid="hero-line1-last">{headlineLastWord}</span><span class="annotation-slot" style="width: {lettering.width + 16}px" bind:this={annotationSlot} aria-hidden="true"></span></span>
		</span>
	</h1>

	<!-- Hide only the decorative text; an aria-hidden ancestor would hide the replay button too. -->
	<p class="font-heading font-black leading-[0.88] tracking-[-0.04em]">
		<span
			class="block text-[var(--primary)]"
			data-testid="hero-line2"
		>
			<span data-hero-stagger="1" aria-hidden="true">{finalLineLead}</span><span class="hero-dot-word"><span data-hero-stagger="1" data-testid="hero-line2-last" aria-hidden="true">{finalWord}</span><span class="hero-dot-anchor"><button
				type="button"
				class="hero-dot-btn {replayEnabled ? 'hero-dot-armed' : ''} {beaconPulsing && replayEnabled
					? 'hero-dot-settled'
					: ''}"
				data-testid="hero-dot-replay"
				disabled={!replayEnabled}
				aria-hidden={replayEnabled ? undefined : 'true'}
				aria-label={replayAriaLabel}
				onclick={() => onReplay?.()}
			><svg
					class="hero-dot"
					data-testid="hero-dot"
					viewBox="0 0 10 10"
					aria-hidden="true"
				><circle cx="5" cy="5" r="5" fill="currentColor" /></svg></button></span></span>
		</span>
	</p>

	<HeroDotAnnotation {lettering} width={headingWidth} height={headingHeight}
		x={annotationX} y={annotationY} {arrow} tip={arrowHead} visible={beaconSettled} ready={annotationReady} />
	</div>

	<!-- Keep the replay stagger order while placing metrics below the headline. -->
	<div class="my-6 md:my-6" data-hero-stagger="3">
		<HeroMetrics metrics={heroData.metrics} {live} />
	</div>

	<div
		class="mt-3 text-title font-bold leading-[1.1] text-[var(--secondary-foreground)] md:mt-2.5 md:text-[clamp(26px,min(3.5vw,4svh),44px)]"
		data-testid="hero-subheadline"
		data-hero-stagger="2"
	>
		{subheadlineText}
	</div>

	<p
		class="mt-5 text-reading leading-[1.7] text-[var(--secondary-foreground)] lg:text-reading-desktop"
		data-testid="hero-subtitle"
		data-hero-stagger="6"
	>
		{subtitleText}
	</p>

	<div class="mt-6 flex flex-wrap gap-3.5" data-hero-stagger="6">
		<span class="tap-press" use:pressBounce>
			<Button variant="default" size="cta-lg" href={localizeHref('/projects', locale)} data-testid="hero-cta-projects">
				{ctaWorkLabel}
			</Button>
		</span>
		<Button variant="conversion" size="cta-lg" href="https://cal.com/yesid-dev" target="_blank" rel="noopener" data-testid="hero-cta-contact" class="tap-press" onclick={() => trackAnalyticsEvent('booking_click')}>
			{ctaContactLabel}
		</Button>
	</div>
</div>

<style>
	.hero-heading {
		position: relative;
		padding-block: 3.5rem 1.75rem;
		padding-inline-end: 1.5rem;
	}
	.hero-dot-anchor { display: inline-block; line-height: 0; }
	.hero-dot-word { display: inline-block; white-space: nowrap; }
	.annotation-slot { display: none; }

	/* Keep the period glued to the headline and its SVG overflow visible so the heartbeat cannot clip. */
	.hero-dot {
		display: inline-block;
		/* The armed dot is the replay affordance: big enough to spot, still period-sized. */
		width: 0.22em;
		height: 0.22em;
		vertical-align: baseline;
		color: var(--primary);
		overflow: visible;
	}

	/* The button inherits glyph metrics to preserve the period's size and position. */
	.hero-dot-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: var(--size-tap-min);
		height: var(--size-tap-min);
		padding: 0;
		margin: calc((0.22em - var(--size-tap-min)) / 2);
		vertical-align: 0.03em;
		background: none;
		border: none;
		font: inherit;
		line-height: inherit;
		color: inherit;
		cursor: default;
		position: relative;
	}

	.hero-dot-armed {
		cursor: pointer;
	}
	.hero-dot-armed:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 6px;
		border-radius: 50%;
	}

	/* Transform-only pulses avoid layout shift; playback stays unavailable under reduced motion. */
	/* Resume the heartbeat during the final small-scale approach. It stays
	   off during the large metro zoom and is cleared before every rewind. */
	.hero-dot-settled .hero-dot {
		animation: hero-dot-pulse 1.5s ease-in-out infinite;
		transform-origin: center;
		will-change: transform;
		filter: drop-shadow(0 0 0.09em color-mix(in srgb, var(--glow) 95%, transparent))
			drop-shadow(0 0 0.28em color-mix(in srgb, var(--glow) 55%, transparent));
	}

	@keyframes hero-dot-pulse {
		0%,
		56%,
		100% {
			transform: scale(1);
		}

		14% {
			transform: scale(1.8);
		}
		28% {
			transform: scale(1);
		}
		42% {
			transform: scale(1.5);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-dot-settled .hero-dot {
			animation: hero-dot-pulse-reduce 1.8s ease-in-out infinite;
		}
	}

	@keyframes hero-dot-pulse-reduce {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	.hero-viewport-text { width: 100%; container-type: inline-size; }
	[data-testid="hero-line1"], [data-testid="hero-line2"] {
		font-size: clamp(min(2.25rem, 10cqi), min(12cqi, 9svh), 7rem);
	}

	/* Keep a strong fluid headline. Short screens and longer translations
	   may grow beyond one viewport without shrinking the heading. */
	@media (--desktop-max) {
		.hero-heading { padding-top: 0; }
		.hero-heading > h1 { margin-bottom: 0.5rem; }
		.hero-title-tail { display: inline-block; white-space: nowrap; }
		.annotation-slot { display: inline-block; height: 0; vertical-align: baseline; }
		.hero-viewport-text {
			min-height: calc(100svh - var(--nav-clearance) - 3rem);
			display: flex;
			flex-direction: column;
			justify-content: center;
			max-width: 44rem;
			margin-inline: auto;
			padding-block: 0.5rem;
		}
		[data-testid="hero-line1"], [data-testid="hero-line2"] {
			font-size: clamp(min(2.5rem, 10cqi), min(16cqi, 9svh), 7rem);
		}
		/* Tighten the inter-element spacing to reclaim vertical budget. */
		.hero-viewport-text :global([data-hero-stagger="3"]) {
			margin-block: 0.5rem;
		}
		.hero-viewport-text :global([data-testid="hero-subheadline"]) {
			margin-top: 0.375rem;
			font-size: clamp(1.2rem, 5vw, 1.5rem);
			line-height: 1.12;
		}
		.hero-viewport-text :global([data-testid="hero-subtitle"]) {
			margin-top: 0.5rem;
		}
		/* The CTA row (the only flex descendant tagged stagger 6) — tighten the
		   top gap + inter-button gap, and the button block padding, so both
		   CTAs stay on-screen. */
		.hero-viewport-text :global([data-hero-stagger="6"].flex) {
			margin-top: 0.75rem;
			gap: 0.625rem;
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
		.hero-viewport-text :global([data-testid="hero-cta-projects"]),
		.hero-viewport-text :global([data-testid="hero-cta-contact"]) {
			padding-top: 0.7rem;
			padding-bottom: 0.7rem;
			width: 100%;
			height: 100%;
			white-space: normal;
			text-align: center;
			padding-inline: 0.75rem;
		}
	}

	/* Sub-660px-tall phones (e.g. 320x640) carrying the longer FR copy need a
	   touch more shaved so nothing clips. iPhone SE (667) and Galaxy S23 (780)
	   are above this floor and unaffected. */
	@media (--tablet-max) and (max-height: 660px) {
		.hero-heading { padding-block: 0 1.25rem; }
		.hero-viewport-text :global([data-hero-stagger="3"]) {
			margin-block: 0.375rem;
		}
		.hero-viewport-text :global([data-testid^="hero-cta-"]) {
			width: 100%;
			height: 100%;
			min-height: 44px;
			padding-inline: 0.5rem;
			font-size: 0.875rem;
			white-space: normal;
			text-align: center;
		}
	}

	@media (--tablet-min) and (--desktop-max) {
		.hero-viewport-text :global([data-testid="hero-line1"]),
		.hero-viewport-text :global([data-testid="hero-line2"]),
		.hero-viewport-text :global([data-testid="hero-subheadline"]),
		.hero-viewport-text :global([data-testid="hero-subtitle"]) {
			overflow-wrap: normal;
			word-break: normal;
			hyphens: none;
		}
		.hero-viewport-text :global([data-testid="hero-subheadline"]) {
			font-size: clamp(1.625rem, calc(4vw - 0.25rem), 2.375rem);
		}
	}
	@media (max-height: 720px) and (--tablet-min) {
		.hero-viewport-text :global([data-hero-stagger="3"]) { margin-block: 0.75rem; }
		.hero-viewport-text :global([data-testid="hero-subtitle"]) { margin-top: 0.75rem; }
	}
</style>
