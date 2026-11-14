<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '@yesid/ui/button';
	import Pause from '@lucide/svelte/icons/pause';
	import Play from '@lucide/svelte/icons/play';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { animationPaused, restoreAnimationPause, setAnimationPaused } from '#lib/state/animation-pause.ts';
	const words = {
		en: ['Pause animation', 'Play animation'],
		fr: ["Mettre l'animation en pause", "Relancer l'animation"],
		es: ['Pausar la animación', 'Reanudar la animación'],
	}[getLocale()];
	const label = $derived(words[$animationPaused ? 1 : 0]);
	onMount(restoreAnimationPause);
</script>

<div class="animation-control absolute bottom-0 right-0">
	<Button variant="ghost" size="icon-tap" class="p-0 text-muted-foreground"
		aria-label={label} title={label}
		onclick={() => setAnimationPaused(!$animationPaused)}>
		{#if $animationPaused}
			<Play class="size-4" aria-hidden="true" data-testid="animation-play-icon" />
		{:else}
			<Pause class="size-4" aria-hidden="true" data-testid="animation-pause-icon" />
		{/if}
	</Button>
</div>

<style>
	@media (prefers-reduced-motion: reduce) { .animation-control { display: none; } }
</style>
