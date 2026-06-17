<!--
  Glance rail for the project detail page (Overview / Impact / Stack / Services /
  Links). Each panel is a CollapsibleSection card; conditionally rendered when its
  data exists. Serves BOTH the desktop right rail and the mobile block below the
  sections: pass `mobile` for the mobile variant (distinct section keys so open
  state doesn't collide, 1-column metrics, non-sticky).
-->
<script lang="ts">
  import type { Project, Service, ImpactMetric } from '$lib/types';
  import { resolveLocale } from '$lib/utils/locale';
  import { getLocale } from '$lib/utils/locale-context';

  const locale = getLocale();
  import { MetricDisplay } from '$lib/components/brand';
  import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
  import SectionIcon from '$lib/components/shared/SectionIcon.svelte';
  import ServiceBadge from './ServiceBadge.svelte';
  import { siteLabels } from '$lib/content';
  import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';
  import ProjectLinksCard from './ProjectLinksCard.svelte';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';

  const glanceChrome = siteLabels.projectsChrome.detail.glance;
  const glanceOverviewTitle = resolveLocale(glanceChrome.overview, locale);
  const glanceImpactTitle = resolveLocale(glanceChrome.impact, locale);
  const glanceStackTitle = resolveLocale(glanceChrome.stack, locale);
  const glanceServicesTitle = resolveLocale(glanceChrome.services, locale);
  let {
    project,
    services,
    serviceSvgContents = {},
    mobile = false,
    showLinks = true,
  }: {
    project: Project;
    services: Service[];
    serviceSvgContents?: Record<string, string>;
    /** Mobile variant: distinct section keys (no persisted-state collision with
     *  the desktop instance), 1-column metrics, and non-sticky (it sits below the
     *  sections in the page flow, like the services detail mobile rail). */
    mobile?: boolean;
    /** Desktop ProjectDetailPage moves Links under Images in the TOC rail. */
    showLinks?: boolean;
  } = $props();

  /** Suffix section keys so the mobile + desktop instances don't share open state. */
  const k = (key: string) => (mobile ? `${key}-m` : key);

  const allMetrics = $derived.by((): ImpactMetric[] => {
    if (project.impactMetrics && project.impactMetrics.length > 0) {
      return project.impactMetrics;
    }
    if (project.impactMetric) {
      return [project.impactMetric];
    }
    return [];
  });

  const hasMetrics = $derived(allMetrics.length > 0);
  const hasServices = $derived(services.length > 0);
  const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl);

  const metricColors = ['var(--primary)', 'var(--accent)'] as const;
</script>

<!-- Bare sticky rail (no StickyPanel box) so it reads clean like the services
     detail rail. scrollChain keeps the nested-scroll exemption on this element. -->
<div
  class="glance-rail scrollbar-hidden {mobile ? '' : 'glance-rail--sticky'}"
  data-testid="project-glance-panel{mobile ? '-mobile' : ''}"
  use:scrollChain
>
    <!-- Overview -->
    <div class="mb-4">
      <CollapsibleSection title={glanceOverviewTitle} sectionKey={k('glance-overview')} open={true}>
        {#snippet icon()}
          <SectionIcon name="eye" />
        {/snippet}
        <div class="glance-overview text-small leading-[1.7]">
          <BlockRenderer doc={resolveLocale(project.description, locale)} />
        </div>
      </CollapsibleSection>
    </div>

    <!-- Impact metrics -->
    {#if hasMetrics}
      <div class="mb-4">
        <CollapsibleSection title={glanceImpactTitle} sectionKey={k('glance-impact')} open={true}>
          {#snippet icon()}
            <SectionIcon name="chart" />
          {/snippet}
          <div class="grid gap-4 {mobile ? 'grid-cols-1' : 'grid-cols-2'}">
            {#each allMetrics as metric, i}
              <MetricDisplay
                value={metric.value}
                label={resolveLocale(metric.label, locale)}
                size="md"
                labelBelow
                style="--metric-color: {metricColors[i % 2]};"
              />
            {/each}
          </div>
        </CollapsibleSection>
      </div>
    {/if}

    <!-- Stack -->
    {#if project.stack.length > 0}
      <div data-toc={mobile ? 'glance-stack' : undefined} class="mb-4">
        <CollapsibleSection title="{glanceStackTitle} ({project.stack.length})" sectionKey={k('glance-stack')} open={true}>
          {#snippet icon()}
            <SectionIcon name="layers" />
          {/snippet}
          <div class="stack-pills">
            {#each project.stack as tech}
              <span class="stack-pill">{tech}</span>
            {/each}
          </div>
        </CollapsibleSection>
      </div>
    {/if}

    <!-- Services (SVG badges with morph hover) -->
    {#if hasServices}
      <div data-toc={mobile ? 'glance-services' : undefined} class="mb-4">
        <CollapsibleSection title="{glanceServicesTitle} ({services.length})" sectionKey={k('glance-services')} open={true}>
          {#snippet icon()}
            <SectionIcon name="grid" />
          {/snippet}
          <div class="flex flex-col gap-2 px-2 py-1">
            {#each services as service}
              <ServiceBadge
                {service}
                svgContent={serviceSvgContents[service.id] ?? ''}
              />
            {/each}
          </div>
        </CollapsibleSection>
      </div>
    {/if}

    <!-- Links -->
    {#if hasLinks && showLinks}
      <div class="mb-4">
        <ProjectLinksCard
          {project}
          sectionKey={k('glance-links')}
          anchor={mobile ? 'glance-links' : undefined}
        />
      </div>
    {/if}
</div>

<style>
  /* Bare rail without a border/background box (matches the services detail rail) and
     NO height cap (as long as its content needs, no internal-scroll clip). Stays
     sticky: the center column is the longest, so the rail pins at the top while
     the article scrolls past it. */
  .glance-rail {
    overflow-x: hidden;
    padding-bottom: 1rem;
  }
  /* Desktop rail pins; the mobile instance flows below the sections (no sticky). */
  .glance-rail--sticky {
    position: sticky;
    top: 5rem;
  }

  .glance-overview {
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
  }

  /* Stack rendered as a literal vertical STACK of connected slabs, mirroring the
     services detail page (visual pun + brand cohesion). */
  .stack-pills {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 0;
  }
  .stack-pill {
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    padding: 0.45rem 0.7rem;
    border: 1.5px solid var(--primary);
    border-bottom-width: 0;
    border-radius: 0;
    color: var(--primary);
    background: color-mix(in srgb, var(--primary) 5%, transparent);
    cursor: default;
  }
  .stack-pill:first-child {
    border-top-left-radius: var(--radius-md);
    border-top-right-radius: var(--radius-md);
  }
  .stack-pill:last-child {
    border-bottom-width: 1.5px;
    border-bottom-left-radius: var(--radius-md);
    border-bottom-right-radius: var(--radius-md);
  }
</style>
