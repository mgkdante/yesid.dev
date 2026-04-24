<!--
  TerminalChrome — terminal window with title bar and optional footer.
  Brand primitive: replaces 4+ scattered terminal implementations.
  Composes StatusDot and HazardStripe.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import StatusDot from './StatusDot.svelte';
  import { Separator } from '$lib/components/ui/separator';
  import { cn } from '$lib/utils';
  import { scrollChain } from '$lib/motion/actions/scrollChain.js';

  export interface TerminalFooterItem {
    label: string;
    value: string;
  }

  export interface TerminalChromeProps {
    /** Terminal window title */
    title: string;
    /** Optional tag label next to title */
    tag?: string;
    /** Optional status text */
    status?: string;
    /** Optional footer metric items */
    footer?: TerminalFooterItem[];
    /** Remove body padding (when children manage their own) */
    noPadding?: boolean;
    /** Terminal body content */
    children: Snippet;
    class?: string;
  }

  let {
    title,
    tag,
    status,
    footer,
    noPadding = false,
    children,
    class: className = '',
    ...rest
  }: TerminalChromeProps & Record<string, unknown> = $props();
</script>

<div class={cn("terminal", className)} data-slot="terminal-chrome" {...rest}>
  <!-- Title bar -->
  <div class="terminal-titlebar">
    <div class="flex items-center gap-2">
      <StatusDot color="orange" pulse size="sm" />
      <span class="font-mono text-caption text-[var(--secondary-foreground)]">{title}</span>
      {#if tag}
        <span class="rounded-sm bg-[var(--popover)] px-1.5 py-0.5 font-mono text-[0.625rem] text-[var(--muted-foreground)]">{tag}</span>
      {/if}
    </div>
    {#if status}
      <span class="font-mono text-caption text-[var(--dim-foreground)]">{status}</span>
    {/if}
  </div>

  <!-- Accent stripe -->
  <Separator variant="hazard" hazardSize="sm" />

  <!-- Body -->
  <div class="terminal-body" class:no-pad={noPadding} use:scrollChain>
    {@render children()}
  </div>

  <!-- Footer -->
  {#if footer && footer.length > 0}
    <div class="terminal-footer">
      {#each footer as item}
        <div class="flex gap-2">
          <span class="font-mono text-caption text-[var(--dim-foreground)]">{item.label}</span>
          <span class="font-mono text-caption text-[var(--secondary-foreground)]">{item.value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .terminal {
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--terminal);
    overflow: hidden;
  }

  .terminal-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--border-subtle);
  }

  .terminal-body {
    flex: 1;
    padding: 0.75rem 1rem;
    overflow-y: auto;
  }
  .terminal-body.no-pad {
    padding: 0;
  }

  .terminal-footer {
    display: flex;
    gap: 1.5rem;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--border-subtle);
  }
</style>
