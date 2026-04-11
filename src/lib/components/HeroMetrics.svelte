<!--
  Hero metric cards — 3 KPIs from the transit pipeline.
  Receives metrics as props so the parent can swap data on refresh.
-->
<script lang="ts">
  import type { HeroMetric } from '$lib/data/hero-data.js';

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
      class="rounded-[10px] border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3.5 transition-colors duration-300 hover:border-[var(--brand-primary)] md:px-5 md:py-4"
      data-testid="metric-card"
    >
      <div class="font-mono text-[11px] tracking-[2px] text-[var(--text-muted)] md:text-[13px]">
        {metric.label}
      </div>
      <div
        class="mt-1 font-heading text-[clamp(30px,3vw,42px)] font-extrabold leading-none text-[var(--brand-primary)]"
        data-testid="metric-value-{metric.key}"
      >
        {formatValue(metric)}{#if metric.unit}<span class="text-[60%] text-[var(--text-secondary)]">{metric.unit}</span>{/if}
      </div>
      <div class="mt-1.5 font-mono text-[11px] text-[var(--text-dim)] md:text-[12px]">
        {metric.sub}
      </div>
    </div>
  {/each}
</div>
