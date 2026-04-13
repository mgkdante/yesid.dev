<!--
  StatusDot — pulsing status indicator.
  Brand primitive: replaces 8+ scattered LED dot implementations.
-->
<script lang="ts">
  export interface StatusDotProps {
    /** Dot color */
    color?: 'orange' | 'green';
    /** Enable pulse-glow animation */
    pulse?: boolean;
    /** Dot size */
    size?: 'sm' | 'md';
  }

  let {
    color = 'orange',
    pulse = false,
    size = 'sm',
  }: StatusDotProps = $props();

  const sizeMap = { sm: 'size-1.5', md: 'size-2.5' } as const;
</script>

<span
  class="{sizeMap[size]} inline-block shrink-0 rounded-full {pulse ? 'led-pulse' : ''}"
  class:bg-primary={color === 'orange'}
  class:bg-[var(--success)]={color === 'green'}
  aria-hidden="true"
></span>
