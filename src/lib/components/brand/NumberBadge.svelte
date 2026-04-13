<!--
  NumberBadge — zero-padded number in colored circle.
  Brand primitive: replaces 3+ numbered circle implementations.
-->
<script lang="ts">
  export interface NumberBadgeProps {
    /** Number to display (zero-padded to 2 digits) */
    value: number;
    /** Badge background color — defaults to brand-primary */
    color?: string;
    /** Enable sonar ping animation around badge */
    sonar?: boolean;
  }

  let {
    value,
    color,
    sonar = false,
  }: NumberBadgeProps = $props();

  const display = $derived(String(value).padStart(2, '0'));
</script>

{#if sonar}
  <span class="badge-wrapper">
    <span class="sonar-ring" aria-hidden="true"></span>
    <span
      class="badge"
      style={color ? `background-color: ${color}` : ''}
      aria-hidden="true"
    >{display}</span>
  </span>
{:else}
  <span
    class="badge"
    style={color ? `background-color: ${color}` : ''}
    aria-hidden="true"
  >{display}</span>
{/if}

<style>
  .badge-wrapper {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .badge {
    display: flex;
    height: 1.75rem;
    width: 1.75rem;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-pill);
    font-family: var(--font-mono);
    font-size: var(--text-caption);
    font-weight: 700;
    background-color: var(--primary);
    color: var(--background);
    position: relative;
    z-index: var(--z-content);
  }

  .sonar-ring {
    position: absolute;
    inset: -4px;
    border-radius: var(--radius-pill);
    border: 2px solid var(--primary);
    opacity: 0;
    animation: sonar-ping 2s ease-out infinite;
  }

  @keyframes sonar-ping {
    0% { transform: scale(0.8); opacity: 0.6; }
    100% { transform: scale(1.4); opacity: 0; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sonar-ring { animation: none; opacity: 0; }
  }
</style>
