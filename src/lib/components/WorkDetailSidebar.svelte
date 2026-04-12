<!--
  Sticky sidebar for the work detail page.
  Shows tech stack tags (GSAP stagger entrance), linked services (WorkServiceBadge),
  and external links (Live Site / GitHub).
  Desktop: sticky at top: 5rem, ~240px wide. Mobile: full-width section above content.
  Visual grouping: subtle gradient separators between sidebar sections.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap } from '$lib/motion/utils/gsap.js';
	import WorkServiceBadge from './WorkServiceBadge.svelte';

	// WHY: all section headers go through LocalizedString so the sidebar is ready
	// for future i18n without changing component logic.
	const labels = {
		techStack: { en: 'Tech Stack' },
		services: { en: 'Services' },
		links: { en: 'Links' },
		liveSite: { en: 'Live Site' },
		github: { en: 'GitHub' }
	};

	let {
		project,
		services,
		serviceSvgContents
	}: {
		project: Project;
		services: Service[];
		serviceSvgContents: Record<string, string>;
	} = $props();

	let tagsContainer: HTMLDivElement;

	/* Whether we need separators between sidebar groups */
	const hasServices = $derived(services.length > 0);
	const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl);

	onMount(() => {
		if (isPrefersReducedMotion() || !tagsContainer) return;
		registerGsapPlugins();

		// Stagger-in animation for tech stack tags on mount
		const tags = tagsContainer.querySelectorAll('[data-animate="tag"]');
		if (tags.length > 0) {
			gsap.from(tags, {
				y: 8,
				opacity: 0,
				duration: 0.4,
				stagger: 0.06,
				ease: 'back.out(1.4)'
			});
		}
	});
</script>

<aside
	class="w-full shrink-0 rounded-lg border border-[#2a2a2a] bg-[#141414] p-5 lg:sticky lg:top-20 lg:w-[240px]"
	data-testid="work-detail-sidebar"
>
	<!-- Tech Stack -->
	{#if project.stack.length > 0}
		<div class="pb-5">
			<h3 class="mb-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				{resolveLocale(labels.techStack, 'en')}
			</h3>
			<div bind:this={tagsContainer} class="flex flex-wrap gap-1.5">
				{#each project.stack as tech}
					<a
						href="/work?tag={tech}"
						data-animate="tag"
						class="sidebar-tag rounded-sm border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-0.5 font-mono text-caption text-[var(--text-primary)] no-underline"
					>
						{tech}
					</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Separator between Tech Stack and Services -->
	{#if project.stack.length > 0 && (hasServices || hasLinks)}
		<div class="mb-5 h-px" style="background: linear-gradient(90deg, #E07800, transparent);"></div>
	{/if}

	<!-- Services -->
	{#if hasServices}
		<div class="pb-5">
			<h3 class="mb-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				{resolveLocale(labels.services, 'en')}
			</h3>
			<div class="flex flex-wrap gap-2">
				{#each services as service}
					<WorkServiceBadge
						{service}
						svgContent={serviceSvgContents[service.id] ?? ''}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Separator between Services and Links -->
	{#if hasServices && hasLinks}
		<div class="mb-5 h-px" style="background: linear-gradient(90deg, #E07800, transparent);"></div>
	{/if}

	<!-- Links -->
	{#if hasLinks}
		<div>
			<h3 class="mb-2.5 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				{resolveLocale(labels.links, 'en')}
			</h3>
			<div class="flex flex-col gap-2">
				{#if project.liveUrl}
					<a
						href={project.liveUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="sidebar-link inline-flex items-center gap-1.5 font-mono text-xs transition-colors hover:underline"
						style="color: #E07800;"
					>
						<!-- Arrow-up-right icon -->
						<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M6 3h7v7M13 3L3 13" />
						</svg>
						{resolveLocale(labels.liveSite, 'en')}
					</a>
				{/if}
				{#if project.repoUrl}
					<a
						href={project.repoUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="sidebar-link inline-flex items-center gap-1.5 font-mono text-xs transition-colors hover:underline"
						style="color: #E07800;"
					>
						<!-- GitHub icon -->
						<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
							<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
						</svg>
						{resolveLocale(labels.github, 'en')}
					</a>
				{/if}
			</div>
		</div>
	{/if}
</aside>

<style>
	/* Tech stack tags — subtle glow on hover for interactivity */
	.sidebar-tag {
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}
	.sidebar-tag:hover {
		background-color: #222;
		border-color: rgba(224, 120, 0, 0.4);
	}

	/* Links — glow effect on hover */
	.sidebar-link {
		transition: color 0.15s ease, text-shadow 0.15s ease;
	}
	.sidebar-link:hover {
		text-shadow: 0 0 8px rgba(224, 120, 0, 0.3);
	}
</style>
