<!--
  StickyPanel — sidebar panel with sticky positioning and brand border.
  Brand primitive: replaces 4+ scattered sticky sidebar implementations.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/utils';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';

  export interface StickyPanelProps {
    /** CSS top offset for sticky positioning */
    top?: string;
    /** Panel content */
    children: Snippet;
    class?: string;
  }

  let {
    top = '6rem',
    children,
    class: className = '',
    ...rest
  }: StickyPanelProps & Record<string, unknown> = $props();
</script>

<div class={cn("panel scrollbar-hidden", className)} data-slot="sticky-panel" use:scrollChain style="top: {top};" {...rest}>
  {@render children()}
</div>

<style>
  .panel {
    position: sticky;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--muted);
    padding: 1.25rem;
    overflow-y: auto;
    max-height: calc(100dvh - 8rem);
  }
</style>
