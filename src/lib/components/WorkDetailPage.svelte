<!--
  Full detail page layout for /work/[slug].
  Two-column on desktop: left = content sections, right = sticky sidebar.
  Mobile: sidebar renders above content as full-width section.
  Uses reveal action for scroll-triggered section entrances.
  Case-study feel: orange accent borders, numbered sections, boxed description.
-->
<script lang="ts">
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { boop } from '$lib/motion/actions/boop.js';
	import WorkDetailSidebar from './WorkDetailSidebar.svelte';
	import TableOfContents from './TableOfContents.svelte';
	import DataFlowDiagram from './DataFlowDiagram.svelte';

	let {
		project,
		services,
		serviceSvgContents,
		readmeHtml
	}: {
		project: Project;
		services: Service[];
		serviceSvgContents: Record<string, string>;
		readmeHtml?: string;
	} = $props();

	// Collapsible section state — all expanded by default
	let overviewOpen = $state(true);
	let sectionOpen = $state<boolean[]>(project.sections.map(() => true));
	let readmeOpen = $state(true);

	// ToC component ref — used to get HTML with injected heading ids
	let tocRef: TableOfContents | undefined = $state();
	// Derive the processed README HTML with heading ids injected by the ToC parser
	let processedReadmeHtml = $derived(
		tocRef ? tocRef.getProcessedHtml() : (readmeHtml ?? '')
	);

	function toggleSection(index: number) {
		sectionOpen[index] = !sectionOpen[index];
	}
</script>

<article class="mx-auto max-w-4xl px-4 pb-16 pt-8" data-testid="work-detail-page">
	<!-- Back link -->
	<a
		href="/work"
		class="mb-6 inline-block font-mono text-xs transition-colors hover:underline"
		style="color: #E07800;"
		use:boop={{ scale: 1.05, timing: 200 }}
	>
		&larr; All Projects
	</a>

	<!-- Hero section — larger title, more contrast on one-liner, wider gradient divider -->
	<header class="relative mb-10" use:reveal={{ direction: 'up', delay: 0 }}>
		<h1
			class="font-heading text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl"
		>
			{resolveLocale(project.title, 'en')}
		</h1>
		<p class="mt-3 text-base text-[#b0b0b0] md:text-lg">
			{resolveLocale(project.oneLiner, 'en')}
		</p>

		<!-- Auto-generated DrawSVG pipeline diagram from project stack -->
		{#if project.stack.length > 0}
			<div class="mt-5" use:reveal={{ direction: 'up', delay: 80 }}>
				<DataFlowDiagram stack={project.stack} size="lg" />
			</div>
		{/if}

		<!-- Wider gradient divider for stronger visual separation -->
		<div
			class="mt-6 h-0.5 rounded-full"
			style="background: linear-gradient(90deg, #E07800 0%, #FFB627 40%, #2a2a2a 100%);"
		></div>
	</header>

	<!-- Mobile sidebar — rendered above content on small screens, hidden on lg+ -->
	<div class="mb-8 lg:hidden">
		<WorkDetailSidebar {project} {services} {serviceSvgContents} />
	</div>

	<!-- Two-column layout: content + sidebar -->
	<div class="flex flex-col gap-10 lg:flex-row">
		<!-- Left: main content area -->
		<div class="min-w-0 flex-1 space-y-6">
			<!-- Project description — boxed card with "Overview" label, matching section style -->
			<div
				class="section-card rounded-lg border-l-[3px] border-[#E07800] bg-[#141414]"
				use:reveal={{ direction: 'up', delay: 100 }}
			>
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<button
					class="flex w-full items-center gap-2 px-6 py-4 text-left"
					onclick={() => overviewOpen = !overviewOpen}
				>
					<svg class="h-4 w-4 shrink-0 text-[#E07800]" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
						<circle cx="8" cy="8" r="2.5" />
						<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
					</svg>
					<h2 class="flex-1 font-heading text-lg font-bold" style="color: #E07800;">
						Overview
					</h2>
					<span class="section-chevron text-xs text-[#666]" class:rotated={overviewOpen}>▸</span>
				</button>
				<div class="section-body" class:expanded={overviewOpen}>
					<div class="px-6 pb-6 pt-3">
						<p class="text-sm leading-relaxed text-[#ccc] md:text-base">
							{resolveLocale(project.description, 'en')}
						</p>
					</div>
				</div>
			</div>

			<!-- Project sections as styled case-study cards -->
			{#each project.sections as section, i}
				<div
					class="section-card rounded-lg border-l-[3px] border-[#E07800] bg-[#141414]"
					use:reveal={{ direction: 'up', delay: 150 + i * 80 }}
				>
					<button
						class="flex w-full items-center gap-2.5 px-6 py-4 text-left"
						onclick={() => toggleSection(i)}
					>
						<span
							class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[#0a0a0a]"
							style="background-color: #E07800;"
							aria-hidden="true"
						>
							{i + 1}
						</span>
						<h2 class="flex-1 font-heading text-lg font-bold" style="color: #E07800;">
							{resolveLocale(section.title, 'en')}
						</h2>
						<span class="section-chevron text-xs text-[#666]" class:rotated={sectionOpen[i]}>▸</span>
					</button>
					<div class="section-body" class:expanded={sectionOpen[i]}>
						<div class="px-6 pb-6 pt-3">
							<p class="text-sm leading-relaxed text-[#ccc]">
								{resolveLocale(section.content, 'en')}
							</p>
						</div>
					</div>
				</div>
			{/each}

			<!-- README section (if provided) — includes ToC sidebar on desktop -->
			{#if readmeHtml}
				<div
					class="section-card mt-2 rounded-lg border-l-[3px] border-[#E07800] bg-[#141414]"
					use:reveal={{ direction: 'up', delay: 200 }}
				>
					<button
						class="flex w-full items-center gap-2 px-6 py-4 text-left"
						onclick={() => readmeOpen = !readmeOpen}
					>
						<svg
							class="h-5 w-5 shrink-0 text-[#E07800]"
							viewBox="0 0 16 16"
							fill="currentColor"
							aria-hidden="true"
						>
							<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
						</svg>
						<h2 class="flex-1 font-heading text-lg font-bold" style="color: #E07800;">
							Repository README
						</h2>
						<span class="section-chevron text-xs text-[#666]" class:rotated={readmeOpen}>▸</span>
					</button>
					<div class="section-body" class:expanded={readmeOpen}>
						<!-- Mobile ToC toggle — shown above content on small screens -->
						<div class="px-6 pt-3">
							<TableOfContents bind:this={tocRef} html={readmeHtml} />
						</div>
						<!-- README content + desktop ToC sidebar -->
						<div class="flex gap-6 px-6 pb-6">
							<div class="readme-content min-w-0 flex-1">
								{@html processedReadmeHtml}
							</div>
							<!-- Desktop ToC sidebar — positioned to the right of readme content -->
							<TableOfContents html={readmeHtml} class="hidden lg:block" />
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Right: desktop sidebar — hidden on mobile (shown above as full-width) -->
		<div class="hidden lg:block">
			<WorkDetailSidebar {project} {services} {serviceSvgContents} />
		</div>
	</div>
</article>

<style>
	/* Section card hover glow — subtle orange glow on hover for premium feel */
	.section-card {
		transition: box-shadow 0.25s ease, border-color 0.25s ease;
	}
	.section-card:hover {
		box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3);
	}

	/* Collapsible section animation */
	.section-chevron {
		display: inline-block;
		transition: transform 0.25s ease;
	}
	.section-chevron.rotated {
		transform: rotate(90deg);
	}
	.section-body {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.3s ease;
	}
	.section-body.expanded {
		grid-template-rows: 1fr;
	}
	.section-body > div {
		overflow: hidden;
	}

	/* README typography — mirrors BlogContent.svelte styles so markdown looks consistent */
	.readme-content {
		max-width: 65ch;
		font-size: 0.9375rem;
		line-height: 1.8;
		color: #ccc;
	}
	.readme-content :global(h1),
	.readme-content :global(h2),
	.readme-content :global(h3),
	.readme-content :global(h4) {
		font-family: 'Inter', sans-serif;
		color: #f5f5f0;
		margin-top: 2rem;
		margin-bottom: 0.75rem;
		line-height: 1.3;
	}
	.readme-content :global(h1) { font-size: 1.5rem; font-weight: 700; }
	.readme-content :global(h2) { font-size: 1.25rem; font-weight: 700; }
	.readme-content :global(h3) { font-size: 1.1rem; font-weight: 600; }
	.readme-content :global(h4) { font-size: 1rem; font-weight: 600; }
	.readme-content :global(p) { margin-bottom: 1rem; }
	.readme-content :global(strong) { color: #f5f5f0; font-weight: 600; }
	.readme-content :global(a) { color: #E07800; text-decoration: none; }
	.readme-content :global(a:hover) { text-decoration: underline; }
	.readme-content :global(pre) {
		background: #141414;
		border: 1px solid #2a2a2a;
		border-radius: 0.375rem;
		padding: 0.875rem 1rem;
		overflow-x: auto;
		margin: 1rem 0;
		font-size: 0.8125rem;
		line-height: 1.6;
	}
	.readme-content :global(pre code) {
		font-family: 'JetBrains Mono', monospace;
		color: #E07800;
		background: none;
		padding: 0;
		border: none;
		font-size: inherit;
	}
	.readme-content :global(code) {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.85em;
		color: #E07800;
		background: #1a1a1a;
		padding: 0.125rem 0.375rem;
		border-radius: 0.25rem;
		border: 1px solid #2a2a2a;
	}
	.readme-content :global(blockquote) {
		border-left: 3px solid #E07800;
		background: #141414;
		border-radius: 0 0.375rem 0.375rem 0;
		padding: 0.75rem 1rem;
		margin: 1rem 0;
	}
	.readme-content :global(blockquote p) {
		margin-bottom: 0;
		font-style: italic;
		color: #ccc;
	}
	.readme-content :global(ul),
	.readme-content :global(ol) {
		padding-left: 1.5rem;
		margin-bottom: 1rem;
	}
	.readme-content :global(li) { margin-bottom: 0.375rem; }
	.readme-content :global(ul) { list-style: disc; }
	.readme-content :global(ol) { list-style: decimal; }
	.readme-content :global(hr) {
		border: none;
		border-top: 1px solid #2a2a2a;
		margin: 2rem 0;
	}
	.readme-content :global(img) {
		max-width: 100%;
		border-radius: 0.375rem;
		margin: 1rem 0;
	}
</style>
