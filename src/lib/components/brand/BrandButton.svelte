<!--
  BrandButton — primary/ghost CTA in 3 sizes.
  Brand primitive: replaces 7+ scattered button implementations.
  D20: 3 sizes (sm/md/lg). D21: primary text always var(--bg-primary).
-->
<script lang="ts">
  import type { Snippet } from 'svelte';

  export interface BrandButtonProps {
    /** Visual style */
    variant?: 'primary' | 'ghost';
    /** Button size */
    size?: 'sm' | 'md' | 'lg';
    /** Renders as <a> when set */
    href?: string;
    /** Button content */
    children: Snippet;
  }

  let {
    variant = 'primary',
    size = 'md',
    href,
    children,
    ...rest
  }: BrandButtonProps & Record<string, unknown> = $props();

  const sizeClass = {
    sm: 'px-5 py-2.5 text-small',
    md: 'px-6 py-3 text-body',
    lg: 'px-8 py-4 text-body-lg',
  } as const;
</script>

{#if href}
  <a
    {href}
    class="btn {sizeClass[size]}"
    class:btn-primary={variant === 'primary'}
    class:btn-ghost={variant === 'ghost'}
    {...rest}
  >{@render children()}</a>
{:else}
  <button
    class="btn {sizeClass[size]}"
    class:btn-primary={variant === 'primary'}
    class:btn-ghost={variant === 'ghost'}
    {...rest}
  >{@render children()}</button>
{/if}

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border-radius: var(--radius-lg);
    font-weight: 600;
    transition: background-color var(--duration-normal) var(--ease-default),
                border-color var(--duration-normal) var(--ease-default),
                color var(--duration-normal) var(--ease-default),
                transform var(--duration-normal) var(--ease-default),
                box-shadow var(--duration-normal) var(--ease-default);
    cursor: pointer;
  }

  .btn-primary {
    background-color: var(--brand-primary);
    color: var(--bg-primary);
    border: 1px solid var(--brand-primary);
  }
  .btn-primary:hover {
    background-color: var(--brand-primary-hover);
    border-color: var(--brand-primary-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-glow-sm);
  }

  .btn-ghost {
    background: transparent;
    color: var(--text-primary);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .btn:focus-visible {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
  }
</style>
