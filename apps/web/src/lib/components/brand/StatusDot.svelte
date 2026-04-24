<!--
  StatusDot — pulsing status indicator.
  Brand primitive: replaces 8+ scattered LED dot implementations.
-->
<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  export interface StatusDotProps extends HTMLAttributes<HTMLSpanElement> {
    /** Dot color */
    color?: 'orange' | 'green';
    /** Enable pulse-glow animation */
    pulse?: boolean;
    /** Dot size */
    size?: 'sm' | 'md';
    /**
     * Halo ring in muted card color — for dots overlaid on muted surfaces (e.g. headshot corner).
     * Uses CSS outline so it composes with box-shadow-based pulse animation.
     */
    ring?: boolean;
    class?: string;
  }

  let {
    color = 'orange',
    pulse = false,
    size = 'sm',
    ring = false,
    class: className,
    ...restProps
  }: StatusDotProps = $props();

  const sizeMap = { sm: 'size-1.5', md: 'size-2.5' } as const;
</script>

<span
  class={cn(sizeMap[size], "inline-block shrink-0 rounded-full", pulse ? 'led-pulse' : '', ring ? 'outline outline-[3px] outline-[var(--muted)]' : '', color === 'orange' ? 'bg-primary' : 'bg-[var(--success)]', className)}
  data-slot="status-dot"
  aria-hidden="true"
  {...restProps}
></span>
