<!--
  Full detail page layout for /projects/[slug].
  Structure: full-bleed header + gradient separator + 3-column CSS Grid body.
  Desktop: TOC (left) + collapsible sections (center) + glance panel (right).
  Mobile: collapsible glance panel + floating TOC pill + stacked sections.
-->
<script lang="ts">
	import type { BlockEditorDoc, Project, Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';

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
	const codeChrome = siteLabels.blogChrome.detail.code;
	const readmeCopyLabel = resolveLocale(codeChrome.copyLabel, locale);
	const readmeCopyAria = resolveLocale(codeChrome.copyAria, locale);
	const readmeCopyErrorLabel = resolveLocale(codeChrome.errorLabel, locale);
	import HazardSeparator from '$lib/components/shared/HazardSeparator.svelte';
	import CtaBand from '$lib/components/shared/CtaBand.svelte';
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
	import SectionIcon from '$lib/components/shared/SectionIcon.svelte';
	import TocNav from '$lib/components/shared/TocNav.svelte';
	import TocPill from '$lib/components/shared/TocPill.svelte';
	import { observeActiveToc, tocElement, type TocEntry } from '$lib/components/shared/toc';
	import ProjectDetailHeader from './ProjectDetailHeader.svelte';
	import ProjectGlancePanel from './ProjectGlancePanel.svelte';
	import ProjectImageGallery from './ProjectImageGallery.svelte';
	import ProjectLinksCard from './ProjectLinksCard.svelte';
	import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { registerScrollContext, lenisAwareScrollTo } from '$lib/state/locale-handoff.svelte';

	let {
		project,
		services,
		serviceSvgContents,
		readmeHtml,
		codeHighlights
	}: {
		project: Project;
		services: Service[];
		serviceSvgContents: Record<string, string>;
		readmeHtml?: string;
		/** block.id → server-highlighted HTML ($lib/server/code-highlights). */
		codeHighlights?: Readonly<Record<string, string>>;
	} = $props();

	let activeHeadingId = $state('');
	let readmeBody = $state<HTMLElement | null>(null);
	let readmeCopyResetTimeout: ReturnType<typeof setTimeout> | null = null;

	type SectionView = {
		section: Project['sections'][number];
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

	function galleryTocEntry(gallery: SectionView): TocEntry {
		return {
			id: `project-gallery-${gallery.originalIndex}`,
			title: gallery.title,
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
		if (project.liveUrl || project.repoUrl || project.repoPrivate)
			entries.push({ id: 'glance-links', title: glanceLinksTitle, level: 2, badge: { kind: 'icon', name: 'arrow' }, rail: true, children: [] });
		return entries;
	}

	const sectionViews = $derived.by((): SectionView[] =>
		project.sections.map((section, originalIndex) => {
			const doc = resolveLocale(section.content, locale);
			return {
				section,
				originalIndex,
				title: resolveLocale(section.title, locale),
				doc,
				isImageGallery: isImageGalleryDoc(doc),
			};
		})
	);
	const imageGallerySections = $derived(sectionViews.filter((section) => section.isImageGallery));
	const articleSections = $derived(sectionViews.filter((section) => !section.isImageGallery));
	const firstArticleSection = $derived(articleSections[0]);
	const remainingArticleSections = $derived(articleSections.slice(1));
	const hasProjectLinks = $derived(!!project.liveUrl || !!project.repoUrl || !!project.repoPrivate);
	const readmeTocEntry = $derived.by((): TocEntry | null => {
		if (!readmeHtml) return null;
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

		for (const gallery of imageGallerySections) {
			entries.push(galleryTocEntry(gallery));
		}

		for (let i = 0; i < articleSections.length; i++) {
			entries.push(articleTocEntry(articleSections[i], i));
		}

		if (readmeTocEntry) entries.push(readmeTocEntry);

		// Glance-rail panels in the TOC (Stack / Services / Links). On mobile these
		// sit below the sections (in-flow); their scroll-target anchors (data-toc)
		// live on the mobile glance instance. On desktop they're already visible in
		// the rail. Badges mirror the glance cards' SectionIcon shapes.
		entries.push(...glanceTocEntries());

		return entries;
	});

	const mobileTocEntries = $derived.by((): TocEntry[] => {
		const entries: TocEntry[] = [];

		if (firstArticleSection) entries.push(articleTocEntry(firstArticleSection, 0));
		for (const gallery of imageGallerySections) entries.push(galleryTocEntry(gallery));
		for (let offset = 0; offset < remainingArticleSections.length; offset++) {
			const articleIndex = offset + 1;
			entries.push(articleTocEntry(remainingArticleSections[offset], articleIndex));
		}
		if (readmeTocEntry) entries.push(readmeTocEntry);
		entries.push(...glanceTocEntries());

		return entries;
	});

	const processedReadmeHtml = $derived.by(() => {
		if (!readmeHtml) return '';
		let idx = 0;
		// Same real "#" permalink as the blog path (homework #7c): id on the
		// opening tag, anchor injected before the closing tag. IDs must count
		// ALL h1-h6 (readmeTocChildren counts them all), but the visible anchor
		// only ships on h2-h4 — the levels the hover CSS positions.
		return readmeHtml.replace(
			/<(h[1-6])([^>]*)>([\s\S]*?)<\/\1>/gi,
			(match, tag, attrs, inner) => {
				const id = `readme-h-${idx++}`;
				const anchor = /^h[234]$/i.test(tag)
					? `<a class="heading-anchor" href="#${id}" aria-labelledby="${id}">#</a>`
					: '';
				return `<${tag}${attrs} id="${id}">${inner}${anchor}</${tag}>`;
			},
		);
	});

	function mermaidCssVar(style: CSSStyleDeclaration, name: string, fallback: string): string {
		return style.getPropertyValue(name).trim() || fallback;
	}

	function mermaidThemeVariables(root: Element): Record<string, string> {
		const style = getComputedStyle(root);
		const primary = mermaidCssVar(style, '--primary', '#E07800');
		const accent = mermaidCssVar(style, '--accent', '#FFB627');
		const background = mermaidCssVar(style, '--background', '#141414');
		const card = mermaidCssVar(style, '--card', '#1a1a1a');
		const foreground = mermaidCssVar(style, '--foreground', '#F5F5F0');
		const muted = mermaidCssVar(style, '--muted-foreground', '#949494');
		const border = mermaidCssVar(style, '--border-subtle', '#2f2f2f');

		return {
			background,
			mainBkg: card,
			primaryColor: card,
			primaryBorderColor: primary,
			primaryTextColor: foreground,
			secondaryColor: background,
			secondaryBorderColor: accent,
			secondaryTextColor: foreground,
			tertiaryColor: background,
			tertiaryBorderColor: border,
			tertiaryTextColor: foreground,
			lineColor: accent,
			textColor: foreground,
			nodeTextColor: foreground,
			clusterBkg: background,
			clusterBorder: primary,
			edgeLabelBackground: card,
			labelTextColor: foreground,
			noteBkgColor: card,
			noteTextColor: foreground,
			noteBorderColor: border,
			actorBkg: card,
			actorBorder: primary,
			actorTextColor: foreground,
			activationBkgColor: primary,
			activationBorderColor: accent,
			signalColor: muted,
			signalTextColor: foreground,
		};
	}

	// One observer drives the active state for BOTH the desktop nav and the mobile
	// pill (each receives activeHeadingId as a prop, no duplicate observers).
	onMount(() => observeActiveToc((id) => (activeHeadingId = id)));

	onMount(() => {
		if (!browser || !readmeHtml) return;

		let cancelled = false;
		let renderSerial = 0;
		let renderQueued = false;
		let observer: MutationObserver | null = null;

		async function renderReadmeMermaid(): Promise<void> {
			const token = ++renderSerial;
			await tick();
			if (cancelled || !readmeBody) return;

			// Query BEFORE importing: most readmes have zero diagrams, and the
			// mermaid bundle is ~144KB gz — only pay for it when one exists.
			const diagrams = [...readmeBody.querySelectorAll<HTMLElement>('[data-mermaid-source]')];
			if (diagrams.length === 0) return;
			const mermaid = (await import('mermaid')).default;
			for (let i = 0; i < diagrams.length; i++) {
				const diagram = diagrams[i];
				const source = diagram.getAttribute('data-mermaid-source')?.trim();
				const surface = diagram.querySelector<HTMLElement>('.mermaid-diagram__surface');
				if (!source || !surface) continue;
				try {
					const themeVariables = mermaidThemeVariables(diagram);
					const renderKey = `${source}\n${JSON.stringify(themeVariables)}`;
					if (diagram.dataset.mermaidRenderedKey === renderKey) continue;
					mermaid.initialize({
						startOnLoad: false,
						securityLevel: 'strict',
						theme: 'base',
						themeVariables,
						flowchart: {
							curve: 'basis',
							htmlLabels: false,
						},
					});
					const rendered = await mermaid.render(`readme-mermaid-${token}-${i}`, source);
					if (cancelled || token !== renderSerial) return;
					surface.innerHTML = rendered.svg;
					diagram.dataset.mermaidRenderedKey = renderKey;
					diagram.removeAttribute('data-mermaid-error');
				} catch {
					if (!cancelled && token === renderSerial) diagram.setAttribute('data-mermaid-error', 'true');
				}
			}
		}

		function queueReadmeMermaid(): void {
			if (renderQueued) return;
			renderQueued = true;
			requestAnimationFrame(() => {
				renderQueued = false;
				void renderReadmeMermaid();
			});
		}

		void renderReadmeMermaid();
		observer = new MutationObserver(queueReadmeMermaid);
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['data-theme', 'class'],
		});

		return () => {
			cancelled = true;
			observer?.disconnect();
		};
	});

	onMount(() => {
		if (!browser || !readmeHtml) return;

		let cancelled = false;
		let removeListener: (() => void) | null = null;

		async function handleReadmeCopy(event: MouseEvent): Promise<void> {
			const button = (event.target as HTMLElement | null)?.closest<HTMLButtonElement>('[data-code-copy-button]');
			if (!button || !readmeBody?.contains(button)) return;
			const terminal = button.closest<HTMLElement>('[data-code-copy]');
			const copyText = terminal?.getAttribute('data-code-copy') ?? '';
			if (!copyText) return;

			try {
				await navigator.clipboard.writeText(copyText);
				button.textContent = '✓';
			} catch {
				button.textContent = readmeCopyErrorLabel;
			}

			if (readmeCopyResetTimeout) clearTimeout(readmeCopyResetTimeout);
			readmeCopyResetTimeout = setTimeout(() => {
				button.textContent = readmeCopyLabel;
			}, 2000);
		}

		void tick().then(() => {
			if (cancelled || !readmeBody) return;
			for (const button of readmeBody.querySelectorAll<HTMLButtonElement>('[data-code-copy-button]')) {
				button.textContent = readmeCopyLabel;
				button.setAttribute('aria-label', readmeCopyAria);
			}
			readmeBody.addEventListener('click', handleReadmeCopy);
			removeListener = () => readmeBody?.removeEventListener('click', handleReadmeCopy);
		});

		return () => {
			cancelled = true;
			removeListener?.();
			if (readmeCopyResetTimeout) clearTimeout(readmeCopyResetTimeout);
		};
	});

	/** Map a TOC id to its DOM element via the shared resolver. `section-${i}` ids
	 *  are SYNTHETIC and locale-stable (driven by section index, not localized
	 *  text); README child ids are index-based too, so the same id resolves to the
	 *  corresponding heading on both /projects/x and /fr/projects/x. */
	function headingElement(id: string): Element | null {
		return tocElement(id);
	}

	function scrollToHeading(id: string): void {
		headingElement(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	// slice-34.4: reading position survives a locale switch. The detail page's
	// section ids are locale-stable (`section-${i}`, `readme-h-${idx}`), so we
	// capture the active heading id and, after the page remounts in the new
	// locale, scroll to that SAME heading. Raw scrollY would be wrong because FR/EN
	// body lengths differ, so the same heading sits at a different offset.
	onMount(() =>
		registerScrollContext({
			capture: () => ({ kind: 'heading', id: activeHeadingId, y: window.scrollY }),
			restore: (snap) => {
				const s = snap as { id?: string; y?: number } | null;
				const id = s?.id;
				const el = id ? headingElement(id) : null;
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

<article data-testid="project-detail-page">
	<!-- Full-bleed header -->
	<ProjectDetailHeader {project} />

	<!-- Edge-to-edge hazard stripes -->
	<HazardSeparator />

	<!-- Body: 3-column CSS Grid with TOC left, sections center, panel right -->
	<div class="detail-body">
		<aside class="toc-column">
			<div class="toc-rail toc-scroll" use:scrollChain>
				<TocNav
					entries={tocEntries}
					activeId={activeHeadingId}
					onNavigate={scrollToHeading}
					heading={tocHeading}
					sectionKey="proj-toc"
					counterPrefix={tocCounterPrefix}
				/>
				{#if imageGallerySections.length > 0}
					<div class="toc-gallery-stack" data-testid="project-image-gallery-rail">
						{#each imageGallerySections as gallery (gallery.originalIndex)}
							<CollapsibleSection
								title={gallery.title}
								sectionKey="proj-gallery-{gallery.originalIndex}"
								open={true}
							>
								{#snippet icon()}
									<SectionIcon name="image" class="h-4 w-4 shrink-0 text-primary" />
								{/snippet}
								<ProjectImageGallery doc={gallery.doc} />
							</CollapsibleSection>
						{/each}
					</div>
				{/if}
				{#if hasProjectLinks}
					<div class="toc-links-stack">
						<ProjectLinksCard project={project} sectionKey="glance-links-left-rail" />
					</div>
				{/if}
			</div>
		</aside>

		<div class="sections-column">
			{#if firstArticleSection}
				<div
					class="section-block"
					data-section-index={0}
				>
					<CollapsibleSection
						title={firstArticleSection.title}
						sectionKey="proj-section-0"
						index={0}
						open={true}
						>
							<div class="section-body">
								<BlockRenderer doc={firstArticleSection.doc} {codeHighlights} />
							</div>
						</CollapsibleSection>
					</div>
			{/if}

			{#if imageGallerySections.length > 0}
				<div class="mobile-gallery-stack lg:hidden" data-testid="project-image-gallery-mobile">
					{#each imageGallerySections as gallery (gallery.originalIndex)}
						<CollapsibleSection
							title={gallery.title}
							sectionKey="proj-gallery-mobile-{gallery.originalIndex}"
							anchor={`project-gallery-${gallery.originalIndex}`}
							open={true}
						>
							{#snippet icon()}
								<SectionIcon name="image" class="h-4 w-4 shrink-0 text-primary" />
							{/snippet}
							<ProjectImageGallery doc={gallery.doc} />
						</CollapsibleSection>
					{/each}
				</div>
			{/if}

			{#each remainingArticleSections as section, offset}
				{@const i = offset + 1}
				<div
					class="section-block"
					data-section-index={i}
				>
					<CollapsibleSection
						title={section.title}
						sectionKey="proj-section-{i}"
						index={i}
						open={true}
						>
							<div class="section-body">
								<BlockRenderer doc={section.doc} {codeHighlights} />
							</div>
						</CollapsibleSection>
					</div>
			{/each}

			{#if readmeHtml}
				<div
					class="section-block"
					data-section-index={articleSections.length}
				>
					<CollapsibleSection title={readmeSectionTitle} sectionKey="proj-readme" open={true}>
						{#snippet icon()}
							<SectionIcon name="github" class="h-5 w-5 shrink-0 text-primary" />
						{/snippet}
						<div class="prose-dark section-body" bind:this={readmeBody}>
							{@html processedReadmeHtml}
						</div>
					</CollapsibleSection>
				</div>
			{/if}
		</div>

		<aside class="glance-column">
			<ProjectGlancePanel {project} {services} {serviceSvgContents} showLinks={false} {codeHighlights} />
		</aside>
	</div>

	<!-- Mobile glance: the SAME panels as desktop (Services-style), rendered below
	     the sections like the services detail mobile rail. Replaces the old
	     condensed "Project Info" panel. -->
	<div class="lg:hidden px-[var(--space-page-x)] pb-8">
		<ProjectGlancePanel {project} {services} {serviceSvgContents} mobile {codeHighlights} />
	</div>

	<!-- End-of-case-study CTA: THE site conversion band, recycled and centered
	     on every surface that mounts it (operator round 2026-07-03). -->
	<section class="cta-area" data-testid="project-cta">
		<CtaBand testidPrefix="project-cta-band" />
	</section>
</article>

<!-- Mobile floating TOC pill -->
{#if mobileTocEntries.length > 0}
	<TocPill entries={mobileTocEntries} activeId={activeHeadingId} openAria={tocOpenAria} closeAria={tocCloseAria} />
{/if}

<style>
	/* End-of-case-study CTA: the shared band brings its own centered layout
	   AND its own hazard strip on top (operator rule), so the wrapper only
	   spaces. */
	.cta-area {
		margin-top: 1rem;
	}

	/* Section blocks match the side-column card spacing (mb-4 = 1rem) so the
	   center column isn't airier than the rails. */
	.section-block {
		margin-bottom: 1rem;
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

	.toc-column,
	.sections-column {
		position: relative;
	}

	.toc-column:has(:global(.project-image-gallery__lightbox)),
	.sections-column:has(:global(.project-image-gallery__lightbox)) {
		z-index: var(--z-overlay);
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

	/* Bare sticky TOC rail without a StickyPanel box (matches the clean services rail).
	   The TOC's CollapsibleSection card carries its own framing. */
	.toc-rail {
		position: sticky;
		top: 5rem;
	}

	/* No height cap because the TOC is as long as it needs (no internal-scroll clip).
	   The .toc-rail above keeps it sticky; the center column is the longest. */
	.toc-scroll {
		padding-bottom: 1rem;
	}

	.toc-gallery-stack {
		margin-top: 1rem;
	}

	.toc-links-stack {
		margin-top: 1rem;
	}

	.mobile-gallery-stack {
		margin-bottom: 1rem;
	}

	/* Section body text */
	.section-body {
		font-size: var(--text-detail-body-mobile);
		color: color-mix(in srgb, var(--foreground) 50%, transparent);
		line-height: 1.8;
	}

	@media (min-width: 1024px) {
		.section-body {
			font-size: var(--text-detail-body-desktop);
			color: color-mix(in srgb, var(--foreground) 55%, transparent);
			line-height: 1.9;
		}
	}

	/* Sub-section h3 styling (within rendered HTML content). The orange
	   left-edge bar retired per operator call (homework #7c): subheadings now
	   carry the same real "#" permalink as the blog. */
	.section-body :global(h3) {
		font-family: var(--font-heading);
		font-size: var(--text-detail-subheading-mobile);
		font-weight: 600;
		color: color-mix(in srgb, var(--foreground) 70%, transparent);
		margin: 20px 0 12px;
		position: relative;
	}

	@media (min-width: 1024px) {
		.section-body :global(h3) {
			font-size: var(--text-detail-subheading-desktop);
			color: color-mix(in srgb, var(--foreground) 80%, transparent);
			margin: 24px 0 16px;
		}
	}

	/* h3 is already position:relative via its subheading rule above; h2/h4
	   need it too so their permalinks anchor to the heading, not the column. */
	.section-body :global(h2),
	.section-body :global(h4) {
		position: relative;
	}

	.section-body :global(.heading-anchor) {
		position: absolute;
		right: 100%;
		margin-right: 0.5rem;
		color: var(--primary);
		text-decoration: none;
		opacity: 0;
		transform: translateX(-4px);
		transition: opacity var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default);
	}

	.section-body :global(h2):hover :global(.heading-anchor),
	.section-body :global(h3):hover :global(.heading-anchor),
	.section-body :global(h4):hover :global(.heading-anchor) {
		opacity: var(--opacity-muted);
		transform: translateX(0);
	}

	.section-body :global(.heading-anchor):focus-visible {
		opacity: 1;
		transform: translateX(0);
	}
</style>
