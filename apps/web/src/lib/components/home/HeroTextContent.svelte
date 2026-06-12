<!--
  HeroTextContent — Left column of the hero grid: headline, metrics, subheadline, CTAs.
  Parent coordinates scroll-driven animation via data-hero-stagger attributes.
-->
<script lang="ts">
	import HeroMetrics from './HeroMetrics.svelte';
	import { Button } from '$lib/components/ui/button';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { pressBounce } from '$lib/motion/actions';
	import type { HeroData } from '$lib/content';
	let {
		headlineLine1,
		headlineAriaSuffix,
		subheadlineText,
		subtitleText,
		ctaWorkLabel,
		ctaContactLabel,
		heroData,
		introCompleted = false,
		replayAriaLabel = 'Replay intro',
		onReplay,
	}: {
		headlineLine1: string;
		headlineAriaSuffix: string;
		subheadlineText: string;
		subtitleText: string;
		ctaWorkLabel: string;
		ctaContactLabel: string;
		heroData: HeroData;
		/** go2/w5: arms the hero-dot replay button once the intro completed. */
		introCompleted?: boolean;
		/** aria-label for the armed dot (site_labels a11y.replayIntro). */
		replayAriaLabel?: string;
		/** Fired when the armed dot is clicked — HeroBanner replays the intro. */
		onReplay?: () => void;
	} = $props();
</script>

<div class="hero-viewport-text">
	<h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]" aria-label="{headlineLine1} {headlineAriaSuffix}">
		<span
			class="block text-hero-mobile text-[var(--foreground)] md:text-hero"
			data-testid="hero-line1"
			data-hero-stagger="1"
		>
			{headlineLine1}
		</span>
	</h1>

	<!-- go2/w5: aria-hidden moved from the <p> to the text span — the replay
	     button inside must stay reachable by AT once armed (an aria-hidden
	     ancestor would hide it). The h1 above still carries the full phrase. -->
	<p class="font-heading font-black leading-[0.88] tracking-[-0.04em]">
		<span
			class="block text-hero-mobile text-[var(--primary)] md:text-hero"
			data-testid="hero-line2"
		>
			<span data-hero-stagger="1" aria-hidden="true">DON'T BREAK</span><button
				type="button"
				class="hero-dot-btn {introCompleted ? 'hero-dot-armed' : ''}"
				data-testid="hero-dot-replay"
				disabled={!introCompleted}
				aria-hidden={introCompleted ? undefined : 'true'}
				aria-label={introCompleted ? replayAriaLabel : undefined}
				onclick={() => onReplay?.()}
			><svg
					class="hero-dot"
					data-testid="hero-dot"
					viewBox="0 0 10 10"
					aria-hidden="true"
				><circle cx="5" cy="5" r="5" fill="currentColor" /></svg></button>
		</span>
	</p>

	<!--
	  Metric cards sit BELOW the headline "PIPELINES THAT DON'T BREAK." —
	  previously they slotted between line 1 and line 2 which broke the visual
	  flow of the two-line headline. data-hero-stagger="3" preserved so the
	  GSAP reveal timeline keeps the same step-3 order regardless of DOM order.
	-->
	<div class="my-6 md:my-6" data-hero-stagger="3">
		<HeroMetrics metrics={heroData.metrics} />
	</div>

	<div
		class="mt-3 text-title font-bold leading-[1.1] text-[var(--secondary-foreground)] md:mt-2.5 md:text-[clamp(26px,min(3.5vw,4svh),44px)]"
		data-testid="hero-subheadline"
		data-hero-stagger="2"
	>
		{subheadlineText}
	</div>

	<p
		class="mt-5 text-subheading leading-[1.7] text-[var(--secondary-foreground)] md:text-heading"
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
		<Button variant="outline" size="cta-lg" href={localizeHref('/contact', locale)} data-testid="hero-cta-contact" class="tap-press">
			{ctaContactLabel}
		</Button>
	</div>
</div>

<style>
	/* SVG period dot — replaces text "." for pixel-perfect zoom center.
	   Sized in em so it scales with the heading font-size. */
	.hero-dot {
		display: inline-block;
		width: 0.19em;
		height: 0.19em;
		vertical-align: baseline;
		margin-bottom: 0.03em;
		color: var(--primary);
	}

	/* go2/w5: the dot rides inside a button so the completed intro can be
	   replayed. The reset keeps the glyph metrics identical to the bare svg
	   (font/line-height inherit → the 0.19em sizing is unchanged). */
	.hero-dot-btn {
		display: inline;
		padding: 0;
		margin: 0;
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
	/* Generous invisible hit area (~44px) without any layout shift. */
	.hero-dot-armed::after {
		content: '';
		position: absolute;
		inset: -14px;
	}
	.hero-dot-armed:focus-visible {
		outline: 2px solid var(--ring);
		outline-offset: 6px;
		border-radius: 50%;
	}

	/* Operator-specified SAFE-ALWAYS tier: opacity-only pulse, indefinite —
	   it IS the replay affordance cue, so it keeps running under
	   prefers-reduced-motion (assistive, not vestibular). */
	.hero-dot-armed .hero-dot {
		animation: hero-dot-pulse 1.8s ease-in-out infinite;
	}

	@keyframes hero-dot-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.35;
		}
	}

	/* Mobile: text + buttons MUST fit in 100svh - nav.
	   Height is a hard constraint; text scales proportionally via svh *and* vw
	   so "PIPELINES" doesn't overflow the viewport width on narrow phones. */
	@media (max-width: 768px) {
		.hero-viewport-text {
			height: calc(100svh - 5rem);
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding-block: 0.75rem;
		}
		/* Font sizing now driven by the --text-hero-mobile token (Tailwind
		   .text-hero-mobile utility, applied in the template).  No scoped
		   override needed — see app.css @theme. */
		/* Tighten spacing to fit within bounded height */
		.hero-viewport-text :global([data-hero-stagger="3"]) {
			margin-block: 0.75rem;
		}
		.hero-viewport-text :global([data-testid="hero-subheadline"]) {
			margin-top: 0.5rem;
		}
		.hero-viewport-text :global([data-testid="hero-subtitle"]) {
			margin-top: 0.75rem;
		}
	}
</style>
