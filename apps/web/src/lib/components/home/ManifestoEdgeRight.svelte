<script lang="ts">
 import { onMount, flushSync } from 'svelte';
 let { lat, lng, src, via, dst, node }: { lat: string; lng: string; src: string; via: string; dst: string; node: string; status?: string } = $props();
 let element: HTMLDivElement;
 let compact = $state(false);
 let placed = $state(false);
 onMount(() => {
  const section = element.parentElement!;
  const content = section.querySelector<HTMLElement>('.manifesto__content')!;
  const rail = section.querySelector<HTMLElement>('[data-testid="manifesto-edge-bottom"]')!;
  const ticks = section.querySelector<HTMLElement>('[data-testid="manifesto-edge-top"]')!;
  let frame = 0;
  const place = () => {
   frame = 0;
   const region = section.getBoundingClientRect();
   const obstacles = [...content.querySelectorAll<HTMLElement>('.manifesto__prompt, .manifesto__statement, .manifesto__pills')].map(el => el.getBoundingClientRect());
   const after = Math.max(...obstacles.map(box => box.bottom)) - region.top + 12;
   const end = rail.getBoundingClientRect().top - region.top - 12;
   flushSync(() => { compact = false; });
   if (element.getBoundingClientRect().height > end - after) flushSync(() => { compact = true; });
   const height = element.getBoundingClientRect().height;
   let top = after;
   // Short windows can use the free upper edge instead of covering the reading area.
   if (top + height > end) top = ticks.getBoundingClientRect().bottom - region.top + 12;
   const clear = obstacles.every(box => top + height <= box.top - region.top || top >= box.bottom - region.top);
   element.style.top = `${top}px`;
   placed = clear && top >= 0 && top + height <= end;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(place); };
  const resize = new ResizeObserver(schedule);
  for (const target of [section, content, element, rail, ticks]) resize.observe(target);
  addEventListener('resize', schedule);
  addEventListener('scroll', schedule, { passive: true });
  schedule();
  return () => { resize.disconnect(); cancelAnimationFrame(frame); removeEventListener('resize', schedule); removeEventListener('scroll', schedule); };
 });
</script>

<div bind:this={element} data-testid="manifesto-edge-right" class="manifesto__edge-right" class:compact data-placed={String(placed)} aria-hidden="true" data-decorative-edge>
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
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: calc(var(--z-content) + 2);
  max-width: calc(100% - 32px);
  visibility: hidden;
 }
 .manifesto__edge-right[data-placed='true'] { visibility: visible; }
 .manifesto__coord { font-family: var(--font-mono); font-size: 9px; line-height: 1.5; letter-spacing: 1px; color: var(--muted-foreground); text-transform: uppercase; white-space: nowrap; }
 .manifesto__separator-line { width: 24px; height: 1px; background: color-mix(in srgb, var(--primary) 20%, transparent); margin-block: 4px; }
 .compact { display: grid; grid-template-columns: repeat(2, max-content); gap: 6px 12px; }
 .compact .manifesto__separator-line { display: none; }
 @media (min-width: 1024px) { .compact { grid-template-columns: repeat(3, max-content); } }
 @media (max-width: 640px) { .manifesto__edge-right { right: 8px; } }
</style>
