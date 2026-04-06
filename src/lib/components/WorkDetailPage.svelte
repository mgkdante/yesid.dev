<!--
  Full detail page layout for /work/[slug].
  Layout: content centered at max-w-6xl, ToC absolutely positioned in left margin
  at README height. Mobile: sidebar above content, ToC inside readme card.
-->
<script lang="ts">
	import type { Project, Service } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { boop } from '$lib/motion/actions/boop.js';
	import WorkDetailSidebar from './WorkDetailSidebar.svelte';
	import TableOfContents from './TableOfContents.svelte';
	import DataFlowDiagram from './DataFlowDiagram.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';

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

	let tocRef: TableOfContents | undefined = $state();
	let processedReadmeHtml = $derived(
		tocRef ? tocRef.getProcessedHtml() : (readmeHtml ?? '')
	);
</script>

<article class="pb-16 pt-8" data-testid="work-detail-page">
	<!-- Hero: centered at max-w-6xl -->
	<div class="mx-auto max-w-6xl px-4">
		<a
			href="/work"
			class="mb-6 inline-block font-mono text-xs transition-colors hover:underline"
			style="color: #E07800;"
			use:boop={{ scale: 1.05, timing: 200 }}
		>
			&larr; All Projects
		</a>

		<header class="relative mb-10" use:reveal={{ direction: 'up', delay: 0 }}>
			<h1 class="font-heading text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl">
				{resolveLocale(project.title, 'en')}
			</h1>
			<p class="mt-3 text-base text-[#b0b0b0] md:text-lg">
				{resolveLocale(project.oneLiner, 'en')}
			</p>
			{#if project.stack.length > 0}
				<div class="mt-5" use:reveal={{ direction: 'up', delay: 80 }}>
					<DataFlowDiagram stack={project.stack} size="lg" />
				</div>
			{/if}
			<div class="mt-6 h-0.5 rounded-full" style="background: linear-gradient(90deg, #E07800 0%, #FFB627 40%, #2a2a2a 100%);"></div>
		</header>

		<!-- Mobile sidebar -->
		<div class="mb-8 lg:hidden">
			<WorkDetailSidebar {project} {services} {serviceSvgContents} />
		</div>
	</div>

	<!-- Main body -->
	<div class="mx-auto max-w-6xl px-4">
		<div class="flex gap-10">
			<!-- Content column -->
			<div class="min-w-0 flex-1 space-y-6">
<!-- Overview card -->
<div use:reveal={{ direction: 'up', delay: 100 }}>
	<CollapsibleSection title="Overview" open={true}>
		{#snippet icon()}
			<svg
				class="h-4 w-4 shrink-0 text-[#E07800]"
				viewBox="0 0 16 16"
				fill="none"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<circle cx="8" cy="8" r="2.5" />
				<path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" />
			</svg>
		{/snippet}
		<p class="text-sm leading-relaxed text-[#ccc] md:text-base">
			{resolveLocale(project.description, 'en')}
		</p>
	</CollapsibleSection>
</div>

<!-- Project sections -->
{#each project.sections as section, i}
	<div use:reveal={{ direction: 'up', delay: 150 + i * 80 }}>
		<CollapsibleSection title={resolveLocale(section.title, 'en')} open={true} index={i}>
			<p class="text-sm leading-relaxed text-[#ccc]">
				{resolveLocale(section.content, 'en')}
			</p>
		</CollapsibleSection>
	</div>
{/each}

				<!-- README section — relative wrapper anchors the ToC at this height -->
				{#if readmeHtml}
					<div class="relative">
						<!-- Desktop ToC: in left page margin, starts at README height -->
						<aside class="absolute inset-y-0 right-full mr-3 hidden 2xl:block">
							<div class="sticky top-20 w-[180px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#141414] p-4">
								<TableOfContents bind:this={tocRef} html={readmeHtml} embedded />
							</div>
						</aside>

						<!-- README card -->
						<div use:reveal={{ direction: 'up', delay: 200 }}>
							<CollapsibleSection title="Repository README" open={true}>
								{#snippet icon()}
									<svg class="h-5 w-5 shrink-0 text-[#E07800]" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
										<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
									</svg>
								{/snippet}
								<!-- Mobile ToC — inside readme card, starts collapsed -->
								<div class="border-b border-[#2a2a2a] py-4 2xl:hidden">
									<TableOfContents html={readmeHtml} embedded startOpen={false} />
								</div>
								<div class="readme-content">
									{@html processedReadmeHtml}
								</div>
							</CollapsibleSection>
						</div>
					</div>
				{/if}
			</div>

			<!-- Right: desktop sidebar -->
			<div class="hidden shrink-0 lg:block">
				<WorkDetailSidebar {project} {services} {serviceSvgContents} />
			</div>
		</div>
	</div>
</article>

<style>
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
