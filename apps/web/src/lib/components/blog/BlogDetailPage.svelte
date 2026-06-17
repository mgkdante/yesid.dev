<!--
  Blog detail page orchestrator for /blog/[slug].
  Structure: full-bleed header + hazard separator + 4-zone body.
  Desktop: BEGIN edge + shared TOC + prose content + TRANSMISSION edge.
  Mobile: shared floating TOC pill + single-column prose.
  Edge labels use writing-mode: vertical-rl with clamp() sizing.
  Same architectural role as ProjectDetailPage.
-->
<script lang="ts">
  import type { BlogPost, BlockEditorDoc, TocHeading } from '$lib/types';
  import { Separator } from '$lib/components/ui/separator';
  import BlogDetailHeader from './BlogDetailHeader.svelte';
  import BlogContent from './BlogContent.svelte';
  import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';
  import TocNav from '$lib/components/shared/TocNav.svelte';
  import TocPill from '$lib/components/shared/TocPill.svelte';
  import { observeActiveToc, tocElement, type TocEntry } from '$lib/components/shared/toc';
  import { onMount } from 'svelte';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';
  import { registerScrollContext, lenisAwareScrollTo } from '$lib/state/locale-handoff.svelte';
  import { resolveLocale } from '$lib/utils/locale';
  import { getLocale } from '$lib/utils/locale-context';

  const locale = getLocale();
  import { siteLabels } from '$lib/content';

  // go2/w4: reading mode removed per operator QA — the default reading
  // experience is the only one. The readingMode field stays dormant in the
  // CMS cache to avoid schema churn.
  const detailPageChrome = siteLabels.blogChrome.detail.page;
  const metaCategoryLabel = resolveLocale(detailPageChrome.metaCategory, locale);
  const metaWordsLabel = resolveLocale(detailPageChrome.metaWords, locale);
  const metaReadTimeLabel = resolveLocale(detailPageChrome.metaReadTime, locale);
  const metaLanguageLabel = resolveLocale(detailPageChrome.metaLanguage, locale);
  const metaTagsLabel = resolveLocale(detailPageChrome.metaTags, locale);
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
  }: {
    post: BlogPost;
    body: BlockEditorDoc;
    svgContent?: string;
    readingTime?: number;
    wordCount?: number;
    headings?: readonly TocHeading[];
    postIndex?: number;
    blogPage?: import('@repo/shared').BlogPageContent;
  } = $props();

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
  // — replacing the raw `en`/`fr` code that leaked into the meta sidebar.
  const languageName = $derived(
    resolveLocale(siteLabels.ui.languageNames[post.lang], locale) || post.lang
  );

  // Shared active heading state — drives TOC + pill
  let activeHeadingId = $state('');

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

    return entries;
  });

  onMount(() => observeActiveToc((id) => (activeHeadingId = id)));

  function scrollToHeading(id: string): void {
    tocElement(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // slice-34.4 — reading position survives a locale switch.
  //
  // Blog heading ids are kebabSlug(headingText) (see @repo/shared
  // extractHeadings), so they are LOCALE-VARIABLE: "Getting Started" → id
  // `getting-started` in EN, "Pour commencer" → `pour-commencer` in FR. The raw
  // id therefore cannot survive the switch.
  //
  // The locale-stable analog is the active heading's ORDINAL INDEX in the
  // `headings` array — a translated post mirrors the source's heading structure,
  // so heading #3 in EN corresponds to heading #3 in FR. We capture that index
  // (plus the raw offset as a fallback) and, on the remounted FR/EN page, scroll
  // to the heading at the same index. If the structures differ (count mismatch,
  // index out of range, untranslated post) we fall back to the raw offset.
  // See the FLAG in the slice report — index↔index assumes matched structure.
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
        // (same count) and the index is in range — otherwise the offset is the
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
  <Separator variant="hazard" />

  <!-- Body: simple centered 2-column grid (TOC | content) -->
  <div class="body-grid">
    <!-- TOC sidebar — desktop only -->
    <div class="toc-column">
      <div class="toc-panel toc-scroll" use:scrollChain>
        {#if tocEntries.length > 0}
          <TocNav
            entries={tocEntries}
            activeId={activeHeadingId}
            onNavigate={scrollToHeading}
            heading={tocHeading}
            sectionKey="blog-toc"
            counterPrefix={tocCounterPrefix}
          />
        {/if}

        <!-- Post metadata panel -->
        <div class="left-meta" aria-hidden="true">
          <div class="left-meta__item">
            <span class="left-meta__label">{metaCategoryLabel}</span>
            <span class="left-meta__value">{categoryName}</span>
          </div>
          <div class="left-meta__item">
            <span class="left-meta__label">{metaWordsLabel}</span>
            <span class="left-meta__value">{wordCount.toLocaleString()}</span>
          </div>
          <div class="left-meta__item">
            <span class="left-meta__label">{metaReadTimeLabel}</span>
            <span class="left-meta__value">{readingTime} min</span>
          </div>
          <div class="left-meta__item">
            <span class="left-meta__label">{metaLanguageLabel}</span>
            <span class="left-meta__value">{languageName}</span>
          </div>
          {#if post.tags.length > 0}
            <div class="left-meta__item">
              <span class="left-meta__label">{metaTagsLabel}</span>
              <span class="left-meta__value">{post.tags.join(' · ')}</span>
            </div>
          {/if}
        </div>
      </div>
    </div>

    <!-- Center: prose content -->
    <div class="content-column">
      <BlogContent {accentColor}>
        <BlockRenderer doc={body} />
      </BlogContent>
    </div>
  </div>
</article>

<!-- Mobile floating TOC pill -->
{#if tocEntries.length > 0}
  <TocPill entries={tocEntries} activeId={activeHeadingId} openAria={tocOpenAria} closeAria={tocCloseAria} />
{/if}

<style>
  /* ── Centered 2-column body grid ───────────────────────── */
  .body-grid {
    max-width: var(--container-wide);
    margin: 2rem auto 0;
    padding-inline: var(--space-page-x);
    min-width: 0;
    overflow-x: clip;
    display: flex;
    flex-direction: column;
  }

  .toc-column {
    display: none;
  }

  /* go2/w4 operator QA: classic blog measure on BOTH breakpoints — the
     prose card is capped at a readable column and centered. 46rem box
     (card padding included) keeps the inner text at the .prose-dark 72ch
     cap or below (~65-75ch at the 1.0625-1.125rem prose sizes), consistent
     with the --container-* token family. */
  .content-column {
    min-width: 0;
    width: 100%;
    max-width: 46rem;
    margin-inline: auto;
  }

  @media (min-width: 1024px) {
    .body-grid {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: clamp(1.5rem, 2.5vw, 3rem);
      align-items: start;
    }
    .toc-column {
      display: block;
    }

    .toc-panel {
      position: sticky;
      top: 5rem;
    }
  }

  @media (min-width: 1024px) and (max-width: 1279px) {
    .body-grid {
      grid-template-columns: 1fr 1.5fr;
    }
  }


  /* ── Left column metadata panel ──────────────────────────────── */
  .left-meta {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid color-mix(in srgb, var(--blog-accent, var(--primary)) 10%, transparent);
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .left-meta__item {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .left-meta__label {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--blog-accent, var(--primary)) 35%, transparent);
  }

  .left-meta__value {
    font-family: var(--font-heading);
    font-size: 17px;
    color: color-mix(in srgb, var(--foreground) 60%, transparent);
  }

  /* Align blog content card top with TOC on desktop */
  @media (min-width: 1024px) {
    .content-column :global([data-testid="blog-content"]) {
      margin-top: 0;
    }
  }

  /* ── TOC scrollable area ───────────────────────────────────── */
  .toc-scroll {
    max-height: calc(100dvh - 14rem);
    overflow-y: auto;
    padding-bottom: 1rem;
  }

  /* go2/w4: reading-mode switch + dim styles removed per operator QA. */
</style>
