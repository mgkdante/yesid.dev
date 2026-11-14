<script lang="ts">
 import { onMount, flushSync } from 'svelte';
 let { lat, lng, src, via, dst, node }: { lat: string; lng: string; src: string; via: string; dst: string; node: string; status?: string } = $props();
 let element: HTMLDivElement;
 type Layout = 'stacked' | 'dense' | 'compact' | 'tight';
 let layout = $state<Layout>('stacked');
 let placed = $state(false);
 function findSpace(box: DOMRect, region: DOMRect, obstacles: DOMRect[], preferred: { left: number; top: number }, gap: number, phase: string) {
  const xs = phase === 'below' || phase === 'right' ? [preferred.left] : [preferred.left, ...obstacles.flatMap(r => [r.left - box.width - gap, r.right + gap]), region.left + gap];
  const ys = [preferred.top, region.top + gap, region.bottom - box.height - gap, ...obstacles.flatMap(r => [r.top - box.height - gap, r.bottom + gap])];
  const clear = (left: number, top: number) => left >= region.left + gap && left + box.width <= region.right - gap && top >= region.top + gap && top + box.height <= region.bottom - gap
   && (phase !== 'below' || top >= preferred.top) && (phase !== 'right-half' || left >= region.left + region.width / 2)
   && obstacles.every(r => left + box.width + gap <= r.left || left >= r.right + gap || top + box.height + gap <= r.top || top >= r.bottom + gap);
  return xs.flatMap(left => ys.map(top => ({ left, top }))).filter(p => clear(p.left, p.top))
   .sort((a, b) => Math.abs(a.top - preferred.top) + Math.abs(a.left - preferred.left) * 2 - Math.abs(b.top - preferred.top) - Math.abs(b.left - preferred.left) * 2)[0];
 }
 onMount(() => {
  const section = element.parentElement!;
  const content = section.querySelector<HTMLElement>('.manifesto__content')!;
  const decorations = [...section.querySelectorAll<HTMLElement>('[data-decorative-edge], .manifesto__stripe, .manifesto__badge, .manifesto__beck-line, .manifesto__chevrons')].filter(el => el !== element);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let previousSize = { width: 0, height: 0 };
  const place = () => {
   frame = 0;
   const region = section.getBoundingClientRect();
   const reading = [...content.querySelectorAll<HTMLElement>('.manifesto__prompt, .manifesto__statement, .manifesto__pills')].map(el => el.getBoundingClientRect());
   const obstacles = [...reading, ...decorations.map(el => el.getBoundingClientRect())].filter(r => r.width > 0 && r.height > 0);
   const current = element.getBoundingClientRect();
   // Scrolling moves the whole section. Keep a clear slot without reflowing each layout on every frame.
   if (placed && region.width === previousSize.width && region.height === previousSize.height
    && current.left >= region.left + 2 && current.right <= region.right - 2 && current.top >= region.top + 2 && current.bottom <= region.bottom - 2
    && obstacles.every(r => current.right + 2 <= r.left || current.left >= r.right + 2 || current.bottom + 2 <= r.top || current.top >= r.bottom + 2)) return;
   previousSize = { width: region.width, height: region.height };
   const top = Math.max(...reading.map(r => r.bottom)) + 12;
   element.style.left = ''; element.style.right = '';
   const boxes = (['stacked', 'dense', 'compact', 'tight'] as const).map(mode => { flushSync(() => { layout = mode; }); return { mode, box: element.getBoundingClientRect() }; });
   const phases = region.width < 1024 ? ['below', 'right', 'right-half', 'anywhere'] : ['right', 'right-half', 'anywhere'];
   for (const phase of phases) for (const { mode, box } of boxes) {
    const point = findSpace(box, region, obstacles, { left: box.left, top }, mode === 'tight' ? 2 : 4, phase);
    if (!point) continue;
    flushSync(() => { layout = mode; });
    element.style.left = `${point.left - region.left}px`; element.style.right = 'auto'; element.style.top = `${point.top - region.top}px`;
    placed = true;
    return;
   }
   placed = false;
  };
  const schedule = () => { if (!frame) frame = requestAnimationFrame(place); };
  const resize = new ResizeObserver(schedule);
  for (const target of [section, content, element, ...decorations]) resize.observe(target);
  addEventListener('resize', schedule); addEventListener('scroll', schedule, { passive: true }); motion.addEventListener('change', schedule);
  schedule();
  return () => { resize.disconnect(); cancelAnimationFrame(frame); removeEventListener('resize', schedule); removeEventListener('scroll', schedule); motion.removeEventListener('change', schedule); };
 });
</script>

<div bind:this={element} data-testid="manifesto-edge-right" class="manifesto__edge-right" class:compact={layout === 'compact' || layout === 'tight'} class:dense={layout === 'dense'} class:tight={layout === 'tight'} data-placed={String(placed)} aria-hidden="true" data-decorative-edge>
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
 .dense { gap: 4px; }
 .tight .manifesto__coord { line-height: 1.3; }
 .compact { display: grid; grid-template-columns: repeat(2, max-content); gap: 6px 12px; }
 .tight { row-gap: 0; }
 .compact .manifesto__separator-line { display: none; }
 @media (min-width: 1024px) { .compact { grid-template-columns: repeat(3, max-content); } }
 @media (max-width: 640px) { .manifesto__edge-right { right: 8px; } }
</style>
