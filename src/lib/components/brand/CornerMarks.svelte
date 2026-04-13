<!--
  CornerMarks — blueprint corner tick marks.
  Brand primitive: replaces scattered corner mark implementations.
  Place inside a relative-positioned parent.
-->
<script lang="ts">
  export interface CornerMarksProps {
    /** Arm length — sm: 12px, md: 32px */
    size?: 'sm' | 'md';
    /** Mark opacity (0-1) */
    opacity?: number;
  }

  let {
    size = 'sm',
    opacity = 0.4,
  }: CornerMarksProps = $props();

  const armMap = { sm: 12, md: 32 } as const;
  const arm = $derived(armMap[size]);
</script>

<div class="corner-marks" style="--arm: {arm}px; --mark-opacity: {opacity};" aria-hidden="true">
  <span class="mark mark-tl"></span>
  <span class="mark mark-tr"></span>
  <span class="mark mark-bl"></span>
  <span class="mark mark-br"></span>
</div>

<style>
  .corner-marks {
    position: absolute;
    inset: 0;
    pointer-events: none;
    z-index: calc(var(--z-content) + 1);
  }

  .mark {
    position: absolute;
    width: var(--arm);
    height: var(--arm);
  }

  .mark::before,
  .mark::after {
    content: '';
    position: absolute;
    background: var(--primary);
    opacity: var(--mark-opacity);
  }

  /* Horizontal arm */
  .mark::before { width: var(--arm); height: 1px; }
  /* Vertical arm */
  .mark::after { width: 1px; height: var(--arm); }

  .mark-tl { top: -1px; left: -1px; }
  .mark-tl::before { top: 0; left: 0; }
  .mark-tl::after { top: 0; left: 0; }

  .mark-tr { top: -1px; right: -1px; }
  .mark-tr::before { top: 0; right: 0; }
  .mark-tr::after { top: 0; right: 0; }

  .mark-bl { bottom: -1px; left: -1px; }
  .mark-bl::before { bottom: 0; left: 0; }
  .mark-bl::after { bottom: 0; left: 0; }

  .mark-br { bottom: -1px; right: -1px; }
  .mark-br::before { bottom: 0; right: 0; }
  .mark-br::after { bottom: 0; right: 0; }
</style>
