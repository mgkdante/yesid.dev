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
    /** Optional test id for the tag */
    tagTestId?: string;
    /** Optional status text */
    status?: string;
    /** Optional footer metric items */
    footer?: TerminalFooterItem[];
    /** Remove body padding (when children manage their own) */
    noPadding?: boolean;
    /** Optional titlebar actions */
    actions?: Snippet;
    /** Terminal body content */
    children: Snippet;
    class?: string;
  }

  let {
    title,
    tag,
    tagTestId,
    status,
    footer,
    noPadding = false,
    actions,
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
    <div class="terminal-titlebar-main">
      <span class="flex items-center gap-1" data-slot="signal-head" aria-hidden="true">
        <StatusDot color="green" pulse size="sm" />
        <StatusDot color="caution" size="sm" class="opacity-25" />
        <StatusDot color="stop" size="sm" class="opacity-25" />
      </span>
      <span class="terminal-title">{title}</span>
      {#if tag}
        <span class="terminal-tag" data-testid={tagTestId}>{tag}</span>
      {/if}
    </div>
    {#if status || actions}
      <div class="terminal-titlebar-actions">
        {#if status}
          <span class="terminal-status">{status}</span>
        {/if}
        {#if actions}
          {@render actions()}
        {/if}
      </div>
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
          <span class="terminal-footer-label">{item.label}</span>
          <span class="terminal-footer-value">{item.value}</span>
        </div>
      {/each}
    </div>
  {/if}
</div>
