<!--
  TechMatcher (slice-29) — compose-as-matching, never free-form wiring.

  Chips for every committed tech, grouped by STACK_LAYERS render order via
  tech.layer (layerless techs under a trailing 'more' group). Picks rank the
  archetypes through engine.matches; a zero-match combo gets the unusual-combo
  CTA with a blueprint-prefilled contact link. Never a blank state: the chip
  groups always render, and picked-with-no-match shows the CTA card.
-->
<script lang="ts">
	import { STACK_LAYERS } from '@repo/shared/schemas';
	import { resolveLocale } from '$lib/utils/locale';
	import { pressBounce } from '$lib/motion/actions';
	import { techStackItems } from '$lib/content/tech-stack';
	import { encodeBlueprint } from '$lib/utils/blueprint-param';
	import type { EngineState } from './engine-state.svelte';

	let { engine }: { engine: EngineState } = $props();

	// Layer groups in render order; layerless techs trail under 'more'.
	const groups: { key: string; label: string; items: typeof techStackItems }[] = [
		...STACK_LAYERS.map((layer) => ({
			key: layer as string,
			label: layer as string,
			items: techStackItems.filter((t) => t.layer === layer),
		})),
		{
			key: 'more',
			label: 'more',
			items: techStackItems.filter(
				(t) => !t.layer || !(STACK_LAYERS as readonly string[]).includes(t.layer),
			),
		},
	].filter((g) => g.items.length > 0);

	const archetypesBySlug = $derived(new Map(engine.archetypes.map((a) => [a.slug, a])));
	const zeroMatch = $derived(engine.pickedTechs.size > 0 && engine.matches.length === 0);
	const zeroMatchHref = $derived(
		'/contact?bp=' + encodeBlueprint({ archetype: null, techs: [...engine.pickedTechs] }),
	);
</script>

<div class="tech-matcher" data-testid="tech-matcher">
	{#each groups as group (group.key)}
		<div class="layer-group" data-testid={`tech-layer-group-${group.key}`}>
			<span class="layer-label">{group.label}</span>
			<div class="layer-chips">
				{#each group.items as tech (tech.id)}
					<button
						type="button"
						class="tech-chip tap-press"
						class:tech-chip-picked={engine.pickedTechs.has(tech.id)}
						aria-pressed={engine.pickedTechs.has(tech.id)}
						data-testid={`tech-chip-${tech.id}`}
						use:pressBounce
						onclick={() => engine.toggleTech(tech.id)}
					>
						<span class="chip-label">{tech.name}</span>
					</button>
				{/each}
			</div>
		</div>
	{/each}

	<div class="match-rail" aria-live="polite">
		{#if zeroMatch}
			<div class="zero-match" data-testid="zero-match-cta">
				<p class="zero-match-text">Unusual combo — I like it. Tell me what you're after.</p>
				<a class="zero-match-link" href={zeroMatchHref}>Tell me what you're after →</a>
			</div>
		{:else}
			{#each engine.matches as match (match.slug)}
				{@const archetype = archetypesBySlug.get(match.slug)}
				{#if archetype}
					<button
						type="button"
						class="match-card tap-press"
						class:match-card-full={match.coverage === 1}
						data-testid={`match-card-${match.slug}`}
						use:pressBounce
						onclick={() => engine.selectArchetype(match.slug)}
					>
						<span class="match-title">
							{resolveLocale(archetype.title, 'en')} — {match.matched.length}/{archetype.tech.length}
						</span>
						<span class="match-hook">{resolveLocale(archetype.hook, 'en')}</span>
					</button>
				{/if}
			{/each}
		{/if}
	</div>
</div>

<style>
	.tech-matcher {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.layer-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.layer-label {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--muted-foreground);
	}

	.layer-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.tech-chip {
		font-family: var(--font-mono);
		font-size: 12px;
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--background);
		color: var(--secondary-foreground);
		cursor: pointer;
		transition: border-color 150ms ease, background-color 150ms ease, color 150ms ease;
	}

	.tech-chip:hover {
		border-color: var(--primary);
	}

	.tech-chip-picked {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-foreground);
	}

	.chip-label {
		display: inline-block;
	}

	/* GO-w2t5: select settle — one micro pop on pick. User-initiated, <400ms,
	   tiny element → SAFE-ALWAYS. Runs on the inner span so it composes with
	   pressBounce's scale tween on the button (same `scale` property, two
	   different elements — no fight). Toggle-OFF just decays color (existing
	   transition). */
	.tech-chip-picked .chip-label {
		animation: chip-settle 180ms var(--ease-bounce);
	}

	@keyframes chip-settle {
		0% { scale: 1; }
		50% { scale: 1.06; }
		100% { scale: 1; }
	}

	.match-rail {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.match-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius, 6px);
		background: var(--background);
		text-align: left;
		cursor: pointer;
		transition: border-color 150ms ease;
	}

	.match-card:hover,
	.match-card-full {
		border-color: var(--primary);
	}

	.match-title {
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--foreground);
	}

	.match-hook {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--muted-foreground);
	}

	.zero-match {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px dashed var(--primary);
		border-radius: var(--radius, 6px);
	}

	.zero-match-text {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--foreground);
		margin: 0;
	}

	.zero-match-link {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
		width: fit-content;
	}
</style>
