<!--
  GlowOverlay — cursor-following radial gradient overlay.
  Brand primitive: standalone version of the auto-injected overlay.
  For most cases, prefer `use:cursorGlow` which auto-injects this.
-->
<script lang="ts">
  export interface GlowOverlayProps {
    /** Glow intensity 0-1. Default: 0.06 */
    intensity?: number;
  }

  let { intensity = 0.06 }: GlowOverlayProps = $props();
</script>

<div
  class="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
  style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgb(var(--brand-primary-rgb) / {intensity}), transparent 60%);"
  aria-hidden="true"
></div>
