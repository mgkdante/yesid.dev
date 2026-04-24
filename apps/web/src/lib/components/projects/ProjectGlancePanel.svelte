<!--
  Right sidebar for the project detail page.
  Each section is a CollapsibleSection card (same primitive as center sections).
  Conditionally rendered — hidden when data is empty.
  Desktop only (hidden below lg). Mobile gets ProjectGlancePanelMobile.
-->
<script lang="ts">
  import type { Project, Service, ImpactMetric } from '$lib/types';
  import { resolveLocale } from '$lib/utils/locale';
  import { MetricDisplay, StickyPanel } from '$lib/components/brand';
  import { Badge } from '$lib/components/ui/badge';
  import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
  import ServiceBadge from './ServiceBadge.svelte';
  import { projectsDetailContent } from '$lib/content/projects';

  const glanceOverviewTitle = resolveLocale(projectsDetailContent.glance.overview, 'en');
  const glanceImpactTitle = resolveLocale(projectsDetailContent.glance.impact, 'en');
  const glanceStackTitle = resolveLocale(projectsDetailContent.glance.stack, 'en');
  const glanceServicesTitle = resolveLocale(projectsDetailContent.glance.services, 'en');
  const glanceLinksTitle = resolveLocale(projectsDetailContent.glance.links, 'en');
  const liveSiteLabel = resolveLocale(projectsDetailContent.glance.liveSiteLabel, 'en');
  const githubLabel = resolveLocale(projectsDetailContent.glance.githubLabel, 'en');

  let {
    project,
    services,
    serviceSvgContents = {},
  }: {
    project: Project;
    services: Service[];
    serviceSvgContents?: Record<string, string>;
  } = $props();

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

<StickyPanel top="5rem">
  <div
    class="glance-panel"
    data-testid="project-glance-panel"
  >
    <!-- Overview -->
    <div class="mb-4">
      <CollapsibleSection title={glanceOverviewTitle} open={true}>
        <p class="glance-overview text-small leading-[1.7]">
          {resolveLocale(project.description, 'en')}
        </p>
      </CollapsibleSection>
    </div>

    <!-- Impact metrics -->
    {#if hasMetrics}
      <div class="mb-4">
        <CollapsibleSection title={glanceImpactTitle} open={true}>
          <div class="grid grid-cols-2 gap-4">
            {#each allMetrics as metric, i}
              <MetricDisplay
                value={metric.value}
                label={resolveLocale(metric.label, 'en')}
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
      <div class="mb-4">
        <CollapsibleSection title={glanceStackTitle} open={true}>
          <div class="flex flex-wrap gap-1.5">
            {#each project.stack as tech}
              <Badge variant="tag" size="xs">{tech}</Badge>
            {/each}
          </div>
        </CollapsibleSection>
      </div>
    {/if}

    <!-- Services (SVG badges with morph hover) -->
    {#if hasServices}
      <div class="mb-4">
        <CollapsibleSection title={glanceServicesTitle} open={true}>
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
    {#if hasLinks}
      <div class="mb-4">
        <CollapsibleSection title={glanceLinksTitle} open={true}>
          <div class="flex flex-col gap-2">
            {#if project.liveUrl}
              <a
                href={project.liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 font-mono text-mono text-primary no-underline"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M6 3h7v7M13 3L3 13" />
                </svg>
                {liveSiteLabel}
              </a>
            {/if}
            {#if project.repoUrl}
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 font-mono text-mono text-primary no-underline"
              >
                <svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                </svg>
                {githubLabel}
              </a>
            {/if}
          </div>
        </CollapsibleSection>
      </div>
    {/if}
  </div>
</StickyPanel>

<style>
  .glance-panel {
    max-height: calc(100dvh - 10rem);
    overflow-y: auto;
    overflow-x: hidden;
    padding-bottom: 1rem;
  }

  .glance-overview {
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
  }
</style>
