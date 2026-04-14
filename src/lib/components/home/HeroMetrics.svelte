<!--
  Hero metric cards — 3 KPIs from the transit pipeline.
  Receives metrics as props so the parent can swap data on refresh.
-->
<script lang="ts">
  import type { HeroMetric } from '$lib/data/hero-data.js';
  import { MetricDisplay } from '$lib/components/brand';

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

<div class="grid grid-cols-3 gap-3.5" data-testid="hero-metrics">
  {#each metrics as metric (metric.key)}
    <div
      class="rounded-lg border border-[var(--border)] bg-[var(--muted)] px-4 py-3.5 transition-colors duration-300 hover:border-[var(--primary)] md:px-5 md:py-4"
      data-testid="metric-card"
    >
      <MetricDisplay
        label={metric.label}
        value="{formatValue(metric)}{metric.unit ?? ''}"
        sublabel={metric.sub}
        size="lg"
      />
    </div>
  {/each}
</div>
