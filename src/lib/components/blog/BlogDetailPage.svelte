<!--
  Blog detail page orchestrator for /blog/[slug].
  Structure: full-bleed header + hazard separator + 4-zone body.
  Desktop: BEGIN (edge) + TOC (sideLeft) + prose (content) + TRANSMISSION (edge).
  Mobile: floating BlogTocPill + single-column prose.
  Edge labels use same title-variant sizing as EdgeRail (Pretext + Canvas measureText).
  Same architectural role as ProjectDetailPage.
-->
<script lang="ts">
  import type { BlogPost } from '$lib/data/types.js';
  import { Separator } from '$lib/components/ui/separator';
  import { StickyPanel } from '$lib/components/brand';
  import { SectionWrapper } from '$lib/components/shells';
  import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
  import TableOfContents from '$lib/components/shared/TableOfContents.svelte';
  import BlogDetailHeader from './BlogDetailHeader.svelte';
  import BlogContent from './BlogContent.svelte';
  import BlogTocPill from './BlogTocPill.svelte';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let {
    post,
    html,
    svgContent = '',
    readingTime = 0,
    postIndex = 1
  }: {
    post: BlogPost;
    html: string;
    svgContent?: string;
    readingTime?: number;
    postIndex?: number;
  } = $props();

  const accentColor = $derived(
    post.category === 'personal' ? 'var(--accent)' : 'var(--primary)'
  );

  // Bind hidden TOC to get processed HTML (with heading IDs injected)
  let tocRef: TableOfContents | undefined = $state();
  let processedHtml = $derived(
    tocRef ? tocRef.getProcessedHtml() : html
  );

  interface TocHeading {
    id: string;
    text: string;
    level: number;
  }

  // Parse headings from processed HTML for TOC + pill
  const headings = $derived.by((): TocHeading[] => {
    if (!browser) return [];
    const parser = new DOMParser();
    const doc = parser.parseFromString(processedHtml, 'text/html');
    const result: TocHeading[] = [];
    doc.querySelectorAll('h2, h3, h4').forEach((el) => {
      const id = el.id;
      const text = el.textContent?.trim() ?? '';
      const level = parseInt(el.tagName[1]);
      if (id && text) result.push({ id, text, level });
    });
    return result;
  });

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

  // Word count for annotations
  const wordCount = $derived(
    html.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length
  );

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
  // Uses Pretext for text width measurement, shared Canvas context for cross-axis.
  // Scale: targetSize = refSize * (viewportHeight / textWidth).
  let leftEdgeEl = $state<HTMLElement>(undefined!);
  let rightEdgeEl = $state<HTMLElement>(undefined!);
  let bodyGridEl = $state<HTMLElement>(undefined!);
  let edgesSized = $state(false);

  const REF_SIZE = 100; // reference font-size for measurement (px)

  function sizeEdgeToViewport(el: HTMLElement | undefined): number | undefined {
    if (!el || !browser) return;
    const labelEl = el.querySelector('[data-edge-text]') as HTMLElement | null;
    if (!labelEl) return;

    // Measure at reference size using the actual DOM element (accounts for
    // letter-spacing, font metrics, and all CSS properties automatically).
    // The text uses writing-mode: vertical-rl, so rect.height = text length.
    labelEl.style.fontSize = `${REF_SIZE}px`;
    const refRect = labelEl.getBoundingClientRect();
    if (refRect.height === 0) return;

    // Scale font-size so text length = viewport height (100dvh)
    const vh = window.innerHeight;
    const targetSize = REF_SIZE * (vh / refRect.height);
    labelEl.style.fontSize = `${targetSize}px`;

    // Column width = cross-axis of the sized text
    const finalRect = labelEl.getBoundingClientRect();
    return Math.ceil(finalRect.width);
  }

  $effect(() => {
    const leftWidth = sizeEdgeToViewport(leftEdgeEl);
    const rightWidth = sizeEdgeToViewport(rightEdgeEl);
    const maxWidth = Math.max(leftWidth ?? 0, rightWidth ?? 0);
    if (bodyGridEl && maxWidth > 0) {
      bodyGridEl.style.setProperty('--_edge-left', `${maxWidth}px`);
      bodyGridEl.style.setProperty('--_edge-right', `${maxWidth}px`);
      edgesSized = true;
    }
  });
</script>

<article data-testid="blog-detail-page" class:reading-active={readingMode} style="--blog-accent: {accentColor};">
  <!-- Full-bleed header -->
  <BlogDetailHeader {post} {svgContent} {accentColor} {readingTime} {postIndex} />

  <!-- Edge-to-edge hazard stripes -->
  <Separator variant="hazard" />

  <!-- Hidden: TableOfContents just for getProcessedHtml() heading ID injection -->
  <div class="hidden">
    <TableOfContents bind:this={tocRef} {html} />
  </div>

  <!-- Body: 4-zone magazine spread — BEGIN | TOC+content | TRANSMISSION -->
  <div bind:this={bodyGridEl} class="body-grid" class:body-grid--ready={edgesSized}>
    <!-- Left edge: BEGIN label -->
    <div bind:this={leftEdgeEl} class="body-edge body-edge--left" aria-hidden="true">
      <span data-edge-text class="body-edge__text">Begin<span class="body-edge__dot">.</span></span>
    </div>

    <!-- Center: SectionWrapper with TOC (sideLeft) + prose (content) -->
    <SectionWrapper
      layout="centered"
      container="none"
      class="detail-body"
      style="--edge-left: 340px; --edge-right: 0;"
    >
      {#snippet sideLeft()}
        <StickyPanel top="5rem">
          <div class="toc-panel toc-scroll">
            <!-- Reading mode switch -->
            <label class="reading-toggle">
              <span class="reading-toggle__label">Reading mode</span>
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

            <CollapsibleSection title="On this page" open={true}>
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
                <span class="left-meta__label">Category</span>
                <span class="left-meta__value">{post.category}</span>
              </div>
              <div class="left-meta__item">
                <span class="left-meta__label">Words</span>
                <span class="left-meta__value">{wordCount.toLocaleString()}</span>
              </div>
              <div class="left-meta__item">
                <span class="left-meta__label">Read time</span>
                <span class="left-meta__value">{readingTime} min</span>
              </div>
              <div class="left-meta__item">
                <span class="left-meta__label">Language</span>
                <span class="left-meta__value">{post.lang}</span>
              </div>
              {#if post.tags.length > 0}
                <div class="left-meta__item">
                  <span class="left-meta__label">Tags</span>
                  <span class="left-meta__value">{post.tags.join(' · ')}</span>
                </div>
              {/if}
            </div>
          </div>
        </StickyPanel>
      {/snippet}

      <!-- Center: prose content -->
      <BlogContent {accentColor}>
        {@html processedHtml}
      </BlogContent>
    </SectionWrapper>

    <!-- Right edge: TRANSMISSION label -->
    <div bind:this={rightEdgeEl} class="body-edge body-edge--right" aria-hidden="true">
      <span data-edge-text class="body-edge__text">Transmission<span class="body-edge__dot">.</span></span>
    </div>
  </div>
</article>

<!-- Mobile floating TOC pill -->
<BlogTocPill {headings} />

<style>
  /* ── 4-zone body grid ──────────────────────────────────────── */
  .body-grid {
    display: grid;
    grid-template-columns: 1fr;
    padding-inline: var(--space-page-x);
    margin-top: 2rem;
    min-width: 0;
    overflow-x: clip;
  }

  @media (min-width: 1024px) {
    .body-grid {
      grid-template-columns: var(--_edge-left, 120px) 1fr var(--_edge-right, 120px);
      padding-inline: 0;
      gap: 0;
      /* Hide until edge labels are sized to prevent layout shift */
      opacity: 0;
    }
    .body-grid--ready {
      opacity: 1;
      transition: opacity 0.15s ease;
    }
  }

  /* ── Edge labels: section-level, same sizing as EdgeRail title variant ── */
  .body-edge {
    display: none;
    position: sticky;
    top: 0;
    height: 100dvh;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    pointer-events: none;
    overflow: hidden;
  }

  @media (min-width: 1024px) {
    .body-edge {
      display: flex;
    }
  }

  .body-edge__text {
    font-family: var(--font-heading);
    font-size: var(--_title-size);
    line-height: 1;
    font-weight: 900;
    letter-spacing: -0.04em;
    color: color-mix(in srgb, var(--foreground) 6%, transparent);
    white-space: nowrap;
    writing-mode: vertical-rl;
  }

  .body-edge--left .body-edge__text {
    transform: rotate(180deg);
  }

  .body-edge__dot {
    color: var(--blog-accent, var(--primary));
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

  /* ── Body wrapper ──────────────────────────────────────────── */
  .detail-body {
    padding-inline: var(--space-page-x);
    padding-block: 1.5rem 3rem;
    min-width: 0;
  }

  /* Prevent grid content cell from overflowing (all breakpoints) */
  :global(.detail-body .section-content) {
    min-width: 0;
  }

  @media (min-width: 1024px) {
    .detail-body {
      padding-inline: 0;
      padding-block: 2.5rem 4rem;
    }
    :global(.detail-body) {
      gap: 1rem;
    }
    /* Align blog content card top with TOC — strip mt-8 on desktop */
    :global(.detail-body [data-testid="blog-content"]) {
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
