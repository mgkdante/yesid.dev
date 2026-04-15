<!--
  Mobile "Project Info" panel — uses CollapsibleSection (same primitive as all panels).
  Shows between hazard stripes and content sections on mobile (<lg).
  Starts collapsed. Contains: overview, metrics, stack tags, links.
-->
<script lang="ts">
  import type { Project, ImpactMetric } from '$lib/data/types.js';
  import { resolveLocale } from '$lib/data/locale.js';
  import { MetricDisplay } from '$lib/components/brand';
  import { Badge } from '$lib/components/ui/badge';
  import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';

  let { project }: { project: Project } = $props();

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
  const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl);
  const metricColors = ['var(--primary)', 'var(--accent)'] as const;
</script>

<div data-testid="project-glance-panel-mobile">
  <CollapsibleSection title="Project Info" open={false}>
    <div class="space-y-5">
      <!-- Overview -->
      <p class="mobile-glance-overview text-small leading-relaxed">
        {resolveLocale(project.description, 'en')}
      </p>

      <!-- Metrics -->
      {#if hasMetrics}
        <div class="flex gap-6">
          {#each allMetrics as metric, i}
            <div class="flex items-start gap-6">
              {#if i > 0}
                <div class="mobile-glance-divider h-12 w-px"></div>
              {/if}
              <div>
                <div
                  class="font-heading text-2xl font-extrabold"
                  style="color: {metricColors[i % 2]};"
                >
                  {metric.value}
                </div>
                <div class="mobile-glance-metric-label mt-1 font-mono text-micro">
                  {metric.label}
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}

      <!-- Stack tags -->
      {#if project.stack.length > 0}
        <div class="flex flex-wrap gap-1.5">
          {#each project.stack as tech}
            <Badge variant="tag" size="xs">{tech}</Badge>
          {/each}
        </div>
      {/if}

      <!-- Links -->
      {#if hasLinks}
        <div class="flex gap-5">
          {#if project.liveUrl}
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-sm text-primary no-underline"
            >
              &#8599; Live Site
            </a>
          {/if}
          {#if project.repoUrl}
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="font-mono text-sm text-primary no-underline"
            >
              GitHub
            </a>
          {/if}
        </div>
      {/if}
    </div>
  </CollapsibleSection>
</div>

<style>
  .mobile-glance-overview {
    color: color-mix(in srgb, var(--foreground) 50%, transparent);
  }

  .mobile-glance-divider {
    background: color-mix(in srgb, var(--primary) 10%, transparent);
  }

  .mobile-glance-metric-label {
    color: color-mix(in srgb, var(--foreground) 30%, transparent);
  }
</style>
