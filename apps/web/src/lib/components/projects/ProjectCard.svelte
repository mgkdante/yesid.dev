<!--
  Single project card for the /projects listing page.
  Layout: short gradient banner (120px) -> title -> description -> service badges
         -> tech stack inline diagram -> tag pills.
  Banner shows project image if available, otherwise a gradient with a subtle
  SvgIcon at the right. Full card is a link to /projects/{slug}.
  Hover triggers border glow + SVG morph. No entrance animation — Snappy Doctrine (17e-2).
-->
<script lang="ts">
	import type { Project, Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { magnetic } from '$lib/motion/actions/magnetic.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { SvgIcon } from '$lib/components/brand';
	import { Badge } from '$lib/components/ui/badge';
	import { Card } from '$lib/components/ui/card';
	import DataFlowDiagram from '$lib/components/home/DataFlowDiagram.svelte';
	import { cn } from '$lib/utils';
	import { projectsListingContent } from '$lib/content/projects';
	import { asset } from '$lib/directus/assets';

	export interface ProjectCardProps {
		/** The project data to display */
		project: Project;
		/** Available services for badge rendering */
		services?: readonly Service[];
		/** SVG contents keyed by service ID */
		serviceSvgContents: Record<string, string>;
		/** Position index for stagger animations */
		index?: number;
		class?: string;
		[key: string]: unknown;
	}

	let {
		project,
		services = [],
		serviceSvgContents = {},
		index = 0,
		class: className = '',
		...rest
	}: ProjectCardProps = $props();

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
		'sql-development': ['var(--primary)', 'var(--primary-hover)'],
		'data-pipeline': ['var(--accent)', 'var(--accent-hover)'],
		'analytics-reporting': ['var(--primary)', 'var(--accent)'],
		'database-engineering': ['var(--primary-hover)', 'var(--primary)'],
		'internal-tooling': ['var(--accent-hover)', 'var(--accent)'],
		'web-development': ['var(--accent)', 'var(--primary)']
	};

	let gradientColors = $derived(
		SERVICE_GRADIENTS[project.relatedServices[0]] ?? ['var(--primary)', 'var(--accent)']
	);

	// i18n labels pulled from content layer (Task 17b-7d).
	const stackLabel = projectsListingContent.filters.techStack;
	const servicesLabel = projectsListingContent.filters.services;
	const stackOverflowTemplate = resolveLocale(projectsListingContent.card.stackOverflowSuffix, 'en');
	const stackOverflow = $derived(
		project.stack.length > 5
			? stackOverflowTemplate.replace('{count}', String(project.stack.length - 5))
			: ''
	);
</script>

<a
	href="/projects/{project.slug}"
	class={cn("tap-press project-card group block h-full", className)}
	data-testid="project-card"
	data-flip-id={project.slug}
	data-batch="project-item"
	onmouseenter={() => (cardHovered = true)}
	onmouseleave={() => (cardHovered = false)}
	{...rest}
>
	<div class="h-full" use:cursorGlow>
	<Card class="h-full">
		<article class="h-full">
		<!-- Gradient banner: short (120px), full-width. Image or gradient+icon fallback -->
		{#if project.image}
			<div class="h-52 overflow-hidden">
				<img
					src={asset(project.image, 'card-600')}
					alt={resolveLocale(project.title, 'en')}
					class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 group-active:scale-105"
					loading="lazy"
					decoding="async"
				/>
			</div>
		{:else}
			<div
				class="flex h-52 items-center justify-end pr-6"
				style="background: linear-gradient(135deg, color-mix(in srgb, {gradientColors[0]} 13%, transparent), color-mix(in srgb, {gradientColors[1]} 7%, transparent));"
			>
				{#if project.relatedServices[0] && serviceSvgContents[project.relatedServices[0]]}
					<div class="opacity-30 transition-opacity duration-300 group-hover:opacity-50 group-active:opacity-50">
						<SvgIcon
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
			<h2 class="text-base font-bold text-[var(--foreground)] transition-colors duration-300 group-hover:text-primary group-active:text-primary md:text-lg">
				{resolveLocale(project.title, 'en')}
			</h2>

			<!-- Description -->
			<p class="mt-1.5 text-sm leading-relaxed text-[var(--secondary-foreground)]">
				{resolveLocale(project.oneLiner, 'en')}
			</p>

			<!-- Service badges row — SVGs with MorphSVG on card hover -->
			{#if projectServices.length > 0}
				<div class="mt-3">
					<div class="mb-1.5 label-section font-semibold">
						{resolveLocale(servicesLabel, 'en')}
					</div>
					<div class="flex flex-wrap gap-1.5">
					{#each projectServices as service}
						<div
							class="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1.5"
							style="border-color: color-mix(in srgb, var(--primary) 35%, transparent);"
						>
							{#if serviceSvgContents[service.id]}
								<div class="service-badge-icon" aria-hidden="true">
									<SvgIcon
										svgContent={serviceSvgContents[service.id]}
										size={28}
										hovered={cardHovered}
									/>
								</div>
							{/if}
							<span class="font-mono text-caption leading-tight text-[var(--foreground)]">
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
					<div class="mb-1.5 label-section font-semibold">
						{resolveLocale(stackLabel, 'en')}
					</div>
					<DataFlowDiagram stack={displayStack} size="sm" />
					{#if stackOverflow}
						<span class="mt-0.5 block font-mono text-caption text-[var(--muted-foreground)]">{stackOverflow}</span>
					{/if}
				</div>
			{/if}

			<!-- Tags as small pills -->
			<div class="flex flex-wrap gap-1 pt-3">
				{#each displayTags as tag}
					<span use:magnetic={{ strength: 2, radius: 30 }}>
						<Badge variant="tag-active" size="xs">{tag}</Badge>
					</span>
				{/each}
			</div>
		</div>

		</article>
	</Card>
	</div>
</a>

<style>
	/* Strip SvgIcon container border/bg when nested in card badges */
	.service-badge-icon :global([data-slot="svg-icon"]) {
		border: none;
		background: transparent;
		border-radius: 0;
	}
</style>
