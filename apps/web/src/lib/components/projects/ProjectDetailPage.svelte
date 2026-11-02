<script lang="ts">
	import '#lib/styles/article-body.css';
	import { afterNavigate } from '$app/navigation';
	import type { BlockEditorDoc, Project, Service } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';

	const locale = getLocale();
	import { siteLabels } from '#lib/content/index.ts';

	// TOC chrome, CMS-sourced (navChrome.shared), shared across detail pages.
	const tocHeading = resolveLocale(siteLabels.navChrome.shared.tocHeading, locale);
	const tocOpenAria = resolveLocale(siteLabels.navChrome.shared.tocMobileButton, locale);
	const tocCloseAria = resolveLocale(siteLabels.navChrome.shared.tocCloseAria, locale);
	const tocCounterPrefix = resolveLocale(siteLabels.navChrome.shared.tocCounterPrefix, locale);
	const detailChrome = siteLabels.projectsChrome.detail;
	const readmeSectionTitle = resolveLocale(detailChrome.readmeSectionTitle, locale);
	const glanceStackTitle = resolveLocale(detailChrome.glance.stack, locale);
	const glanceServicesTitle = resolveLocale(detailChrome.glance.services, locale);
	const glanceLinksTitle = resolveLocale(detailChrome.glance.links, locale);
	import CtaBand from '#lib/components/shared/CtaBand.svelte';
	import QuietModeButton from '#lib/components/shared/QuietModeButton.svelte';
	import {
		CollapsibleSection,
		SectionIcon,
		TocNav,
		navigateToc,
		onTocNavigate,
		tocElement,
		type TocEntry,
	} from '@yesid/ui/brand';
	import { ArticleHeader, DetailFrame } from '@yesid/ui/layout';
	import { YESID_TOC_SELECTOR } from '#lib/utils/toc-selector.ts';
	import { collectProjectImages } from '#lib/projects/project-images.ts';
	import { collectProjectVideos, youtubeLabels } from '#lib/utils/youtube.ts';
	import ProjectGlancePanel from './ProjectGlancePanel.svelte';
	import ProjectHeaderTelemetry from './ProjectHeaderTelemetry.svelte';
	import ProjectImageGallery from './ProjectImageGallery.svelte';
	import ProjectImpactCard from './ProjectImpactCard.svelte';
	import ProjectLinksCard from './ProjectLinksCard.svelte';
	import { projectMetrics } from '#lib/utils/project-metrics.ts';
	import BlockRenderer from '#lib/components/cms/BlockRenderer.svelte';
	import CodeBlock from '#lib/components/cms/blocks/CodeBlock.svelte';
	import type { ReadmeSegment } from '#lib/utils/code-fences.ts';
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { registerScrollContext, lenisAwareScrollTo } from '#lib/state/locale-handoff.svelte.ts';

	let {
		project,
		services,
		serviceSvgContents,
		readme,
		codeHighlights

		/** block.id → server-highlighted HTML ($lib/server/code-highlights). */
	}: { 
		project: Project;
		services: Service[];
		serviceSvgContents: Record<string, string>;
		readme?: ReadmeSegment[];
		codeHighlights?: Readonly<Record<string, string>>
	 } = $props();

	const backToListingLabel =
		resolveLocale(siteLabels.ui.backToProjects, locale) ||
		resolveLocale(detailChrome.backToListingLabel, locale);
	const subtitle = $derived(resolveLocale(project.oneLiner, locale));

	let activeHeadingId = $state('');
	/** Storage key scoped to this project, so one project's open sections never leak into another. */
	const scoped = (key: string) => `${project.slug}:${key}`;

	type SectionView = {
		originalIndex: number;
		title: string;
		doc: BlockEditorDoc;
		isImageGallery: boolean;
	};

	function isImageGalleryDoc(doc: BlockEditorDoc): boolean {
		return doc.blocks.length > 0 && doc.blocks.every((block) => block.type === 'image');
	}

	function articleTocEntry(section: SectionView, articleIndex: number): TocEntry {
		return {
			id: `section-${articleIndex}`,
			title: section.title,
			level: 2,
			badge: { kind: 'number', value: articleIndex + 1 },
			children: [],
		};
	}

	function galleryTocEntry(): TocEntry {
		return {
			id: galleryAnchor,
			title: mediaGalleryTitle,
			level: 2,
			badge: { kind: 'icon', name: 'image' },
			rail: true,
			children: [],
		};
	}

	function readmeTocChildren(html: string): TocEntry[] {
		const children: TocEntry[] = [];
		if (!browser) return children;

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const headings = doc.querySelectorAll('h1, h2, h3, h4, h5, h6');
		headings.forEach((h, idx) => {
			const level = parseInt(h.tagName[1]) + 1;
			const id = `readme-h-${idx}`;
			children.push({
				id,
				title: h.textContent?.trim() || `Section ${idx + 1}`,
				level: Math.min(level, 6),
				children: [],
			});
		});

		return children;
	}

	function glanceTocEntries(): TocEntry[] {
		const entries: TocEntry[] = [];
		if (project.stack.length > 0)
			entries.push({ id: 'glance-stack', title: glanceStackTitle, level: 2, badge: { kind: 'icon', name: 'layers' }, rail: true, children: [] });
		if (services.length > 0)
			entries.push({ id: 'glance-services', title: glanceServicesTitle, level: 2, badge: { kind: 'icon', name: 'grid' }, rail: true, children: [] });
		return entries;
	}

	const sectionViews = $derived.by((): SectionView[] =>
		project.sections.map((section, originalIndex) => {
			const doc = resolveLocale(section.content, locale);
			return {
				originalIndex,
				title: resolveLocale(section.title, locale),
				doc,
				isImageGallery: isImageGalleryDoc(doc),
			};
		})
	);
	const imageGallerySections = $derived(sectionViews.filter((section) => section.isImageGallery));
	const articleSections = $derived(sectionViews.filter((section) => !section.isImageGallery));
	const gallerySource = $derived(imageGallerySections[0]);
	const galleryTitle = $derived(gallerySource?.title ?? ({ en: 'Images', fr: 'Images', es: 'Imágenes' } as const)[locale]);
	const galleryAnchor = $derived(gallerySource ? `project-gallery-${gallerySource.originalIndex}` : 'project-gallery');
	const galleryDoc = $derived({
		...resolveLocale(project.description, locale),
		blocks: collectProjectImages([
			...imageGallerySections.map((section) => section.doc),
			resolveLocale(project.description, locale),
			...articleSections.map((section) => section.doc),
		]),
	});
	const galleryVideos = $derived(collectProjectVideos([
		resolveLocale(project.description, locale),
		...sectionViews.map((section) => section.doc),
	]));
	const hasGallery = $derived(galleryDoc.blocks.length > 0 || galleryVideos.length > 0);
	const mediaGalleryTitle = $derived(galleryVideos.length === 0 ? galleryTitle : galleryDoc.blocks.length > 0 ? youtubeLabels[locale].media : youtubeLabels[locale].gallery);
	const firstArticleSection = $derived(articleSections[0]);
	const remainingArticleSections = $derived(articleSections.slice(1));
	const hasImpact = $derived(projectMetrics(project).length > 0);
	const hasProjectLinks = $derived(!!project.liveUrl || !!project.repoUrl || !!project.docsUrl || !!project.repoPrivate);
	const readmeHtml = $derived((readme ?? []).map((part) => ('html' in part ? part.html : '')).join(''));
	const readmeTocEntry = $derived.by((): TocEntry | null => {
		if (!readme?.length) return null;
		return {
			id: `section-${articleSections.length}`,
			title: 'README',
			level: 2,
			badge: { kind: 'icon', name: 'github' },
			children: readmeTocChildren(readmeHtml),
		};
	});

	const tocEntries = $derived.by((): TocEntry[] => {
		const entries: TocEntry[] = [];

		// Links lead the page on mobile (above the sections) and the right rail on desktop.
		if (hasProjectLinks)
			entries.push({ id: 'glance-links', title: glanceLinksTitle, level: 2, badge: { kind: 'icon', name: 'arrow' }, rail: true, children: [] });

		for (let i = 0; i < articleSections.length; i++) {
			entries.push(articleTocEntry(articleSections[i], i));
		}

		if (readmeTocEntry) entries.push(readmeTocEntry);

		// Glance-rail panels in the TOC (Stack / Services). On mobile these
		// sit below the sections (in-flow); their scroll-target anchors (data-toc)
		// live on the mobile glance instance. On desktop they're already visible in
		// the rail. Badges mirror the glance cards' SectionIcon shapes.
		entries.push(...glanceTocEntries());
		if (hasGallery) entries.push(galleryTocEntry());

		return entries;
	});

	const mobileTocEntries = $derived(tocEntries);

	const readmeParts = $derived.by(() => {
		let idx = 0;
		// Count all heading levels for stable IDs, but expose visible permalinks only on h2-h4.
		return (readme ?? []).map((part) =>
			'html' in part
				? { html: part.html.replace(/<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi, (match, tag, attrs, inner) => {
					const id = `readme-h-${idx++}`;
					const anchor = (/^h[234]$/i).test(tag)
						? `<a class="heading-anchor" href="#${id}" aria-labelledby="${id}">#</a>`
						: '';
					return `<${tag}${attrs} id="${id}">${inner}${anchor}</${tag}>`;
				}) }
				: part,
		);
	});

	afterNavigate(onTocNavigate);

	// Restore the locale-stable heading ID because translated text changes its vertical offset.
	onMount(() =>
		registerScrollContext({
			capture: () => ({ kind: 'heading', id: activeHeadingId, y: window.scrollY }),
			restore: (snap) => {
				const s = snap as { id?: string; y?: number } | null;
				const id = s?.id;
				const el = id ? tocElement(id) : null;
				if (el) {
					// Instant, Lenis-aware jump to the heading's top, matching the
					// IntersectionObserver's -20% top rootMargin so the restored
					// heading lands where the observer considers it "active".
					const top = el.getBoundingClientRect().top + window.scrollY;
					lenisAwareScrollTo(Math.max(0, top - window.innerHeight * 0.2));
				} else {
					// No active heading (top of page) or it vanished, so fall back to
					// the raw captured offset (still Lenis-aware).
					lenisAwareScrollTo(Math.max(0, s?.y ?? 0));
				}
			},
		})
	);
</script>

{#snippet galleryCard(mobile: boolean)}
	<CollapsibleSection
		title={mediaGalleryTitle}
		sectionKey={scoped(`proj-gallery-${mobile ? 'mobile-' : ''}${gallerySource?.originalIndex ?? 'article'}`)}
		anchor={galleryAnchor}
		open={true}
	>
		{#snippet icon()}
			<SectionIcon name="image" class="h-4 w-4 shrink-0 text-primary" />
		{/snippet}
		<ProjectImageGallery doc={galleryDoc} videos={galleryVideos} />
	</CollapsibleSection>
{/snippet}

{#snippet after()}
	<div class="lg:hidden px-[var(--space-page-x)] pb-8">
		<ProjectGlancePanel
			project={project}
			services={services}
			serviceSvgContents={serviceSvgContents}
			mobile
			codeHighlights={codeHighlights}
		/>
		{#if hasGallery}
			<div class="mobile-gallery-stack" data-testid="project-image-gallery-mobile">
				{@render galleryCard(true)}
			</div>
		{/if}
	</div>

	<section class="cta-area" data-testid="project-cta">
		<CtaBand testidPrefix="project-cta-band" />
	</section>
{/snippet}

<div style="padding-top: var(--chrome-offset);">
	{#snippet right()}
		<div class="glance-column">
			<ProjectGlancePanel
				project={project}
				services={services}
				serviceSvgContents={serviceSvgContents}
				codeHighlights={codeHighlights}
			/>
		</div>
	{/snippet}

	<DetailFrame
		data-testid="project-detail-page"
		class="reading-detail"
		{right}
		{after}
		bind:activeId={activeHeadingId}
		toc={{
			entries: tocEntries,
			pillEntries: mobileTocEntries,
			openAria: tocOpenAria,
			closeAria: tocCloseAria,
			onNavigate: navigateToc,
			selector: YESID_TOC_SELECTOR,
			landFragments: true,
		}}
	>
		{#snippet header()}
			<ArticleHeader
				title={resolveLocale(project.title, locale)}
				{subtitle}
				backHref={localizeHref('/projects', locale)}
				backLabel={backToListingLabel}
				accent="var(--primary)"
				testId="project-detail-header"
			>
				{#snippet decorations()}
					<ProjectHeaderTelemetry {project} />
				{/snippet}
				{#snippet controls()}
					<QuietModeButton />
				{/snippet}
			</ArticleHeader>
		{/snippet}

		{#snippet left()}
			<div class="toc-column">
				<TocNav
					entries={tocEntries}
					activeId={activeHeadingId}
					onNavigate={navigateToc}
					heading={tocHeading}
					sectionKey={scoped('proj-toc')}
					counterPrefix={tocCounterPrefix}
				/>
				{#if hasImpact}
					<div class="toc-impact-stack">
						<ProjectImpactCard project={project} sectionKey={scoped('glance-impact')} />
					</div>
				{/if}
				{#if hasGallery}
					<div class="toc-gallery-stack" data-testid="project-image-gallery-rail">
						{@render galleryCard(false)}
					</div>
				{/if}
			</div>
		{/snippet}

		<div class="sections-column">
			{#if hasProjectLinks}
				<div class="section-block lg:hidden" data-testid="project-links-mobile">
					<ProjectLinksCard project={project} sectionKey={scoped('glance-links-m')} anchor="glance-links" />
				</div>
			{/if}
			{#snippet articleSection(section: SectionView, index: number)}
				<div
					class="section-block"
					id={`section-${index}`}
					data-section-index={index}
				>
					<CollapsibleSection
						title={section.title}
						sectionKey={scoped(`proj-section-${index}`)}
						index={index}
						open={index === 0}
					>
						<div class="article-body section-body"><BlockRenderer doc={section.doc} codeHighlights={codeHighlights} /></div>
					</CollapsibleSection>
				</div>
			{/snippet}
			{#if firstArticleSection}
				{@render articleSection(firstArticleSection, 0)}
			{/if}

			{#each remainingArticleSections as section, offset}
				{@render articleSection(section, offset + 1)}
			{/each}

			{#if readme?.length}
				<div
					class="section-block"
					data-section-index={articleSections.length}
				>
					<CollapsibleSection title={readmeSectionTitle} sectionKey={scoped('proj-readme')} open={true}>
						{#snippet icon()}
							<SectionIcon name="github" class="h-5 w-5 shrink-0 text-primary" />
						{/snippet}
						<div class="article-body prose-dark section-body">
							{#each readmeParts as part, i (i)}
								{#if 'html' in part}
									{@html part.html}
								{:else}
									<CodeBlock data={{ code: part.fence }} highlightedHtml={part.highlighted} />
								{/if}
							{/each}
						</div>
					</CollapsibleSection>
				</div>
			{/if}
		</div>
	</DetailFrame>
</div>

<style>

	.cta-area {
		margin-top: 1rem;
	}

	/* Section blocks match the side-column card spacing (mb-4 = 1rem) so the
	   center column isn't airier than the rails. */
	.section-block {
		margin-bottom: 1rem;
	}

	.sections-column {
		position: relative;
	}

	.sections-column:has(:global(.project-image-gallery__lightbox)),
	:global([data-slot='detail-shell-left']:has(.project-image-gallery__lightbox)) {
		z-index: var(--z-overlay);
	}

	.toc-column {
		padding-bottom: 1rem;
	}

	.toc-gallery-stack {
		margin-top: 1rem;
	}

	.toc-impact-stack {
		margin-top: 1rem;
	}

	.mobile-gallery-stack {
		margin-bottom: 1rem;
	}

</style>
