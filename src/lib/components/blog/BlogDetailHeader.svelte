<!--
  Magazine cover header for /blog/[slug].
  Full-bleed cover story: circuit grid, ManifestoCanvas, watermark, CornerMarks,
  rotated edge labels, category line, display title (SplitText), tag pills, meta row.
  Extends behind nav with negative margin. Same structural pattern as ProjectDetailHeader.
-->
<script lang="ts">
  import type { BlogPost } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { CornerMarks } from '$lib/components/brand';
  import { SectionWrapper } from '$lib/components/shells';
  import ManifestoCanvas from '$lib/components/home/ManifestoCanvas.svelte';
  import { boop } from '$lib/motion/actions/boop.js';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
  import { registerGsapPlugins, gsap, SplitText } from '$lib/motion/utils/gsap.js';

  let {
    post,
    svgContent = '',
    accentColor = 'var(--primary)',
    readingTime = 0,
    postIndex = 1
  }: {
    post: BlogPost;
    svgContent?: string;
    accentColor?: string;
    readingTime?: number;
    postIndex?: number;
  } = $props();

  let headerEl = $state<HTMLElement>(undefined!);
  let titleEl = $state<HTMLHeadingElement>(undefined!);

  const backHref = $derived(
    post.category === 'personal' ? '/blog/personal' : '/blog'
  );
  const backLabel = $derived(
    post.category === 'personal' ? '\u2190 back to personal corner' : '\u2190 back to dispatches'
  );
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
    const titleText = resolveLocale(post.title, 'en');
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

  onMount(() => {
    if (!browser || isPrefersReducedMotion() || !headerEl) return;
    registerGsapPlugins();

    const q = gsap.utils.selector(headerEl);
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    tl.to(q('.header__circuit-grid'), { opacity: 1, duration: 0.6 }, 0);
    tl.to(q('.header__edge'), { opacity: 1, duration: 0.5, stagger: 0.1 }, 0.3);
    tl.to(q('.header__decoration'), { opacity: 1, duration: 0.4, stagger: 0.05 }, 0.4);

    if (titleEl && SplitText) {
      const split = new SplitText(titleEl, { type: 'chars' });
      tl.from(
        split.chars,
        { opacity: 0, y: 20, stagger: 0.02, duration: 0.4, ease: 'power2.out' },
        0.6
      );
    }

    tl.to(q('.header__pill'), { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' }, 0.9);

    return () => {
      tl.kill();
    };
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

  <SectionWrapper layout="bleed" centerContent class="header-section">
    {#snippet background()}
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
    {/snippet}

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
      <h1 bind:this={titleEl} class="header__title">
        {#each titleParts as part}
          {#if part.highlight}
            <span class="header__title-highlight">{part.text}</span>
          {:else}
            {part.text}
          {/if}
        {/each}
      </h1>

      <!-- Tag pills -->
      <nav class="header__tags" aria-label="Post tags">
        {#each post.tags as tag}
          <span class="header__pill">{tag}</span>
        {/each}
      </nav>

      <!-- Meta row -->
      <div class="header__meta">
        <time datetime={post.date}>{formattedDate}</time>
        <span class="header__meta-sep" aria-hidden="true"></span>
        <span>{readingTime} min read</span>
        <span class="header__meta-sep" aria-hidden="true"></span>
        <span>{post.lang}</span>
      </div>
    </div>
  </SectionWrapper>
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

  .blog-detail-header :global(.header-section) {
    min-height: 380px;
  }

  @media (min-width: 1024px) {
    .blog-detail-header :global(.header-section) {
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
    opacity: 0;
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
  .header__edge {
    opacity: 0;
  }

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
    opacity: 0;
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
    opacity: 0;
    transform: translateY(15px);
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
