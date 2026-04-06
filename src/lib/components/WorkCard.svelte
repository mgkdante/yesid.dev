<!--
  Single project card for the /work listing page.
  Layout: gradient thumbnail (tall) -> title -> one-liner -> service badges (SVG + name)
         -> tech stack inline diagram -> tag pills.
  Full card is a link to /work/{slug}. Hover triggers border glow + SVG morph.
  Entrance via use:reveal with stagger delay from index.
-->
<script lang="ts">
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import WorkSvgIcon from './WorkSvgIcon.svelte';
	import DataFlowDiagram from './DataFlowDiagram.svelte';

	let {
		project,
		services = [],
		serviceSvgContents = {},
		index = 0
	}: {
		project: Project;
		services?: readonly Service[];
		serviceSvgContents: Record<string, string>;
		index?: number;
	} = $props();

	let cardHovered = $state(false);

	// Show at most 4 tags to keep the card compact
	let displayTags = $derived(project.tags.slice(0, 4));

	// Show at most 5 stack items in the inline diagram to keep cards compact
	let displayStack = $derived(project.stack.slice(0, 5));

	// Resolve service objects for this project so we can show title labels
	let projectServices = $derived(
		project.relatedServices
			.map((id) => services.find((s) => s.id === id))
			.filter((s): s is Service => !!s)
	);

	// Gradient color based on the first related service's position in the palette.
	// Creates visual variety across cards without requiring thumbnails.
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

	// i18n label for tech stack section
	const stackLabel = { en: 'Tech Stack' };
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
		<!-- Gradient placeholder thumbnail — taller for future screenshots -->
		<div
			class="flex h-[170px] items-center justify-center"
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

			<!-- Service badges row — SVGs with MorphSVG on card hover -->
			{#if projectServices.length > 0}
				<div class="mt-3 flex flex-wrap gap-1.5">
					{#each projectServices as service}
						<div
							class="inline-flex items-center gap-1.5 rounded-full border bg-[#141414] px-2 py-0.5"
							style="border-color: rgba(224, 120, 0, 0.35);"
						>
							{#if serviceSvgContents[service.id]}
								<div class="service-badge-icon" aria-hidden="true">
									<WorkSvgIcon
										svgContent={serviceSvgContents[service.id]}
										size={20}
										hovered={cardHovered}
									/>
								</div>
							{/if}
							<span class="font-mono text-[9px] leading-tight text-[var(--text-primary)] md:text-[10px]">
								{resolveLocale(service.title, 'en')}
							</span>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Tech stack SVG diagram with DrawSVG animation -->
			{#if displayStack.length > 0}
				<div class="mt-3">
					<div class="mb-1 font-mono text-[8px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
						{resolveLocale(stackLabel, 'en')}
					</div>
					<DataFlowDiagram stack={displayStack} size="sm" />
					{#if project.stack.length > 5}
						<span class="mt-0.5 block font-mono text-[8px] text-[var(--text-muted)]">+{project.stack.length - 5} more</span>
					{/if}
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

	/* Strip WorkSvgIcon container border/bg when nested in card badges */
	.service-badge-icon :global(.work-svg-icon) {
		border: none;
		background: transparent;
		border-radius: 0;
	}
</style>
