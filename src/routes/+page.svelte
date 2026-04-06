<!--
  Home page: 8-stop metro journey (redesigned in slice 06d).

  Layout (all viewports):
    1. Fixed CSS gradient background + warm glow overlay
    2. Fixed right-rail overlay: thicker track, 8 station nodes, progressive fill
    3. Fixed SVG train with trailing glow
    4. Scrollable HTML content: hero, services, featured work, about bento, blog, CTA

  Stops:
    00 — Departure (Hero): 3D wagon + art bg + bold type
    01-04 — Services: station cards with Lottie, scroll-linked
    05 — Featured Work: project cards grid
    06 — Who's Driving: about bento grid
    07 — Dispatches: blog feed
    Terminal — CTA with social links

  Reduced motion: static gradient, no train, no scroll animations.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { services, siteMeta, TOTAL_STOPS, formatStopLabel, formatServicesLabel, getStopByType, ctaContent } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import { prefersReducedMotion } from '$lib/motion/stores';
	import { registerGsapPlugins, gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import ServiceStation from '$lib/components/ServiceStation.svelte';
	import HeroBanner from '$lib/components/HeroBanner.svelte';
	import FeaturedWork from '$lib/components/FeaturedWork.svelte';
	import AboutBento from '$lib/components/AboutBento.svelte';
	import BlogFeed from '$lib/components/BlogFeed.svelte';
	import GradientSeparator from '$lib/components/GradientSeparator.svelte';
	import SkillsJourney from '$lib/components/SkillsJourney.svelte';

	let localProgress = $state(0);
	let scrollWrapper: HTMLDivElement;
	let glowOverlay: HTMLDivElement;

	// TOTAL_STOPS imported from metro.ts — auto-computed from services + fixed sections

	// Service-specific active index: maps the service scroll range (stops 1–N)
	// to service indices. Services occupy a fraction of total scroll — normalize
	// progress to just the service portion so each card lights up at the right time.
	const serviceStartPct = 1 / (TOTAL_STOPS - 1);
	const serviceEndPct = (1 + services.length) / (TOTAL_STOPS - 1);

	let serviceActiveIndex = $derived(
		localProgress < serviceStartPct ? -1 : Math.min(
			services.length - 1,
			Math.floor(
				((localProgress - serviceStartPct) / (serviceEndPct - serviceStartPct)) * services.length
			)
		)
	);


	onMount(() => {
		registerGsapPlugins();
		const trigger = ScrollTrigger.create({
			trigger: scrollWrapper,
			start: 'top top',
			end: 'bottom bottom',
			onUpdate: (self: { progress: number }) => {
				localProgress = self.progress;
			}
		});

		return () => {
			trigger.kill();
		};
	});

	// Scroll-reactive warm glow
	$effect(() => {
		if (glowOverlay) {
			glowOverlay.style.opacity = String(localProgress * 0.08);
		}
	});
</script>

<svelte:head>
</svelte:head>

<div data-testid="app-root">
	<!-- Layer 1: Fixed CSS gradient background -->
	<div
		class="fixed inset-0 z-0 bg-gradient-to-b from-[#141414] via-[#1a1410] to-[#141414]"
		aria-hidden="true"
	></div>

	<!-- Warm glow overlay -->
	<div
		bind:this={glowOverlay}
		class="pointer-events-none fixed inset-0 z-0"
		style="background: radial-gradient(ellipse at 50% 60%, #E07800 0%, transparent 70%); opacity: 0;"
		aria-hidden="true"
	></div>

	<!-- Scrollable HTML Content -->
	<div bind:this={scrollWrapper} class="relative z-30">
		<!-- STOP 00: Hero / Departure (self-managed ScrollTrigger) -->
		<HeroBanner />

		<GradientSeparator label={formatServicesLabel()} />

		<!-- STOPS 01-04: Services -->
		{#each services as service, i (service.id)}
			<ServiceStation {service} index={i} active={i === serviceActiveIndex} />
		{/each}

		<GradientSeparator label={formatStopLabel(getStopByType('featured')!)} />

		<!-- STOP 05: Featured Work -->
		<FeaturedWork />

		<GradientSeparator label={formatStopLabel(getStopByType('about')!)} />

		<!-- STOP 06: Who's Driving (About Bento) -->
		<AboutBento />

		<GradientSeparator label={formatStopLabel(getStopByType('blog')!)} />

		<!-- STOP 07: Dispatches (Blog Feed) -->
		<BlogFeed />

		<GradientSeparator />

				<!-- Skills Journey: horizontal scroll CTA (Slice B) -->
				<SkillsJourney />

				<GradientSeparator />

		<!-- TERMINAL: CTA -->
		<section
			class="flex min-h-[60vh] flex-col items-center justify-center px-6 pr-10 md:pr-[72px] text-center"
			data-testid="section-terminal"
			use:reveal
		>
			<div class="rounded-xl border border-[#E07800] bg-[#141414]/85 p-12 shadow-[0_0_32px_rgba(224,120,0,0.15)] backdrop-blur-sm">
				<!-- Station label -->
				<div class="mb-6 font-mono text-xs tracking-[3px] text-[#E07800] md:text-sm">
					{formatStopLabel(getStopByType('terminal')!)}
				</div>

				<h2 class="font-heading text-3xl font-bold text-[var(--text-primary)] md:text-4xl">
					{@html resolveLocale(ctaContent.heading, 'en').replace('\n', '<br />')}<span class="text-[#E07800]">.</span>
				</h2>
				<p class="mx-auto mt-4 max-w-md text-sm text-[var(--text-secondary)]">
					{resolveLocale(ctaContent.subtitle, 'en')}
				</p>

				<div class="mt-8 flex flex-wrap justify-center gap-4">
					<a
						href="/contact"
						class="inline-flex items-center rounded-lg bg-[#E07800] px-6 py-3 font-semibold text-[#141414] transition-colors hover:bg-[#C96A00]"
						data-testid="cta-contact"
						use:magnetic={{ strength: 4, radius: 60 }}
					>
						{resolveLocale(ctaContent.ctaContact, 'en')}
					</a>
					<a
						href={siteMeta.links.github}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center rounded-lg border border-[var(--border)] px-6 py-3 font-semibold text-[var(--text-primary)] transition-colors hover:border-[#E07800] hover:text-[#E07800]"
						data-testid="cta-github"
						use:magnetic={{ strength: 4, radius: 60 }}
					>
						{resolveLocale(ctaContent.ctaGithub, 'en')}
					</a>
				</div>

				<!-- Social links -->
				<div class="mt-6 flex justify-center gap-6">
					{#if siteMeta.links.linkedin}
						<a href={siteMeta.links.linkedin} target="_blank" rel="noopener noreferrer" class="text-sm text-[var(--text-muted)] transition-colors hover:text-[#E07800]">LinkedIn</a>
					{/if}
					<a href={siteMeta.links.github} target="_blank" rel="noopener noreferrer" class="text-sm text-[var(--text-muted)] transition-colors hover:text-[#E07800]">GitHub</a>
					{#if siteMeta.links.upwork}
						<a href={siteMeta.links.upwork} target="_blank" rel="noopener noreferrer" class="text-sm text-[var(--text-muted)] transition-colors hover:text-[#E07800]">Upwork</a>
					{/if}
					<a href="mailto:{siteMeta.links.email}" class="text-sm text-[var(--text-muted)] transition-colors hover:text-[#E07800]">Email</a>
				</div>
			</div>
		</section>
	</div>
</div>
