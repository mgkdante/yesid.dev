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
	import { STACK_LAYERS } from '@repo/shared/stack-layers';
	import type { Locale } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { pressBounce } from '$lib/motion/actions';
	import { StatusDot } from '$lib/components/brand';
	import { techStackItems } from '$lib/content/tech-stack';
	import { LAYER_NAMES, LAYER_TEACHING } from './layer-teaching';
	import { JOURNEY_STEPS } from './stack-shape';
	import BuildShapeCard from './BuildShapeCard.svelte';
	import TechIcon from './TechIcon.svelte';
	import type { EngineState } from './engine-state.svelte';

	type Tech = (typeof techStackItems)[number];

	let { engine, animate = true }: { engine: EngineState; animate?: boolean } = $props();

	// Layer groups in render order; layerless techs trail under 'more'.
	// Labels are the localized LAYER_NAMES (receiver r2); keys stay canonical.
	const groups: { key: string; label: string; items: typeof techStackItems }[] = [
		...STACK_LAYERS.map((layer) => ({
			key: layer as string,
			label: resolveLocale(LAYER_NAMES[layer], locale),
			items: techStackItems.filter((t) => t.layer === layer),
		})),
		{
			key: 'more',
			// Layer KEYS stay verbatim (they double as printed labels); only the
			// catch-all 'more' group reads as a word, so it localizes.
			label: resolveLocale({ en: 'more', fr: 'autres', es: 'más' }, locale),
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
	let shapeView = $state<'drawing' | 'product'>('drawing');

	// Finale (4c): the guided journey — which stepper station is lit. The
	// fourth (take it with you) is the standing invitation, never 'current'.
	const journeyStep = $derived(!hasPicks ? 0 : shapeView === 'product' ? 2 : 1);

	// The view state outlives the card's {#if hasPicks} block — 'start over'
	// then re-picking must reopen on the DRAWING (the teaching surface), not
	// resurrect a stale product view.
	$effect(() => {
		if (!hasPicks && shapeView !== 'drawing') shapeView = 'drawing';
	});

	// ── Teach line (go2/w5 §3) — ONE fixed slot, last trigger wins. ─────────
	const TEACH_EMPTY = resolveLocale(
		{
			en: "tap a part, I'll tell you what it does.",
			fr: 'tape un morceau, je te dis ce qu\'il fait.',
			es: 'toca una pieza y te digo qué hace.',
		},
		locale,
	);
	let teachLine = $state(TEACH_EMPTY);

	// "lives in" connector for the teach line, localized (exhaustive map).
	const LIVES_IN: Record<Locale, string> = { en: 'lives in', fr: 'vit dans', es: 'vive en' };
	const livesIn = LIVES_IN[locale];

	function teach(tech: Tech): void {
		const enables = tech.enables ? resolveLocale(tech.enables, locale) : '';
		const layerLine = tech.layer ? resolveLocale(LAYER_TEACHING[tech.layer], locale) : null;
		const layerName = tech.layer ? resolveLocale(LAYER_NAMES[tech.layer], locale) : '';
		if (enables && layerLine) {
			teachLine = `${tech.name}, ${enables}. ${livesIn} ${layerName}: ${layerLine}`;
		} else if (layerLine) {
			teachLine = `${tech.name} ${livesIn} ${layerName}: ${layerLine}`;
		} else if (enables) {
			teachLine = `${tech.name}, ${enables}.`;
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

	// ── Localized UI copy (code-owned, em-dash-free). Counts/names interpolate. ─
	const t = {
		knownBuildsLabel: resolveLocale(
			{
				en: "known builds, recipes I've already drawn with these parts",
				fr: 'builds connus, des recettes que j\'ai déjà dessinées avec ces morceaux',
				es: 'builds conocidos, recetas que ya dibujé con estas piezas',
			},
			locale,
		),
		railAllOut: resolveLocale(
			{
				en: 'no drawn recipe uses all of these yet, the shape above is already yours',
				fr: 'aucune recette dessinée utilise tout ça encore, la forme en haut est déjà à toi',
				es: 'ninguna receta dibujada usa todo esto todavía, la forma de arriba ya es tuya',
			},
			locale,
		),
		undoLast: resolveLocale(
			{ en: 'undo last pick', fr: 'défaire le dernier choix', es: 'deshacer la última elección' },
			locale,
		),
		startOver: resolveLocale(
			{ en: 'start over', fr: 'recommencer', es: 'empezar de nuevo' },
			locale,
		),
		closestComplete: resolveLocale(
			{
				en: 'closest to complete',
				fr: 'le plus proche du complet',
				es: 'el más cercano a completo',
			},
			locale,
		),
		completeTapToDraw: resolveLocale(
			{
				en: 'complete, tap to draw it',
				fr: 'complet, tape pour le dessiner',
				es: 'completo, toca para dibujarlo',
			},
			locale,
		),
	};

	// Count-interpolating copy per locale — pluralization rules differ (FR
	// treats the counters' nouns differently, ES pluralizes 0 like EN), so an
	// exhaustive Record<Locale, …> of template functions replaces the old
	// isFr ternaries (L1 rule: es must never silently render English).
	const COUNTER_COPY: Record<
		Locale,
		{
			idle: (builds: number) => string;
			zero: (picks: number) => string;
			picksLead: (picks: number, builds: number) => string;
			suffix: string;
			partsWord: string;
			matchParts: (matched: number, total: number, missing: number) => string;
			ruledOut: (name: string) => string;
		}
	> = {
		en: {
			idle: (builds) => `${builds} known builds on the board, tap parts to narrow`,
			zero: (picks) => `${picks} pick${picks === 1 ? '' : 's'} → no known build, your shape's below`,
			picksLead: (picks, builds) =>
				`${picks} pick${picks === 1 ? '' : 's'} → ${builds} known build${builds === 1 ? '' : 's'}`,
			suffix: ' · each pick narrows, never widens',
			partsWord: 'parts',
			matchParts: (matched, total, missing) => `${matched} of ${total} parts, ${missing} to go`,
			ruledOut: (name) => `ruled out, ${name} isn't in this recipe`,
		},
		fr: {
			idle: (builds) => `${builds} builds connus sur le tableau, tape des morceaux pour réduire`,
			zero: (picks) => `${picks} choix → aucun build connu, ta forme est plus bas`,
			picksLead: (picks, builds) =>
				`${picks} choix → ${builds} build${builds === 1 ? '' : 's'} connu${builds === 1 ? '' : 's'}`,
			suffix: ' · chaque choix réduit, jamais élargit',
			partsWord: 'morceaux',
			matchParts: (matched, total, missing) => `${matched} de ${total} morceaux, ${missing} à venir`,
			ruledOut: (name) => `écarté, ${name} n'est pas dans cette recette`,
		},
		es: {
			idle: (builds) => `${builds} builds conocidos en el tablero, toca piezas para reducir`,
			zero: (picks) =>
				`${picks} elecci${picks === 1 ? 'ón' : 'ones'} → ningún build conocido, tu forma está más abajo`,
			picksLead: (picks, builds) =>
				`${picks} elecci${picks === 1 ? 'ón' : 'ones'} → ${builds} build${builds === 1 ? '' : 's'} conocido${builds === 1 ? '' : 's'}`,
			suffix: ' · cada elección reduce, nunca amplía',
			partsWord: 'piezas',
			matchParts: (matched, total, missing) =>
				`${matched} de ${total} piezas, queda${missing === 1 ? '' : 'n'} ${missing}`,
			ruledOut: (name) => `descartado, ${name} no está en esta receta`,
		},
	};
	const cc = COUNTER_COPY[locale];

	/** "{n} known builds on the board, tap parts to narrow" — count interpolated. */
	const counterIdle = $derived(cc.idle(engine.archetypes.length));
	/** Zero-match counter line. */
	const counterZero = $derived(cc.zero(engine.pickedTechs.size));
	/** "{n} picks → {m} known builds" + the narrowing suffix. */
	const counterPicksLead = $derived(cc.picksLead(engine.pickedTechs.size, engine.matches.length));
	const counterSuffix = cc.suffix;
	const partsWord = cc.partsWord;

	/** Match-card parts line: "{matched} of {total} parts, {missing} to go". */
	function matchPartsLine(matched: number, total: number, missing: number): string {
		return cc.matchParts(matched, total, missing);
	}
	/** Ruled-out card reason: "ruled out, {name} isn't in this recipe". */
	function ruledOutLine(name: string): string {
		return cc.ruledOut(name);
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
						<TechIcon icon={tech.icon} label={tech.name} />
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
				<span>{counterIdle}</span>
			{:else if zeroMatch}
				<span>{counterZero}</span>
			{:else}
				<span>{counterPicksLead}<span class="counter-suffix">{counterSuffix}</span></span>
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
					<span aria-hidden="true">↶</span> {t.undoLast}
				</button>
				<button
					type="button"
					class="pick-tool"
					data-testid="pick-clear"
					onclick={() => engine.clearPicks()}
				>
					<span aria-hidden="true">✕</span> {t.startOver}
				</button>
			</div>
		{/if}
	</div>

	<div class="match-rail">
		{#if hasPicks}
			<BuildShapeCard
				pickedTechs={engine.pickedTechs}
				{animate}
				onViewChange={(view) => (shapeView = view)}
			/>

			<p class="rail-label" data-testid="known-builds-label">
				{#if zeroMatch}
					{t.railAllOut}
				{:else}
					{t.knownBuildsLabel}
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
							{match.missing.length > 0 ? t.closestComplete : t.completeTapToDraw}
						</span>
					{/if}
					<span class="match-parts">
						{matchPartsLine(match.matched.length, total, match.missing.length)}
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
						{ruledOutLine(firstConflictName(archetype.slug))}
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
					<span class="match-parts">{total} {partsWord}</span>
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
		display: inline-flex;
		align-items: center;
		gap: 0.42rem;
		font-family: var(--font-mono);
		font-size: var(--text-small);
		padding: 0.35rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-pill);
		background: var(--background);
		color: var(--secondary-foreground);
		cursor: pointer;
		transition: border-color var(--duration-fast) ease, background-color var(--duration-fast) ease, color var(--duration-fast) ease;
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
	   tiny element; guarded for prefers-reduced-motion below. Runs on the inner
	   span so it composes with pressBounce's scale tween on the button (same
	   `scale` property, two different elements — no fight). Toggle-OFF just
	   decays color (existing transition). */
	.tech-chip-picked .chip-label {
		animation: chip-settle 180ms var(--ease-bounce);
	}

	@keyframes chip-settle {
		0% { scale: 1; }
		50% { scale: 1.06; }
		100% { scale: 1; }
	}

	@media (prefers-reduced-motion: reduce) {
		.tech-chip-picked .chip-label {
			animation: none;
		}
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
		border-radius: var(--radius-pill);
		padding: 0.25rem 0.7rem;
		cursor: pointer;
		transition: border-color var(--duration-fast) ease, color var(--duration-fast) ease;
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
		transition: border-color var(--duration-fast) ease, opacity var(--duration-fast) ease;
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
		box-shadow: 0 6px 18px color-mix(in srgb, var(--glow) 12%, transparent);
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
		border-radius: var(--radius-pill);
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
