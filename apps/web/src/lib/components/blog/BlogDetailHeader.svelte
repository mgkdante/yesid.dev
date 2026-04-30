<!--
  Magazine cover header for /blog/[slug].
  Full-bleed cover story: circuit grid, ManifestoCanvas, watermark, CornerMarks,
  rotated edge labels, category line, display title, tag pills, meta row.
  Extends behind nav with negative margin. Same structural pattern as ProjectDetailHeader.
  No entrance animation — Snappy Doctrine (17e-2). ManifestoCanvas is ambient (doctrine-allowed).
-->
<script lang="ts">
  import type { BlogPost } from '$lib/types';
  import { resolveLocale } from '$lib/utils/locale';
  import { blogDetailContent } from '$lib/content/blog';
  import { CornerMarks } from '$lib/components/brand';
  import ManifestoCanvas from '$lib/components/home/ManifestoCanvas.svelte';
  import { boop } from '$lib/motion/actions/boop.js';

  let {
    post,
    svgContent = '',
    accentColor = 'var(--primary)',
    readingTime = 0,
    postIndex = 1,
    blogPage
  }: {
    post: BlogPost;
    svgContent?: string;
    accentColor?: string;
    readingTime?: number;
    postIndex?: number;
    blogPage?: import('@repo/shared').BlogPageContent;
  } = $props();

  let headerEl = $state<HTMLElement>(undefined!);

  const backHref = $derived(
    post.category === 'personal' ? '/blog/personal' : '/blog'
  );
  // Prefer CMS-sourced labels (blogPage.backToPersonal / backToDispatches);
  // fall back to the legacy $lib/content/blog static module so the page still
  // renders if Directus drops the field.
  const backLabel = $derived.by(() => {
    if (blogPage) {
      const ls = post.category === 'personal'
        ? blogPage.backToPersonal
        : blogPage.backToDispatches;
      const resolved = resolveLocale(ls, 'en');
      if (resolved.trim()) return resolved;
    }
    return post.category === 'personal'
      ? resolveLocale(blogDetailContent.backNav.toPersonal, 'en')
      : resolveLocale(blogDetailContent.backNav.toDispatches, 'en');
  });
  const postTagsAria = resolveLocale(blogDetailContent.header.postTagsAria, 'en');
  const readingTimeTemplate = resolveLocale(blogDetailContent.header.readingTimeLabel, 'en');
  const readingTimeText = $derived(readingTimeTemplate.replace('{minutes}', String(readingTime)));
  const categoryLabel = $derived(
    post.category === 'personal' ? 'Personal' : 'Professional'
  );
  const watermarkText = $derived(
    post.category === 'personal' ? 'Personal' : 'Dispatch'
  );

  // Format date as "Apr 2026"
  const formattedDate = $derived.by(() => {
    const d = new Date(post.date + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  });

  // Format date for edge label: "2026.04.15"
  const edgeDate = $derived(post.date.replace(/-/g, '.'));

  // Highlight first tag keyword in title
  const titleParts = $derived.by(() => {
    const titleText = post.title;
    const keyword = post.tags[0];
    if (!keyword) return [{ text: titleText, highlight: false }];

    const regex = new RegExp(`(${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
    const match = titleText.match(regex);
    if (!match || match.index === undefined) return [{ text: titleText, highlight: false }];

    const parts: { text: string; highlight: boolean }[] = [];
    if (match.index > 0) parts.push({ text: titleText.slice(0, match.index), highlight: false });
    parts.push({ text: match[1], highlight: true });
    const after = titleText.slice(match.index + match[1].length);
    if (after) parts.push({ text: after, highlight: false });
    return parts;
  });

</script>

<div
  bind:this={headerEl}
  class="blog-detail-header"
  style="--blog-accent: {accentColor};"
  data-testid="blog-detail-header"
>
  <div class="header__circuit-grid"></div>
  <ManifestoCanvas containerEl={headerEl} />

  <section class="header-section w-full">
    <!-- Background decorations (absolute layer behind content) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <CornerMarks size="md" opacity={0.12} />

      <!-- Chevrons (top-right, desktop only) -->
      <div class="header__decoration absolute right-[55px] top-[70px] hidden items-center gap-1.5 lg:flex" aria-hidden="true">
        {#each Array(3) as _}
          <div class="h-3.5 w-3.5 rotate-[-45deg] border-b-2 border-r-2" style="border-color: var(--blog-accent);"></div>
        {/each}
      </div>

      <!-- Watermark -->
      <div class="header__watermark" aria-hidden="true">
        {watermarkText}
      </div>

      <!-- Edge labels (rotated, desktop only) -->
      <div class="header__edge header__edge-left hidden lg:block" aria-hidden="true">
        VOL. 01 // ISS. {String(postIndex).padStart(2, '0')}
      </div>
      <div class="header__edge header__edge-right hidden lg:block" aria-hidden="true">
        {edgeDate} // {readingTime} MIN
      </div>
    </div>

    <div class="header__content">
      <!-- Back link -->
      <a
        href={backHref}
        class="header__back"
        use:boop={{ scale: 1.05, timing: 200 }}
      >
        {backLabel}
      </a>

      <!-- Category line with ruled borders -->
      <div class="header__cat-line">
        {categoryLabel}
      </div>

      <!-- Display title -->
      <h1 class="header__title">
        {#each titleParts as part}
          {#if part.highlight}
            <span class="header__title-highlight">{part.text}</span>
          {:else}
            {part.text}
          {/if}
        {/each}
      </h1>

      <!-- Tag pills -->
      <nav class="header__tags" aria-label={postTagsAria}>
        {#each post.tags as tag}
          <span class="header__pill">{tag}</span>
        {/each}
      </nav>

      <!-- Meta row -->
      <div class="header__meta">
        <time datetime={post.date}>{formattedDate}</time>
        <span class="header__meta-sep" aria-hidden="true"></span>
        <span>{readingTimeText}</span>
        <span class="header__meta-sep" aria-hidden="true"></span>
        <span>{post.lang}</span>
      </div>
    </div>
  </section>
</div>

<style>
  /* ── Container — extends behind nav ────────────────────────── */
  .blog-detail-header {
    position: relative;
    margin-top: calc(-1 * var(--nav-height, 64px));
    padding-top: var(--nav-height, 64px);
    overflow: hidden;
    background: var(--manifesto, #0f0d0a);
    cursor: crosshair;
  }

  .header-section {
    position: relative;
    display: grid;
    align-items: center;
    min-height: 380px;
  }

  @media (min-width: 1024px) {
    .header-section {
      min-height: 440px;
    }
  }

  /* ── BG Layer 1: Circuit Grid ──────────────────────────────── */
  .header__circuit-grid {
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(90deg, color-mix(in srgb, var(--blog-accent) 3.5%, transparent) 0px, color-mix(in srgb, var(--blog-accent) 3.5%, transparent) 1px, transparent 1px, transparent 80px),
      repeating-linear-gradient(0deg, color-mix(in srgb, var(--blog-accent) 3.5%, transparent) 0px, color-mix(in srgb, var(--blog-accent) 3.5%, transparent) 1px, transparent 1px, transparent 80px);
    z-index: var(--z-base);
  }

  .header__circuit-grid::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle 2.5px at 80px 80px, color-mix(in srgb, var(--blog-accent) 12%, transparent) 0%, transparent 4px),
      radial-gradient(circle 2px at 160px 160px, color-mix(in srgb, var(--blog-accent) 8%, transparent) 0%, transparent 3px),
      radial-gradient(circle 2.5px at 240px 80px, color-mix(in srgb, var(--blog-accent) 10%, transparent) 0%, transparent 4px),
      radial-gradient(circle 2px at 80px 240px, color-mix(in srgb, var(--blog-accent) 6%, transparent) 0%, transparent 3px);
    background-size: 320px 320px;
  }

  /* ── Watermark ─────────────────────────────────────────────── */
  .header__watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(100px, 14vw, 180px);
    font-weight: 900;
    color: color-mix(in srgb, var(--blog-accent) 2.5%, transparent);
    text-transform: uppercase;
    letter-spacing: -0.06em;
    pointer-events: none;
    white-space: nowrap;
    z-index: var(--z-base);
  }

  /* ── Edge labels (rotated, desktop only) ───────────────────── */
  .header__edge-left,
  .header__edge-right {
    position: absolute;
    top: 50%;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    color: color-mix(in srgb, var(--blog-accent) 20%, transparent);
    text-transform: uppercase;
    white-space: nowrap;
    z-index: calc(var(--z-content) + 1);
  }

  .header__edge-left {
    left: 24px;
    transform: translateY(-50%) rotate(-90deg);
  }

  .header__edge-right {
    right: 24px;
    transform: translateY(-50%) rotate(90deg);
  }

  /* ── Decorations ───────────────────────────────────────────── */
  .header__decoration {
    z-index: calc(var(--z-content) + 1);
  }

  /* ── Center Content ────────────────────────────────────────── */
  .header__content {
    position: relative;
    z-index: calc(var(--z-content) + 9);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    margin-inline: auto;
    padding: 2rem 1.25rem 2.5rem;
  }

  @media (min-width: 1024px) {
    .header__content {
      padding: 2.5rem 2rem 3.75rem;
    }
  }

  /* ── Back link ─────────────────────────────────────────────── */
  .header__back {
    display: inline-block;
    margin-bottom: 1.25rem;
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.5px;
    color: var(--blog-accent);
    text-decoration: none;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .header__back:hover {
    opacity: 1;
  }

  @media (min-width: 1024px) {
    .header__back {
      margin-bottom: 1.75rem;
    }
  }

  /* ── Category line with ruled borders ──────────────────────── */
  .header__cat-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    margin-bottom: 1.25rem;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--blog-accent);
  }

  .header__cat-line::before,
  .header__cat-line::after {
    content: '';
    width: 40px;
    height: 1px;
    background: color-mix(in srgb, var(--blog-accent) 30%, transparent);
  }

  @media (min-width: 1024px) {
    .header__cat-line {
      margin-bottom: 1.5rem;
    }
  }

  /* ── Title ─────────────────────────────────────────────────── */
  .header__title {
    font-family: var(--font-heading);
    font-size: clamp(28px, 6vw, 56px);
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: -0.04em;
    line-height: 0.95;
    color: var(--foreground);
    margin-bottom: 1.25rem;
    text-shadow: 0 0 60px color-mix(in srgb, var(--blog-accent) 12%, transparent);
  }

  .header__title-highlight {
    color: var(--blog-accent);
  }

  @media (min-width: 1024px) {
    .header__title {
      text-shadow: 0 0 80px color-mix(in srgb, var(--blog-accent) 12%, transparent);
    }
  }

  /* ── Tag pills ─────────────────────────────────────────────── */
  .header__tags {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 6px;
    margin-bottom: 1.25rem;
  }

  @media (min-width: 1024px) {
    .header__tags {
      gap: 8px;
    }
  }

  .header__pill {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: color-mix(in srgb, var(--blog-accent) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--blog-accent) 12%, transparent);
    border-radius: var(--radius-pill);
    padding: 4px 12px;
    background: color-mix(in srgb, var(--blog-accent) 3%, transparent);
  }

  @media (min-width: 1024px) {
    .header__pill {
      font-size: 13px;
      color: color-mix(in srgb, var(--blog-accent) 60%, transparent);
      border-color: color-mix(in srgb, var(--blog-accent) 15%, transparent);
      padding: 7px 18px;
      background: color-mix(in srgb, var(--blog-accent) 4%, transparent);
    }
  }

  /* ── Meta row ──────────────────────────────────────────────── */
  .header__meta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-family: var(--font-mono);
    font-size: 11px;
    color: color-mix(in srgb, var(--blog-accent) 35%, transparent);
  }

  .header__meta-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--blog-accent);
    opacity: 0.4;
  }
</style>
