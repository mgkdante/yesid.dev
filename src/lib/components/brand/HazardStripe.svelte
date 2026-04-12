<!--
  HazardStripe — repeating diagonal stripe bar.
  Brand primitive: replaces 11+ scattered hazard stripe implementations.
-->
<script lang="ts">
  export interface HazardStripeProps {
    /** Stripe width — sm: 6px, md: 8px, lg: 12px */
    size?: 'sm' | 'md' | 'lg';
    /** Stripe angle in degrees */
    angle?: number;
    /** Optional label displayed alongside the stripe */
    label?: string;
  }

  let {
    size = 'md',
    angle = -45,
    label,
  }: HazardStripeProps = $props();

  const stripeWidth = { sm: 6, md: 8, lg: 12 } as const;
  const heightClass = { sm: 'h-0.5', md: 'h-1', lg: 'h-2' } as const;

  const gradient = $derived(
    `repeating-linear-gradient(${angle}deg, var(--brand-accent) 0px, var(--brand-accent) ${stripeWidth[size]}px, var(--bg-primary) ${stripeWidth[size]}px, var(--bg-primary) ${stripeWidth[size] * 2}px)`
  );
</script>

{#if label}
  <div class="flex items-center gap-3">
    <div
      class="{heightClass[size]} flex-1 rounded-sm"
      style="background: {gradient};"
      aria-hidden="true"
    ></div>
    <span class="label-section shrink-0">{label}</span>
    <div
      class="{heightClass[size]} flex-1 rounded-sm"
      style="background: {gradient};"
      aria-hidden="true"
    ></div>
  </div>
{:else}
  <div
    class="{heightClass[size]} w-full rounded-sm"
    style="background: {gradient};"
    aria-hidden="true"
  ></div>
{/if}
