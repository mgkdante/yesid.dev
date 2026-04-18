<!--
  Full detail page layout for /projects/[slug].
  Structure: full-bleed header + gradient separator + 3-column CSS Grid body.
  Desktop: TOC (left) + collapsible sections (center) + glance panel (right).
  Mobile: collapsible glance panel + floating TOC pill + stacked sections.
-->
<script lang="ts">
	import type { Project, Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { Separator } from '$lib/components/ui/separator';
	import { SectionLabel, StickyPanel, ChevronToggle } from '$lib/components/brand';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
	import ProjectDetailHeader from './ProjectDetailHeader.svelte';
	import ProjectGlancePanel from './ProjectGlancePanel.svelte';
	import ProjectGlancePanelMobile from './ProjectGlancePanelMobile.svelte';
	import ProjectTocPill from './ProjectTocPill.svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';

	interface TocEntry {
		id: string;
		title: string;
		level: number;
		children: TocEntry[];
	}

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

	let activeHeadingId = $state('');

	const tocEntries = $derived.by((): TocEntry[] => {
		const entries: TocEntry[] = [];

		for (let i = 0; i < project.sections.length; i++) {
			entries.push({
				id: `section-${i}`,
				title: resolveLocale(project.sections[i].title, 'en'),
				level: 2,
				children: [],
			});
		}

		if (readmeHtml) {
			const readmeChildren: TocEntry[] = [];
			if (browser) {
				const parser = new DOMParser();
				const doc = parser.parseFromString(readmeHtml, 'text/html');
				const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
				headings.forEach((h, idx) => {
					const level = parseInt(h.tagName[1]) + 1;
					const id = `readme-h-${idx}`;
					readmeChildren.push({
						id,
						title: h.textContent?.trim() ?? '',
						level: Math.min(level, 6),
						children: [],
					});
				});
			}
			entries.push({
				id: `section-${project.sections.length}`,
				title: 'README',
				level: 2,
				children: readmeChildren,
			});
		}

		return entries;
	});

	const allHeadingIds = $derived.by(() => {
		const ids: string[] = [];
		for (const entry of tocEntries) {
			ids.push(entry.id);
			for (const child of entry.children) {
				ids.push(child.id);
			}
		}
		return ids;
	});

	const activeEntryIndex = $derived(
		Math.max(0, allHeadingIds.indexOf(activeHeadingId))
	);

	const processedReadmeHtml = $derived.by(() => {
		if (!readmeHtml) return '';
		let idx = 0;
		return readmeHtml.replace(/<(h[1-6])([^>]*)>/gi, (match, tag, attrs) => {
			const id = `readme-h-${idx++}`;
			return `<${tag}${attrs} id="${id}">`;
		});
	});

	onMount(() => {
		const headingEls = document.querySelectorAll('[data-section-index], [id^="readme-h-"]');
		if (headingEls.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting) {
						const el = entry.target;
						const sectionIdx = el.getAttribute('data-section-index');
						if (sectionIdx !== null) {
							activeHeadingId = `section-${sectionIdx}`;
						} else if (el.id) {
							activeHeadingId = el.id;
						}
					}
				}
			},
			{ rootMargin: '-20% 0px -70% 0px' }
		);
		headingEls.forEach((el) => observer.observe(el));

		return () => observer.disconnect();
	});

	function scrollToHeading(id: string): void {
		const el = id.startsWith('section-')
			? document.querySelector(`[data-section-index="${id.replace('section-', '')}"]`)
			: document.getElementById(id);
		if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}
</script>

<article data-testid="project-detail-page">
	<!-- Full-bleed header -->
	<ProjectDetailHeader {project} />

	<!-- Edge-to-edge hazard stripes -->
	<Separator variant="hazard" />

	<!-- Mobile: collapsible glance panel -->
	<div class="mt-4 px-[var(--space-page-x)] lg:hidden">
		<ProjectGlancePanelMobile {project} />
	</div>

	<!-- Body: 3-column CSS Grid with TOC left, sections center, panel right -->
	<div class="detail-body">
		<aside class="toc-column">
			<StickyPanel top="5rem">
				<div class="toc-panel toc-scroll" use:scrollChain>
					<CollapsibleSection title="On this page" open={true}>
						<nav class="toc-nav">
								{#each tocEntries as entry}
									<button
										class="toc-item"
										class:active={activeHeadingId === entry.id}
										onclick={() => scrollToHeading(entry.id)}
									>
										{#if activeHeadingId === entry.id}
											<div class="toc-dot"></div>
										{/if}
										{entry.title}
									</button>
									{#each entry.children as child}
										<button
											class="toc-item toc-sub-item"
											class:active={activeHeadingId === child.id}
											onclick={() => scrollToHeading(child.id)}
											style="padding-left: {16 + Math.max(0, child.level - 3) * 10}px;"
										>
											{#if activeHeadingId === child.id}
												<div class="toc-dot"></div>
											{/if}
											{child.title}
										</button>
									{/each}
								{/each}
							</nav>

							<div class="mt-6 flex items-center gap-2">
								<div class="toc-counter-dot"></div>
								<span class="toc-counter-text font-mono text-micro tracking-[1.5px]">
									SEC {activeEntryIndex + 1} / {allHeadingIds.length}
								</span>
							</div>
					</CollapsibleSection>
				</div>
			</StickyPanel>
		</aside>

		<div class="sections-column">
			{#each project.sections as section, i}
				<div
					class="section-block"
					data-section-index={i}
				>
					<CollapsibleSection
						title={resolveLocale(section.title, 'en')}
						index={i}
						open={true}
					>
						<p class="section-body">{resolveLocale(section.content, 'en')}</p>
					</CollapsibleSection>
				</div>
			{/each}

			{#if readmeHtml}
				<div
					class="section-block"
					data-section-index={project.sections.length}
				>
					<CollapsibleSection title="README" open={true}>
						{#snippet icon()}
							<svg class="h-5 w-5 shrink-0 text-primary" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
								<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
							</svg>
						{/snippet}
						<div class="prose-dark section-body">
							{@html processedReadmeHtml}
						</div>
					</CollapsibleSection>
				</div>
			{/if}
		</div>

		<aside class="glance-column">
			<ProjectGlancePanel {project} {services} {serviceSvgContents} />
		</aside>
	</div>
</article>

<!-- Mobile floating TOC pill -->
<ProjectTocPill {tocEntries} />

<style>
	/* TOC panel */
	.toc-nav {
		font-family: var(--font-heading);
		font-size: 16px;
		line-height: 2.4;
		border-left: 2px solid color-mix(in srgb, var(--primary) 12%, transparent);
		padding-left: 16px;
	}

	.toc-item {
		display: block;
		position: relative;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0;
		color: var(--muted-foreground);
		transition: color var(--duration-fast) var(--ease-default);
	}

	.toc-item:hover {
		color: color-mix(in srgb, var(--foreground) 60%, transparent);
	}

	.toc-item.active {
		color: var(--primary);
		font-weight: 600;
	}

	.toc-sub-item {
		/* padding-left set inline based on heading depth */
		font-size: 13px;
		color: color-mix(in srgb, var(--foreground) 20%, transparent);
	}

	.toc-sub-item:hover {
		color: color-mix(in srgb, var(--foreground) 50%, transparent);
	}

	.toc-sub-item.active {
		color: var(--primary);
	}

	.toc-dot {
		position: absolute;
		left: -19px;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--primary);
	}

	.toc-counter-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--primary);
		box-shadow: 0 0 8px color-mix(in srgb, var(--primary) 40%, transparent);
	}

	.toc-counter-text {
		color: color-mix(in srgb, var(--primary) 30%, transparent);
	}

	/* Section blocks */
	.section-block {
		margin-bottom: 36px;
	}

	@media (min-width: 1024px) {
		.section-block {
			margin-bottom: 48px;
		}
	}

	/* Body: 3-column grid layout */
	.detail-body {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-card-gap);
		padding-inline: var(--space-page-x);
		padding-block: 1.5rem;
	}

	.toc-column,
	.glance-column {
		display: none;
	}

	@media (min-width: 1024px) {
		.detail-body {
			grid-template-columns: 1fr 2fr 1fr;
			gap: 2rem;
			padding-block: 2.5rem;
		}
		.toc-column,
		.glance-column {
			display: block;
		}
	}

	/* TOC scrollable area */
	.toc-scroll {
		max-height: calc(100dvh - 14rem);
		overflow-y: auto;
		padding-bottom: 1rem;
	}

	/* Section body text */
	.section-body {
		font-size: 17px;
		color: color-mix(in srgb, var(--foreground) 50%, transparent);
		line-height: 1.8;
	}

	@media (min-width: 1024px) {
		.section-body {
			font-size: 18px;
			color: color-mix(in srgb, var(--foreground) 55%, transparent);
			line-height: 1.9;
		}
	}

	/* Sub-section h3 styling (within rendered HTML content) */
	.section-body :global(h3) {
		font-family: var(--font-heading);
		font-size: 16px;
		font-weight: 600;
		color: color-mix(in srgb, var(--foreground) 70%, transparent);
		margin: 20px 0 12px;
		padding-left: 10px;
		border-left: 2px solid color-mix(in srgb, var(--primary) 20%, transparent);
	}

	@media (min-width: 1024px) {
		.section-body :global(h3) {
			font-size: 18px;
			color: color-mix(in srgb, var(--foreground) 80%, transparent);
			margin: 24px 0 16px;
			padding-left: 12px;
			border-left: 3px solid color-mix(in srgb, var(--primary) 25%, transparent);
		}
	}
</style>
