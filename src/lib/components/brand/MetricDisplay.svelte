<!--
  MetricDisplay — big number + label stat combo.
  Brand primitive: replaces 6+ scattered metric implementations.
-->
<script lang="ts">
  export interface MetricDisplayProps {
    /** The metric value (e.g. "5+", "99.9%", "30+") */
    value: string;
    /** Primary label */
    label: string;
    /** Optional secondary description */
    sublabel?: string;
    /** Display size */
    size?: 'sm' | 'md' | 'lg';
  }

  let {
    value,
    label,
    sublabel,
    size = 'md',
  }: MetricDisplayProps = $props();

  const valueClass = {
    sm: 'text-heading',
    md: 'text-title',
    lg: 'text-display',
  } as const;
</script>

<div class="flex flex-col">
  <span class="label-metric">{label}</span>
  <span
    class="font-heading font-extrabold leading-none text-brand-primary {valueClass[size]}"
  >{value}</span>
  {#if sublabel}
    <span class="mt-1 font-mono text-caption text-[var(--text-dim)]">{sublabel}</span>
  {/if}
</div>
