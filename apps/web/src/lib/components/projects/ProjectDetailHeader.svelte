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
  import { siteLabels } from '$lib/content';
  import DetailHeaderShell from '$lib/components/shared/DetailHeaderShell.svelte';

  let { project }: { project: Project } = $props();

  // go2/w4: "← All Projects" now comes from site_labels (CMS-editable),
  // previous companion literal kept as the code fallback.
  const backToListingLabel =
    resolveLocale(siteLabels.ui.backToProjects, locale) ||
    resolveLocale(siteLabels.projectsChrome.detail.backToListingLabel, locale);
  // go2-t1c2: aria microcopy from site_labels, previous literal as fallback.
  const navTechStackAria = resolveLocale(siteLabels.a11y.navTechStack, locale);
  const subtitle = $derived(resolveLocale(project.oneLiner, locale));

  // No invented defaults: the edge chrome reads as factual telemetry, so a
  // line simply disappears when the CMS field is absent (the old
  // sherbrooke/production/1.0.0 fallbacks fabricated metadata).
  const location = $derived(project.location);
  const environment = $derived(project.environment);
  const version = $derived(project.version);

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
</script>

<DetailHeaderShell
  accent="var(--primary)"
  testId="project-detail-header"
  rootClass="project-detail-header"
  mobileMinHeight={420}
  backHref={localizeHref('/projects', locale)}
  backLabel={backToListingLabel}
  pills={project.stack}
  pillsAriaLabel={navTechStackAria}
>
  {#snippet decorations()}
    <div class="header__decoration absolute bottom-[55px] right-[45px] hidden lg:block" aria-hidden="true">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" stroke="var(--primary)" stroke-width="0.8">
        <circle cx="22" cy="22" r="16" />
        <line x1="22" y1="0" x2="22" y2="44" />
        <line x1="0" y1="22" x2="44" y2="22" />
      </svg>
    </div>

    <div class="header__decoration absolute left-1/2 top-[18px] hidden -translate-x-1/2 gap-7 font-mono text-micro lg:flex" aria-hidden="true"
      style="color: var(--primary); opacity: var(--chrome-ink-opacity);"
    >
      {#each [0, 80, 160, 240, 320, 400, 480] as tick}
        <span>{tick}</span>
      {/each}
    </div>

    <div class="edge-left header__edge hidden lg:block" aria-hidden="true">
      <div>PRJ <span class="edge-value">{project.slug}</span></div>
      {#if location}<div>SRC {location}</div>{/if}
      {#if environment}<div>ENV {environment}</div>{/if}
      {#if version}<div>VER {version}</div>{/if}
      <div>STATUS <span class="edge-value">{project.status}</span></div>
      <div class="edge-separator">───────</div>
      {#each metrics as metric}
        <div>{metric.value} {resolveLocale(metric.label, locale)}</div>
      {/each}
    </div>

    <div class="edge-right header__edge hidden lg:block" aria-hidden="true">
      <div>LAYER {layerId}</div>
      {#each stackRoles as item}
        <div>{item.role} <span class="edge-value">{item.name}</span></div>
      {/each}
      <div class="edge-separator">───────</div>
      <div>NODES {project.stack.length}</div>
    </div>
  {/snippet}

  {#snippet beforePills()}
    <h1
      class="header-title mb-3 font-heading font-black uppercase leading-[0.95] tracking-[-0.03em] text-primary lg:mb-4"
    >
      {resolveLocale(project.title, locale)}
    </h1>

    {#if subtitle}
      <p class="header-subtitle">{subtitle}</p>
    {/if}
  {/snippet}
</DetailHeaderShell>

<style>
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

  /* ── Decorations ──────────────────────────────────────────── */
  .header__decoration {
    z-index: calc(var(--z-content) + 1);
  }

  /* ── Title ─────────────────────────────────────��──────────── */
  .header-title {
    font-size: 32px;
    text-shadow: 0 0 60px color-mix(in srgb, var(--glow) 12%, transparent);
  }

  @media (--desktop-min) {
    .header-title {
      font-size: var(--text-display);
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

  @media (--desktop-min) {
    .header-subtitle {
      margin-bottom: 1.5rem;
      font-size: var(--text-detail-body-desktop);
    }
  }
</style>
