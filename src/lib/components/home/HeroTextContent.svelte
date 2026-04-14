<!--
  HeroTextContent — Left column of the hero grid: headline, metrics, subheadline, CTAs.
  Parent coordinates scroll-driven animation via data-hero-stagger attributes.
-->
<script lang="ts">
	import HeroMetrics from './HeroMetrics.svelte';
	import { Button } from '$lib/components/ui/button';
	import type { HeroData } from '$lib/data';

	let {
		headlineLine1,
		subheadlineText,
		subtitleText,
		ctaWorkLabel,
		ctaContactLabel,
		heroData,
	}: {
		headlineLine1: string;
		subheadlineText: string;
		subtitleText: string;
		ctaWorkLabel: string;
		ctaContactLabel: string;
		heroData: HeroData;
	} = $props();
</script>

<div class="hero-viewport-text">
	<h1 class="font-heading font-black leading-[0.88] tracking-[-0.04em]" aria-label="{headlineLine1} Don't Break.">
		<span
			class="block text-hero text-[var(--foreground)]"
			data-testid="hero-line1"
			data-hero-stagger="1"
		>
			{headlineLine1}
		</span>
	</h1>

	<div class="my-6 md:my-6" data-hero-stagger="3">
		<HeroMetrics metrics={heroData.metrics} />
	</div>

	<p class="font-heading font-black leading-[0.88] tracking-[-0.04em]" aria-hidden="true">
		<span
			class="block text-hero text-[var(--primary)]"
			data-testid="hero-line2"
		>
			<span data-hero-stagger="1">DON'T BREAK</span><svg
				class="hero-dot"
				data-testid="hero-dot"
				viewBox="0 0 10 10"
				aria-hidden="true"
			><circle cx="5" cy="5" r="5" fill="currentColor" /></svg>
		</span>
	</p>

	<div
		class="mt-3 text-title font-bold leading-[1.1] text-[var(--secondary-foreground)] md:mt-2.5 md:text-[clamp(26px,min(3.5vw,4svh),44px)]"
		data-testid="hero-subheadline"
		data-hero-stagger="2"
	>
		{subheadlineText}
	</div>

	<p
		class="mt-5 text-body-lg leading-[1.7] text-[var(--secondary-foreground)] md:text-heading"
		data-testid="hero-subtitle"
		data-hero-stagger="6"
	>
		{subtitleText}
	</p>

	<div class="mt-6 flex flex-wrap gap-3.5" data-hero-stagger="6">
		<Button variant="default" size="cta-lg" href="/projects" data-testid="hero-cta-projects">
			{ctaWorkLabel}
		</Button>
		<Button variant="outline" size="cta-lg" href="/contact" data-testid="hero-cta-contact">
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

	/* Mobile: single-column viewport */
	@media (max-width: 768px) {
		.hero-viewport-text {
			min-height: 100dvh;
			display: flex;
			flex-direction: column;
			justify-content: center;
			padding-block: 2rem;
		}
	}
</style>
