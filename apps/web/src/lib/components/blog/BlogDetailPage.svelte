<script lang="ts">
	import '#lib/styles/article-body.css';
	import { afterNavigate } from '$app/navigation';
  import type { BlogPost, BlockEditorDoc, TocHeading } from '#lib/types.ts';
  import SectionsToggle from '#lib/components/shared/SectionsToggle.svelte';
  import BlockRenderer from '#lib/components/cms/BlockRenderer.svelte';
  import MediaGallery from '#lib/components/media/MediaGallery.svelte';
  import MediaLightbox from '#lib/components/media/MediaLightbox.svelte';
  import { articleMediaLabels, setArticleMedia } from '#lib/media/article-media.svelte.ts';
  import { collectProjectImages } from '#lib/projects/project-images.ts';
  import { collectProjectVideos, youtubeLabels } from '#lib/utils/youtube.ts';
  import {
    CollapsibleSection,
    SectionIcon,
    TocNav,
    useSectionJump,
    type TocEntry,
  } from '@yesid/ui/brand';
  import { ArticleHeader, DetailFrame } from '@yesid/ui/layout';

  import BlogEntryRail from './BlogEntryRail.svelte';
  import { registerDetailReadingPosition } from '#lib/state/detail-reading-position.ts';
  import { resolveLocale } from '#lib/utils/locale.ts';
  import { getLocale, intl } from '#lib/utils/locale-context.ts';
  import { localizeHref } from '#lib/utils/locale-routing.ts';
  import { fillTemplate } from '#lib/utils/labels.ts';
  import { sectionizeBlogBody } from '#lib/blog/sections.ts';

  const locale = getLocale();
  import { siteLabels } from '#lib/content/index.ts';

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
    codeHighlights,
  }: {
    post: BlogPost;
    body: BlockEditorDoc;
    svgContent?: string;
    readingTime?: number;
    wordCount?: number;
    headings?: readonly TocHeading[];
    postIndex?: number;
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

  const detailChrome = siteLabels.blogChrome.detail;
  const backHref = $derived(
    localizeHref(post.category === 'personal' ? '/blog/personal' : '/blog', post.lang)
  );
  const backLabel = $derived(
    resolveLocale(
      post.category === 'personal' ? detailChrome.backNav.toPersonal : detailChrome.backNav.toDispatches,
      locale
    )
  );
  const watermark = $derived(
    resolveLocale(
      post.category === 'personal' ? siteLabels.ui.watermarkPersonal : siteLabels.ui.watermarkProfessional,
      locale
    )
  );
  const editionTemplate =
    resolveLocale(siteLabels.ui.blogEditionTemplate, locale) || 'VOL. 01 // ISS. {issue}';
  const formattedDate = $derived(
    intl.dateTime(locale, { month: 'short', year: 'numeric' }).format(new Date(`${post.date}T00:00:00`))
  );
  const headerMeta = $derived([
    { text: formattedDate, datetime: post.date },
    readingTimeText,
    languageName,
  ]);

  // Shared active heading state, drives TOC + pill.
  let activeHeadingId = $state('');
  const articleSections = $derived(sectionizeBlogBody(body, post.title));
  const galleryImages = $derived(collectProjectImages([body]));
  const galleryVideos = $derived(collectProjectVideos([body]));
  const imageGalleryTitle = articleMediaLabels[locale].images;
  const media = setArticleMedia(() => galleryImages, () => galleryVideos);
  const videoGalleryTitle = $derived(youtubeLabels[locale].gallery);
  const entryRail = detailChrome.entryRail;

  const entryRailTocEntries: TocEntry[] = [
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

    if (galleryImages.length > 0) entries.push({
      id: 'blog-images', title: imageGalleryTitle, level: 2,
      badge: { kind: 'icon', name: 'image' }, children: [],
    });
    if (galleryVideos.length > 0) entries.push({
      id: 'blog-videos',
      title: videoGalleryTitle,
      level: 2,
      badge: { kind: 'icon', name: 'image' },
      children: [],
    });
    entries.push(...entryRailTocEntries);

    return entries;
  });

  const navigation = useSectionJump(afterNavigate);

  registerDetailReadingPosition('[data-testid="blog-sections"] > .blog-section-block', navigation);

  // Edge label sizing: font-size calculated so rotated text spans exactly 100dvh.
</script>

<div style="padding-top: var(--chrome-offset);">
  {#snippet left()}
    <div class="context-column">
      <div class="context-panel toc-scroll">
        {#if tocEntries.length > 0}
          <div class="toc-nav-shell">
            <TocNav
              entries={tocEntries}
              activeId={activeHeadingId}
              {navigation}
              heading={tocHeading}
              counterPrefix={tocCounterPrefix}
            />
          </div>
        {/if}

        <div class="meta-card" data-testid="blog-meta-card" data-ripple-exempt>
          <CollapsibleSection title={categoryName} open={true} accentColor={accentColor}>
            {#snippet icon()}
              <SectionIcon name="list" class="h-4 w-4 shrink-0 text-primary" />
            {/snippet}
            <dl class="meta-list">
              <div class="meta-list__item">
                <dt>{metaWordsLabel}</dt>
                <dd>{intl.number(locale).format(wordCount)}</dd>
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
    </div>
  {/snippet}

  {#snippet right()}
    <div class="entry-column reading-support">
      <BlogEntryRail rail={entryRail} />
    </div>
  {/snippet}

  {#snippet after()}
    <div class="entry-mobile reading-support lg:hidden px-[var(--space-page-x)] pb-8">
      <BlogEntryRail rail={entryRail} mobile />
    </div>
  {/snippet}

  <DetailFrame
    {left}
    {right}
    {after}
    data-testid="blog-detail-page"
    class="reading-detail"
    style="--blog-accent: {accentColor};"
    measure="46rem"
    railScroll
    leftMobile
    bind:activeId={activeHeadingId}
    toc={{
      entries: tocEntries,
      openAria: tocOpenAria,
      closeAria: tocCloseAria,
      navigation,
      selector: '[data-testid="blog-section-body"] h3[id], [data-testid="blog-section-body"] h4[id]',
      landFragments: true,
    }}
  >
    {#snippet header()}
      <ArticleHeader
        title={post.title}
        category={categoryName}
        {watermark}
        edgeLeft={fillTemplate(editionTemplate, { issue: String(postIndex).padStart(2, '0') })}
        edgeRight={`${post.date.replace(/-/g, '.')} // ${readingTimeText.toUpperCase()}`}
        meta={headerMeta}
        {backHref}
        {backLabel}
        accent={accentColor}
        testId="blog-detail-header"
      >
        {#snippet controls()}
          <SectionsToggle />
        {/snippet}
      </ArticleHeader>
    {/snippet}

    <div class="sections-column" data-testid="blog-sections" data-ripple-exempt>
      {#each articleSections as section, i (section.id)}
        <div class="blog-section-block">
          <CollapsibleSection
            title={section.title}
            anchor={section.anchor}
            index={i}
            open={true}
            accentColor={accentColor}
          >
            <div class="article-body blog-section-body prose-dark" data-testid="blog-section-body" style="--blog-accent: {accentColor};">
              <BlockRenderer doc={section.doc} {codeHighlights} />
            </div>
          </CollapsibleSection>
        </div>
      {/each}
      {#if galleryImages.length > 0}
        <div class="blog-section-block" data-testid="blog-image-gallery">
          <CollapsibleSection title={imageGalleryTitle} anchor="blog-images" open={true} accentColor={accentColor}>
            {#snippet icon()}<SectionIcon name="image" class="h-4 w-4 shrink-0 text-primary" />{/snippet}
            <MediaGallery kind="image" />
          </CollapsibleSection>
        </div>
      {/if}
      {#if galleryVideos.length > 0}
        <div class="blog-section-block" data-testid="blog-video-gallery">
          <CollapsibleSection title={videoGalleryTitle} anchor="blog-videos" open={true} accentColor={accentColor}>
            {#snippet icon()}
              <SectionIcon name="image" class="h-4 w-4 shrink-0 text-primary" />
            {/snippet}
            <MediaGallery kind="video" />
          </CollapsibleSection>
        </div>
      {/if}
    </div>
  </DetailFrame>
</div>

<MediaLightbox {media} />

<style>
  .sections-column {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    width: 100%;
  }

  @media (--desktop-min) {
    .context-column,
    .entry-column {
      width: min(18rem, 100%);
    }

    .context-column {
      margin-inline-start: auto;
    }
  }

  .toc-scroll {
    padding-bottom: 1rem;
  }

  .toc-nav-shell {
    display: none;
  }

  @media (--desktop-min) {
    .toc-nav-shell {
      display: block;
    }
  }

  .meta-card {
    margin-bottom: 1rem;
  }

  @media (--desktop-min) {
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
    color: var(--muted-foreground);
  }

  .meta-list dd {
    margin: 0;
    font-family: var(--font-heading);
    font-size: var(--text-detail-meta);
    color: color-mix(in srgb, var(--foreground) 60%, transparent);
  }

  .blog-section-body :global(code) {
    color: var(--blog-accent);
  }

  .blog-section-body :global(blockquote) {
    border-left-color: var(--blog-accent);
  }

</style>
