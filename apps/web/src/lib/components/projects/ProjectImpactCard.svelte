<script lang="ts">
  import type { Project } from '#lib/types.ts';
  import { resolveLocale } from '#lib/utils/locale.ts';
  import { getLocale } from '#lib/utils/locale-context.ts';
  import { projectMetrics } from '#lib/utils/project-metrics.ts';
  import { siteLabels } from '#lib/content/index.ts';
  import { CollapsibleSection, MetricDisplay, SectionIcon } from '@yesid/ui/brand';

  let {
    project,
    sectionKey,
    columns = 2,
  }: {
    project: Project;
    sectionKey: string;
    columns?: 1 | 2;
  } = $props();

  const locale = getLocale();
  const title = resolveLocale(siteLabels.projectsChrome.detail.glance.impact, locale);
  const metrics = $derived(projectMetrics(project));
  const metricColors = ['var(--primary)', 'var(--accent)'] as const;
</script>

{#if metrics.length > 0}
  <div data-testid="project-impact-card">
    <CollapsibleSection {title} {sectionKey} open={true}>
      {#snippet icon()}
        <SectionIcon name="chart" />
      {/snippet}
      <div class="grid gap-4 {columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}">
        {#each metrics as metric, i}
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
