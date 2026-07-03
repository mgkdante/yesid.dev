<!--
  Hero metric cards — 3 KPIs from the transit pipeline.
  Receives metrics as props so the parent can swap data on refresh.
-->
<script lang="ts">
  import type { HeroMetric } from '$lib/content/hero-data';
  import { siteLabels } from '$lib/content/site-labels';
  import { MetricDisplay } from '$lib/components/brand';
  import { Card } from '$lib/components/ui/card';
  import { resolveLocale } from '$lib/utils/locale';
  import { getLocale } from '$lib/utils/locale-context';

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

  // Digit grouping follows the active locale ('1 247' in fr-CA, '1,247' in
  // en-CA); a hard-coded en-US grouping stood out to exactly the local
  // audience the FR page targets.
  const numberLocale = locale === 'fr' ? 'fr-CA' : locale === 'es' ? 'es' : 'en-CA';

  function formatValue(metric: HeroMetric): string {
    if (metric.key === 'vehicles') return metric.value.toLocaleString(numberLocale);
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
            label={metricLabel(metric)}
            value="{formatValue(metric)}{metric.unit ?? ''}"
            sublabel={metricSub(metric)}
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
        label={metricLabel(metric)}
        value="{formatValue(metric)}{metric.unit ?? ''}"
        sublabel={metricSub(metric)}
        size="lg"
      />
    </Card>
  {/each}
</div>
