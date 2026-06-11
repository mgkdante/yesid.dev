<!--
  GoalPicker (slice-29) — goal-mode entry: one card per archetype.
  Title + hook resolve like sibling components (resolveLocale(…, 'en'));
  clicking a card hands the slug to the engine → blueprint view.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils/locale';
	import type { EngineState } from './engine-state.svelte';

	let { engine }: { engine: EngineState } = $props();
</script>

<div class="goal-picker" data-testid="goal-picker">
	{#each engine.archetypes as archetype (archetype.slug)}
		<button
			type="button"
			class="archetype-card"
			data-testid={`archetype-card-${archetype.slug}`}
			onclick={() => engine.selectArchetype(archetype.slug)}
		>
			<span class="card-title">{resolveLocale(archetype.title, 'en')}</span>
			<span class="card-hook">{resolveLocale(archetype.hook, 'en')}</span>
			<span class="card-meta">{archetype.tech.length} parts · tap to draw</span>
		</button>
	{/each}
</div>

<style>
	.goal-picker {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1rem;
	}

	.archetype-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.5rem;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: var(--radius, 6px);
		background: var(--background);
		text-align: left;
		cursor: pointer;
		transition: border-color 150ms ease, transform 150ms ease;
	}

	.archetype-card:hover {
		border-color: var(--primary);
		transform: translateY(-2px);
	}

	.card-title {
		font-family: var(--font-heading);
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--foreground);
	}

	.card-hook {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--primary);
	}

	.card-meta {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}
</style>
