<!--
  Tech Stack Engine (slice-29) — interactive blueprint on /tech-stack.

  Loaded ONLY via dynamic import() from the route so all engine code (this
  shell, the state class, GSAP Flip usage, sub-views) lives in its own async
  chunk below the hero. Pure client-side: data comes from the committed
  content modules, zero runtime fetches.

  Two framings, one state object (engine-state.svelte.ts):
    goal    — "I want to build…"      → archetype cards → blueprint → preview
    compose — "What can these build?" → tech chips rank the archetypes

  `animate` is the single reduced-motion switch, computed once by the route
  (!isPrefersReducedMotion()) and passed down — every GSAP call in the engine
  tree sits behind it.
-->
<script lang="ts">
	import { tick } from 'svelte';
	import { gsap } from 'gsap';
	import { Flip } from 'gsap/Flip';
	import { pushState } from '$app/navigation';
	import { page } from '$app/state';
	import { STACK_LAYERS } from '@repo/shared/schemas';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { stackArchetypes } from '$lib/content/stack-archetypes';
	import { registerSession, pendingRestore } from '$lib/state/locale-handoff.svelte';
	import { EngineState, seedFromParams, coerceEngineSeed } from './engine-state.svelte';
	import { LAYER_TEACHING } from './layer-teaching';
	import GoalPicker from './GoalPicker.svelte';
	import TechMatcher from './TechMatcher.svelte';
	import BlueprintCanvas from './BlueprintCanvas.svelte';
	import ProductPreview from './ProductPreview.svelte';
	import BlueprintCTA from './BlueprintCTA.svelte';

	// Registered ONCE inside the engine chunk — Flip never touches the route's
	// entry chunk (the whole engine, GSAP plugin included, is the async chunk).
	gsap.registerPlugin(Flip);

	let { animate = true }: { animate?: boolean } = $props();

	// ── slice-34.2: the engine REMOUNTS on a language switch (the {#key
	// $page.url.pathname} subtree is destroyed), AND it mounts via async dynamic
	// import() — so there is no surviving singleton to live-set into. The boot
	// seed is resolved HERE, at construction, in precedence:
	//   1. an in-flight switch-restore (the orchestrator is still inside its
	//      post-paint await window when this async chunk lands — read it the same
	//      way FeaturedProjects reads pendingRestore in onEmblaInit), THEN
	//   2. an inbound deep-link (?mode=&archetype=&techs= on the URL), THEN
	//   3. the engine's plain defaults (seed === null → goal/select/empty).
	// All of this runs through engine-state's pure, whitelisting seed helpers so
	// a hand-edited URL or a stale blob can never seed a bogus mode/archetype.
	const restoreSeed = coerceEngineSeed(pendingRestore('stack-engine'), stackArchetypes);
	const bootSeed = restoreSeed ?? seedFromParams(page.url.searchParams, stackArchetypes);
	const engine = new EngineState(undefined, bootSeed);

	// Register with the locale-handoff orchestrator so beforeNavigate can SNAPSHOT
	// the live build before the switch tears this subtree down. get-only: the
	// restore is the constructor reading pendingRestore above (an async-mount
	// consumer, never a live-setter race), so `set` is intentionally a no-op.
	$effect(() => registerSession('stack-engine', { get: () => engine.serialize(), set: () => {} }));

	// ── Round 4 nav: browser-back friendliness via SvelteKit shallow routing.
	// Opening a drawing pushes ONE history entry (URL unchanged); the browser
	// back button then closes the drawing back to the map instead of leaving
	// the page. Blueprint ⇄ preview toggles share the entry — one drawing, one
	// entry. pushState needs the running router: in unit tests (no router) the
	// try/catch keeps in-page nav fully working without history — and
	// `historyLive` stays false so the fold-back effect below never fires.
	let historyLive = false;
	engine.onDetailOpen = (slug) => {
		if (page.state.stackEngineDetail === slug) return;
		try {
			pushState('', { stackEngineDetail: slug });
			historyLive = true;
		} catch {
			/* router-less environment (unit tests) — nav works without history */
		}
	};

	// Browser back (or forward past the entry) clears the shallow state — fold
	// the engine back to the select surface. Close-only on purpose: re-OPENING
	// on forward is judged out (a stale entry after a mode switch would fight
	// setMode's view reset — don't overbuild). The reactive reads happen
	// BEFORE the historyLive guard: effects track per-run, and a short-circuit
	// on the plain flag would leave the effect with zero dependencies.
	$effect(() => {
		const detail = page.state.stackEngineDetail;
		const view = engine.view;
		if (historyLive && !detail && view !== 'select') {
			engine.backToSelect();
		}
	});

	/**
	 * The '←' step: preview → blueprint stays inside the history entry;
	 * blueprint → select pops our shallow entry when it's on top (so the
	 * browser's own back lands where the visitor already is), else folds
	 * directly (unit tests, stale-entry edge cases).
	 */
	function backStep(): void {
		if (engine.view === 'preview') {
			engine.back();
			return;
		}
		if (page.state.stackEngineDetail) {
			history.back();
		} else {
			engine.back();
		}
	}

	// Homey nav labels (round 4) — the breadcrumb step reads like a place.
	const BACK_TO_BLUEPRINT = {
		en: '← back to the blueprint',
		fr: '← retour au plan',
		es: '← volver al plano',
	};
	const BACK_TO_MAP = { en: '← back to the map', fr: '← retour à la carte', es: '← volver al mapa' };
	const backLabel = $derived(
		resolveLocale(engine.view === 'preview' ? BACK_TO_BLUEPRINT : BACK_TO_MAP, locale),
	);

	/**
	 * Blueprint ⇄ preview morph: capture every [data-flip-id] box, swap the
	 * view, then Flip from the captured state so each blueprint box flies into
	 * its preview slot (and back). animate=false → plain swap, zero GSAP.
	 */
	async function toggleView(): Promise<void> {
		if (!animate) {
			engine.toggleBlueprintPreview();
			return;
		}
		const state = Flip.getState('[data-flip-id]');
		engine.toggleBlueprintPreview();
		await tick();
		Flip.from(state, { duration: 0.6, ease: 'power2.inOut', absolute: true, nested: true });
	}

	// Mode toggle labels — pinned EXACTLY by Engine.test.ts (spec wording).
	const MODE_LABELS = {
		goal: { en: 'I want to build…', fr: 'Je veux bâtir…', es: 'Quiero construir…' },
		compose: { en: 'What can these build?', fr: 'Ça peut bâtir quoi?', es: '¿Qué construyen estas?' },
	} as const;
	const modeGoalLabel = $derived(resolveLocale(MODE_LABELS.goal, locale));
	const modeComposeLabel = $derived(resolveLocale(MODE_LABELS.compose, locale));

	// View-toggle copy (blueprint ⇄ product) — pinned by Engine.test.ts.
	const SEE_AS_PRODUCT = {
		en: 'see it as a product',
		fr: 'vois-le comme un produit',
		es: 'velo como producto',
	};
	const BACK_TO_BLUEPRINT_INLINE = {
		en: 'back to blueprint',
		fr: 'retour au plan',
		es: 'volver al plano',
	};
	const seeAsProductLabel = $derived(resolveLocale(SEE_AS_PRODUCT, locale));
	const backToBlueprintInline = $derived(resolveLocale(BACK_TO_BLUEPRINT_INLINE, locale));

	const activeTitle = $derived(engine.active ? resolveLocale(engine.active.title, locale) : '');
	/** Compose entry: the matched/missing partition for the active archetype. */
	const activeMatch = $derived(
		engine.mode === 'compose' && engine.activeArchetype
			? (engine.matches.find((m) => m.slug === engine.activeArchetype) ?? null)
			: null,
	);
</script>

<section class="stack-engine" data-testid="stack-engine">
	<!-- GO-w2t5 addendum + go2/w5 taste round 2: section is full-bleed (route
	     wraps it in the hazard-framed engine-band) and the inner container is
	     now UNCAPPED too — the engine genuinely spans the viewport; the
	     section's --space-page-x padding is the readable gutter. -->
	<div class="engine-inner">
	<div class="engine-mode-toggle" role="group" aria-label="Engine mode">
		<button
			type="button"
			class="mode-btn"
			class:mode-btn-active={engine.mode === 'goal'}
			aria-pressed={engine.mode === 'goal'}
			data-testid="mode-toggle-goal"
			onclick={() => engine.setMode('goal')}
		>
			{modeGoalLabel}
		</button>
		<button
			type="button"
			class="mode-btn"
			class:mode-btn-active={engine.mode === 'compose'}
			aria-pressed={engine.mode === 'compose'}
			data-testid="mode-toggle-compose"
			onclick={() => engine.setMode('compose')}
		>
			{modeComposeLabel}
		</button>
	</div>

	<!-- go2/w5 layered learning: persistent layer legend — never unmounted, so
	     it teaches across goal/compose AND select/blueprint/preview. The metro
	     track between the stations (per-cell flex segments, ≥768px) echoes the
	     site's station vocabulary. Teaching lines come from layer-teaching.ts
	     (single source). -->
	<div class="layer-legend" data-testid="layer-legend">
		{#each STACK_LAYERS as layer (layer)}
			<div class="legend-cell" data-testid={`legend-${layer}`} style:--legend-color={`var(--layer-${layer})`}>
				<span class="legend-station">
					<span class="legend-dot" aria-hidden="true"></span>
					<span class="legend-name">{layer}</span>
					<!-- go2/w5 taste round 2: the metro track is a per-cell flex
					     segment AFTER the name — it fills the gap to the next
					     station and can never paint over text (the old absolute
					     ::before sat in the positioned layer, striking the
					     in-flow labels: "labels under the line"). -->
					<span class="legend-track" aria-hidden="true"></span>
				</span>
				<span class="legend-teach">{resolveLocale(LAYER_TEACHING[layer], locale)}</span>
			</div>
		{/each}
	</div>

	{#if engine.mode === 'goal'}
		<div class="engine-region" data-testid="engine-goal-region">
			{#if engine.view === 'select' || !engine.active}
				<GoalPicker {engine} />
			{:else}
				<div class="engine-viewbar">
					<!-- Round 4: stepped back — preview → blueprint → map (the
					     view toggle stays for the lateral flip). -->
					<button
						type="button"
						class="engine-back"
						data-testid="engine-back"
						onclick={backStep}
					>
						{backLabel}
					</button>
					<button
						type="button"
						class="engine-view-toggle"
						data-testid="view-toggle"
						onclick={toggleView}
					>
						{#if engine.view === 'blueprint'}
						{seeAsProductLabel} <span class="toggle-arrow" aria-hidden="true">→</span>
					{:else}
						<span class="toggle-arrow toggle-arrow-back" aria-hidden="true">←</span> {backToBlueprintInline}
					{/if}
					</button>
				</div>
				{#if engine.view === 'blueprint'}
					<BlueprintCanvas links={engine.active.tech} title={activeTitle} {animate} />
				{:else}
					<ProductPreview archetype={engine.active} {animate} />
				{/if}
				<BlueprintCTA archetype={engine.active} />
			{/if}
		</div>
	{:else}
		<div class="engine-region" data-testid="engine-compose-region">
			{#if engine.view === 'select' || !engine.active}
				<TechMatcher {engine} {animate} />
			{:else}
				<div class="engine-viewbar">
					<button
						type="button"
						class="engine-back"
						data-testid="engine-back"
						onclick={backStep}
					>
						{backLabel}
					</button>
					<button
						type="button"
						class="engine-view-toggle"
						data-testid="view-toggle"
						onclick={toggleView}
					>
						{#if engine.view === 'blueprint'}
						{seeAsProductLabel} <span class="toggle-arrow" aria-hidden="true">→</span>
					{:else}
						<span class="toggle-arrow toggle-arrow-back" aria-hidden="true">←</span> {backToBlueprintInline}
					{/if}
					</button>
				</div>
				{#if engine.view === 'blueprint'}
					<BlueprintCanvas
						links={engine.active.tech}
						title={activeTitle}
						matched={activeMatch?.matched}
						missing={activeMatch?.missing}
						{animate}
					/>
				{:else}
					<ProductPreview archetype={engine.active} {animate} />
				{/if}
				<BlueprintCTA archetype={engine.active} composeTechs={[...engine.pickedTechs]} />
			{/if}
		</div>
	{/if}
	</div>
</section>

<style>
	.stack-engine {
		/* GO-w2t5 addendum: no width cap here — the section bleeds with the
		   route's engine-band; .engine-inner carries the content column. */
		padding: 2rem var(--space-page-x);

		/* go2/w5 §B: engine-LOCAL layer accents — scoped aliases over existing
		   global tokens (theme implementer owns globals; no new global tokens,
		   no hex literals). Light/dark flips ride the underlying tokens.
		   Rule: hue is NEVER the sole carrier — every layer-colored element
		   sits next to its printed layer name. */
		--layer-interface: var(--primary);
		--layer-logic: var(--accent-text);
		--layer-data: var(--success);
		--layer-infra: var(--muted-foreground);
		--bp-grid-ink: color-mix(in srgb, var(--border) 45%, transparent);
		--engine-teach-ink: var(--secondary-foreground);
		/* Taste round 2 (fit audit): what the engine band actually composites —
		   route tint (3% primary) over the page background. Text halos that
		   must mask connector lines (pair notes) use THIS, not raw
		   --background, so the mask is invisible on the tinted band. */
		--engine-paper: color-mix(in srgb, var(--primary) 3%, var(--background));
	}

	/* go2/w5 taste round 2: TRULY edge-to-edge — the old var(--container-wide)
	   cap here re-constrained the content the band had just un-constrained
	   ("still feels constrained", operator). The inner now rides the full
	   bleed; the section's --space-page-x padding keeps readable gutters.
	   Chips, legend rail and the known-builds grid all breathe the viewport. */
	.engine-inner {
		width: 100%;
	}

	.engine-mode-toggle {
		display: inline-flex;
		gap: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius, 6px);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	/* go2/w5 legibility pass (here and below): engine chrome steps up one full
	   rung of the site type scale — tokens only, never raw px. */
	.mode-btn {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		letter-spacing: 0.4px;
		padding: 0.6rem 1rem;
		background: var(--background);
		color: var(--muted-foreground);
		border: none;
		cursor: pointer;
		transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
	}

	.mode-btn + .mode-btn {
		border-left: 1px solid var(--border);
	}

	/* GO-w2t5 cute pass: inactive mode hints orange before commit —
	   color-only → SAFE-ALWAYS, consistent with the fun-pass accents. */
	.mode-btn:hover:not(.mode-btn-active) {
		color: var(--primary);
	}

	.mode-btn-active {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	/* go2/w5: persistent layer legend — 2×2 grid <768px, one metro row ≥768px.
	   Taste round 2: the track is now a per-cell flex segment between stations
	   (see markup note) — nothing ever overlaps the printed names. */
	.layer-legend {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem 1.25rem;
		margin-bottom: 1.5rem;
	}

	.legend-cell {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}

	.legend-station {
		display: flex;
		align-items: center;
		gap: 6px;
		height: 16px;
	}

	.legend-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--legend-color);
		flex-shrink: 0;
	}

	.legend-name {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--legend-color);
	}

	/* Metro-line micro-detail, in-flow edition: each station trails a 1px
	   rail toward the next dot. Hidden <768px (2×2 grid has no line to draw)
	   and after the last station (the line terminates there). */
	.legend-track {
		display: none;
	}

	.legend-teach {
		font-family: var(--font-mono);
		font-size: var(--text-mono);
		color: var(--engine-teach-ink);
	}

	@media (min-width: 768px) {
		.layer-legend {
			display: flex;
			gap: 1.25rem;
		}

		.legend-cell {
			flex: 1 1 0;
			min-width: 0;
		}

		.legend-track {
			display: block;
			flex: 1;
			height: 1px;
			background: var(--border);
			margin-left: 2px;
		}

		.legend-cell:last-child .legend-track {
			display: none;
		}
	}

	.engine-region {
		min-height: 200px;
	}

	.engine-viewbar {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
		flex-wrap: wrap;
		padding-bottom: 1rem;
	}

	.engine-back {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--muted-foreground);
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
	}

	.engine-back:hover {
		color: var(--primary);
	}

	.engine-view-toggle {
		font-family: var(--font-mono);
		font-size: var(--text-small);
		color: var(--primary);
		background: none;
		border: 1px solid var(--primary);
		border-radius: var(--radius-pill);
		padding: 0.35rem 0.9rem;
		cursor: pointer;
		transition: background-color var(--duration-fast) ease, color var(--duration-fast) ease;
	}

	.engine-view-toggle:hover {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	/* GO-w2t5: Flip anticipation — the arrow leans toward the target view on
	   hover; the Flip morph on activate is the payoff. ≤4px → SAFE-ALWAYS. */
	.toggle-arrow {
		display: inline-block;
		transition: transform var(--duration-fast) var(--ease-out);
	}

	.engine-view-toggle:hover .toggle-arrow {
		transform: translateX(2px);
	}

	.engine-view-toggle:hover .toggle-arrow-back {
		transform: translateX(-2px);
	}
</style>
