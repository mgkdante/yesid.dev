<!--
  TerminalChrome — terminal window with title bar and optional footer.
  Brand primitive: replaces 4+ scattered terminal implementations.
  Composes StatusDot and HazardStripe.
-->
<script lang="ts">
  import type { Snippet } from 'svelte';
  import StatusDot from './StatusDot.svelte';
  import HazardStripe from './HazardStripe.svelte';

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
    /** Terminal body content */
    children: Snippet;
  }

  let {
    title,
    tag,
    status,
    footer,
    children,
  }: TerminalChromeProps = $props();
</script>

<div class="terminal">
  <!-- Title bar -->
  <div class="terminal-titlebar">
    <div class="flex items-center gap-2">
      <StatusDot color="orange" pulse size="sm" />
      <span class="font-mono text-caption text-[var(--text-secondary)]">{title}</span>
      {#if tag}
        <span class="rounded-sm bg-[var(--bg-elevated)] px-1.5 py-0.5 font-mono text-[0.625rem] text-[var(--text-muted)]">{tag}</span>
      {/if}
    </div>
    {#if status}
      <span class="font-mono text-caption text-[var(--text-dim)]">{status}</span>
    {/if}
  </div>

  <!-- Accent stripe -->
  <HazardStripe size="sm" />

  <!-- Body -->
  <div class="terminal-body">
    {@render children()}
  </div>

  <!-- Footer -->
  {#if footer && footer.length > 0}
    <div class="terminal-footer">
      {#each footer as item}
        <div class="flex gap-2">
          <span class="font-mono text-caption text-[var(--text-dim)]">{item.label}</span>
          <span class="font-mono text-caption text-[var(--text-secondary)]">{item.value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .terminal {
    border-radius: var(--radius-lg);
    border: 1px solid var(--border);
    background: var(--bg-terminal);
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
    padding: 0.75rem 1rem;
  }

  .terminal-footer {
    display: flex;
    gap: 1.5rem;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--border-subtle);
  }
</style>
