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

<!--
  Mobile: all 3 metrics inside a single Card, laid out horizontally with
  thin dividers. Saves ~150px of vertical space vs 3 stacked cards so
  the whole hero (headline + metrics + subhead + subtitle + CTAs) fits
  inside calc(100svh - 5rem) on short phones (iPhone SE etc).

  Desktop (md+): 3 separate cards in a row — original layout, unchanged.
-->
<!-- Mobile single-card layout -->
<div class="md:hidden" data-testid="hero-metrics">
  <Card class="px-4 py-3.5" data-testid="metric-card-mobile">
    <div class="flex items-stretch justify-between gap-3">
      {#each metrics as metric, i (metric.key)}
        {#if i > 0}
          <div
            class="w-px self-stretch bg-[var(--border)]"
            aria-hidden="true"
          ></div>
        {/if}
        <div class="flex-1 text-center">
          <MetricDisplay
            label={metric.label}
            value="{formatValue(metric)}{metric.unit ?? ''}"
            sublabel={metric.sub}
            size="sm"
          />
        </div>
      {/each}
    </div>
  </Card>
</div>

<!-- Desktop 3-card grid -->
<div class="hidden gap-3.5 md:grid md:grid-cols-3" data-testid="hero-metrics-desktop">
  {#each metrics as metric (metric.key)}
    <Card
      class="md:px-5 md:py-4"
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
