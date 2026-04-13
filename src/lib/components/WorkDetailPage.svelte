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
	import GradientSeparator from './GradientSeparator.svelte';
	import { StickyPanel } from '$lib/components/brand';

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

	// WHY: readmeOpen is bound to the README CollapsibleSection so the
	// desktop ToC sidebar can sync its visibility with the section's open state.
	let readmeOpen = $state(true);
	let tocRef: TableOfContents | undefined = $state();
	let processedReadmeHtml = $derived(
		tocRef ? tocRef.getProcessedHtml() : (readmeHtml ?? '')
	);

	// WHY: all user-facing strings go through LocalizedString so the page is ready
	// for future i18n without changing component logic.
	const labels = {
		backLink: { en: '\u2190 All Projects' },
		overview: { en: 'Overview' },
		readme: { en: 'Repository README' }
	};
</script>

<article class="w-full pb-16 pt-8" data-testid="work-detail-page">
	<!-- Hero: centered with container-wide + spacing token gutters -->
	<div class="mx-auto px-[var(--space-page-x)]" style="max-width: var(--container-wide)">
		<a
			href="/work"
			class="mb-6 inline-block font-mono text-xs transition-colors hover:underline"
			style="color: var(--brand-primary);"
			use:boop={{ scale: 1.05, timing: 200 }}
		>
			{resolveLocale(labels.backLink, 'en')}
		</a>

		<header class="relative mb-10" use:reveal={{ direction: 'up', delay: 0 }}>
			<h1 class="font-heading text-3xl font-bold leading-tight text-[var(--text-primary)] md:text-4xl lg:text-5xl">
				{resolveLocale(project.title, 'en')}
			</h1>
			<p class="mt-3 text-base text-text-secondary md:text-lg">
				{resolveLocale(project.oneLiner, 'en')}
			</p>
			{#if project.stack.length > 0}
				<div class="mt-5" use:reveal={{ direction: 'up', delay: 80 }}>
					<DataFlowDiagram stack={project.stack} size="lg" />
				</div>
			{/if}
		</header>

		<GradientSeparator />

		<!-- Mobile sidebar -->
		<div class="mb-8 lg:hidden">
			<WorkDetailSidebar {project} {services} {serviceSvgContents} />
		</div>
	</div>

	<!-- Main body -->
	<div class="mx-auto px-[var(--space-page-x)]" style="max-width: var(--container-wide)">
		<div class="flex gap-10">
			<!-- Content column -->
			<div class="min-w-0 flex-1 space-y-6">
<!-- Overview card -->
<div use:reveal={{ direction: 'up', delay: 100 }}>
	<CollapsibleSection title={resolveLocale(labels.overview, 'en')} open={true}>
		{#snippet icon()}
			<svg
				class="h-4 w-4 shrink-0 text-brand-primary"
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
		<p class="text-sm leading-relaxed text-text-light md:text-base">
			{resolveLocale(project.description, 'en')}
		</p>
	</CollapsibleSection>
</div>

<!-- Project sections -->
{#each project.sections as section, i}
	<div use:reveal={{ direction: 'up', delay: 150 + i * 80 }}>
		<CollapsibleSection title={resolveLocale(section.title, 'en')} open={true} index={i}>
			<p class="text-sm leading-relaxed text-text-light">
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
							<StickyPanel top="5rem" class="w-45">
								<TableOfContents bind:this={tocRef} html={readmeHtml} embedded syncOpen={readmeOpen} />
							</StickyPanel>
						</aside>

						<!-- README card -->
						<div use:reveal={{ direction: 'up', delay: 200 }}>
							<CollapsibleSection title={resolveLocale(labels.readme, 'en')} bind:open={readmeOpen}>
								{#snippet icon()}
									<svg class="h-5 w-5 shrink-0 text-brand-primary" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
										<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
									</svg>
								{/snippet}
								<!-- Mobile ToC — inside readme card, starts collapsed -->
								<div class="border-b border-[var(--border-subtle)] py-4 2xl:hidden">
									<TableOfContents html={readmeHtml} embedded startOpen={false} />
								</div>
								<div class="prose-dark">
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

