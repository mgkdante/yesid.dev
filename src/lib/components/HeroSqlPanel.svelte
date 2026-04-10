<!--
  SQL panel for the hero — shows a real Gold-layer query with syntax highlighting
  and a results table. Rows + queryTime are props so the parent can refresh them.
  The SQL query itself is static (always the same analysis query).
-->
<script lang="ts">
  import type { HeroQueryRow } from '$lib/data/hero-data.js';

  interface Props {
    rows: HeroQueryRow[];
    queryTime: number;
    prompt: string;
    liveLabel: string;
    updatedAgo?: string;
  }

  let { rows, queryTime, prompt, liveLabel, updatedAgo = '30s ago' }: Props = $props();
</script>

<div
  class="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-terminal)] p-[22px_24px] font-mono"
  data-testid="sql-panel"
>
  <!-- Header: prompt + live dot -->
  <div class="mb-4 flex items-center justify-between">
    <span class="text-[11px] tracking-[1px] text-[var(--text-muted)]" data-testid="sql-prompt">
      {prompt}
    </span>
    <span class="flex items-center gap-1.5 text-[10px] text-[var(--text-dim)]" data-testid="sql-live">
      <span class="live-dot"></span>
      {liveLabel}
    </span>
  </div>

  <!-- Query with syntax highlighting -->
  <div class="text-xs leading-[1.7]" data-testid="sql-query">
    <span class="text-[var(--brand-primary)]">SELECT</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;d.route_short_name,</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">round</span><span class="text-[var(--text-secondary)]">(</span><span class="text-[var(--brand-primary)]">avg</span><span class="text-[var(--text-secondary)]">(f.delay_seconds)::numeric, 1)</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">AS</span> <span class="text-[var(--text-secondary)]">avg_delay_s,</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">count</span><span class="text-[var(--text-secondary)]">(</span><span class="text-[var(--brand-primary)]">DISTINCT</span> <span class="text-[var(--text-secondary)]">f.vehicle_id)</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">AS</span> <span class="text-[var(--text-secondary)]">vehicles</span><br />
    <span class="text-[var(--brand-primary)]">FROM</span> <span class="text-[var(--brand-accent)]">gold.latest_trip_delay_snapshot</span> <span class="text-[var(--text-secondary)]">f</span><br />
    <span class="text-[var(--brand-primary)]">JOIN</span> <span class="text-[var(--brand-accent)]">gold.dim_route</span> <span class="text-[var(--text-secondary)]">d</span><br />
    <span class="text-[var(--text-secondary)]">&nbsp;&nbsp;</span><span class="text-[var(--brand-primary)]">USING</span> <span class="text-[var(--text-secondary)]">(provider_id, route_id)</span><br />
    <span class="text-[var(--brand-primary)]">WHERE</span> <span class="text-[var(--text-secondary)]">f.delay_seconds</span> <span class="text-[var(--brand-primary)]">IS NOT NULL</span><br />
    <span class="text-[var(--brand-primary)]">GROUP BY</span> <span class="text-[var(--text-secondary)]">d.route_short_name</span><br />
    <span class="text-[var(--brand-primary)]">ORDER BY</span> <span class="text-[var(--text-secondary)]">vehicles</span> <span class="text-[var(--brand-primary)]">DESC</span><br />
    <span class="text-[var(--brand-primary)]">LIMIT</span> <span class="text-[var(--brand-accent)]">5</span><span class="text-[var(--text-secondary)]">;</span>
  </div>

  <!-- Results table -->
  <div class="mt-4 border-t border-[var(--border-subtle)] pt-3">
    <div class="grid grid-cols-3 gap-x-3 gap-y-1 text-xs">
      <span class="border-b border-[#1a1a1a] pb-1.5 text-[var(--text-muted)]">route</span>
      <span class="border-b border-[#1a1a1a] pb-1.5 text-[var(--text-muted)]">avg_delay_s</span>
      <span class="border-b border-[#1a1a1a] pb-1.5 text-[var(--text-muted)]">vehicles</span>
      {#each rows as row (row.route)}
        <span class="text-[var(--text-primary)]" data-testid="sql-result-row">{row.route}</span>
        <span class="text-[var(--brand-accent)]">{row.avgDelayS}</span>
        <span class="text-[var(--text-secondary)]">{row.vehicles}</span>
      {/each}
    </div>
    <div class="mt-2.5 text-[10px] text-[var(--text-dim)]" data-testid="sql-meta">
      5 rows &middot; {queryTime}s &middot; updated {updatedAgo}
    </div>
  </div>
</div>

<style>
  .live-dot {
    width: 7px;
    height: 7px;
    background: var(--status-live);
    border-radius: 50%;
    box-shadow: 0 0 6px var(--status-live);
    animation: pulse-dot 2s ease-in-out infinite;
  }

  @keyframes pulse-dot {
    0%, 100% { box-shadow: 0 0 6px var(--status-live); }
    50% { box-shadow: 0 0 12px var(--status-live), 0 0 24px rgba(34, 197, 94, 0.3); }
  }
</style>
