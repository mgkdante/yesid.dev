<!--
  StickyPanel — sidebar panel with sticky positioning and brand border.
  Brand primitive: replaces 4+ scattered sticky sidebar implementations.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface StickyPanelProps {
    /** CSS top offset for sticky positioning */
    top?: string;
    /** Panel content */
    children: Snippet;
  }

  let {
    top = '6rem',
    children,
  }: StickyPanelProps = $props();
</script>

<aside class="panel scrollbar-hidden" style="top: {top};">
  {@render children()}
</aside>

<style>
  .panel {
    position: sticky;
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    background: var(--bg-surface);
    padding: 1.25rem;
    overflow-y: auto;
    max-height: calc(100vh - 8rem);
  }
</style>
