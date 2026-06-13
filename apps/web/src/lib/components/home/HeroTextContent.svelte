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
		ringsArmed = false,
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
		/** Beacon rings render only in SETTLED completed geometry (armed AND
		    collapsed) — during a replay the GSAP zoom scales this same svg to
		    ~213×, and rings living inside it would blow up with it. */
		ringsArmed?: boolean;
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
				><circle cx="5" cy="5" r="5" fill="currentColor" />{#if ringsArmed}<circle
							class="hero-dot-ring"
							cx="5"
							cy="5"
							r="5"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							vector-effect="non-scaling-stroke"
						/><circle
							class="hero-dot-ring hero-dot-ring--late"
							cx="5"
							cy="5"
							r="5"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							vector-effect="non-scaling-stroke"
						/>{/if}</svg></button>
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

	<!-- Round 5c doctrine: orange = deep dive (projects); yellow = the single
	     "talk to Yesid" conversion action in this view (contact). -->
	<div class="mt-6 flex flex-wrap gap-3.5" data-hero-stagger="6">
		<span class="tap-press" use:pressBounce>
			<Button variant="default" size="cta-lg" href={localizeHref('/projects', locale)} data-testid="hero-cta-projects">
				{ctaWorkLabel}
			</Button>
		</span>
		<Button variant="conversion" size="cta-lg" href={localizeHref('/contact', locale)} data-testid="hero-cta-contact" class="tap-press">
			{ctaContactLabel}
		</Button>
	</div>
</div>

<style>
	/* SVG period dot — replaces text "." for pixel-perfect zoom center.
	   Sized in em so it scales with the heading font-size. The markup keeps
	   it whitespace-glued to "DON'T BREAK" (no soft-wrap point), so it always
	   renders as that headline's period — never a lone dot on its own line.
	   overflow:visible (go2/w5 taste-2): the heartbeat scales the element, so
	   the circle must never be edge-clipped by the svg viewport at any
	   breakpoint/zoom rounding. */
	.hero-dot {
		display: inline-block;
		/* go2 beacon pass: 0.19em → 0.22em — the armed dot is the page's one
		   replay affordance and must read from across the room. Still period-
		   proportioned; the intro zoom only over-covers with a bigger glyph. */
		width: 0.22em;
		height: 0.22em;
		vertical-align: baseline;
		margin-bottom: 0.03em;
		color: var(--primary);
		overflow: visible;
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

	/* go2/w5 taste-2: HEARTBEAT pulse — a strong, unmistakable double-beat
	   scale (lub-dub, then rest). transform only: zero layout shift, and the
	   element-level scale can never clip the circle (the svg viewport scales
	   with it, overflow stays visible). Arming requires the intro to have
	   PLAYED, which reduced motion never does — and the reduce tier below
	   still swaps scale for the round-1 opacity pulse as belt-and-suspenders
	   (the affordance cue is assistive, so it keeps running). */
	/* go2 beacon pass: SUPER-obvious tier — the heartbeat doubles its punch
	   and the dot wears a sodium glow; the rings below radiate the metro
	   "you are here" ping. The glow is em-scaled so desktop and mobile read
	   identically loud. */
	.hero-dot-armed .hero-dot {
		animation: hero-dot-pulse 1.5s ease-in-out infinite;
		transform-origin: center;
		will-change: transform, filter;
		filter: drop-shadow(0 0 0.09em color-mix(in srgb, var(--primary) 95%, transparent))
			drop-shadow(0 0 0.28em color-mix(in srgb, var(--primary) 55%, transparent));
	}

	@keyframes hero-dot-pulse {
		0%,
		56%,
		100% {
			transform: scale(1);
		}
		/* Operator trim: the glow + rings carry the highlight — the beat
		   itself steps back a notch (was 2.1 / 1.65). */
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

	/* Station-beacon rings — two staggered pings expanding from the dot's
	   edge and fading out. They live INSIDE the svg (overflow: visible) so
	   they stay pixel-centered on the dot at every font size; non-scaling
	   stroke keeps the line weight constant as they grow. They inherit the
	   svg's heartbeat scale, so each ping surges with the beat — on purpose. */
	.hero-dot-ring {
		transform-box: fill-box;
		transform-origin: center;
		opacity: 0;
		animation: hero-dot-ring 2.4s cubic-bezier(0.2, 0.55, 0.35, 1) infinite;
		pointer-events: none;
	}

	.hero-dot-ring--late {
		animation-delay: 1.2s;
	}

	@keyframes hero-dot-ring {
		0% {
			transform: scale(1);
			opacity: 0.9;
		}
		70%,
		100% {
			transform: scale(4.6);
			opacity: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.hero-dot-armed .hero-dot {
			animation: hero-dot-pulse-reduce 1.8s ease-in-out infinite;
		}
		/* Reduce tier: no expansion — one static halo breathing in opacity
		   (fades are SAFE-ALWAYS; the affordance cue stays assistive). */
		.hero-dot-ring {
			animation: hero-dot-halo 1.8s ease-in-out infinite;
			transform: scale(2.4);
		}
		.hero-dot-ring--late {
			display: none;
		}
	}

	@keyframes hero-dot-halo {
		0%,
		100% {
			opacity: 0.55;
		}
		50% {
			opacity: 0.15;
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
