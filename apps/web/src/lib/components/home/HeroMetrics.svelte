<!--
  Hero metric cards — 3 KPIs from the transit pipeline.
  Receives metrics as props so the parent can swap data on refresh.
-->
<script lang="ts">
  import type { HeroMetric } from '#lib/live/index.ts';
  import { siteLabels } from '#lib/content/site-labels.ts';
  import TransitInfoLink from './TransitInfoLink.svelte';
  import TransitSourceNote from './TransitSourceNote.svelte';
  import { Card } from '@yesid/ui/card';
  import { resolveLocale } from '#lib/utils/locale.ts';
  import { getLocale, intl } from '#lib/utils/locale-context.ts';

  const locale = getLocale();

  interface Props {
    metrics: HeroMetric[];
    /** True while REAL transit KPIs are on screen: vehicles card wears the
     *  LIVE-state sub-label instead of the DEMO one. */
    live?: boolean;
  }

  let { metrics, live = false }: Props = $props();

  // CMS truth: the dashboard card LABEL/SUB copy comes from the site_labels
  // singleton (siteLabels.heroDashboard), keyed by the metric's stable `key`.
  // Numbers/units stay code-owned dynamic data on the metric; only the words
  // are localized here. The {coverage}/{total} placeholders are filled from the
  // metric's own dynamic numbers (per-render coverage, constant route total).
  const dashboard = siteLabels.heroDashboard;

  function metricLabel(metric: HeroMetric): string {
    switch (metric.key) {
      case 'vehicles':
        return resolveLocale(dashboard.vehiclesLabel, locale);
      case 'delay':
        return resolveLocale(dashboard.delayLabel, locale);
      case 'routes':
        return resolveLocale(dashboard.routesLabel, locale);
    }
  }

  function metricSub(metric: HeroMetric): string {
    switch (metric.key) {
      case 'vehicles':
        return resolveLocale(live ? dashboard.vehiclesSubLive : dashboard.vehiclesSub, locale);
      case 'delay':
        return resolveLocale(dashboard.delaySub, locale).replace(
          '{coverage}',
          String(metric.coverage ?? ''),
        );
      case 'routes':
        return resolveLocale(dashboard.routesSub, locale).replace(
          '{total}',
          String(metric.total ?? ''),
        );
    }
  }

  function formatValue(metric: HeroMetric): string {
    if (metric.key === 'vehicles') return intl.number(locale).format(metric.value);
    if (metric.key === 'delay') return metric.value.toFixed(1);
    return String(metric.value);
  }
</script>

{#snippet metricDisplay(metric: HeroMetric, size: 'sm' | 'lg')}
  <div class="flex flex-col" data-slot="metric-display">
    <span class="label-metric metric-label"><span class="metric-label-text">{metricLabel(metric)}</span><TransitInfoLink label={metricLabel(metric)} /></span>
    <span class="metric-value font-heading font-extrabold leading-none text-accent-text {size === 'sm' ? 'text-subheading' : 'text-title'}">{formatValue(metric)}{metric.unit ?? ''}</span>
    <span class="mt-1 font-mono text-caption text-[var(--muted-foreground)]">{metricSub(metric)}</span>
  </div>
{/snippet}

<!-- Compact stacked rows on narrow phones; a card row where space permits. -->
<!-- Mobile single-card layout -->
<div class="hero-metrics-mobile md:hidden" data-testid="hero-metrics">
  <Card class="px-4 py-3.5" data-testid="metric-card-mobile">
    <div class="hero-metrics-row flex items-stretch justify-between gap-3">
      {#each metrics as metric, i (metric.key)}
        {#if i > 0}
          <div
            class="w-px self-stretch bg-[var(--border)]"
            aria-hidden="true"
          ></div>
        {/if}
        <div class="hero-metric-item flex-1 text-start">
          {@render metricDisplay(metric, 'sm')}
        </div>
      {/each}
    </div>
  </Card>
</div>

<!-- Desktop 3-card grid -->
<div class="hero-metrics-desktop hidden gap-3.5 md:grid md:grid-cols-3" data-testid="hero-metrics-desktop">
  {#each metrics as metric (metric.key)}
    <Card
      class="md:px-5 md:py-4"
      data-testid="metric-card"
    >
      {@render metricDisplay(metric, 'lg')}
    </Card>
  {/each}
</div>

<TransitSourceNote />

<style>
  .metric-label { display: flex; align-items: center; justify-content: start; gap: 0.5rem; }
  .metric-label-text { min-width: 0; flex: 1; white-space: normal; }
  .metric-value { white-space: nowrap; }
  @container (max-width: 480px) {
    .hero-metrics-mobile { display: block; }
    .hero-metrics-desktop { display: none; }
    .hero-metrics-mobile :global([data-slot='card']) { padding-block: 0.5rem; }
    .hero-metrics-row { flex-direction: column; gap: 0.25rem; }
    .hero-metrics-row > [aria-hidden] { width: 100%; height: 1px; }
    .hero-metric-item { text-align: start; }
    .hero-metric-item .metric-label { justify-content: start; }
    .hero-metric-item :global([data-slot='metric-display']) {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
      column-gap: 0.75rem;
    }
    .hero-metric-item :global(.metric-value) { grid-column: 2; grid-row: 1 / span 2; }
    .hero-metric-item :global([data-slot='metric-display'] > span:last-child) { margin-top: 0; }
  }
  @media (--tablet-min) and (--desktop-max) {
    .hero-metrics-desktop {
      grid-template-columns: repeat(3, minmax(0, 1fr));
    }

    .hero-metrics-desktop :global([data-slot='metric-display'] > span) {
      overflow-wrap: normal;
      word-break: normal;
      hyphens: none;
    }
  }
</style>
