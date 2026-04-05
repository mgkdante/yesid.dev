<!--
  A station section in the home page train journey, styled as a transit station sign.
  Composes: station number, indicator light, Lottie (scroll-linked), title, description,
  related project cards. Each station gets its own GSAP ScrollTrigger for Lottie scrubbing.

  Data-driven: renders whatever the Service object contains. Station number is derived
  from the index prop (index + 1, zero-padded). No hardcoded station counts.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Service, Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { getProjectBySlug } from '$lib/data/projects.js';
	import { registerGsapPlugins, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { tilt } from '$lib/motion/actions/tilt.js';
	import { boop } from '$lib/motion/actions/boop.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import SectionHeader from './SectionHeader.svelte';
	import ProjectCard from './ProjectCard.svelte';
	import LottiePlayer from '$lib/motion/components/LottiePlayer.svelte';

	let {
		service,
		index,
		active = false
	}: {
		service: Service;
		index: number;
		/** Whether this station's indicator light is on. Controlled by parent. */
		active?: boolean;
	} = $props();

	// Station number: zero-padded, derived from array index. Never hardcoded.
	let stationNumber = $derived(String(index + 1).padStart(2, '0'));

	// Resolve localized strings (English for now).
	let title = $derived(resolveLocale(service.title, 'en'));
	let description = $derived(resolveLocale(service.description, 'en'));

	// Type guard to narrow undefined out of the filter result
	function isDefined(p: Project | undefined): p is Project {
		return p != null;
	}

	// Resolve related projects — filter out private, non-existent, and undefined slugs
	let relatedProjects = $derived(
		service.relatedProjects
			.map((slug) => getProjectBySlug(slug))
			.filter(isDefined)
			.filter((p) => p.status !== 'private')
	);

	// Lottie scroll progress (0-1), driven by per-station ScrollTrigger
	let lottieProgress = $state(0);

	let sectionEl: HTMLElement;

	onMount(() => {
		if (isPrefersReducedMotion()) return;

		registerGsapPlugins();

		// Per-station ScrollTrigger drives Lottie scrub progress.
		// Tighter range: Lottie completes by the time the section center
		// reaches the viewport center, so animations like the speed gauge max out
		// while the user is viewing the station, not after scrolling past it.
		const trigger = ScrollTrigger.create({
			trigger: sectionEl,
			start: 'top 80%',
			end: 'center center',
			onUpdate: (self: { progress: number }) => {
				lottieProgress = self.progress;
			}
		});

		return () => {
			trigger.kill();
		};
	});
</script>

<section
	bind:this={sectionEl}
	class="relative mx-auto flex min-h-[70vh] max-w-5xl flex-col justify-center px-6 py-16 pr-10 md:pr-[72px]"
	data-testid="station-{service.id}"
	use:reveal
>
	<!-- Station sign card wrapper — border glows orange when active (rail connects) -->
	<div
		class="overflow-hidden rounded-lg border bg-[#1a1a1a] transition-all duration-500
			{active
				? 'border-[#E07800] shadow-[0_0_16px_rgba(224,120,0,0.25)]'
				: 'border-[#2a2a2a]'}"
		use:tilt={{ maxDeg: 1.5, perspective: 800 }}
	>
		<!-- Header bar: dark bg, 2px orange bottom border -->
		<div class="flex items-center gap-3 border-b-2 border-b-[#E07800] bg-[#1e1e1e] px-6 py-4">
			<!-- Station number in mono font -->
			<span
				class="font-mono text-lg font-bold text-[#E07800]"
				data-testid="station-number"
			>
				{stationNumber}
			</span>

			<!-- Divider -->
			<div class="h-5 w-px bg-[#333]"></div>

			<!-- Station title -->
			<SectionHeader {title} />

			<!-- Spacer -->
			<div class="flex-1"></div>

			<!-- Indicator light: circle in upper-right, glows orange when active -->
			<div
				data-testid="station-indicator"
				class="h-3.5 w-3.5 rounded-full border transition-all duration-300
					{active
						? 'border-[#E07800] bg-[#E07800] shadow-[0_0_12px_#E07800,0_0_24px_rgba(224,120,0,0.3)]'
						: 'border-[#444] bg-[#222]'}"
			></div>
		</div>

		<!-- Card body -->
		<div class="p-6 md:p-8">
			<!-- Lottie station animation: 400x400, scroll-linked -->
			{#if service.icon}
				<div
					class="mx-auto aspect-square w-full max-w-[400px]"
					data-testid="station-lottie"
				>
					<LottiePlayer
						src="/lottie/{service.icon}"
						scrub={true}
						progress={lottieProgress}
						reverse={service.lottieReverse ?? false}
					/>
				</div>
			{/if}

			<p class="max-w-2xl leading-relaxed text-[var(--text-secondary)]">
				{description}
			</p>

			<!-- Related project cards -->
			{#if relatedProjects.length > 0}
				<div class="mt-8 grid gap-4 sm:grid-cols-2">
					{#each relatedProjects as project (project.slug)}
						<ProjectCard
							slug={project.slug}
							title={resolveLocale(project.title, 'en')}
							oneLiner={resolveLocale(project.oneLiner, 'en')}
							tags={project.stack}
							status={project.status}
						/>
					{/each}
				</div>
			{/if}
		</div>
	</div>
</section>
