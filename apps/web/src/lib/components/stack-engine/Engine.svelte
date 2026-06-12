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
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { EngineState } from './engine-state.svelte';
	import GoalPicker from './GoalPicker.svelte';
	import TechMatcher from './TechMatcher.svelte';
	import BlueprintCanvas from './BlueprintCanvas.svelte';
	import ProductPreview from './ProductPreview.svelte';
	import BlueprintCTA from './BlueprintCTA.svelte';

	// Registered ONCE inside the engine chunk — Flip never touches the route's
	// entry chunk (the whole engine, GSAP plugin included, is the async chunk).
	gsap.registerPlugin(Flip);

	let { animate = true }: { animate?: boolean } = $props();

	const engine = new EngineState();

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
		goal: 'I want to build…',
		compose: 'What can these build?',
	} as const;

	const activeTitle = $derived(engine.active ? resolveLocale(engine.active.title, locale) : '');
	/** Compose entry: the matched/missing partition for the active archetype. */
	const activeMatch = $derived(
		engine.mode === 'compose' && engine.activeArchetype
			? (engine.matches.find((m) => m.slug === engine.activeArchetype) ?? null)
			: null,
	);
</script>

<section class="stack-engine" data-testid="stack-engine">
	<!-- GO-w2t5 addendum: section is full-bleed (route wraps it in the
	     hazard-framed engine-band); the width cap lives on this inner
	     container so content stays a readable centered column. -->
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
			{MODE_LABELS.goal}
		</button>
		<button
			type="button"
			class="mode-btn"
			class:mode-btn-active={engine.mode === 'compose'}
			aria-pressed={engine.mode === 'compose'}
			data-testid="mode-toggle-compose"
			onclick={() => engine.setMode('compose')}
		>
			{MODE_LABELS.compose}
		</button>
	</div>

	{#if engine.mode === 'goal'}
		<div class="engine-region" data-testid="engine-goal-region">
			{#if engine.view === 'select' || !engine.active}
				<GoalPicker {engine} />
			{:else}
				<div class="engine-viewbar">
					<button
						type="button"
						class="engine-back"
						data-testid="engine-back"
						onclick={() => engine.backToSelect()}
					>
						← all goals
					</button>
					<button
						type="button"
						class="engine-view-toggle"
						data-testid="view-toggle"
						onclick={toggleView}
					>
						{#if engine.view === 'blueprint'}
						see it as a product <span class="toggle-arrow" aria-hidden="true">→</span>
					{:else}
						<span class="toggle-arrow toggle-arrow-back" aria-hidden="true">←</span> back to blueprint
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
				<TechMatcher {engine} />
			{:else}
				<div class="engine-viewbar">
					<button
						type="button"
						class="engine-back"
						data-testid="engine-back"
						onclick={() => engine.backToSelect()}
					>
						← all picks
					</button>
					<button
						type="button"
						class="engine-view-toggle"
						data-testid="view-toggle"
						onclick={toggleView}
					>
						{#if engine.view === 'blueprint'}
						see it as a product <span class="toggle-arrow" aria-hidden="true">→</span>
					{:else}
						<span class="toggle-arrow toggle-arrow-back" aria-hidden="true">←</span> back to blueprint
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
	}

	.engine-inner {
		max-width: var(--container-wide);
		margin: 0 auto;
	}

	.engine-mode-toggle {
		display: inline-flex;
		gap: 0;
		border: 1px solid var(--border);
		border-radius: var(--radius, 6px);
		overflow: hidden;
		margin-bottom: 1.5rem;
	}

	.mode-btn {
		font-family: var(--font-mono);
		font-size: 12px;
		letter-spacing: 0.4px;
		padding: 0.6rem 1rem;
		background: var(--background);
		color: var(--muted-foreground);
		border: none;
		cursor: pointer;
		transition: background-color 150ms ease, color 150ms ease;
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
		font-size: 12px;
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
		font-size: 12px;
		color: var(--primary);
		background: none;
		border: 1px solid var(--primary);
		border-radius: 999px;
		padding: 0.35rem 0.9rem;
		cursor: pointer;
		transition: background-color 150ms ease, color 150ms ease;
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

	.engine-placeholder {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--muted-foreground);
	}
</style>
