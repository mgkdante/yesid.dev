<!--
  TechMatcher (slice-29, go2/w5 layered learning) — compose-as-matching,
  never free-form wiring.

  Chips for every committed tech, grouped by STACK_LAYERS render order via
  tech.layer (layerless techs under a trailing 'more' group). Matching is AND
  (picked ⊆ stack) per stack-matching.ts — more picks narrow, never widen.

  go2/w5 teaching layer:
  - ONE fixed teach-line slot above the chips (hover/focus/pick — last trigger
    wins) explains what a tech does and which layer it lives in.
  - A live build counter (the single aria-live element) narrates the
    narrowing: "{n} picks → {m} possible builds".
  - The rail renders the FULL catalogue ALWAYS — stable grid, gray-out not
    vanish. Ruled-out cards print the AND lesson ("ruled out — X isn't in
    this recipe"); dimming IS the narrowing.
  - Zero-match composes a generic project SHAPE from the picked layers
    (stack-shape.ts) before the warm CTA — a teaching moment, never a dead end.
-->
<script lang="ts">
	import { STACK_LAYERS } from '@repo/shared/schemas';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { pressBounce } from '$lib/motion/actions';
	import { StatusDot } from '$lib/components/brand';
	import { techStackItems } from '$lib/content/tech-stack';
	import { encodeBlueprint } from '$lib/utils/blueprint-param';
	import { LAYER_TEACHING } from './layer-teaching';
	import { composeStackShape } from './stack-shape';
	import type { EngineState } from './engine-state.svelte';

	type Tech = (typeof techStackItems)[number];

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

	const techById = new Map(techStackItems.map((t) => [t.id, t]));
	const archetypesBySlug = $derived(new Map(engine.archetypes.map((a) => [a.slug, a])));
	const matchBySlug = $derived(new Map(engine.matches.map((m) => [m.slug, m])));
	const hasPicks = $derived(engine.pickedTechs.size > 0);
	const zeroMatch = $derived(hasPicks && engine.matches.length === 0);
	/** matches[0] — closest to complete (fewest missing, AND contract). */
	const topMatchSlug = $derived(engine.matches[0]?.slug ?? null);
	const zeroMatchHref = $derived(
		'/contact?bp=' + encodeBlueprint({ archetype: null, techs: [...engine.pickedTechs] }),
	);
	/** Zero-match teaching: the picked layers composed into a project shape. */
	const shape = $derived(composeStackShape([...engine.pickedTechs], techStackItems));
	const shapeLine = $derived.by(() => {
		if (shape.missing.length === 0) {
			return "That covers all four layers — a complete shape. I just haven't drawn this exact recipe yet.";
		}
		const needs = `A working build usually still needs ${shape.missing.join(' + ')} — ${LAYER_TEACHING[shape.missing[0]]}.`;
		if (shape.present.length === 0) return needs; // defensive: layerless-only picks
		return `You've got ${shape.present.join(' + ')} parts. ${needs}`;
	});

	// ── Teach line (go2/w5 §3) — ONE fixed slot, last trigger wins. ─────────
	const TEACH_EMPTY = "tap a part — I'll tell you what it does.";
	let teachLine = $state(TEACH_EMPTY);

	function teach(tech: Tech): void {
		const enables = tech.enables ? resolveLocale(tech.enables, locale) : '';
		const layerLine = tech.layer ? LAYER_TEACHING[tech.layer] : null;
		if (enables && layerLine) {
			teachLine = `${tech.name} — ${enables}. lives in ${tech.layer}: ${layerLine}`;
		} else if (layerLine) {
			teachLine = `${tech.name} lives in ${tech.layer}: ${layerLine}`;
		} else if (enables) {
			teachLine = `${tech.name} — ${enables}.`;
		} else {
			teachLine = tech.name;
		}
	}

	/** Tap = pick (no new tap targets inside chips); toggling ON also teaches. */
	function onChipClick(tech: Tech): void {
		engine.toggleTech(tech.id);
		if (engine.pickedTechs.has(tech.id)) teach(tech);
	}

	/** The AND lesson per ruled-out card: first pick (insertion order) outside the stack. */
	function firstConflictName(slug: string): string {
		const archetype = archetypesBySlug.get(slug);
		if (!archetype) return '';
		const stackSet = new Set(archetype.tech.map((l) => l.id));
		const conflict = [...engine.pickedTechs].find((id) => !stackSet.has(id));
		return conflict ? (techById.get(conflict)?.name ?? conflict) : '';
	}
</script>

<div class="tech-matcher" data-testid="tech-matcher">
	<!-- Fixed teach slot — min-height reserved so it never reflows the chips.
	     Plain visible text, deliberately NOT aria-live (hover spam). -->
	<p class="tech-teach-line" data-testid="tech-teach-line">{teachLine}</p>

	{#each groups as group (group.key)}
		<div class="layer-group" data-testid={`tech-layer-group-${group.key}`}>
			<span
				class="layer-label"
				style:--tick-color={group.key === 'more' ? 'var(--primary)' : `var(--layer-${group.key})`}
			>{group.label}</span>
			<div class="layer-chips">
				{#each group.items as tech (tech.id)}
					<button
						type="button"
						class="tech-chip tap-press"
						class:tech-chip-picked={engine.pickedTechs.has(tech.id)}
						aria-pressed={engine.pickedTechs.has(tech.id)}
						data-testid={`tech-chip-${tech.id}`}
						use:pressBounce
						onclick={() => onChipClick(tech)}
						onmouseenter={() => teach(tech)}
						onfocus={() => teach(tech)}
					>
						<span class="chip-label">{tech.name}</span>
					</button>
				{/each}
			</div>
		</div>
	{/each}

	<!-- Live build counter (go2/w5 §5) — departures-board row; THE single
	     aria-live element of the matcher (the rail re-announcing whole cards
	     was noise; the counter is the meaningful delta). -->
	<p class="build-counter" data-testid="build-counter" aria-live="polite">
		<span class="counter-prompt" aria-hidden="true">~</span>
		<StatusDot color="orange" pulse />
		{#if !hasPicks}
			<span>{engine.archetypes.length} recipes on the board — tap parts to narrow</span>
		{:else if zeroMatch}
			<span>{engine.pickedTechs.size} pick{engine.pickedTechs.size === 1 ? '' : 's'} → no drawn recipe — see below</span>
		{:else}
			<span>{engine.pickedTechs.size} pick{engine.pickedTechs.size === 1 ? '' : 's'} → {engine.matches.length} possible build{engine.matches.length === 1 ? '' : 's'}<span class="counter-suffix"> · each pick narrows, never widens</span></span>
		{/if}
	</p>

	<div class="match-rail">
		{#if zeroMatch}
			<!-- Zero-match = teaching moment (go2/w5 §6): compose the project
			     shape over STACK_LAYERS, then the warm CTA. Exactly ONE <a>
			     (href pinned by unit + e2e suites). -->
			<div class="zero-match" data-testid="zero-match-cta">
				<div class="shape-strip" aria-hidden="true">
					{#each STACK_LAYERS as layer (layer)}
						<span class="shape-cell" style:--shape-color={`var(--layer-${layer})`}>
							<span
								class="shape-dot"
								class:shape-dot-missing={!shape.present.includes(layer)}
							></span>
							<span class="shape-dot-name">{layer}</span>
						</span>
					{/each}
				</div>
				<p class="zero-match-heading">No drawn recipe uses all of these — but the shape is real.</p>
				<p class="zero-match-shape">{shapeLine}</p>
				<a class="zero-match-link" href={zeroMatchHref}>Take this combo with you →</a>
				<p class="zero-match-whisper">if you ever want help building it, I'm around.</p>
			</div>
		{/if}

		<!-- Stable grid (go2/w5 §5): the FULL catalogue renders ALWAYS, in
		     engine.archetypes order — cards never move or disappear; dimming
		     IS the narrowing. -->
		{#each engine.archetypes as archetype (archetype.slug)}
			{@const match = matchBySlug.get(archetype.slug)}
			{@const total = archetype.tech.length}
			{#if match}
				<button
					type="button"
					class="match-card tap-press"
					class:match-card-full={match.coverage === 1}
					data-testid={`match-card-${archetype.slug}`}
					use:pressBounce
					onclick={() => engine.selectArchetype(archetype.slug)}
				>
					<span class="match-title">{resolveLocale(archetype.title, locale)}</span>
					{#if archetype.slug === topMatchSlug}
						<span class="match-tag">
							{match.missing.length > 0 ? 'closest to complete' : 'complete — tap to draw it'}
						</span>
					{/if}
					<span class="match-parts">
						{match.matched.length} of {total} parts — {match.missing.length} to go
					</span>
					<span class="match-hook">{resolveLocale(archetype.hook, locale)}</span>
				</button>
			{:else if hasPicks}
				<button
					type="button"
					class="compose-card compose-card-out"
					data-testid={`compose-card-${archetype.slug}`}
					disabled
					aria-disabled="true"
				>
					<span class="match-title">{resolveLocale(archetype.title, locale)}</span>
					<span class="match-reason">
						ruled out — {firstConflictName(archetype.slug)} isn't in this recipe
					</span>
					<span class="match-hook">{resolveLocale(archetype.hook, locale)}</span>
				</button>
			{:else}
				<button
					type="button"
					class="compose-card compose-card-idle tap-press"
					data-testid={`compose-card-${archetype.slug}`}
					use:pressBounce
					onclick={() => engine.selectArchetype(archetype.slug)}
				>
					<span class="match-title">{resolveLocale(archetype.title, locale)}</span>
					<span class="match-parts">{total} parts</span>
					<span class="match-hook">{resolveLocale(archetype.hook, locale)}</span>
				</button>
			{/if}
		{/each}
	</div>
</div>

<style>
	.tech-matcher {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* go2/w5 §3: fixed teach slot — reserved height (1 line desktop / 2 lines
	   mobile) so a longer line never reflows the chips below it. */
	.tech-teach-line {
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.5;
		color: var(--engine-teach-ink);
		margin: 0;
		min-height: calc(12px * 1.5);
	}

	@media (max-width: 767px) {
		.tech-teach-line {
			min-height: calc(12px * 1.5 * 2);
		}
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

	/* GO-w2t5 cute pass, recolored go2/w5 §8: the tick before each layer label
	   now speaks that layer's color ('more' stays --primary). The printed
	   label name rides alongside — hue is never the sole carrier. */
	.layer-label::before {
		content: '';
		display: inline-block;
		width: 12px;
		height: 1px;
		background: var(--tick-color, var(--primary));
		vertical-align: middle;
		margin-right: 6px;
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

	/* go2/w5 §5: departures-board counter row. */
	.build-counter {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 12px;
		font-variant-numeric: tabular-nums;
		color: var(--foreground);
		margin: 0;
	}

	.counter-prompt {
		color: var(--foreground);
	}

	.counter-suffix {
		color: var(--engine-teach-ink);
	}

	.match-rail {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.match-card,
	.compose-card {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.35rem;
		padding: 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius, 6px);
		background: var(--background);
		text-align: left;
		transition: border-color 150ms ease, opacity 150ms ease;
	}

	.match-card,
	.compose-card-idle {
		cursor: pointer;
	}

	.match-card:hover,
	.compose-card-idle:hover,
	.match-card-full {
		border-color: var(--primary);
	}

	/* GO-w2t5 cute pass: same soft brand glow as the goal cards (shadow-only
	   → SAFE-ALWAYS) so both modes speak one hover language. */
	.match-card:hover,
	.compose-card-idle:hover {
		box-shadow: 0 6px 18px color-mix(in srgb, var(--primary) 12%, transparent);
	}

	/* go2/w5 §5: ruled out — grayed, not gone. The stable grid makes the AND
	   narrowing visible; no hover lift, no pointer. */
	.compose-card-out {
		opacity: 0.45;
		border-color: var(--border-subtle);
		cursor: default;
	}

	.compose-card-out .match-title,
	.compose-card-out .match-hook {
		color: var(--muted-foreground);
	}

	.match-title {
		font-family: var(--font-heading);
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--foreground);
	}

	.match-tag {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--primary);
		border: 1px solid var(--primary);
		border-radius: 999px;
		padding: 0.1rem 0.5rem;
	}

	.match-parts {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--secondary-foreground);
	}

	.match-reason {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--muted-foreground);
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

	/* go2/w5 §6: the composition made visible — present layers solid,
	   missing layers hollow; names printed under each dot. */
	.shape-strip {
		display: flex;
		gap: 1.25rem;
	}

	.shape-cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.25rem;
	}

	.shape-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--shape-color);
	}

	.shape-dot-missing {
		background: transparent;
		box-shadow: inset 0 0 0 1.5px var(--shape-color);
	}

	.shape-dot-name {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--engine-teach-ink);
	}

	.zero-match-heading {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--foreground);
		margin: 0;
	}

	.zero-match-shape {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--engine-teach-ink);
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

	.zero-match-whisper {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--engine-teach-ink);
		margin: 0;
	}
</style>
