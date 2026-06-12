<!--
  Transit route diagram for blog detail sideRight.
  Each h2 heading = major station, h3/h4 = minor stop.
  SVG styled entirely via CSS classes — zero inline fill/stroke attributes.
  Visual language matches montreal-metro.svg (organic curves, circle nodes).
-->
<script lang="ts" module>
  export interface RouteHeading {
    id: string;
    text: string;
    level: number;
  }

  export interface BlogRouteMapProps {
    headings: RouteHeading[];
    activeHeadingId: string;
    class?: string;
  }
</script>

<script lang="ts">
  import { resolveLocale } from '$lib/utils/locale';
  import { getLocale } from '$lib/utils/locale-context';

  const locale = getLocale();
  import { blogListingContent } from '$lib/content/blog';

  let {
    headings,
    activeHeadingId,
    class: className = ''
  }: BlogRouteMapProps = $props();

  const routeMapLabel = resolveLocale(blogListingContent.routeMap.title, locale);
  const terminusLabel = resolveLocale(blogListingContent.routeMap.terminus, locale);

  const CX = 50;
  const START_Y = 30;
  const MAJOR_SPACING = 100;
  const MINOR_SPACING = 40;
  const LABEL_OFFSET = 18;
  const SVG_WIDTH = 200;

  interface Station {
    id: string;
    text: string;
    level: number;
    y: number;
    active: boolean;
    passed: boolean;
  }

  const stations = $derived.by(() => {
    const activeIdx = headings.findIndex((h) => h.id === activeHeadingId);
    let y = START_Y + 30;
    return headings.map((h, i) => {
      if (i > 0) {
        y += h.level === 2 ? MAJOR_SPACING : MINOR_SPACING;
      }
      return {
        id: h.id,
        text: h.text,
        level: h.level,
        y,
        active: i === activeIdx,
        passed: activeIdx >= 0 && i < activeIdx,
      } satisfies Station;
    });
  });

  const svgHeight = $derived(
    stations.length > 0
      ? stations[stations.length - 1].y + 50
      : START_Y + 80
  );

  function computeCurvePath(fromY: number, toY: number): string {
    const midY = (fromY + toY) / 2;
    const offset = (toY - fromY) > 60 ? 5 : 3;
    return `M${CX} ${fromY} C${CX + offset} ${midY - 10} ${CX - offset} ${midY + 10} ${CX} ${toY}`;
  }
</script>

<div class="route-map {className}" data-testid="blog-route-map">
  <div class="route-map__label">{routeMapLabel}</div>

  <svg
    class="route-map__svg"
    viewBox="0 0 {SVG_WIDTH} {svgHeight}"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Terminus start -->
    <circle class="route-station--terminus" cx={CX} cy={START_Y} r="7" />

    {#each stations as station, i}
      <!-- Connecting line from previous node -->
      <path
        class="route-line"
        class:route-line--active={station.passed || station.active}
        d={computeCurvePath(i === 0 ? START_Y : stations[i - 1].y, station.y)}
      />

      <!-- Station node -->
      <circle
        class="route-station"
        class:route-station--major={station.level === 2}
        class:route-station--minor={station.level > 2}
        class:route-station--active={station.active}
        class:route-station--passed={station.passed}
        cx={CX}
        cy={station.y}
        r={station.level === 2 ? 8 : 4}
      />

      <!-- Station label (h2 only) -->
      {#if station.level === 2}
        <text
          class="route-label-text"
          class:route-label-text--active={station.active}
          x={CX + LABEL_OFFSET}
          y={station.y + 4}
        >
          {station.text.toUpperCase()}
        </text>
      {/if}
    {/each}

    <!-- Terminus end -->
    {#if stations.length > 0}
      <path
        class="route-line"
        class:route-line--active={stations[stations.length - 1].passed || stations[stations.length - 1].active}
        d={computeCurvePath(stations[stations.length - 1].y, svgHeight - 20)}
      />
    {/if}
    <circle class="route-station--terminus" cx={CX} cy={svgHeight - 20} r="5" />
  </svg>

  <div class="route-map__terminus-label">{terminusLabel}</div>
</div>

<style>
  /* ── Container ─────────────────────────────────────────────── */
  .route-map {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  /* ── Labels ────────────────────────────────────────────────── */
  .route-map__label {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--blog-accent, var(--primary));
    opacity: 0.3;
    margin-bottom: 0.75rem;
  }

  .route-map__terminus-label {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--blog-accent, var(--primary));
    opacity: 0.2;
    margin-top: 0.25rem;
    padding-left: 38px;
  }

  /* ── SVG ────────────────────────────────────────────────────── */
  .route-map__svg {
    width: 100%;
    max-width: 200px;
    height: auto;
  }

  /* ── Route lines ───────────────────────────────────────────── */
  .route-line {
    fill: none;
    stroke: var(--blog-accent, var(--primary));
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.15;
    transition: opacity var(--duration-normal, 200ms) var(--ease-default, ease);
  }

  .route-line--active {
    opacity: 0.8;
  }

  /* ── Station nodes ─────────────────────────────────────────────
     GO2-W5 métro-map recipe: white-core station dots (fill var(--card))
     with a colored ring, Montréal-map style. Current position rides the
     yellow line (--line-amber survives daylight, graphics ≥3:1). */
  .route-station--major {
    fill: var(--card);
    stroke: var(--blog-accent, var(--primary));
    stroke-width: 2;
    opacity: 0.25;
    transition:
      opacity var(--duration-normal, 200ms) var(--ease-default, ease),
      filter var(--duration-normal, 200ms) var(--ease-default, ease);
  }

  .route-station--minor {
    fill: var(--card);
    stroke: var(--blog-accent, var(--primary));
    stroke-width: 1.5;
    opacity: 0.15;
    transition: opacity var(--duration-normal, 200ms) var(--ease-default, ease);
  }

  .route-station--active {
    stroke: var(--line-amber, var(--accent));
    opacity: 1;
    filter: drop-shadow(0 0 8px color-mix(in srgb, var(--line-amber, var(--accent)) 40%, transparent));
  }

  .route-station--passed {
    opacity: 0.6;
  }

  .route-station--terminus {
    fill: none;
    stroke: var(--blog-accent, var(--primary));
    stroke-width: 2;
    opacity: 0.3;
  }

  /* ── Station labels ────────────────────────────────────────── */
  .route-label-text {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 1px;
    fill: color-mix(in srgb, var(--blog-accent, var(--primary)) 25%, transparent);
  }

  .route-label-text--active {
    fill: var(--blog-accent, var(--primary));
    font-weight: 600;
  }

  /* ── Reduced motion ────────────────────────────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .route-line,
    .route-station--major,
    .route-station--minor {
      transition: none;
    }
  }
</style>
