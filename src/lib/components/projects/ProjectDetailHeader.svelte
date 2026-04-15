<!--
  Manifesto-style header for /projects/[slug].
  Reuses the exact Manifesto visual base: circuit grid, ManifestoCanvas (hover/click),
  CornerMarks. Only the center text content changes per project.
  Extends behind nav with negative margin.
-->
<script lang="ts">
  import type { Project } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { getStackRole } from '$lib/data/stackRoles.js';
  import { CornerMarks } from '$lib/components/brand';
  import { SectionWrapper } from '$lib/components/shells';
  import ManifestoCanvas from '$lib/components/home/ManifestoCanvas.svelte';
  import { boop } from '$lib/motion/actions/boop.js';
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
  import { registerGsapPlugins, gsap, SplitText } from '$lib/motion/utils/gsap.js';

  let { project }: { project: Project } = $props();

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

  const metrics = $derived.by(() => {
    if (project.impactMetrics && project.impactMetrics.length > 0) {
      return project.impactMetrics;
    }
    if (project.impactMetric) {
      return [project.impactMetric];
    }
    return [];
  });

  let headerEl = $state<HTMLElement>(undefined!);
  let titleEl = $state<HTMLHeadingElement>(undefined!);

  onMount(() => {
    if (!browser || isPrefersReducedMotion() || !headerEl) return;
    registerGsapPlugins();

    // Scope all selectors to headerEl to avoid animating elements outside this component
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

<div bind:this={headerEl} class="project-detail-header" data-testid="project-detail-header">
  <!-- BG layers as direct children (same pattern as home Manifesto) so
       ManifestoCanvas containerEl coordinates match the canvas position -->
  <div class="header__circuit-grid"></div>
  <ManifestoCanvas containerEl={headerEl} />

<SectionWrapper layout="bleed" centerContent class="header-section">
  {#snippet background()}
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

    <!-- Ticks (top center) -->
    <div class="header__decoration absolute left-1/2 top-[18px] hidden -translate-x-1/2 gap-7 font-mono text-micro lg:flex" aria-hidden="true"
      style="color: color-mix(in srgb, var(--primary) 8%, transparent);"
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
      <div>{metric.value} {metric.label}</div>
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
  {/snippet}

  <!-- Center content (SectionWrapper content slot) -->
  <div class="header__content">
    <a
      href="/projects"
      class="mb-5 inline-block font-mono text-xs tracking-[0.5px] text-primary opacity-70 transition-opacity hover:opacity-100 lg:mb-7"
      use:boop={{ scale: 1.05, timing: 200 }}
    >
      &larr; All Projects
    </a>

    <h1
      bind:this={titleEl}
      class="header-title mb-3 font-heading font-black uppercase leading-[0.95] tracking-[-0.03em] text-primary lg:mb-4"
    >
      {resolveLocale(project.title, 'en')}
    </h1>

    <nav class="flex flex-wrap justify-center gap-1.5 lg:gap-2" aria-label="Tech stack">
      {#each project.stack as tech}
        <span class="header__pill">{tech}</span>
      {/each}
    </nav>
  </div>
</SectionWrapper>
</div>

<style>
  /* ── Container — extends behind nav with negative margin ────── */
  .project-detail-header {
    position: relative;
    margin-top: calc(-1 * var(--nav-height, 64px));
    padding-top: var(--nav-height, 64px);
    overflow: hidden;
    background: var(--manifesto, #0f0d0a);
    cursor: crosshair;
  }

  .project-detail-header :global(.header-section) {
    min-height: 420px;
  }

  @media (min-width: 1024px) {
    .project-detail-header :global(.header-section) {
      min-height: 440px;
    }
  }

  /* ── BG Layer 1: Circuit Grid (direct child of header, covers full area) ── */
  .header__circuit-grid {
    position: absolute;
    inset: 0;
    background-image:
      repeating-linear-gradient(90deg, color-mix(in srgb, var(--primary) 3.5%, transparent) 0px, color-mix(in srgb, var(--primary) 3.5%, transparent) 1px, transparent 1px, transparent 80px),
      repeating-linear-gradient(0deg, color-mix(in srgb, var(--primary) 3.5%, transparent) 0px, color-mix(in srgb, var(--primary) 3.5%, transparent) 1px, transparent 1px, transparent 80px);
    z-index: var(--z-base);
    opacity: 0;
  }

  .header__circuit-grid::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle 2.5px at 80px 80px, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 4px),
      radial-gradient(circle 2px at 160px 160px, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 3px),
      radial-gradient(circle 2.5px at 240px 80px, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 4px),
      radial-gradient(circle 2px at 80px 240px, color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 3px);
    background-size: 320px 320px;
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
    padding: 2.5rem 1.25rem 2.5rem;
  }

  @media (min-width: 1024px) {
    .header__content {
      padding: 2.5rem 2rem 3.75rem;
    }
  }

  /* ── Edge metadata ────────────────────────────────────────── */
  .header__edge {
    opacity: 0;
  }

  .edge-left,
  .edge-right {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 1.5px;
    color: color-mix(in srgb, var(--primary) 15%, transparent);
    line-height: 2.4;
    text-transform: uppercase;
    z-index: calc(var(--z-content) + 1);
  }

  .edge-left { left: 28px; }
  .edge-right { right: 28px; text-align: right; }

  .edge-value {
    color: color-mix(in srgb, var(--primary) 25%, transparent);
  }

  .edge-separator {
    margin-top: 8px;
    opacity: 0.5;
  }

  /* ── Decorations ──────────────────────────────────────────── */
  .header__decoration {
    opacity: 0;
    z-index: calc(var(--z-content) + 1);
  }

  /* ── Title ─────────────────────────────────────��──────────── */
  .header-title {
    font-size: 32px;
    text-shadow: 0 0 60px color-mix(in srgb, var(--primary) 12%, transparent);
  }

  @media (min-width: 1024px) {
    .header-title {
      font-size: clamp(2.5rem, 5vw, 4rem);
      text-shadow: 0 0 80px color-mix(in srgb, var(--primary) 12%, transparent);
    }
  }

  /* ── Tech pills (same as Manifesto) ───────────────────────── */
  .header__pill {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.04em;
    color: color-mix(in srgb, var(--primary) 50%, transparent);
    border: 1px solid color-mix(in srgb, var(--primary) 12%, transparent);
    border-radius: var(--radius-pill);
    padding: 4px 12px;
    background: color-mix(in srgb, var(--primary) 3%, transparent);
    opacity: 0;
    transform: translateY(15px);
  }

  @media (min-width: 1024px) {
    .header__pill {
      font-size: 13px;
      color: color-mix(in srgb, var(--primary) 60%, transparent);
      border-color: color-mix(in srgb, var(--primary) 15%, transparent);
      padding: 7px 18px;
      background: color-mix(in srgb, var(--primary) 4%, transparent);
    }
  }
</style>
