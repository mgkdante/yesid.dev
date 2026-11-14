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

<div class="animation-control mt-2 flex shrink-0 justify-end">
	<Button variant="outline" size="sm" class="h-auto min-h-6 min-w-6 max-w-full whitespace-normal px-2 py-1"
		onclick={() => setAnimationPaused(!$animationPaused)}>
		{words[$animationPaused ? 1 : 0]}
	</Button>
</div>

<style>
	@media (prefers-reduced-motion: reduce) { .animation-control { display: none; } }
</style>
