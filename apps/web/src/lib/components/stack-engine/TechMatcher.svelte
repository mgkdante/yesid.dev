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
	import { tick } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { gsap } from 'gsap';
	import { Flip } from 'gsap/Flip';
	import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { pressBounce } from '$lib/motion/actions';
	import { StatusDot } from '$lib/components/brand';
	import { techStackItems } from '$lib/content/tech-stack';
	import { encodeBlueprint } from '$lib/utils/blueprint-param';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { LAYER_TEACHING } from './layer-teaching';
	import {
		AVAILABILITY_LINE,
		composePhrase,
		composeStackShape,
		JOURNEY_STEPS,
		layerArticle,
		readShape,
	} from './stack-shape';
	import ShapeBlueprint from './ShapeBlueprint.svelte';
	import ProductPreview from './ProductPreview.svelte';
	import type { EngineState } from './engine-state.svelte';

	// Idempotent (Engine.svelte registers it too) — the card morph below uses
	// Flip directly; everything stays inside the engine's async chunk.
	gsap.registerPlugin(Flip);

	type Tech = (typeof techStackItems)[number];

	let { engine, animate = true }: { engine: EngineState; animate?: boolean } = $props();

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

	// ── Build shape (taste round 2; round 3 makes it a DRAWING) — the
	// ALWAYS-ON primary teaching surface. Every pick re-reads the 15-cell
	// layer-coverage matrix: the mini-blueprint draws it (solid picks, ghost
	// layers), the heading names the covered layers, the reading says what
	// they do TOGETHER, the roster grounds it in the actual picks (enables
	// lines), and the next-step line names what a complete build still needs.
	const shape = $derived(composeStackShape([...engine.pickedTechs], techStackItems));
	const shapeHeading = $derived(
		shape.present.length > 0
			? `Your build: ${shape.present.join(' + ')} covered`
			: 'Your build: no layers covered yet',
	);
	const shapeReading = $derived(`that's ${readShape(shape.present)}.`);
	const shapeNext = $derived(
		shape.missing.length === 0
			? "nothing missing — this one's ready to build."
			: `add ${shape.missing.map((l) => `${layerArticle(l)} ${l} layer`).join(' + ')} and this becomes a working product.`,
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
				layer: t.layer,
				enables: t.enables ? resolveLocale(t.enables, locale) : '',
			})),
	);
	/** The drawable picks — roster order, layered only (defensive: a layerless
	 *  pick has no blueprint row; it still lists in the roster). */
	const shapePicked = $derived(
		shapeRoster
			.filter((p): p is typeof p & { layer: StackLayer } =>
				Boolean(p.layer && (STACK_LAYERS as readonly string[]).includes(p.layer)),
			)
			.map(({ id, name, layer }) => ({ id, name, layer })),
	);

	// ── Finale (4c): THE PHRASE BUILDER — the card now LEADS with a
	// market-friendly product sentence composed by the layer grammar
	// (stack-shape.ts); the category line demotes to the kicker above it and
	// the 15-subset reading stays as the supporting teaching line below.
	const shapePhrase = $derived(
		resolveLocale(composePhrase(shapePicked, shape.present), locale),
	);

	const availabilityLine = $derived(resolveLocale(AVAILABILITY_LINE, locale));

	// ── Round 4: 'see your build as a product' — the composed shape gets the
	// same drawing ⇄ product flip as the archetypes. The drawing flip-tags
	// only the VISIBLE variant (wide/stacked are CSS-swapped at 768px) so
	// GSAP Flip never sees duplicate ids.
	let shapeView = $state<'drawing' | 'product'>('drawing');
	let shapeBoardEl: HTMLElement | null = $state(null);
	const wideDrawing = new MediaQuery('(min-width: 768px)');

	// Finale (4c): the guided journey — which stepper station is lit. The
	// fourth (take it with you) is the standing invitation, never 'current'.
	const journeyStep = $derived(!hasPicks ? 0 : shapeView === 'product' ? 2 : 1);

	// The view state outlives the card's {#if hasPicks} block — 'start over'
	// then re-picking must reopen on the DRAWING (the teaching surface), not
	// resurrect a stale product view.
	$effect(() => {
		if (!hasPicks && shapeView !== 'drawing') shapeView = 'drawing';
	});

	async function toggleShapeView(): Promise<void> {
		const next = shapeView === 'drawing' ? 'product' : 'drawing';
		if (!animate) {
			shapeView = next;
			return;
		}
		const state = Flip.getState(
			shapeBoardEl?.querySelectorAll('[data-flip-id]') ?? '[data-flip-id]',
		);
		shapeView = next;
		await tick();
		Flip.from(state, { duration: 0.6, ease: 'power2.inOut', absolute: true, nested: true });
	}

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
	<!-- Finale (4c): the guided journey — a light stepper in the teaching
	     voice. The lit station follows the visitor (pick → read → product);
	     the last is the standing invitation. Numbers + arrows are decorative;
	     the labels carry the meaning. -->
	<ol class="journey-steps" data-testid="engine-stepper" aria-label="How this works">
		{#each JOURNEY_STEPS as step, i (step.en)}
			<li
				class="journey-step"
				class:journey-step-now={i === journeyStep}
				aria-current={i === journeyStep ? 'step' : undefined}
			>
				<span class="journey-step-num" aria-hidden="true">{i + 1}</span>
				{resolveLocale(step, locale)}
			</li>
		{/each}
	</ol>

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
	     was noise; the counter is the meaningful delta). Round 4: the pick
	     tools share the row but live OUTSIDE the live region (announcing
	     button labels on every pick would be noise too). -->
	<div class="counter-row">
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
		{#if hasPicks}
			<!-- Round 4 nav: native buttons (keyboard + SR for free), homey
			     labels; the counter narrates the result of either press. -->
			<div class="pick-tools" data-testid="pick-tools">
				<button
					type="button"
					class="pick-tool"
					data-testid="pick-undo"
					onclick={() => engine.undoLastPick()}
				>
					<span aria-hidden="true">↶</span> undo last pick
				</button>
				<button
					type="button"
					class="pick-tool"
					data-testid="pick-clear"
					onclick={() => engine.clearPicks()}
				>
					<span aria-hidden="true">✕</span> start over
				</button>
			</div>
		{/if}
	</div>

	<div class="match-rail">
		{#if hasPicks}
			<!-- Build shape (taste round 2; round 3: the shape IS a blueprint) —
			     THE primary teaching surface, present from the first pick
			     onward; archetype cards below are bonus "known builds". The
			     mini-blueprint carries the teaching visually (solid picks,
			     ghosted missing layers, dashed wiring); the words support it.
			     Exactly ONE <a> (href formula pinned by unit + e2e suites).
			     The reading re-keys on coverage so it settles in with a
			     micro-pop (fun pass, <400ms → SAFE-ALWAYS). -->
			<div class="build-shape" data-testid="build-shape">
				<div class="shape-head">
					<!-- Finale (4c): the PHRASE leads — a market-friendly product
					     sentence from the layer grammar; the category line
					     demotes to the kicker above it. -->
					<div class="shape-head-text">
						<p class="shape-kicker">{shapeHeading}</p>
						<p class="shape-phrase" data-testid="shape-phrase">{shapePhrase}</p>
					</div>
					{#if shapePicked.length > 0}
						<!-- Round 4: the composed shape gets the archetype payoff
						     too — drawing ⇄ generic product, Flip-morphed. -->
						<button
							type="button"
							class="shape-view-toggle"
							data-testid="shape-view-toggle"
							onclick={toggleShapeView}
						>
							{#if shapeView === 'drawing'}
								see your build as a product <span class="shape-toggle-arrow" aria-hidden="true">→</span>
							{:else}
								<span class="shape-toggle-arrow" aria-hidden="true">←</span> back to the drawing
							{/if}
						</button>
					{/if}
				</div>
				<div class="shape-board" bind:this={shapeBoardEl}>
					<!-- Both variants render; CSS swaps at 768px (bp-pair-list
					     precedent) — wide rows on desktop, the blueprint-layout
					     stacked column on mobile. display:none keeps the hidden
					     one out of the a11y tree; only the VISIBLE one flip-tags
					     (MediaQuery mirrors the CSS breakpoint). -->
					{#if shapeView === 'drawing' || shapePicked.length === 0}
						<div class="shape-drawing shape-drawing-wide">
							<ShapeBlueprint
								picked={shapePicked}
								missing={shape.missing}
								flip={wideDrawing.current}
							/>
						</div>
						<div class="shape-drawing shape-drawing-stacked">
							<ShapeBlueprint
								picked={shapePicked}
								missing={shape.missing}
								stacked
								testid="shape-blueprint-stacked"
								flip={!wideDrawing.current}
							/>
						</div>
					{:else}
						<div class="shape-product" data-testid="shape-product">
							<ProductPreview picks={shapePicked} />
						</div>
					{/if}
					<div class="shape-notes">
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
						<a class="shape-link" data-testid="shape-link" href={shapeHref}>Take this combo with you →</a>
						<!-- Finale (4c): the operator's open door, woven next to the
						     CTA — warm, small, homey; the whole line is the link. -->
						<p class="shape-availability">
							<StatusDot color="green" pulse />
							<a
								class="shape-availability-link"
								data-testid="shape-availability"
								href={localizeHref('/contact', locale)}
							>{availabilityLine}</a>
						</p>
					</div>
				</div>
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

	/* Finale (4c): the journey stepper — quiet mono row, the lit station in
	   brand ink. An affordance, not chrome: no borders, no widget.
	   go2/w5 legibility pass (here and below): every engine size steps up one
	   full rung of the site type scale, via tokens only — caption→small,
	   11px→mono, 10px→caption, 9px→micro. */
	.journey-steps {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem 0.5rem;
		margin: 0;
		padding: 0;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--muted-foreground);
	}

	.journey-step {
		display: inline-flex;
		align-items: center;
		gap: 5px;
	}

	.journey-step:not(:last-child)::after {
		content: '→';
		margin-left: 0.5rem;
		color: var(--border);
	}

	.journey-step-num {
		display: inline-grid;
		place-items: center;
		width: 17px;
		height: 17px;
		border: 1px solid currentColor;
		border-radius: 50%;
		font-size: var(--text-micro);
		line-height: 1;
	}

	.journey-step-now {
		color: var(--primary);
	}

	/* go2/w5 §3: fixed teach slot — reserved height (1 line wide / 2 lines
	   below 1280px) so a longer line never reflows the chips below it.
	   Taste round 2 (fit audit) established the 2-line reservation; the
	   legibility pass moves its ceiling 1023 → 1279: at --text-small (14px
	   mono) a full teach line (~115ch ≈ 966px) wraps once on content columns
	   narrower than ~1050px, so the 1024–1279 range needs the reservation
	   too. */
	.tech-teach-line {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		line-height: 1.5;
		color: var(--engine-teach-ink);
		margin: 0;
		min-height: calc(var(--text-small) * 1.5);
	}

	@media (max-width: 1279px) {
		.tech-teach-line {
			min-height: calc(var(--text-small) * 1.5 * 2);
		}
	}

	.layer-group {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}

	.layer-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
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
		font-size: var(--text-small);
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

	/* go2/w5 §5: departures-board counter row (+ round 4: pick tools beside). */
	.counter-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem 1rem;
		flex-wrap: wrap;
	}

	.build-counter {
		display: flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: var(--text-small);
		font-variant-numeric: tabular-nums;
		color: var(--foreground);
		margin: 0;
	}

	/* Round 4 nav: undo / start-over — quiet text buttons, chip vocabulary. */
	.pick-tools {
		display: flex;
		gap: 0.5rem;
	}

	.pick-tool {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--muted-foreground);
		background: none;
		border: 1px solid var(--border);
		border-radius: 999px;
		padding: 0.25rem 0.7rem;
		cursor: pointer;
		transition: border-color 150ms ease, color 150ms ease;
	}

	.pick-tool:hover {
		color: var(--primary);
		border-color: var(--primary);
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
		font-size: var(--text-subheading);
		font-weight: 700;
		color: var(--foreground);
	}

	.match-tag {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		letter-spacing: 0.5px;
		text-transform: uppercase;
		color: var(--primary);
		border: 1px solid var(--primary);
		border-radius: 999px;
		padding: 0.1rem 0.5rem;
	}

	.match-parts {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--secondary-foreground);
	}

	.match-reason {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--muted-foreground);
	}

	.match-hook {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--muted-foreground);
	}

	/* Taste round 2: the build-shape card — the ever-present companion.
	   Round 3: the card is a drawing board — mini-blueprint beside (desktop)
	   or above (mobile) the supporting words. */
	.build-shape {
		grid-column: 1 / -1;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px dashed var(--primary);
		border-radius: var(--radius, 6px);
	}

	/* Round 3: drawing + notes share the board — drawing keeps its natural
	   width (render scale ≤ 1), the words wrap beside it and drop below when
	   the row gets tight. */
	.shape-board {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-start;
		gap: 1rem 2.5rem;
	}

	.shape-drawing {
		flex: 0 1 auto;
		min-width: 0;
		max-width: 100%;
	}

	.shape-notes {
		flex: 1 1 280px;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* The wide ⇄ stacked swap (bp-pair-list breakpoint): exactly one variant
	   is ever displayed; display:none keeps the other out of the a11y tree. */
	.shape-drawing-wide {
		display: none;
	}

	@media (min-width: 768px) {
		.shape-drawing-wide {
			display: block;
		}

		.shape-drawing-stacked {
			display: none;
		}
	}

	/* Round 4: heading + the product toggle share the card's head row. */
	.shape-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.5rem 1rem;
		flex-wrap: wrap;
	}

	.shape-head-text {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		min-width: 0;
	}

	/* Finale (4c): the category line, demoted to kicker — still teaching the
	   layer names, no longer the headline. */
	.shape-kicker {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		letter-spacing: 0.5px;
		color: var(--muted-foreground);
		margin: 0;
	}

	/* The product sentence — the card now leads with what this build IS in
	   market words; heading voice, sized to carry the card. Legibility pass:
	   it's the headline of the card, so it wears the site's heading token. */
	.shape-phrase {
		font-family: var(--font-heading);
		font-size: var(--text-heading);
		font-weight: 700;
		line-height: 1.3;
		letter-spacing: -0.01em;
		color: var(--foreground);
		margin: 0;
		max-width: 56ch;
	}

	/* Round 4: same pill language as the engine's view toggle — one hover
	   grammar for every blueprint ⇄ product flip. */
	.shape-view-toggle {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--primary);
		background: none;
		border: 1px solid var(--primary);
		border-radius: 999px;
		padding: 0.35rem 0.9rem;
		cursor: pointer;
		transition: background-color 150ms ease, color 150ms ease;
	}

	.shape-view-toggle:hover {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.shape-toggle-arrow {
		display: inline-block;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.shape-view-toggle:hover .shape-toggle-arrow {
		transform: translateX(2px);
	}

	.shape-product {
		flex: 1 1 280px;
		min-width: 0;
		max-width: 540px;
	}

	/* The matrix reading — re-keyed per coverage change, eases in 2px. */
	.shape-reading {
		font-family: var(--font-mono);
		font-size: var(--text-small);
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
		font-size: var(--text-mono);
	}

	.roster-name {
		color: var(--secondary-foreground);
	}

	.roster-enables {
		color: var(--engine-teach-ink);
	}

	.shape-next {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--engine-teach-ink);
		margin: 0;
	}

	.shape-link {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
		width: fit-content;
	}

	/* Finale (4c): the open door — a green dot and one warm linked line. */
	.shape-availability {
		display: flex;
		align-items: center;
		gap: 7px;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		margin: 0;
	}

	/* Yellow-conversion rule (go2/w5): the door is a conversion moment, so its
	   accent joins the signage family — --accent-text is accent-AS-text
	   (#FFB627 dark / darkened #8A6400 light; AA on both engine surfaces).
	   Subtler than the blueprint button — a door, not a billboard: hover
	   thickens the underline and never goes orange (orange = exploration). */
	.shape-availability-link {
		color: var(--accent-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}

	.shape-availability-link:hover {
		text-decoration-thickness: 2px;
	}

	/* The bonus rail's nameplate — bridges shape card and known builds. */
	.rail-label {
		grid-column: 1 / -1;
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		letter-spacing: 0.5px;
		color: var(--muted-foreground);
		margin: 0.25rem 0 0;
	}
</style>
