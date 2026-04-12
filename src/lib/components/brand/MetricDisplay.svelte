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
    /** Place label below value instead of above */
    labelBelow?: boolean;
  }

  let {
    value,
    label,
    sublabel,
    size = 'md',
    labelBelow = false,
  }: MetricDisplayProps = $props();

  const valueClass = {
    sm: 'text-heading',
    md: 'text-title',
    lg: 'text-display',
  } as const;
</script>

<div class="flex flex-col">
  {#if !labelBelow}
    <span class="label-metric">{label}</span>
  {/if}
  <span
    class="font-heading font-extrabold leading-none text-brand-primary {valueClass[size]}"
  >{value}</span>
  {#if labelBelow}
    <span class="mt-2 label-metric">{label}</span>
  {/if}
  {#if sublabel}
    <span class="mt-1 font-mono text-caption text-[var(--text-dim)]">{sublabel}</span>
  {/if}
</div>
