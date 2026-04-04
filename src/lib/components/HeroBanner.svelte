<!--
  Hero banner: split layout with bold typography left, scroll-linked video right.
  Three layers:
    1. Transparent — lets the fixed gradient from +page.svelte show through
    2. Content: badge, headline, subtitle, CTAs, SQL decoration
    3. Contained video card: art background + scroll-linked video in a rounded box

  The video component maps scrollProgress to <video>.currentTime for a
  cinematic scroll-linked playback effect.
-->
<script lang="ts">
	import { heroContent, formatStopLabel, getStopByType } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import HeroVideoCard from './HeroVideoCard.svelte';
	import ScrollPrompt from './ScrollPrompt.svelte';

	// Resolve hero content for current locale
	const badge = resolveLocale(heroContent.badge, 'en');
	const h1 = resolveLocale(heroContent.headline.line1, 'en');
	const h2 = resolveLocale(heroContent.headline.line2, 'en');
	const h3 = resolveLocale(heroContent.headline.line3, 'en');
	const subtitle = resolveLocale(heroContent.subtitle, 'en');
	const ctaWork = resolveLocale(heroContent.ctaWork, 'en');
	const ctaContact = resolveLocale(heroContent.ctaContact, 'en');
	const sql1 = resolveLocale(heroContent.sqlDecoration.line1, 'en');
	const sql2 = resolveLocale(heroContent.sqlDecoration.line2, 'en');
	const departureLabel = formatStopLabel(getStopByType('hero')!);

	let {
		scrollProgress = 0
	}: {
		scrollProgress?: number;
	} = $props();
</script>

<section
	class="relative flex min-h-screen items-start overflow-hidden pt-24 md:items-center md:pt-0"
	data-testid="hero-banner"
>
	<!-- No opaque background — the fixed gradient from +page.svelte shows through -->

	<!-- Content: flex-col on mobile (text then card), flex-row on desktop -->
	<div class="relative z-20 mx-auto flex w-full max-w-5xl flex-col items-center gap-8 px-6 pr-10 md:flex-row md:items-center md:gap-12 md:pr-[72px]">

		<!-- Left side: text content -->
		<div class="flex-1">
			<!-- "AVAILABLE FOR HIRE" badge -->
			<div class="mb-8" use:reveal={{ delay: 0 }}>
				<span
					class="inline-flex items-center gap-2 rounded-full bg-[#E07800] px-4 py-1.5 text-xs font-bold tracking-wide text-[#141414] shadow-[0_0_20px_rgba(224,120,0,0.4)]"
					data-testid="hire-badge"
				>
					<span class="h-2 w-2 animate-pulse rounded-full bg-[#141414]"></span>
					{badge}
				</span>
			</div>

			<!-- Station label -->
			<div
				class="mb-4 font-mono text-xs tracking-[3px] text-[#E07800] md:text-sm"
				use:reveal={{ delay: 100 }}
			>
				{departureLabel}
			</div>

			<!-- Headline -->
			<div use:reveal={{ delay: 200 }}>
				<h1 class="font-heading text-5xl font-black leading-[0.95] tracking-tight text-[var(--text-primary)] md:text-7xl lg:text-8xl">
					{h1}<br />
					{h2}<span class="text-[#E07800]">.</span><br />
					<span class="text-3xl font-extrabold text-[#E07800] md:text-5xl lg:text-6xl">{h3}</span>
				</h1>
			</div>

			<!-- Subtitle -->
			<p
				class="mt-6 max-w-md text-base leading-relaxed text-[var(--text-secondary)] md:text-lg"
				use:reveal={{ delay: 300 }}
			>
				{subtitle}
			</p>

			<!-- CTA buttons -->
			<div class="mt-8 flex flex-wrap gap-3" use:reveal={{ delay: 400 }}>
				<a
					href="/work"
					class="inline-flex items-center rounded-lg bg-[#E07800] px-6 py-3 text-sm font-bold text-[#141414] transition-colors hover:bg-[#C96A00]"
					data-testid="cta-work"
					use:magnetic={{ strength: 4, radius: 60 }}
				>
					{ctaWork}
				</a>
				<a
					href="/contact"
					class="inline-flex items-center rounded-lg border border-[#3a3a3a] px-6 py-3 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:border-[#E07800] hover:text-[#E07800]"
					data-testid="cta-contact"
					use:magnetic={{ strength: 4, radius: 60 }}
				>
					{ctaContact}
				</a>
			</div>

			<!-- SQL decoration -->
			<div
				class="mt-12 font-mono text-sm leading-relaxed text-[#888] md:text-base"
				aria-hidden="true"
				use:reveal={{ delay: 500, direction: 'left' }}
			>
				{sql1}<br />
				{sql2}
			</div>

			<!-- Scroll prompt -->
			<div class="mt-8">
				<ScrollPrompt />
			</div>
		</div>

		<!-- Right side: contained video card (visible on all viewports) -->
		<div class="w-full max-w-lg md:w-[55%] md:flex-shrink-0" use:reveal={{ delay: 300 }}>
			<div class="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[#2a2a2a]/50 shadow-[0_0_40px_rgba(224,120,0,0.08)]">
				<!-- Art background inside card (clipped to rounded corners) -->
				<div class="absolute inset-0 overflow-hidden rounded-2xl">
					<div
						class="absolute inset-0"
						style="
							background-image: url('/images/hero-station-art.webp');
							background-size: cover;
							background-position: center;
						"
					>
						<div class="absolute inset-0 bg-[#141414]/30"></div>
					</div>
				</div>

				<!-- Scroll-linked video + code overlays -->
				<HeroVideoCard
					{scrollProgress}
					reducedMotion={$prefersReducedMotion}
				/>
			</div>
		</div>
	</div>
</section>
