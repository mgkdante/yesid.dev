<!--
  Manifesto-style header for /projects/[slug].
  Reuses the exact Manifesto visual base: circuit grid, ManifestoCanvas (hover/click),
  CornerMarks. Only the center text content changes per project.
  Extends behind nav with negative margin.
-->
<script lang="ts">
  import type { Project } from '$lib/types';
  import { resolveLocale } from '$lib/utils/locale';
  import { localizeHref } from '$lib/utils/locale-routing';
  import { getLocale } from '$lib/utils/locale-context';

  const locale = getLocale();
  import { getStackRole } from '$lib/utils/stack-roles';
  import { projectMetrics } from '$lib/utils/project-metrics';
  import { CornerMarks } from '$lib/components/brand';
  import ManifestoCanvas from '$lib/components/home/ManifestoCanvas.svelte';
  import { boop } from '$lib/motion/actions/boop.js';
  import { siteLabels } from '$lib/content';
  import QuietModeButton from '$lib/components/shared/QuietModeButton.svelte';

  let { project }: { project: Project } = $props();

  // go2/w4: "← All Projects" now comes from site_labels (CMS-editable),
  // previous companion literal kept as the code fallback.
  const backToListingLabel =
    resolveLocale(siteLabels.ui.backToProjects, locale) ||
    resolveLocale(siteLabels.projectsChrome.detail.backToListingLabel, locale);
  // go2-t1c2: aria microcopy from site_labels, previous literal as fallback.
  const navTechStackAria = resolveLocale(siteLabels.a11y.navTechStack, locale);
  const subtitle = $derived(resolveLocale(project.oneLiner, locale));

  const location = $derived(project.location ?? 'sherbrooke');
  const environment = $derived(project.environment ?? 'production');
  const version = $derived(project.version ?? '1.0.0');

  const layerId = $derived(
    project.relatedServices[0] ?? project.slug
  );

  const stackRoles = $derived(
    project.stack.map((tech) => ({
      role: getStackRole(tech),
      name: tech.toLowerCase().replace(/\s+/g, '-'),
    }))
  );

  const metrics = $derived(projectMetrics(project));

  let headerEl = $state<HTMLElement>(undefined!);
</script>

<div bind:this={headerEl} class="project-detail-header" data-testid="project-detail-header">
  <!-- BG layers as direct children (same pattern as home Manifesto) so
       ManifestoCanvas containerEl coordinates match the canvas position -->
  <div class="header__circuit-grid detail-header-grid"></div>
  <ManifestoCanvas containerEl={headerEl} />

<section class="header-section w-full">
    <!-- Background decorations (absolute layer behind content) -->
    <div class="absolute inset-0 pointer-events-none overflow-hidden">
      <!-- CornerMarks -->
      <CornerMarks size="md" opacity={0.12} />

      <!-- Chevrons (top-right decoration) -->
      <div class="header__decoration absolute right-[55px] top-[70px] hidden items-center gap-1.5 lg:flex" aria-hidden="true">
        {#each Array(3) as _}
          <div class="h-3.5 w-3.5 rotate-[-45deg] border-b-2 border-r-2 border-primary"></div>
        {/each}
      </div>

      <!-- Crosshair (bottom-right decoration) -->
      <div class="header__decoration absolute bottom-[55px] right-[45px] hidden lg:block" aria-hidden="true">
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--primary)" stroke-width="0.8">
          <circle cx="22" cy="22" r="16" />
          <line x1="22" y1="0" x2="22" y2="44" />
          <line x1="0" y1="22" x2="44" y2="22" />
        </svg>
      </div>

      <!-- Ticks (top center) — contrast-exempt: decorative (aria-hidden watermark) -->
      <div class="header__decoration absolute left-1/2 top-[18px] hidden -translate-x-1/2 gap-7 font-mono text-micro lg:flex" aria-hidden="true"
        style="color: var(--primary); opacity: var(--chrome-ink-opacity);"
      >
        {#each [0, 80, 160, 240, 320, 400, 480] as tick}
          <span>{tick}</span>
        {/each}
      </div>

      <!-- Edge Left: project identity + impact metrics (desktop only) -->
      <div class="edge-left header__edge hidden lg:block" aria-hidden="true">
        <div>PRJ <span class="edge-value">{project.slug}</span></div>
        <div>SRC {location}</div>
        <div>ENV {environment}</div>
        <div>VER {version}</div>
        <div>STATUS <span class="edge-value">{project.status}</span></div>
        <div class="edge-separator">───────</div>
        {#each metrics as metric}
          <div>{metric.value} {resolveLocale(metric.label, locale)}</div>
        {/each}
      </div>

      <!-- Edge Right: tech stack breakdown (desktop only) -->
      <div class="edge-right header__edge hidden lg:block" aria-hidden="true">
        <div>LAYER {layerId}</div>
        {#each stackRoles as item}
          <div>{item.role} <span class="edge-value">{item.name}</span></div>
        {/each}
        <div class="edge-separator">───────</div>
        <div>NODES {project.stack.length}</div>
      </div>
    </div>

    <!-- Center content -->
    <div class="header__content">
      <a
        href={localizeHref('/projects', locale)}
        class="header__back mb-5 inline-block font-mono text-primary opacity-70 transition-opacity hover:opacity-100 lg:mb-7"
        use:boop={{ scale: 1.05, timing: 200 }}
      >
        {backToListingLabel}
      </a>

      <h1
        class="header-title mb-3 font-heading font-black uppercase leading-[0.95] tracking-[-0.03em] text-primary lg:mb-4"
      >
        {resolveLocale(project.title, locale)}
      </h1>

      {#if subtitle}
        <p class="header-subtitle">{subtitle}</p>
      {/if}

      <nav class="flex flex-wrap justify-center gap-1.5 lg:gap-2" aria-label={navTechStackAria}>
        {#each project.stack as tech}
          <span class="header__pill">{tech}</span>
        {/each}
      </nav>

      <div class="header__quiet">
        <QuietModeButton />
      </div>
    </div>
  </section>
</div>

<style>
  /* ── Container — extends behind nav with negative margin ────── */
  .project-detail-header {
    position: relative;
    /* accent for the shared .detail-header-grid dot-grid (app.css) */
    --header-accent: var(--primary);
    /* --nav-height was never defined (64px fallback under-reserved the 76px
       pill by 12px, clipping the header title under the nav). Route through the
       shared --nav-clearance (88px) so the negative-margin/padding pair reserves
       the real pill height on this full-bleed detail page. */
    margin-top: calc(-1 * var(--nav-clearance, 5.5rem));
    padding-top: var(--nav-clearance, 5.5rem);
    overflow: hidden;
    background: var(--manifesto, #0f0d0a);
    cursor: crosshair;
  }

  .header-section {
    position: relative;
    display: grid;
    align-items: center;
    min-height: 420px;
  }

  @media (min-width: 1024px) {
    .header-section {
      min-height: 440px;
    }
  }

  /* ── BG Layer 1: Circuit Grid (direct child of header, covers full area) ──
     Dot-grid pattern lives in the shared .detail-header-grid class (app.css),
     driven by --header-accent. Only the surface-layout box stays here. */
  .header__circuit-grid {
    position: absolute;
    inset: 0;
    z-index: var(--z-base);
  }

  /* ── Center Content — full bleed, centered ─────────────────── */
  .header__content {
    position: relative;
    z-index: calc(var(--z-content) + 9);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    margin-inline: auto;
    /* Top padding clears the fixed floating nav. The wrapper's
       -nav-height/+nav-height trick only extends the background up under the
       nav; it does NOT push content down, so the first element (the back link)
       must clear the nav here or it renders hidden beneath it. */
    padding: 4.5rem 1.25rem 2.5rem;
  }

  @media (min-width: 1024px) {
    .header__content {
      padding: 5.5rem 2rem 3.75rem;
    }
  }

  /* ── Edge metadata ────────────────────────────────────────── */
  .edge-left,
  .edge-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    /* contrast-exempt: decorative (aria-hidden edge ornament) */
    color: var(--primary); opacity: var(--chrome-ink-opacity);
    line-height: 2.4;
    text-transform: uppercase;
    z-index: calc(var(--z-content) + 1);
  }

  .edge-left { left: 28px; }
  .edge-right { right: 28px; text-align: right; }

  /* edge-value + edge-separator INHERIT the container's colour + chrome-ink
     opacity. They must NOT set their own opacity: nested under .edge-left/right
     it would COMPOUND (0.6 x 0.6 = 0.36) and render fainter than the labels.
     One opacity on the container → the whole panel reads consolidated. */
  .edge-separator {
    margin-top: 8px;
  }

  .header__back {
    font-size: var(--text-back-link);
    letter-spacing: 0;
  }

  .header__quiet {
    margin-top: 1.25rem;
  }

  /* ── Decorations ──────────────────────────────────────────── */
  .header__decoration {
    z-index: calc(var(--z-content) + 1);
  }

  /* ── Title ─────────────────────────────────────��──────────── */
  .header-title {
    font-size: 32px;
    text-shadow: 0 0 60px color-mix(in srgb, var(--glow) 12%, transparent);
  }

  @media (min-width: 1024px) {
    .header-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      text-shadow: 0 0 80px color-mix(in srgb, var(--glow) 12%, transparent);
    }
  }

  .header-subtitle {
    max-width: 720px;
    margin: 0 auto 1.25rem;
    color: color-mix(in srgb, var(--foreground) 76%, transparent);
    font-size: 1rem;
    line-height: 1.45;
  }

  @media (min-width: 1024px) {
    .header-subtitle {
      margin-bottom: 1.5rem;
      font-size: 1.125rem;
    }
  }

  /* ── Tech pills (same as Manifesto) ───────────────────────── */
  .header__pill {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: color-mix(in srgb, var(--primary) 85%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary) 12%, transparent);
    border-radius: var(--radius-pill);
    padding: 4px 12px;
    background: color-mix(in srgb, var(--primary) 3%, transparent);
  }

  @media (min-width: 1024px) {
    .header__pill {
      font-size: 13px;
      color: color-mix(in srgb, var(--primary) 90%, transparent);
      border-color: color-mix(in srgb, var(--primary) 15%, transparent);
      padding: 7px 18px;
      background: color-mix(in srgb, var(--primary) 4%, transparent);
    }
  }
</style>
