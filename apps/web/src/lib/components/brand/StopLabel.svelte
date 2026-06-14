<!--
  StopLabel — metro stop marker with pulsing LED dot.
  Brand primitive: replaces 10 scattered stop-label implementations in About bento cards.
-->
<script lang="ts">
  import { cn } from '$lib/utils';
  import type { HTMLAttributes } from 'svelte/elements';

  export interface StopLabelProps extends HTMLAttributes<HTMLDivElement> {
    /** Stop number (e.g. "01", "02") */
    stop: string;
    /** Stop name */
    label: string;
    class?: string;
  }

  let { stop, label, class: className, ...restProps }: StopLabelProps = $props();
</script>

<div class={cn("stop-label", className)} data-slot="stop-label" {...restProps}><span class="stop-label-num">STOP {stop}</span> · {label}</div>

<style>
  .stop-label {
    font-family: var(--font-mono);
    font-size: var(--text-micro);
    letter-spacing: 2px;
    color: var(--muted-foreground);
    position: relative;
    padding-left: 16px;
    text-transform: uppercase;
  }

  /* GO2-W5 wayfinding plate: the stop digits speak the yellow voice
     (STM-style station numbering, accent-text = AA-computed amber ink). */
  .stop-label-num {
    color: var(--accent-text);
  }

  .stop-label::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--primary);
    box-shadow: 0 0 6px 2px rgb(var(--primary-rgb) / 0.6);
    animation: pulse-glow 2s ease-in-out infinite;
  }

  /* GO2-W5: in daylight the LED sits on a signal-head target plate so the
     lamp reads against paper. */
  :global([data-theme='light']) .stop-label::before,
  :global(.theme-light) .stop-label::before {
    outline: 2px solid var(--lamp-bezel);
    outline-offset: 0px;
  }

  @media (prefers-reduced-motion: reduce) {
    .stop-label::before {
      animation: none;
    }
  }
</style>
