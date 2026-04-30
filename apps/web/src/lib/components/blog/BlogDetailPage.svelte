<!--
  Blog detail page orchestrator for /blog/[slug].
  Structure: full-bleed header + hazard separator + 4-zone body.
  Desktop: BEGIN (edge) + TOC (sideLeft) + prose (content) + TRANSMISSION (edge).
  Mobile: floating BlogTocPill + single-column prose.
  Edge labels use writing-mode: vertical-rl with clamp() sizing.
  Same architectural role as ProjectDetailPage.
-->
<script lang="ts">
  import type { BlogPost, BlockEditorDoc, TocHeading } from '$lib/types';
  import { Separator } from '$lib/components/ui/separator';
  import { StickyPanel } from '$lib/components/brand';
  import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
  import BlogDetailHeader from './BlogDetailHeader.svelte';
  import BlogContent from './BlogContent.svelte';
  import BlogTocPill from './BlogTocPill.svelte';
  import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';
  import { onMount } from 'svelte';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';
  import { resolveLocale } from '$lib/utils/locale';
  import { blogDetailContent } from '$lib/content/blog';

  const readingModeLabel = resolveLocale(blogDetailContent.page.readingMode, 'en');
  const tocSectionTitle = resolveLocale(blogDetailContent.page.tocSectionTitle, 'en');
  const metaCategoryLabel = resolveLocale(blogDetailContent.page.metaCategory, 'en');
  const metaWordsLabel = resolveLocale(blogDetailContent.page.metaWords, 'en');
  const metaReadTimeLabel = resolveLocale(blogDetailContent.page.metaReadTime, 'en');
  const metaLanguageLabel = resolveLocale(blogDetailContent.page.metaLanguage, 'en');
  const metaTagsLabel = resolveLocale(blogDetailContent.page.metaTags, 'en');

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
    post.category === 'personal' ? 'var(--accent)' : 'var(--primary)'
  );

  // Reading mode — dims everything except left panel + blog content
  let readingMode = $state(false);

  // Shared active heading state — drives TOC + pill
  let activeHeadingId = $state('');

  const activeIndex = $derived(
    Math.max(0, headings.findIndex((h) => h.id === activeHeadingId))
  );

  const h2Count = $derived(
    headings.filter((h) => h.level === 2).length
  );

  const h2Index = $derived.by(() => {
    let count = 0;
    for (let i = 0; i <= activeIndex; i++) {
      if (headings[i]?.level === 2) count++;
    }
    return count;
  });

  // IntersectionObserver for heading tracking (desktop TOC)
  onMount(() => {
    const contentEl = document.querySelector('[data-testid="blog-content"]');
    if (!contentEl) return;

    const observedHeadings = contentEl.querySelectorAll('h2[id], h3[id], h4[id]');
    if (observedHeadings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            activeHeadingId = entry.target.id;
          }
        }
      },
      { rootMargin: '-20% 0px -70% 0px' }
    );
    observedHeadings.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  });

  function scrollToHeading(id: string): void {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Edge label sizing: font-size calculated so rotated text spans exactly 100dvh.
</script>

<article data-testid="blog-detail-page" class:reading-active={readingMode} style="--blog-accent: {accentColor};">
  <!-- Full-bleed header -->
  <BlogDetailHeader {post} {svgContent} {accentColor} {readingTime} {postIndex} {blogPage} />

  <!-- Edge-to-edge hazard stripes -->
  <Separator variant="hazard" />

  <!-- Body: simple centered 2-column grid (TOC | content) -->
  <div class="body-grid">
    <!-- TOC sidebar — desktop only -->
    <div class="toc-column">
      <StickyPanel top="5rem">
        <div class="toc-panel toc-scroll" use:scrollChain>
          <!-- Reading mode switch -->
          <label class="reading-toggle">
            <span class="reading-toggle__label">{readingModeLabel}</span>
            <button
              class="reading-switch"
              class:reading-switch--on={readingMode}
              onclick={() => (readingMode = !readingMode)}
              role="switch"
              aria-checked={readingMode}
            >
              <span class="reading-switch__thumb"></span>
            </button>
          </label>

          <CollapsibleSection title={tocSectionTitle} open={true}>
            <nav class="toc-nav">
              {#each headings as heading}
                <button
                  class="toc-item"
                  class:toc-sub-item={heading.level > 2}
                  class:active={activeHeadingId === heading.id}
                  onclick={() => scrollToHeading(heading.id)}
                  style={heading.level > 2 ? `padding-left: ${16 + (heading.level - 3) * 10}px;` : ''}
                >
                  {#if activeHeadingId === heading.id}
                    <div class="toc-dot"></div>
                  {/if}
                  {heading.text}
                </button>
              {/each}
            </nav>

            <div class="mt-6 flex items-center gap-2">
              <div class="toc-counter-dot"></div>
              <span class="toc-counter-text font-mono text-micro tracking-[1.5px]">
                SEC {h2Index} / {h2Count}
              </span>
            </div>
          </CollapsibleSection>

          <!-- Post metadata panel -->
          <div class="left-meta" aria-hidden="true">
            <div class="left-meta__item">
              <span class="left-meta__label">{metaCategoryLabel}</span>
              <span class="left-meta__value">{post.category}</span>
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
              <span class="left-meta__value">{post.lang}</span>
            </div>
            {#if post.tags.length > 0}
              <div class="left-meta__item">
                <span class="left-meta__label">{metaTagsLabel}</span>
                <span class="left-meta__value">{post.tags.join(' · ')}</span>
              </div>
            {/if}
          </div>
        </div>
      </StickyPanel>
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
<BlogTocPill headings={headings as TocHeading[]} />

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

  .content-column {
    min-width: 0;
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

  /* ── TOC nav ───────────────────────────────────────────────── */
  .toc-nav {
    font-family: var(--font-heading);
    font-size: 15px;
    line-height: 2.4;
    border-left: 2px solid color-mix(in srgb, var(--blog-accent, var(--primary)) 12%, transparent);
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
    color: var(--blog-accent, var(--primary));
    font-weight: 600;
  }

  .toc-sub-item {
    font-size: 13px;
    color: color-mix(in srgb, var(--foreground) 20%, transparent);
  }

  .toc-sub-item:hover {
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
  }

  .toc-sub-item.active {
    color: var(--blog-accent, var(--primary));
  }

  .toc-dot {
    position: absolute;
    left: -19px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--blog-accent, var(--primary));
  }

  .toc-counter-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--blog-accent, var(--primary));
    box-shadow: 0 0 8px color-mix(in srgb, var(--blog-accent, var(--primary)) 40%, transparent);
  }

  .toc-counter-text {
    color: color-mix(in srgb, var(--blog-accent, var(--primary)) 30%, transparent);
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

  /* ── Reading mode switch ────────────────────────────────────── */
  .reading-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0;
    margin-bottom: 1rem;
    cursor: pointer;
  }

  .reading-toggle__label {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: color-mix(in srgb, var(--foreground) 40%, transparent);
    user-select: none;
  }

  .reading-switch {
    position: relative;
    width: 36px;
    height: 20px;
    border-radius: 10px;
    background: color-mix(in srgb, var(--foreground) 12%, transparent);
    border: 1px solid color-mix(in srgb, var(--foreground) 15%, transparent);
    cursor: pointer;
    padding: 0;
    transition: background var(--duration-fast) var(--ease-default),
                border-color var(--duration-fast) var(--ease-default);
  }

  .reading-switch--on {
    background: var(--blog-accent, var(--primary));
    border-color: var(--blog-accent, var(--primary));
  }

  .reading-switch__thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background: var(--foreground);
    transition: transform var(--duration-fast) var(--ease-default);
  }

  .reading-switch--on .reading-switch__thumb {
    transform: translateX(16px);
  }

  /* ── Reading mode: dim everything except left panel + content ── */
  :global(.reading-active) :global([data-testid="blog-detail-header"]),
  :global(.reading-active) .body-edge {
    opacity: 0.1;
    transition: opacity 0.3s ease;
  }

  :global(.reading-active) ~ :global(div:has(> footer)),
  :global(.reading-active) ~ :global(footer) {
    opacity: 0.1;
    transition: opacity 0.3s ease;
  }
</style>
