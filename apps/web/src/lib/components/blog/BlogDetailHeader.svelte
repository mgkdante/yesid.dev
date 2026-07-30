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
  import { getLocale } from '$lib/utils/locale-context';
  import { localizeHref } from '$lib/utils/locale-routing';

  const locale = getLocale();
  import { fillTemplate } from '$lib/utils/labels';
  import { siteLabels } from '$lib/content';
  import DetailHeaderShell from '$lib/components/shared/DetailHeaderShell.svelte';

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

  const detailChrome = siteLabels.blogChrome.detail;

  const backHref = $derived(
    localizeHref(post.category === 'personal' ? '/blog/personal' : '/blog', post.lang)
  );
  // Prefer CMS-sourced labels (blogPage.backToPersonal / backToDispatches);
  // fall back to the legacy $lib/content/blog static module so the page still
  // renders if Directus drops the field.
  const backLabel = $derived.by(() => {
    if (blogPage) {
      const ls = post.category === 'personal'
        ? blogPage.backToPersonal
        : blogPage.backToDispatches;
      const resolved = resolveLocale(ls, locale);
      if (resolved.trim()) return resolved;
    }
    return post.category === 'personal'
      ? resolveLocale(detailChrome.backNav.toPersonal, locale)
      : resolveLocale(detailChrome.backNav.toDispatches, locale);
  });
  const postTagsAria = resolveLocale(detailChrome.header.postTagsAria, locale);
  const readingTimeTemplate = resolveLocale(detailChrome.header.readingTimeLabel, locale);
  const readingTimeText = $derived(readingTimeTemplate.replace('{minutes}', String(readingTime)));
  const edgeReadingTimeText = $derived(readingTimeText.toUpperCase());
  // go2-t1c2: category/watermark/edition microcopy from site_labels, previous
  // literals kept as code fallbacks.
  const categoryLabel = $derived(
    post.category === 'personal'
      ? resolveLocale(siteLabels.ui.categoryPersonal, locale)
      : resolveLocale(siteLabels.ui.categoryProfessional, locale)
  );
  const watermarkText = $derived(
    post.category === 'personal'
      ? resolveLocale(siteLabels.ui.watermarkPersonal, locale)
      : resolveLocale(siteLabels.ui.watermarkProfessional, locale)
  );
  const editionTemplate = resolveLocale(siteLabels.ui.blogEditionTemplate, locale) || 'VOL. 01 // ISS. {issue}';

  // Format date as "Apr 2026" (EN) / "avr. 2026" (FR) / "abr 2026" (ES).
  // Month abbrev is localized natively by Intl from the active UI locale — no
  // hardcoded 'en-US' (which leaked English month names onto /fr and /es).
  const dateLocale = $derived(locale === 'fr' ? 'fr-CA' : locale === 'es' ? 'es' : 'en-US');
  const formattedDate = $derived.by(() => {
    const d = new Date(post.date + 'T00:00:00');
    return d.toLocaleDateString(dateLocale, { month: 'short', year: 'numeric' });
  });

  // Format date for edge label: "2026.04.15"
  const edgeDate = $derived(post.date.replace(/-/g, '.'));

  // Post body language as a localized display name (CMS truth:
  // siteLabels.ui.languageNames), not the raw `en`/`fr` code that leaked into
  // the meta row. resolveLocale picks the name in the active UI locale (e.g. an
  // English post reads "English" on /, "Anglais" on /fr).
  const languageName = $derived(
    resolveLocale(siteLabels.ui.languageNames[post.lang], locale) || post.lang
  );

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

<DetailHeaderShell
  accent={accentColor}
  testId="blog-detail-header"
  rootClass="blog-detail-header"
  mobileMinHeight={380}
  {backHref}
  {backLabel}
  pills={post.tags}
  pillsAriaLabel={postTagsAria}
>
  {#snippet decorations()}
    <div class="header__watermark" aria-hidden="true">
      {watermarkText}
    </div>

    <div class="header__edge header__edge-left hidden lg:block" aria-hidden="true">
      {fillTemplate(editionTemplate, { issue: String(postIndex).padStart(2, '0') })}
    </div>
    <div class="header__edge header__edge-right hidden lg:block" aria-hidden="true">
      {edgeDate} // {edgeReadingTimeText}
    </div>
  {/snippet}

  {#snippet beforePills()}
    <div class="header__cat-line">
      {categoryLabel}
    </div>

    <h1 class="header__title">
      {#each titleParts as part}
        {#if part.highlight}
          <span class="header__title-highlight">{part.text}</span>
        {:else}
          {part.text}
        {/if}
      {/each}
    </h1>
  {/snippet}

  {#snippet afterPills()}
    <div class="header__meta">
      <time datetime={post.date}>{formattedDate}</time>
      <span class="header__meta-sep" aria-hidden="true"></span>
      <span>{readingTimeText}</span>
      <span class="header__meta-sep" aria-hidden="true"></span>
      <span>{languageName}</span>
    </div>
  {/snippet}
</DetailHeaderShell>

<style>
  /* ── Watermark ─────────────────────────────────────────────── */
  .header__watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: clamp(100px, 14vw, 180px);
    font-weight: 900;
    /* contrast-exempt: decorative (aria-hidden watermark) */
    color: color-mix(in srgb, var(--header-accent) 2.5%, transparent);
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
    /* contrast-exempt: decorative (aria-hidden edge ornament) */
    color: var(--header-accent); opacity: var(--chrome-ink-opacity);
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
    color: var(--header-accent);
  }

  .header__cat-line::before,
  .header__cat-line::after {
    content: '';
    width: 40px;
    height: 1px;
    background: color-mix(in srgb, var(--header-accent) 30%, transparent);
  }

  @media (--desktop-min) {
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
    text-shadow: 0 0 60px color-mix(in srgb, var(--header-accent) 12%, transparent);
  }

  .header__title-highlight {
    color: var(--header-accent);
  }

  @media (--desktop-min) {
    .header__title {
      text-shadow: 0 0 80px color-mix(in srgb, var(--header-accent) 12%, transparent);
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
    color: color-mix(in srgb, var(--header-accent) 85%, transparent);
  }

  .header__meta-sep {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--header-accent);
    opacity: 0.4;
  }
</style>
