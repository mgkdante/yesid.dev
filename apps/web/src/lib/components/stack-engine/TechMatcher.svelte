<!--
  TechMatcher (slice-29, go2/w5 taste round 2) — compose-as-matching,
  never free-form wiring.

  Chips for every committed tech, grouped by STACK_LAYERS render order via
  tech.layer (layerless techs under a trailing 'more' group). Matching is AND
  (picked ⊆ stack) per stack-matching.ts — more picks narrow, never widen.

  Taste round 2 — SHAPE-FIRST matrix (operator verdict):
  - The composed BUILD SHAPE is the PRIMARY teaching surface: an always-on
    card (any pick → card) that re-reads the 15-cell layer-coverage matrix
    (stack-shape.ts) on every pick — which layers the picks cover, what they
    can do TOGETHER (per-tech `enables` roster), and what a complete build
    still needs. Zero-match is no longer an edge case — it's just the card
    with zero bonus rail under it.
  - AND-matched archetypes are the BONUS rail of "known builds" — recipes
    already drawn. Stable grid: the FULL catalogue renders ALWAYS, ruled-out
    cards gray out (never vanish) and print the AND lesson.
  - ONE fixed teach-line slot above the chips (hover/focus/pick — last trigger
    wins) explains what a tech does and which layer it lives in.
  - A live build counter (the single aria-live element) narrates the
    narrowing: "{n} picks → {m} known builds".
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
	import { composeStackShape, readShape } from './stack-shape';
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
	const shapeHref = $derived(
		'/contact?bp=' + encodeBlueprint({ archetype: null, techs: [...engine.pickedTechs] }),
	);

	// ── Build shape (taste round 2) — the ALWAYS-ON primary teaching surface.
	// Every pick re-reads the 15-cell layer-coverage matrix: heading names the
	// covered layers, the reading says what they do TOGETHER, the roster
	// grounds it in the actual picks (enables lines), and the next-step line
	// names what a complete build still needs.
	const shape = $derived(composeStackShape([...engine.pickedTechs], techStackItems));
	const shapeHeading = $derived(
		shape.present.length > 0
			? `Your build: ${shape.present.join(' + ')} covered`
			: 'Your build: no layers covered yet',
	);
	const shapeReading = $derived(`that's ${readShape(shape.present)}.`);
	const an = (layer: string) => (layer === 'interface' || layer === 'infra' ? 'an' : 'a');
	const shapeNext = $derived(
		shape.missing.length === 0
			? "nothing missing — this one's ready to build."
			: `add ${shape.missing.map((l) => `${an(l)} ${l} layer`).join(' + ')} and this becomes a working product.`,
	);
	/** Picked techs in STACK_LAYERS order (stable within a layer), with enables. */
	const layerRank = new Map<string, number>(
		STACK_LAYERS.map((l, i) => [l as string, i] as const),
	);
	const shapeRoster = $derived(
		[...engine.pickedTechs]
			.map((id) => techById.get(id))
			.filter((t): t is Tech => Boolean(t))
			.sort((a, b) => (layerRank.get(a.layer ?? '') ?? 99) - (layerRank.get(b.layer ?? '') ?? 99))
			.map((t) => ({
				id: t.id,
				name: t.name,
				enables: t.enables ? resolveLocale(t.enables, locale) : '',
			})),
	);

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
			<span>{engine.archetypes.length} known builds on the board — tap parts to narrow</span>
		{:else if zeroMatch}
			<span>{engine.pickedTechs.size} pick{engine.pickedTechs.size === 1 ? '' : 's'} → no known build — your shape's below</span>
		{:else}
			<span>{engine.pickedTechs.size} pick{engine.pickedTechs.size === 1 ? '' : 's'} → {engine.matches.length} known build{engine.matches.length === 1 ? '' : 's'}<span class="counter-suffix"> · each pick narrows, never widens</span></span>
		{/if}
	</p>

	<div class="match-rail">
		{#if hasPicks}
			<!-- Build shape (taste round 2) — THE primary teaching surface,
			     present from the first pick onward; archetype cards below are
			     bonus "known builds". Exactly ONE <a> (href formula pinned by
			     unit + e2e suites). The reading re-keys on coverage so it
			     settles in with a micro-pop (fun pass, <400ms → SAFE-ALWAYS). -->
			<div class="build-shape" data-testid="build-shape">
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
				<p class="shape-heading">{shapeHeading}</p>
				{#key shape.present.join('+')}
					<p class="shape-reading">{shapeReading}</p>
				{/key}
				<ul class="shape-roster">
					{#each shapeRoster as part (part.id)}
						<li>
							<!-- The separator lives in the expression: Svelte trims a text
							     node's leading whitespace at the element boundary, which
							     ate the space ("PostgreSQL— stores…"). -->
							<span class="roster-name">{part.name}</span>{#if part.enables}<span class="roster-enables">{` — ${part.enables}`}</span>{/if}
						</li>
					{/each}
				</ul>
				<p class="shape-next">{shapeNext}</p>
				<a class="shape-link" href={shapeHref}>Take this combo with you →</a>
				<p class="shape-whisper">if you ever want help building it, I'm around.</p>
			</div>

			<p class="rail-label" data-testid="known-builds-label">
				{#if zeroMatch}
					no drawn recipe uses all of these yet — the shape above is already yours
				{:else}
					known builds — recipes I've already drawn with these parts
				{/if}
			</p>
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

	/* go2/w5 §3: fixed teach slot — reserved height (1 line wide / 2 lines
	   below 1024px) so a longer line never reflows the chips below it.
	   Taste round 2 (fit audit): the 2-line reservation now covers up to
	   1023px — full teach lines (~115ch) wrap once between 768–1023px and
	   used to push the chips down on hover. */
	.tech-teach-line {
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.5;
		color: var(--engine-teach-ink);
		margin: 0;
		min-height: calc(12px * 1.5);
	}

	@media (max-width: 1023px) {
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

	/* Taste round 2: the build-shape card — the ever-present companion. */
	.build-shape {
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

	/* Fun pass: a dot turning solid settles in with the chips' own pop —
	   the keyframe re-runs each time a layer flips hollow → solid.
	   User-initiated, tiny, <400ms → SAFE-ALWAYS (pressBounce precedent). */
	.shape-dot:not(.shape-dot-missing) {
		animation: chip-settle 180ms var(--ease-bounce);
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

	.shape-heading {
		font-family: var(--font-mono);
		font-size: 13px;
		font-weight: 700;
		color: var(--foreground);
		margin: 0;
	}

	/* The matrix reading — re-keyed per coverage change, eases in 2px. */
	.shape-reading {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--foreground);
		margin: 0;
		animation: shape-note-in 180ms ease-out;
	}

	@keyframes shape-note-in {
		from {
			opacity: 0;
			translate: 0 2px;
		}
		to {
			opacity: 1;
			translate: 0 0;
		}
	}

	.shape-roster {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		margin: 0;
		padding: 0;
		font-family: var(--font-mono);
		font-size: 11px;
	}

	.roster-name {
		color: var(--secondary-foreground);
	}

	.roster-enables {
		color: var(--engine-teach-ink);
	}

	.shape-next {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--engine-teach-ink);
		margin: 0;
	}

	.shape-link {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
		width: fit-content;
	}

	.shape-whisper {
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--engine-teach-ink);
		margin: 0;
	}

	/* The bonus rail's nameplate — bridges shape card and known builds. */
	.rail-label {
		grid-column: 1 / -1;
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 0.5px;
		color: var(--muted-foreground);
		margin: 0.25rem 0 0;
	}
</style>
