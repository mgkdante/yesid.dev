<!--
  MetricDisplay — big number + label stat combo.
  Brand primitive: replaces 6+ scattered metric implementations.
-->
<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  export interface MetricDisplayProps extends HTMLAttributes<HTMLDivElement> {
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
    class?: string;
  }

  let {
    value,
    label,
    sublabel,
    size = 'md',
    labelBelow = false,
    class: className,
    ...restProps
  }: MetricDisplayProps = $props();

  const valueClass = {
    sm: 'text-subheading',
    md: 'text-heading',
    lg: 'text-title',
  } as const;
</script>

<div class={cn("flex flex-col", className)} data-slot="metric-display" {...restProps}>
  {#if !labelBelow}
    <span class="label-metric">{label}</span>
  {/if}
  <span
    class="metric-value font-heading font-extrabold leading-none text-primary {valueClass[size]}"
  >{value}</span>
  {#if labelBelow}
    <span class="mt-2 label-metric">{label}</span>
  {/if}
  {#if sublabel}
    <span class="mt-1 font-mono text-caption text-[var(--muted-foreground)]">{sublabel}</span>
  {/if}
</div>
