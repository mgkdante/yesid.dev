<script lang="ts">
  import type { Project } from '#lib/types.ts';
  import { resolveLocale } from '#lib/utils/locale.ts';
  import { getLocale } from '#lib/utils/locale-context.ts';
  import { siteLabels } from '#lib/content/index.ts';
  import { CollapsibleSection, MetricDisplay, SectionIcon } from '@yesid/ui/brand';
  import MetricProof from '#lib/components/shared/MetricProof.svelte';

  let {
    project,
    columns = 2,
  }: {
    project: Project;
    columns?: 1 | 2;
  } = $props();

  const locale = getLocale();
  const title = resolveLocale(siteLabels.projectsChrome.detail.glance.impact, locale);
  const metrics = $derived(project.impactMetrics ?? []);
  const metricColors = ['var(--primary)', 'var(--accent)'] as const;
</script>

{#if metrics.length > 0}
  <div data-testid="project-impact-card">
    <CollapsibleSection {title} open={true}>
      {#snippet icon()}
        <SectionIcon name="chart" />
      {/snippet}
      <div class="grid gap-4 {columns === 1 ? 'grid-cols-1' : 'grid-cols-2'}">
        {#each metrics as metric, i}
          <div class="min-w-0">
          <MetricDisplay
            value={resolveLocale(metric.value, locale)}
            label={resolveLocale(metric.label, locale)}
            size="md"
            labelBelow
            style="--metric-color: {metricColors[i % 2]};"
          >
            {#snippet info()}<MetricProof {metric} {locale} />{/snippet}
          </MetricDisplay>
          </div>
        {/each}
      </div>
    </CollapsibleSection>
  </div>
{/if}
