<!--
  SQL panel for the hero — shows a real Gold-layer query with syntax highlighting
  and a results table. Rows + queryTime are props so the parent can refresh them.
  The SQL query itself is static (always the same analysis query).
-->
<script lang="ts">
  import type { HeroQueryRow } from '$lib/content/hero-data';
  import { StatusDot } from '$lib/components/brand';

  interface Props {
    rows: HeroQueryRow[];
    queryTime: number;
    prompt: string;
    liveLabel: string;
    columnRoute: string;
    columnAvgDelay: string;
    columnVehicles: string;
    /** Meta caption template with `{queryTime}` + `{updatedAgo}` placeholders. */
    metaTemplate: string;
    updatedAgo?: string;
  }

  let {
    rows,
    queryTime,
    prompt,
    liveLabel,
    columnRoute,
    columnAvgDelay,
    columnVehicles,
    metaTemplate,
    updatedAgo = 'demo data',
  }: Props = $props();

  const metaCaption = $derived(
    metaTemplate.replace('{queryTime}', String(queryTime)).replace('{updatedAgo}', updatedAgo)
  );
</script>

<!-- GO2-W5 taste round 2: terminal body = the SITE background (solid);
     identity = solid-orange rule chassis + terminal-ink type.
     Round 3: chassis one step thicker (border-2) — bolder structure. -->
<div
  class="rounded-lg border-2 border-[var(--border-rule)] bg-[var(--terminal)] p-5 font-mono"
  data-testid="sql-panel"
>
  <!-- Header: prompt + live dot -->
  <div class="mb-4 flex items-center justify-between">
    <span class="text-caption tracking-[1px] text-[var(--terminal-ink-muted)] md:text-mono" data-testid="sql-prompt">
      {prompt}
    </span>
    <span class="flex items-center gap-1.5 text-caption text-[var(--terminal-ink-muted)]" data-testid="sql-live">
      <StatusDot color="green" pulse />
      {liveLabel}
    </span>
  </div>

  <!-- Query with syntax highlighting -->
  <div class="text-xs leading-[1.7] md:text-sm md:leading-[1.8]" data-testid="sql-query">
    <span class="text-[var(--primary)]">SELECT</span><br />
    <span class="text-[var(--terminal-ink)]">&nbsp;&nbsp;d.route_short_name,</span><br />
    <span class="text-[var(--terminal-ink)]">&nbsp;&nbsp;</span><span class="text-[var(--primary)]">round</span><span class="text-[var(--terminal-ink)]">(</span><span class="text-[var(--primary)]">avg</span><span class="text-[var(--terminal-ink)]">(f.delay_seconds)::numeric, 1)</span><br />
    <span class="text-[var(--terminal-ink)]">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="text-[var(--primary)]">AS</span> <span class="text-[var(--terminal-ink)]">avg_delay_s,</span><br />
    <span class="text-[var(--terminal-ink)]">&nbsp;&nbsp;</span><span class="text-[var(--primary)]">count</span><span class="text-[var(--terminal-ink)]">(</span><span class="text-[var(--primary)]">DISTINCT</span> <span class="text-[var(--terminal-ink)]">f.vehicle_id)</span><br />
    <span class="text-[var(--terminal-ink)]">&nbsp;&nbsp;&nbsp;&nbsp;</span><span class="text-[var(--primary)]">AS</span> <span class="text-[var(--terminal-ink)]">vehicles</span><br />
    <span class="text-[var(--primary)]">FROM</span> <span class="text-[var(--accent-text)]">gold.latest_trip_delay_snapshot</span> <span class="text-[var(--terminal-ink)]">f</span><br />
    <span class="text-[var(--primary)]">JOIN</span> <span class="text-[var(--accent-text)]">gold.dim_route</span> <span class="text-[var(--terminal-ink)]">d</span><br />
    <span class="text-[var(--terminal-ink)]">&nbsp;&nbsp;</span><span class="text-[var(--primary)]">USING</span> <span class="text-[var(--terminal-ink)]">(provider_id, route_id)</span><br />
    <span class="text-[var(--primary)]">WHERE</span> <span class="text-[var(--terminal-ink)]">f.delay_seconds</span> <span class="text-[var(--primary)]">IS NOT NULL</span><br />
    <span class="text-[var(--primary)]">GROUP BY</span> <span class="text-[var(--terminal-ink)]">d.route_short_name</span><br />
    <span class="text-[var(--primary)]">ORDER BY</span> <span class="text-[var(--terminal-ink)]">vehicles</span> <span class="text-[var(--primary)]">DESC</span><br />
    <span class="text-[var(--primary)]">LIMIT</span> <span class="text-[var(--accent-text)]">5</span><span class="text-[var(--terminal-ink)]">;</span>
  </div>

  <!-- Results: a real <table>, styled like a SQL client result grid (psql
       look: vertical column separators + a header rule, numbers right-
       aligned). Semantic table = real column/row structure for screen
       readers too. data-testid="sql-result-row" stays on each <tr>. -->
  <div class="mt-4 border-t border-[var(--border-subtle)] pt-3">
    <table class="w-full border-collapse text-xs md:text-sm" data-testid="sql-results">
      <thead>
        <tr>
          <th scope="col" class="border-b border-r border-[var(--border-subtle)] px-2 py-1 text-left font-normal text-[var(--terminal-ink-muted)]">{columnRoute}</th>
          <th scope="col" class="border-b border-r border-[var(--border-subtle)] px-2 py-1 text-right font-normal text-[var(--terminal-ink-muted)]">{columnAvgDelay}</th>
          <th scope="col" class="border-b border-[var(--border-subtle)] px-2 py-1 text-right font-normal text-[var(--terminal-ink-muted)]">{columnVehicles}</th>
        </tr>
      </thead>
      <tbody>
        {#each rows as row (row.route)}
          <tr data-testid="sql-result-row">
            <td class="border-b border-r border-[var(--border-subtle)] px-2 py-1 text-[var(--terminal-ink)]">{row.route}</td>
            <td class="border-b border-r border-[var(--border-subtle)] px-2 py-1 text-right text-[var(--accent-text)]">{row.avgDelayS}</td>
            <td class="border-b border-[var(--border-subtle)] px-2 py-1 text-right text-[var(--terminal-ink)]">{row.vehicles}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="mt-2.5 text-caption text-[var(--terminal-ink-muted)]" data-testid="sql-meta">
      {metaCaption}
    </div>
  </div>
</div>

