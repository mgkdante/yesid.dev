<script lang="ts">
 let { lat, lng, src, via, dst, node }: { lat: string; lng: string; src: string; via: string; dst: string; node: string; status?: string } = $props();
</script>

<div data-testid="manifesto-edge-right" class="manifesto__edge-right" aria-hidden="true" data-decorative-edge>
 <span class="manifesto__coord">{lat}</span>
 <span class="manifesto__coord">{lng}</span>
 <span class="manifesto__separator-line"></span>
 <span class="manifesto__coord">{src}</span>
 <span class="manifesto__coord">{via}</span>
 <span class="manifesto__coord">{dst}</span>
 <span class="manifesto__separator-line"></span>
 <span class="manifesto__coord">{node}</span>
</div>

<style>
 .manifesto__edge-right {
  position: absolute;
  top: calc(100% + 12px);
  /* The centered pill row anchors height; reserve the hatch/roundel column at the right edge. */
  right: calc(50% - 50vw + 284px);
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: max-content;
  max-width: calc(100vw - 16px);
  z-index: calc(var(--z-content) + 2);
 }
 .manifesto__coord { font-family: var(--font-mono); font-size: 9px; line-height: 1.5; letter-spacing: 1px; color: var(--muted-foreground); text-transform: uppercase; white-space: nowrap; }
 .manifesto__separator-line { width: 24px; height: 1px; background: color-mix(in srgb, var(--primary) 20%, transparent); margin-block: 4px; }
 @media (max-width: 640px) {
  .manifesto__edge-right { top: calc(100% + 8px); right: calc(50% - 50vw + 8px); display: grid; grid-template-columns: repeat(2, max-content); gap: 0 12px; }
  .manifesto__coord { line-height: 1.3; }
  .manifesto__separator-line { display: none; }
 }
 @media (max-height: 840px) {
  /* The compact 35.1px readout fits in the existing 40px headline-to-pills gap. */
  .manifesto__edge-right { top: -38px; display: grid; grid-template-columns: repeat(2, max-content); gap: 0 12px; }
  .manifesto__coord { line-height: 1.3; }
  .manifesto__separator-line { display: none; }
 }
</style>
