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
  <!-- Title bar — GO2-W5: three-aspect signal head (proceed lit; caution +
       stop unlit at 25%) replaces the single orange dot. Inline dots, zero
       layout shift. -->
  <div class="terminal-titlebar">
    <div class="flex items-center gap-2">
      <span class="flex items-center gap-1" data-slot="signal-head" aria-hidden="true">
        <StatusDot color="green" pulse size="sm" />
        <StatusDot color="caution" size="sm" class="opacity-25" />
        <StatusDot color="stop" size="sm" class="opacity-25" />
      </span>
      <span class="font-mono text-caption text-[var(--secondary-foreground)]">{title}</span>
      {#if tag}
        <span class="rounded-sm bg-[var(--accent-surface)] px-1.5 py-0.5 font-mono text-[0.625rem] text-[var(--accent-text)]">{tag}</span>
      {/if}
    </div>
    {#if status}
      <span class="font-mono text-caption text-[var(--terminal-ink-muted)]">{status}</span>
    {/if}
  </div>

  <!-- Accent stripe -->
  <Separator variant="hazard" hazardSize="sm" />

  <!-- Body -->
  <div class="terminal-body" class:no-pad={noPadding} use:scrollChain>
    {@render children()}
  </div>

  <!-- Footer — GO2-W5 departure board: values speak the wayfinding voice
       (accent-text; "PROCHAIN DÉPART / À L'HEURE" energy). -->
  {#if footer && footer.length > 0}
    <div class="terminal-footer">
      {#each footer as item}
        <div class="flex gap-2">
          <span class="font-mono text-caption text-[var(--terminal-ink-muted)]">{item.label}</span>
          <span class="font-mono text-caption text-[var(--accent-text)]">{item.value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* GO2-W5 INTERLOCKING terminal: dark = signal-box black; light = warm
     CREAM CONSOLE (not stuck-dark, not a white div). border-strong reads as
     the console chassis edge; titlebar/footer get the chrome strip. */
  .terminal {
    display: flex;
    flex-direction: column;
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-strong);
    background: var(--terminal);
    overflow: hidden;
  }

  .terminal-titlebar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 0.75rem;
    background: var(--terminal-chrome);
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
    background: var(--terminal-chrome);
    border-top: 1px solid var(--border-subtle);
  }
</style>
