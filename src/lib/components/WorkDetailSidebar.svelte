<!--
  Sticky sidebar for the work detail page.
  Shows tech stack tags (GSAP stagger entrance), linked services (WorkServiceBadge),
  and external links (Live Site / GitHub).
  Desktop: sticky at top: 5rem, ~220px wide. Mobile: full-width section above content.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { Project, Service } from '$lib/data/types.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap } from '$lib/motion/utils/gsap.js';
	import WorkServiceBadge from './WorkServiceBadge.svelte';

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
	class="w-full shrink-0 lg:sticky lg:top-20 lg:w-[220px]"
	data-testid="work-detail-sidebar"
>
	<!-- Tech Stack -->
	{#if project.stack.length > 0}
		<div class="mb-6">
			<h3 class="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				Tech Stack
			</h3>
			<div bind:this={tagsContainer} class="flex flex-wrap gap-1.5">
				{#each project.stack as tech}
					<span
						data-animate="tag"
						class="rounded-sm border border-[#2a2a2a] bg-[#141414] px-2 py-0.5 font-mono text-[10px] text-[var(--text-primary)] md:text-xs"
					>
						{tech}
					</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Services -->
	{#if services.length > 0}
		<div class="mb-6">
			<h3 class="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				Services
			</h3>
			<div class="flex flex-wrap gap-1.5">
				{#each services as service}
					<WorkServiceBadge
						{service}
						svgContent={serviceSvgContents[service.id] ?? ''}
					/>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Links -->
	{#if project.liveUrl || project.repoUrl}
		<div>
			<h3 class="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
				Links
			</h3>
			<div class="flex flex-col gap-1.5">
				{#if project.liveUrl}
					<a
						href={project.liveUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 font-mono text-xs transition-colors hover:underline"
						style="color: #E07800;"
					>
						Live Site
						<!-- External link arrow icon -->
						<svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M6 3h7v7M13 3L3 13" />
						</svg>
					</a>
				{/if}
				{#if project.repoUrl}
					<a
						href={project.repoUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-1 font-mono text-xs transition-colors hover:underline"
						style="color: #E07800;"
					>
						GitHub
						<!-- External link arrow icon -->
						<svg class="h-3 w-3" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
							<path d="M6 3h7v7M13 3L3 13" />
						</svg>
					</a>
				{/if}
			</div>
		</div>
	{/if}
</aside>
