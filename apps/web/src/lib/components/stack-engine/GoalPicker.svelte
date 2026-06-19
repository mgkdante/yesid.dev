<!--
  GoalPicker (slice-29) — goal-mode entry: one card per archetype.
  Title + hook resolve like sibling components (resolveLocale(…, locale));
  clicking a card hands the slug to the engine → blueprint view.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { pressBounce } from '$lib/motion/actions';
	import type { EngineState } from './engine-state.svelte';

	let { engine }: { engine: EngineState } = $props();

	// Card meta: "{n} parts · tap to draw" — code-owned, localized.
	const PARTS_WORD = { en: 'parts', fr: 'morceaux' };
	const TAP_TO_DRAW = { en: 'tap to draw', fr: 'tape pour dessiner' };
	const partsWord = $derived(resolveLocale(PARTS_WORD, locale));
	const tapToDraw = $derived(resolveLocale(TAP_TO_DRAW, locale));
</script>

<div class="goal-picker" data-testid="goal-picker">
	{#each engine.archetypes as archetype (archetype.slug)}
		<button
			type="button"
			class="archetype-card tap-press"
			data-testid={`archetype-card-${archetype.slug}`}
			use:pressBounce
			onclick={() => engine.selectArchetype(archetype.slug)}
		>
			<span class="card-title">{resolveLocale(archetype.title, locale)}</span>
			<span class="card-hook">{resolveLocale(archetype.hook, locale)}</span>
			<span class="card-meta">{archetype.tech.length} {partsWord} · {tapToDraw}</span>
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
		/* GO-w2t5 cute pass: soft brand glow under the lift — shadow-only →
		   SAFE-ALWAYS, pairs with the committed pressBounce on tap. */
		box-shadow: 0 6px 18px color-mix(in srgb, var(--glow) 12%, transparent);
	}

	/* go2/w5 legibility pass: card type steps up one full rung of the site
	   scale — the title reads like a card headline (--text-heading), hook and
	   meta follow on tokens. */
	.card-title {
		font-family: var(--font-heading);
		font-size: var(--text-heading);
		font-weight: 700;
		color: var(--foreground);
	}

	.card-hook {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--primary);
	}

	.card-meta {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}
</style>
