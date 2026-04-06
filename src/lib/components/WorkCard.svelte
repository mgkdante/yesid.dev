<!--
  Single project card for the /work listing page.
  Layout: short gradient banner (120px) -> title -> description -> service badges
         -> tech stack inline diagram -> tag pills.
  Banner shows project image if available, otherwise a gradient with a subtle
  WorkSvgIcon at the right. Full card is a link to /work/{slug}.
  Hover triggers border glow + SVG morph. Entrance via use:reveal with stagger delay.
-->
<script lang="ts">
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { tilt } from '$lib/motion/actions/tilt.js';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
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

	// i18n labels — all user-facing strings go through LocalizedString so future
	// translations can be added without changing component logic.
	const stackLabel = { en: 'Tech Stack' };
	const servicesLabel = { en: 'Services' };
</script>

<a
	href="/work/{project.slug}"
	class="work-card group block"
	data-testid="work-card"
	data-flip-id={project.slug}
	data-batch="work-item"
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
>
	<article
		class="work-card-article relative overflow-hidden rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] transition-all duration-300"
		use:tilt={{ maxDeg: 1.5 }}
		use:cursorGlow
	>
		<!-- Gradient banner: short (120px), full-width. Image or gradient+icon fallback -->
		{#if project.image}
			<div class="h-[200px] overflow-hidden">
				<img
					src="/images/work/{project.image}"
					alt={resolveLocale(project.title, 'en')}
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
					loading="lazy"
				/>
			</div>
		{:else}
			<div
				class="flex h-[200px] items-center justify-end pr-6"
				style="background: linear-gradient(135deg, {gradientColors[0]}22, {gradientColors[1]}11);"
			>
				{#if project.relatedServices[0] && serviceSvgContents[project.relatedServices[0]]}
					<div class="opacity-30 transition-opacity duration-300 group-hover:opacity-50">
						<WorkSvgIcon
							svgContent={serviceSvgContents[project.relatedServices[0]]}
							size={72}
							hovered={cardHovered}
						/>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Content area — all content stacks naturally below the banner -->
		<div class="p-4">
			<!-- Title below the gradient, not overlaid -->
			<h3 class="text-base font-bold text-[var(--text-primary)] transition-colors duration-300 group-hover:text-[#E07800] md:text-lg">
				{resolveLocale(project.title, 'en')}
			</h3>

			<!-- Description -->
			<p class="mt-1.5 text-sm leading-relaxed text-[var(--text-secondary)]">
				{resolveLocale(project.oneLiner, 'en')}
			</p>

			<!-- Service badges row — SVGs with MorphSVG on card hover -->
			{#if projectServices.length > 0}
				<div class="mt-3">
					<div class="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)] md:text-[10px]">
						{resolveLocale(servicesLabel, 'en')}
					</div>
					<div class="flex flex-wrap gap-1.5">
					{#each projectServices as service}
						<div
							class="inline-flex items-center gap-2 rounded-full border bg-[#141414] px-3 py-1.5"
							style="border-color: rgba(224, 120, 0, 0.35);"
						>
							{#if serviceSvgContents[service.id]}
								<div class="service-badge-icon" aria-hidden="true">
									<WorkSvgIcon
										svgContent={serviceSvgContents[service.id]}
										size={28}
										hovered={cardHovered}
									/>
								</div>
							{/if}
							<span class="font-mono text-[10px] leading-tight text-[var(--text-primary)] md:text-xs">
								{resolveLocale(service.title, 'en')}
							</span>
						</div>
					{/each}
					</div>
				</div>
			{/if}

			<!-- Tech stack SVG diagram with DrawSVG animation -->
			{#if displayStack.length > 0}
				<div class="mt-3">
					<div class="mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)] md:text-[10px]">
						{resolveLocale(stackLabel, 'en')}
					</div>
					<DataFlowDiagram stack={displayStack} size="sm" />
					{#if project.stack.length > 5}
						<span class="mt-0.5 block font-mono text-[8px] text-[var(--text-muted)]">+{project.stack.length - 5} more</span>
					{/if}
				</div>
			{/if}

			<!-- Tags as small pills -->
			<div class="flex flex-wrap gap-1 pt-3">
				{#each displayTags as tag}
					<span
						class="rounded border border-[#E07800]/30 px-1.5 py-0.5 font-mono text-[10px] text-[#E07800]"
						use:magnetic={{ strength: 2, radius: 30 }}
					>
						{tag}
					</span>
				{/each}
			</div>
		</div>

		<!-- Subtle glow on hover -->
		<div
			class="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), {gradientColors[0]}0a, transparent 60%);"
		></div>
	</article>
</a>

<style>
	/* WHY: same hover pattern as BlogRow — subtle border glow + shadow,
	   no rotating gradient (that was visually distracting on cards) */
	.work-card:hover .work-card-article {
		border-color: color-mix(in srgb, #E07800 50%, transparent);
		box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	/* Strip WorkSvgIcon container border/bg when nested in card badges */
	.service-badge-icon :global(.work-svg-icon) {
		border: none;
		background: transparent;
		border-radius: 0;
	}
</style>
