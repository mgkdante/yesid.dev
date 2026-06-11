<!--
  Floating TOC pill for blog detail on mobile (<lg).
  Shows current heading + counter at bottom center.
  Tapping opens a drawer with full heading list.
  Same UX pattern as ProjectTocPill.
-->
<script lang="ts">
  import { ChevronToggle } from '$lib/components/brand';
  import { onMount, onDestroy } from 'svelte';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';
  import { resolveLocale } from '$lib/utils/locale';
  import { blogDetailContent } from '$lib/content/blog';

  const tocOpenAria = resolveLocale(blogDetailContent.tocPill.openAria, 'en');
  const tocCloseAria = resolveLocale(blogDetailContent.tocPill.closeAria, 'en');

  interface TocHeading {
    id: string;
    text: string;
    level: number;
  }

  let { headings }: { headings: TocHeading[] } = $props();

  let visible = $state(false);
  let drawerOpen = $state(false);
  let activeId = $state('');

  const activeIndex = $derived(
    Math.max(0, headings.findIndex((h) => h.id === activeId))
  );
  const activeName = $derived(
    headings[activeIndex]?.text ?? ''
  );
  const h2Count = $derived(
    headings.filter((h) => h.level === 2).length
  );

  let heroObserver: IntersectionObserver | undefined;
  let headingObserver: IntersectionObserver | undefined;

  onMount(() => {
    const headerEl = document.querySelector('[data-testid="blog-detail-header"]');
    const contentEl = document.querySelector('[data-testid="blog-content"]');

    if (headerEl) {
      heroObserver = new IntersectionObserver(
        ([entry]) => { visible = !entry.isIntersecting; },
        { threshold: 0 }
      );
      heroObserver.observe(headerEl);
    }

    if (contentEl) {
      const headingEls = contentEl.querySelectorAll('h2[id], h3[id], h4[id]');
      if (headingEls.length > 0) {
        headingObserver = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting && entry.target.id) {
                activeId = entry.target.id;
              }
            }
          },
          { rootMargin: '-20% 0px -70% 0px' }
        );
        headingEls.forEach((el) => headingObserver?.observe(el));
      }
    }
  });

  onDestroy(() => {
    heroObserver?.disconnect();
    headingObserver?.disconnect();
  });

  function scrollTo(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      drawerOpen = false;
    }
  }
</script>

{#if visible}
  <div class="toc-pill-container lg:hidden" data-testid="blog-toc-pill">
    <!--
      A11y: the button shows visible text ("{activeName} {n}/{total}") while
      tocOpenAria carries the purpose ("Table of contents"). Lighthouse 2.5.3
      (label-content-name-mismatch) requires the visible text to appear as a
      prefix of the accessible name. Compose aria-label so it starts with the
      same visible string, then appends the purpose.
    -->
    <button
      class="toc-pill"
      onclick={() => (drawerOpen = !drawerOpen)}
      aria-label={`${activeName} ${activeIndex + 1}/${h2Count} — ${tocOpenAria}`}
    >
      <div class="h-1.5 w-1.5 rounded-full bg-[var(--blog-accent,var(--primary))]"></div>
      <span class="toc-pill-name font-mono text-caption">
        {activeName}
      </span>
      <span class="toc-pill-counter font-mono text-micro">
        {activeIndex + 1}/{h2Count}
      </span>
      <ChevronToggle open={drawerOpen} size="sm" direction="down" />
    </button>

    {#if drawerOpen}
      <button
        class="toc-drawer-backdrop"
        onclick={() => (drawerOpen = false)}
        aria-label={tocCloseAria}
      ></button>

      <div class="toc-drawer" use:scrollChain>
        <nav class="flex flex-col gap-0.5 p-4">
          {#each headings as heading, i}
            <button
              class="toc-drawer-item"
              class:toc-drawer-sub={heading.level > 2}
              class:active={activeId === heading.id}
              onclick={() => scrollTo(heading.id)}
            >
              {#if heading.level === 2}
                <span class="toc-drawer-number font-mono text-micro">
                  {String(headings.filter((h, j) => h.level === 2 && j <= i).length).padStart(2, '0')}
                </span>
              {/if}
              <span>{heading.text}</span>
            </button>
          {/each}
        </nav>
      </div>
    {/if}
  </div>
{/if}

<style>
  .toc-pill-container {
    position: fixed;
    bottom: calc(20px + env(safe-area-inset-bottom, 0px));
    left: 50%;
    transform: translateX(-50%);
    z-index: var(--z-sheet);
  }

  .toc-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 20px;
    background: color-mix(in srgb, var(--background) 95%, transparent);
    border: 1px solid color-mix(in srgb, var(--blog-accent, var(--primary)) 20%, transparent);
    border-radius: var(--radius-pill);
    backdrop-filter: blur(8px);
    cursor: pointer;
    white-space: nowrap;
  }

  .toc-pill-name {
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
  }

  .toc-pill-counter {
    color: color-mix(in srgb, var(--blog-accent, var(--primary)) 30%, transparent);
  }

  .toc-drawer-backdrop {
    position: fixed;
    inset: 0;
    background: transparent;
    z-index: -1;
    border: none;
    cursor: default;
  }

  .toc-drawer {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 280px;
    max-width: 90vw;
    max-height: 60dvh;
    overflow-y: auto;
    background: color-mix(in srgb, var(--background) 97%, transparent);
    border: 1px solid color-mix(in srgb, var(--blog-accent, var(--primary)) 15%, transparent);
    border-radius: 12px;
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-sheet);
  }

  .toc-drawer-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    background: none;
    border-radius: 8px;
    cursor: pointer;
    font-family: var(--font-heading);
    font-size: 14px;
    color: color-mix(in srgb, var(--foreground) 40%, transparent);
    transition: background var(--duration-fast) var(--ease-default),
                color var(--duration-fast) var(--ease-default);
    text-align: left;
    width: 100%;
  }

  .toc-drawer-item:hover {
    background: color-mix(in srgb, var(--blog-accent, var(--primary)) 5%, transparent);
    color: color-mix(in srgb, var(--foreground) 70%, transparent);
  }

  .toc-drawer-item.active {
    color: var(--blog-accent, var(--primary));
    font-weight: 600;
  }

  .toc-drawer-number {
    color: color-mix(in srgb, var(--blog-accent, var(--primary)) 30%, transparent);
  }

  .toc-drawer-sub {
    padding-left: 32px;
    font-size: 13px;
    color: color-mix(in srgb, var(--foreground) 25%, transparent);
  }

  .toc-drawer-sub:hover {
    color: color-mix(in srgb, var(--foreground) 55%, transparent);
  }

  .toc-drawer-sub.active {
    color: var(--blog-accent, var(--primary));
  }
</style>
