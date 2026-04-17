<!--
  Hero metric cards — 3 KPIs from the transit pipeline.
  Receives metrics as props so the parent can swap data on refresh.
-->
<script lang="ts">
  import type { HeroMetric } from '$lib/data/hero-data.js';
  import { MetricDisplay } from '$lib/components/brand';
  import { Card } from '$lib/components/ui/card';

  interface Props {
    metrics: HeroMetric[];
  }

  let { metrics }: Props = $props();

  function formatValue(metric: HeroMetric): string {
    if (metric.key === 'vehicles') return metric.value.toLocaleString('en-US');
    if (metric.key === 'delay') return metric.value.toFixed(1);
    return String(metric.value);
  }
</script>

<div class="grid grid-cols-1 gap-3.5 md:grid-cols-3" data-testid="hero-metrics">
  {#each metrics as metric (metric.key)}
    <Card
      class="px-4 py-3.5 md:px-5 md:py-4"
      data-testid="metric-card"
    >
      <MetricDisplay
        label={metric.label}
        value="{formatValue(metric)}{metric.unit ?? ''}"
        sublabel={metric.sub}
        size="lg"
      />
    </Card>
  {/each}
</div>
