<script lang="ts">
 import { onMount } from 'svelte';
 import { Button } from '@yesid/ui/button';
 import { getLocale } from '#lib/utils/locale-context.ts';
 import { animationPaused, restoreAnimationPause, setAnimationPaused } from '#lib/state/animation-pause.ts';
 const words = {
  en: ['Pause animation', 'Play animation'],
  fr: ["Mettre l'animation en pause", "Relancer l'animation"],
  es: ['Pausar la animación', 'Reanudar la animación'],
 }[getLocale()];
 onMount(restoreAnimationPause);
</script>

<div class="animation-control relative z-10 p-3">
 <Button variant="outline" class="min-h-11 min-w-11 whitespace-normal" aria-pressed={$animationPaused}
  onclick={() => setAnimationPaused(!$animationPaused)}>
  {words[$animationPaused ? 1 : 0]}
 </Button>
</div>

<style>
 @media (prefers-reduced-motion: reduce) { .animation-control { display: none; } }
</style>
