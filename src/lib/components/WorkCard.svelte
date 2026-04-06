<!--
  Single project card for the /work listing page.
  Layout: gradient thumbnail → title → one-liner → service SVGs → tag pills.
  Full card is a link to /work/{slug}. Hover triggers border glow + SVG morph.
  Entrance via use:reveal with stagger delay from index.
-->
<script lang="ts">
	import type { Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import WorkSvgIcon from './WorkSvgIcon.svelte';

	let {
		project,
		serviceSvgContents = {},
		index = 0
	}: {
		project: Project;
		serviceSvgContents: Record<string, string>;
		index?: number;
	} = $props();

	let cardHovered = $state(false);

	// Show at most 4 tags to keep the card compact
	let displayTags = $derived(project.tags.slice(0, 4));

	// Gradient color based on the first related service's position in the palette
	// Creates visual variety across cards without requiring thumbnails
	const SERVICE_GRADIENTS: Record<string, [string, string]> = {
		'sql-development': ['#E07800', '#c06000'],
		'data-pipeline': ['#FFB627', '#d99a10'],
		'analytics-reporting': ['#E07800', '#FFB627'],
		'database-engineering': ['#c06000', '#E07800'],
		'internal-tooling': ['#d99a10', '#FFB627'],
		'web-development': ['#FFB627', '#E07800']
	};

	let gradientColors = $derived(
		SERVICE_GRADIENTS[project.relatedServices[0]] ?? ['#E07800', '#FFB627']
	);
</script>

<a
	href="/work/{project.slug}"
	class="work-card group block"
	data-testid="work-card"
	data-flip-id={project.slug}
	use:reveal={{ delay: stagger(index, 80) }}
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
>
	<article
		class="relative flex h-full flex-col overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] transition-all duration-300"
	>
		<!-- Gradient placeholder thumbnail -->
		<div
			class="flex h-[120px] items-center justify-center"
			style="background: linear-gradient(135deg, {gradientColors[0]}22, {gradientColors[1]}11);"
		>
			<!-- Show first service SVG in the thumbnail area if available -->
			{#if project.relatedServices[0] && serviceSvgContents[project.relatedServices[0]]}
				<div class="opacity-60 transition-opacity duration-300 group-hover:opacity-90">
					<WorkSvgIcon
						svgContent={serviceSvgContents[project.relatedServices[0]]}
						size={48}
						hovered={cardHovered}
					/>
				</div>
			{/if}
		</div>

		<!-- Content area -->
		<div class="flex flex-1 flex-col p-4">
			<!-- Title -->
			<h3 class="text-sm font-bold text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[#E07800] md:text-base">
				{resolveLocale(project.title, 'en')}
			</h3>

			<!-- One-liner -->
			<p class="mt-1.5 line-clamp-2 text-xs leading-relaxed text-[var(--text-secondary)] md:text-sm">
				{resolveLocale(project.oneLiner, 'en')}
			</p>

			<!-- Service SVG icons row -->
			{#if project.relatedServices.length > 0}
				<div class="mt-3 flex gap-1.5">
					{#each project.relatedServices as serviceId}
						{#if serviceSvgContents[serviceId]}
							<WorkSvgIcon
								svgContent={serviceSvgContents[serviceId]}
								size={20}
								hovered={cardHovered}
							/>
						{/if}
					{/each}
				</div>
			{/if}

			<!-- Tags as small pills -->
			<div class="mt-auto flex flex-wrap gap-1 pt-3">
				{#each displayTags as tag}
					<span
						class="rounded border border-[#E07800]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#E07800]"
					>
						{tag}
					</span>
				{/each}
			</div>
		</div>

		<!-- Subtle glow on hover -->
		<div
			class="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			style="box-shadow: 0 0 20px {gradientColors[0]}15; border: 1px solid {gradientColors[0]}40;"
		></div>
	</article>
</a>

<style>
	.work-card:hover article {
		border-color: color-mix(in srgb, #E07800 50%, transparent);
		box-shadow: 0 0 20px color-mix(in srgb, #E07800 10%, transparent);
	}
</style>
