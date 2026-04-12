<!--
  CardBase — card with hover/glow foundation.
  Brand primitive: replaces 12+ scattered card patterns.
  Glow is opt-in (glow={true}) — applies use:cursorGlow with auto-injected overlay.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';

  export interface CardBaseProps {
    /** Enable brand-glow-hover effect */
    hover?: boolean;
    /** Enable cursor-following glow (opt-in, uses cursorGlow action) */
    glow?: boolean;
    /** Enable interactive pointer cursor */
    interactive?: boolean;
    /** Inner padding */
    padding?: 'sm' | 'md' | 'lg';
    /** Renders as <a> when set */
    href?: string;
    /** Card content */
    children: Snippet;
  }

  let {
    hover = true,
    glow = false,
    interactive = false,
    padding = 'md',
    href,
    children,
    ...rest
  }: CardBaseProps & Record<string, unknown> = $props();

  const paddingClass = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  } as const;

  function glowAction(node: HTMLElement) {
    if (glow) {
      return cursorGlow(node);
    }
    return { destroy() {} };
  }
</script>

{#if href}
  <a
    {href}
    class="card group {paddingClass[padding]}"
    class:brand-glow-hover={hover}
    class:cursor-pointer={interactive}
    use:glowAction
    {...rest}
  >{@render children()}</a>
{:else}
  <div
    class="card group {paddingClass[padding]}"
    class:brand-glow-hover={hover}
    class:cursor-pointer={interactive}
    use:glowAction
    {...rest}
  >{@render children()}</div>
{/if}

<style>
  .card {
    position: relative;
    overflow: hidden;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--bg-surface);
  }
</style>
