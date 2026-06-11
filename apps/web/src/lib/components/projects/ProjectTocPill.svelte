<!--
  Floating pill at the bottom center of the viewport on mobile (<lg).
  Shows current heading name + counter. Tapping opens a drawer with the full TOC
  including nested README sub-headings — same detail level as the desktop TOC.
-->
<script lang="ts">
  import { ChevronToggle } from '$lib/components/brand';
  import { onMount, onDestroy } from 'svelte';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';
  import { resolveLocale } from '$lib/utils/locale';
  import { projectsDetailContent } from '$lib/content/projects';

  const tocOpenAria = resolveLocale(projectsDetailContent.tocPill.openAria, 'en');
  const tocCloseAria = resolveLocale(projectsDetailContent.tocPill.closeAria, 'en');

  interface TocChild {
    id: string;
    title: string;
    level: number;
  }

  interface TocEntry {
    id: string;
    title: string;
    level: number;
    children: TocChild[];
  }

  let { tocEntries }: { tocEntries: TocEntry[] } = $props();

  // Flat list of all IDs for counting + name lookup
  const allEntries = $derived.by(() => {
    const flat: Array<TocEntry | TocChild> = [];
    for (const entry of tocEntries) {
      flat.push(entry);
      for (const child of entry.children) {
        flat.push(child);
      }
    }
    return flat;
  });

  let visible = $state(false);
  let drawerOpen = $state(false);
  let activeId = $state('');

  const activeIndex = $derived(
    Math.max(0, allEntries.findIndex((e) => e.id === activeId))
  );
  const activeName = $derived(
    allEntries[activeIndex]?.title ?? ''
  );

  let heroObserver: IntersectionObserver | undefined;
  let headingObserver: IntersectionObserver | undefined;

  onMount(() => {
    const headerEl = document.querySelector('[data-testid="project-detail-header"]');
    const headingEls = document.querySelectorAll('[data-section-index], [id^="readme-h-"]');

    if (headerEl) {
      heroObserver = new IntersectionObserver(
        ([entry]) => { visible = !entry.isIntersecting; },
        { threshold: 0 }
      );
      heroObserver.observe(headerEl);
    }

    if (headingEls.length > 0) {
      headingObserver = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const el = entry.target;
              const sectionIdx = el.getAttribute('data-section-index');
              if (sectionIdx !== null) {
                activeId = `section-${sectionIdx}`;
              } else if (el.id) {
                activeId = el.id;
              }
            }
          }
        },
        { rootMargin: '-20% 0px -70% 0px' }
      );
      headingEls.forEach((el) => headingObserver?.observe(el));
    }
  });

  onDestroy(() => {
    heroObserver?.disconnect();
    headingObserver?.disconnect();
  });

  function scrollTo(id: string): void {
    const el = id.startsWith('section-')
      ? document.querySelector(`[data-section-index="${id.replace('section-', '')}"]`)
      : document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      drawerOpen = false;
    }
  }
</script>

{#if visible}
  <div class="toc-pill-container lg:hidden" data-testid="project-toc-pill">
    <!--
      A11y: the button shows visible text ("{activeName} {n}/{total}") while
      tocOpenAria carries the purpose ("Table of contents"). Lighthouse 2.5.3
      (label-content-name-mismatch) requires the visible text to appear as a
      prefix of the accessible name. Compose aria-label so it starts with the
      same visible string, then appends the purpose.
    -->
    <button
      class="tap-press toc-pill"
      onclick={() => (drawerOpen = !drawerOpen)}
      aria-label={`${activeName} ${activeIndex + 1}/${allEntries.length} — ${tocOpenAria}`}
    >
      <div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
      <span class="toc-pill-name font-mono text-caption">
        {activeName}
      </span>
      <span class="toc-pill-counter font-mono text-micro">
        {activeIndex + 1}/{allEntries.length}
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
        <nav class="toc-drawer-nav flex flex-col gap-0.5 p-4">
          {#each tocEntries as entry}
            <button
              class="tap-press toc-drawer-item"
              class:active={activeId === entry.id}
              onclick={() => scrollTo(entry.id)}
            >
              <span class="toc-drawer-number font-mono text-micro">
                {entry.title === 'README' ? '' : String(tocEntries.indexOf(entry) + 1).padStart(2, '0')}
              </span>
              {#if entry.title === 'README'}
                <svg class="h-3.5 w-3.5 text-primary" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
              {/if}
              <span>{entry.title}</span>
            </button>
            <!-- Nested sub-headings -->
            {#each entry.children as child}
              <button
                class="tap-press toc-drawer-item toc-drawer-sub"
                class:active={activeId === child.id}
                onclick={() => scrollTo(child.id)}
              >
                <span>{child.title}</span>
              </button>
            {/each}
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
    padding: 12px 20px;
    min-height: 44px;
    background: color-mix(in srgb, var(--background) 95%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
    border-radius: var(--radius-pill);
    backdrop-filter: blur(8px);
    cursor: pointer;
    white-space: nowrap;
  }

  .toc-pill-name {
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
  }

  .toc-pill-counter {
    color: color-mix(in srgb, var(--primary) 30%, transparent);
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
    border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
    border-radius: 12px;
    backdrop-filter: blur(12px);
    box-shadow: var(--shadow-sheet);
  }

  .toc-drawer-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 14px;
    min-height: 44px;
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
    background: color-mix(in srgb, var(--primary) 5%, transparent);
    color: color-mix(in srgb, var(--foreground) 70%, transparent);
  }

  .toc-drawer-item.active {
    color: var(--primary);
    font-weight: 600;
  }

  .toc-drawer-number {
    color: color-mix(in srgb, var(--primary) 30%, transparent);
  }

  /* Sub-headings indented */
  .toc-drawer-sub {
    padding-left: 32px;
    font-size: 13px;
    color: color-mix(in srgb, var(--foreground) 25%, transparent);
  }

  .toc-drawer-sub:hover {
    color: color-mix(in srgb, var(--foreground) 55%, transparent);
  }

  .toc-drawer-sub.active {
    color: var(--primary);
  }
</style>
