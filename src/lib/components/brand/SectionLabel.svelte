<!--
  SectionLabel — mono uppercase label in 3 variants.
  Brand primitive: replaces 25+ scattered label patterns.
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  export interface SectionLabelProps extends HTMLAttributes<HTMLSpanElement> {
    /** Label text */
    text: string;
    /** Visual style variant */
    variant?: 'section' | 'station' | 'metric';
    /** Text alignment */
    align?: 'left' | 'center';
    class?: string;
  }

  let {
    text,
    variant = 'section',
    align = 'left',
    class: className,
    ...restProps
  }: SectionLabelProps = $props();

  const variantClass = {
    section: 'label-section',
    station: 'label-station',
    metric: 'label-metric',
  } as const;
</script>

<span
  class={cn(variantClass[variant], align === 'center' ? 'text-center block' : '', className)}
  data-slot="section-label"
  {...restProps}
>{text}</span>
