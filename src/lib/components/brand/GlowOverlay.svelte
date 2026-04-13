<!--
  GlowOverlay — cursor-following radial gradient overlay.
  Brand primitive: standalone version of the auto-injected overlay.
  For most cases, prefer `use:cursorGlow` which auto-injects this.
-->
<script lang="ts">
  import { cn } from '$lib/utils.js';
  import type { HTMLAttributes } from 'svelte/elements';

  export interface GlowOverlayProps extends HTMLAttributes<HTMLDivElement> {
    /** Glow intensity 0-1. Default: 0.06 */
    intensity?: number;
    class?: string;
  }

  let { intensity = 0.06, class: className, ...restProps }: GlowOverlayProps = $props();
</script>

<div
  class={cn("pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100", className)}
  data-slot="glow-overlay"
  style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgb(var(--primary-rgb) / {intensity}), transparent 60%);"
  aria-hidden="true"
  {...restProps}
></div>
