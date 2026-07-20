<!--
  Blog detail page orchestrator for /blog/[slug].
  Structure: full-bleed header + hazard separator + shared article body.
  Desktop: shared TOC + post meta rail + sectionized article cards.
  Mobile: post meta card + sectionized article cards + floating TOC pill.
  Same architectural role as ProjectDetailPage.
-->
<script lang="ts">
  import type { BlogPost, BlockEditorDoc, TocHeading } from '$lib/types';
  import HazardSeparator from '$lib/components/shared/HazardSeparator.svelte';
  import BlogDetailHeader from './BlogDetailHeader.svelte';
  import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';
  import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
  import SectionIcon from '$lib/components/shared/SectionIcon.svelte';
  import TocNav from '$lib/components/shared/TocNav.svelte';
  import TocPill from '$lib/components/shared/TocPill.svelte';
  import { observeActiveToc, tocElement, type TocEntry } from '$lib/components/shared/toc';
  import BlogEntryRail from './BlogEntryRail.svelte';
  import { onMount } from 'svelte';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';
  import { registerScrollContext, lenisAwareScrollTo } from '$lib/state/locale-handoff.svelte';
  import { resolveLocale } from '$lib/utils/locale';
  import { getLocale } from '$lib/utils/locale-context';
  import { sectionizeBlogBody } from '$lib/blog/sections';

  const locale = getLocale();
  import { siteLabels } from '$lib/content';

  // go2/w4: reading mode removed per operator QA. The default reading
  // experience is the only one. The readingMode field stays dormant in the
  // CMS cache to avoid schema churn.
  const detailPageChrome = siteLabels.blogChrome.detail.page;
  const metaWordsLabel = resolveLocale(detailPageChrome.metaWords, locale);
  const metaReadTimeLabel = resolveLocale(detailPageChrome.metaReadTime, locale);
  const metaLanguageLabel = resolveLocale(detailPageChrome.metaLanguage, locale);
  const metaTagsLabel = resolveLocale(detailPageChrome.metaTags, locale);
  const readingTimeTemplate = resolveLocale(siteLabels.blogChrome.detail.header.readingTimeLabel, locale);
  const tocHeading = resolveLocale(siteLabels.navChrome.shared.tocHeading, locale);
  const tocOpenAria = resolveLocale(siteLabels.navChrome.shared.tocMobileButton, locale);
  const tocCloseAria = resolveLocale(siteLabels.navChrome.shared.tocCloseAria, locale);
  const tocCounterPrefix = resolveLocale(siteLabels.navChrome.shared.tocCounterPrefix, locale);

  let {
    post,
    body,
    svgContent = '',
    readingTime = 0,
    wordCount = 0,
    headings = [],
    postIndex = 1,
    blogPage,
    codeHighlights,
  }: {
    post: BlogPost;
    body: BlockEditorDoc;
    svgContent?: string;
    readingTime?: number;
    wordCount?: number;
    headings?: readonly TocHeading[];
    postIndex?: number;
    blogPage?: import('@repo/shared').BlogPageContent;
    /** block.id → server-highlighted HTML ($lib/server/code-highlights). */
    codeHighlights?: Readonly<Record<string, string>>;
  } = $props();

  const readingTimeText = $derived(readingTimeTemplate.replace('{minutes}', String(readingTime)));

  const accentColor = $derived(
    post.category === 'personal' ? 'var(--accent-text)' : 'var(--primary)'
  );

  // Value localization for the meta sidebar (was rendering raw enum/code values).
  // Category name: CMS-backed via siteLabels.ui.category{Personal,Professional}
  // (same fields BlogDetailHeader already resolves for its category line).
  const categoryName = $derived(
    post.category === 'personal'
      ? resolveLocale(siteLabels.ui.categoryPersonal, locale)
      : resolveLocale(siteLabels.ui.categoryProfessional, locale)
  );

  // Language name: CMS-backed via siteLabels.ui.languageNames (a Locale-keyed
  // map of LocalizedString display names). resolveLocale picks the name in the
  // active UI locale, so an English post reads "English" on /, "Anglais" on /fr
  // replacing the raw `en`/`fr` code that leaked into the meta sidebar.
  const languageName = $derived(
    resolveLocale(siteLabels.ui.languageNames[post.lang], locale) || post.lang
  );

  // Shared active heading state, drives TOC + pill.
  let activeHeadingId = $state('');
  const articleSections = $derived(sectionizeBlogBody(body, post.title));
  const entryRail = $derived(blogPage?.entryRail);

  const entryRailTocEntries = $derived.by((): TocEntry[] => {
    if (!entryRail) return [];
    return [
      {
        id: 'blog-work-with-me',
        title: resolveLocale(entryRail.workWithMe.title, locale),
        level: 2,
        badge: { kind: 'icon', name: 'briefcase' },
        rail: true,
        children: [],
      },
      {
        id: 'blog-pick-route',
        title: resolveLocale(entryRail.routes.title, locale),
        level: 2,
        badge: { kind: 'icon', name: 'toc' },
        rail: true,
        children: [],
      },
    ];
  });

  const tocEntries = $derived.by((): TocEntry[] => {
    const entries: TocEntry[] = [];
    let sectionNumber = 0;
    let currentSection: TocEntry | null = null;

    for (const heading of headings) {
      if (heading.level <= 2 || currentSection === null) {
        const badge =
          heading.level === 2
            ? ({ kind: 'number', value: ++sectionNumber } as const)
            : undefined;
        currentSection = {
          id: heading.id,
          title: heading.text,
          level: heading.level,
          badge,
          children: [],
        };
        entries.push(currentSection);
      } else {
        currentSection.children.push({
          id: heading.id,
          title: heading.text,
          level: heading.level,
          children: [],
        });
      }
    }

    entries.push(...entryRailTocEntries);

    return entries;
  });

  onMount(() => observeActiveToc((id) => (activeHeadingId = id)));

  function scrollToHeading(id: string): void {
    tocElement(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // slice-34.4: reading position survives a locale switch.
  //
  // Blog heading ids are kebabSlug(headingText) (see @repo/shared
  // extractHeadings), so they are LOCALE-VARIABLE: "Getting Started" -> id
  // `getting-started` in EN, "Pour commencer" -> `pour-commencer` in FR. The raw
  // id therefore cannot survive the switch.
  //
  // The locale-stable analog is the active heading's ORDINAL INDEX in the
  // `headings` array. A translated post mirrors the source's heading structure,
  // so heading #3 in EN corresponds to heading #3 in FR. We capture that index
  // (plus the raw offset as a fallback) and, on the remounted FR/EN page, scroll
  // to the heading at the same index. If the structures differ (count mismatch,
  // index out of range, untranslated post) we fall back to the raw offset.
  // See the FLAG in the slice report: index-to-index assumes matched structure.
  function activeHeadingIndex(): number {
    return headings.findIndex((h) => h.id === activeHeadingId);
  }

  onMount(() =>
    registerScrollContext({
      capture: () => ({
        kind: 'heading-index',
        index: activeHeadingIndex(),
        count: headings.length,
        y: window.scrollY,
      }),
      restore: (snap) => {
        const s = snap as { index?: number; count?: number; y?: number } | null;
        const idx = s?.index ?? -1;
        // Restore by ordinal index only when the heading structure matches
        // (same count) and the index is in range. Otherwise the offset is the
        // safer guess than scrolling to a structurally-different heading.
        const sameStructure = s?.count === headings.length;
        const target = sameStructure && idx >= 0 ? headings[idx] : undefined;
        const el = target ? document.getElementById(target.id) : null;
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY;
          // Match the IntersectionObserver's -20% top rootMargin so the restored
          // heading lands where the observer considers it active.
          lenisAwareScrollTo(Math.max(0, top - window.innerHeight * 0.2));
        } else {
          lenisAwareScrollTo(Math.max(0, s?.y ?? 0));
        }
      },
    })
  );

  // Edge label sizing: font-size calculated so rotated text spans exactly 100dvh.
</script>

<article data-testid="blog-detail-page" style="--blog-accent: {accentColor};">
  <!-- Full-bleed header -->
  <BlogDetailHeader {post} {svgContent} {accentColor} {readingTime} {postIndex} {blogPage} />

  <!-- Edge-to-edge hazard stripes -->
  <HazardSeparator />

  <!-- Body: shared article grid (TOC/meta rail | section cards) -->
  <div class="body-grid">
    <aside class="context-column">
      <div class="context-panel toc-scroll" use:scrollChain>
        {#if tocEntries.length > 0}
          <div class="toc-nav-shell">
            <TocNav
              entries={tocEntries}
              activeId={activeHeadingId}
              onNavigate={scrollToHeading}
              heading={tocHeading}
              sectionKey="blog-toc"
              counterPrefix={tocCounterPrefix}
            />
          </div>
        {/if}

        <div class="meta-card" data-testid="blog-meta-card">
          <CollapsibleSection title={categoryName} sectionKey="blog-meta" open={true} accentColor={accentColor}>
            {#snippet icon()}
              <SectionIcon name="list" class="h-4 w-4 shrink-0 text-primary" />
            {/snippet}
            <dl class="meta-list">
              <div class="meta-list__item">
                <dt>{metaWordsLabel}</dt>
                <dd>{wordCount.toLocaleString()}</dd>
              </div>
              <div class="meta-list__item">
                <dt>{metaReadTimeLabel}</dt>
                <dd>{readingTimeText}</dd>
              </div>
              <div class="meta-list__item">
                <dt>{metaLanguageLabel}</dt>
                <dd>{languageName}</dd>
              </div>
              {#if post.tags.length > 0}
                <div class="meta-list__item">
                  <dt>{metaTagsLabel}</dt>
                  <dd>{post.tags.join(' · ')}</dd>
                </div>
              {/if}
            </dl>
          </CollapsibleSection>
        </div>
      </div>
    </aside>

    <div class="sections-column" data-testid="blog-sections">
      {#each articleSections as section, i (section.id)}
        <div class="blog-section-block">
          <CollapsibleSection
            title={section.title}
            sectionKey={section.id}
            anchor={section.anchor}
            index={i}
            open={true}
            accentColor={accentColor}
          >
            <div class="blog-section-body prose-dark" data-testid="blog-section-body" style="--blog-accent: {accentColor};">
              <BlockRenderer doc={section.doc} {codeHighlights} />
            </div>
          </CollapsibleSection>
        </div>
      {/each}
    </div>

    {#if entryRail}
      <aside class="entry-column">
        <BlogEntryRail rail={entryRail} />
      </aside>
    {/if}
  </div>

  {#if entryRail}
    <div class="entry-mobile lg:hidden px-[var(--space-page-x)] pb-8">
      <BlogEntryRail rail={entryRail} mobile />
    </div>
  {/if}
</article>

<!-- Mobile floating TOC pill -->
{#if tocEntries.length > 0}
  <TocPill entries={tocEntries} activeId={activeHeadingId} openAria={tocOpenAria} closeAria={tocCloseAria} />
{/if}

<style>
  /* ── Shared article grid ───────────────────────── */
  .body-grid {
    max-width: var(--container-wide);
    margin: 0 auto;
    padding-inline: var(--space-page-x);
    padding-block: 1.5rem;
    min-width: 0;
    overflow-x: clip;
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-card-gap);
  }

  .context-column,
  .sections-column,
  .entry-column {
    min-width: 0;
  }

  .sections-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  .entry-column {
    display: none;
  }

  @media (min-width: 1024px) {
    .body-grid {
      display: grid;
      width: 100%;
      max-width: none;
      grid-template-columns: minmax(12rem, 1fr) minmax(0, 46rem) minmax(12rem, 1fr);
      gap: 2rem;
      align-items: stretch;
      padding-block: 2.5rem;
    }

    .context-column {
      grid-column: 1;
      align-self: stretch;
      justify-self: end;
      width: min(18rem, 100%);
    }

    .sections-column {
      grid-column: 2;
      justify-self: center;
      max-width: 46rem;
    }

    .entry-column {
      display: block;
      grid-column: 3;
      align-self: stretch;
      justify-self: start;
      width: min(18rem, 100%);
    }

    .context-panel {
      position: sticky;
      top: 5rem;
    }
  }

  @media (min-width: 1024px) and (max-width: 1279px) {
    .body-grid {
      gap: 1.25rem;
    }

    .context-column {
      width: 100%;
      justify-self: stretch;
    }

    .sections-column {
      max-width: none;
      justify-self: stretch;
    }

    .entry-column {
      width: 100%;
      justify-self: stretch;
    }
  }

  .toc-nav-shell {
    display: none;
  }

  @media (min-width: 1024px) {
    .toc-nav-shell {
      display: block;
    }
  }

  .meta-card {
    margin-bottom: 1rem;
  }

  @media (min-width: 1024px) {
    .meta-card {
      margin-top: 1rem;
      margin-bottom: 0;
    }
  }

  .meta-list {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
  }

  .meta-list__item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .meta-list dt {
    font-family: var(--font-mono);
    font-size: var(--text-detail-kicker);
    letter-spacing: 0;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--blog-accent, var(--primary)) 35%, transparent);
  }

  .meta-list dd {
    margin: 0;
    font-family: var(--font-heading);
    font-size: var(--text-detail-meta);
    color: color-mix(in srgb, var(--foreground) 60%, transparent);
  }

  .blog-section-body {
    font-size: var(--text-detail-body-mobile);
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
    line-height: 1.8;
  }

  @media (min-width: 1024px) {
    .blog-section-body {
      font-size: var(--text-detail-body-desktop);
      color: color-mix(in srgb, var(--foreground) 55%, transparent);
      line-height: 1.9;
    }
  }

  /* Clickables are ORANGE on every post (yellow = conversion only, operator
     call homework #6a); --blog-accent stays on the decorative voice below. */
  .blog-section-body :global(a) {
    color: var(--primary);
  }

  .blog-section-body :global(code) {
    color: var(--blog-accent);
  }

  .blog-section-body :global(blockquote) {
    border-left-color: var(--blog-accent);
  }

  .blog-section-body :global(h2),
  .blog-section-body :global(h3),
  .blog-section-body :global(h4) {
    position: relative;
  }

  /* The "#" is a REAL copyable permalink (homework #7c): rendered inside the
     heading by cms/blocks/Heading.svelte (h2-h4), revealed on hover/focus. */
  .blog-section-body :global(.heading-anchor) {
    position: absolute;
    right: 100%;
    margin-right: 0.5rem;
    color: var(--primary);
    text-decoration: none;
    opacity: 0;
    transform: translateX(-4px);
    transition: opacity var(--duration-normal) var(--ease-default), transform var(--duration-normal) var(--ease-default);
  }

  .blog-section-body :global(h2):hover :global(.heading-anchor),
  .blog-section-body :global(h3):hover :global(.heading-anchor),
  .blog-section-body :global(h4):hover :global(.heading-anchor) {
    opacity: var(--opacity-muted);
    transform: translateX(0);
  }

  .blog-section-body :global(.heading-anchor):focus-visible {
    opacity: 1;
    transform: translateX(0);
  }

  @media (min-width: 1024px) {
    .toc-scroll {
      max-height: calc(100dvh - 6rem);
      overflow-y: auto;
      padding-bottom: 1rem;
    }
  }

  /* go2/w4: reading-mode switch + dim styles removed per operator QA. */
</style>
