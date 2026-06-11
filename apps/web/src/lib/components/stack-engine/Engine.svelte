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
	import { resolveLocale } from '$lib/utils/locale';
	import { EngineState } from './engine-state.svelte';
	import GoalPicker from './GoalPicker.svelte';
	import TechMatcher from './TechMatcher.svelte';
	import BlueprintCanvas from './BlueprintCanvas.svelte';

	let { animate = true }: { animate?: boolean } = $props();

	const engine = new EngineState();

	// Mode toggle labels — pinned EXACTLY by Engine.test.ts (spec wording).
	const MODE_LABELS = {
		goal: 'I want to build…',
		compose: 'What can these build?',
	} as const;

	const activeTitle = $derived(engine.active ? resolveLocale(engine.active.title, 'en') : '');
	/** Compose entry: the matched/missing partition for the active archetype. */
	const activeMatch = $derived(
		engine.mode === 'compose' && engine.activeArchetype
			? (engine.matches.find((m) => m.slug === engine.activeArchetype) ?? null)
			: null,
	);
</script>

<section class="stack-engine" data-testid="stack-engine">
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
				<button
					type="button"
					class="engine-back"
					data-testid="engine-back"
					onclick={() => engine.backToSelect()}
				>
					← all goals
				</button>
				{#if engine.view === 'blueprint'}
					<BlueprintCanvas links={engine.active.tech} title={activeTitle} {animate} />
				{:else}
					<!-- ProductPreview lands in Task 11 -->
					<p class="engine-placeholder">preview — coming in Task 11</p>
				{/if}
				<!-- BlueprintCTA lands in Task 12 -->
			{/if}
		</div>
	{:else}
		<div class="engine-region" data-testid="engine-compose-region">
			{#if engine.view === 'select' || !engine.active}
				<TechMatcher {engine} />
			{:else}
				<button
					type="button"
					class="engine-back"
					data-testid="engine-back"
					onclick={() => engine.backToSelect()}
				>
					← all picks
				</button>
				{#if engine.view === 'blueprint'}
					<BlueprintCanvas
						links={engine.active.tech}
						title={activeTitle}
						matched={activeMatch?.matched}
						missing={activeMatch?.missing}
						{animate}
					/>
				{:else}
					<!-- ProductPreview lands in Task 11 -->
					<p class="engine-placeholder">preview — coming in Task 11</p>
				{/if}
			{/if}
		</div>
	{/if}
</section>

<style>
	.stack-engine {
		max-width: var(--container-wide);
		margin: 0 auto;
		padding: 2rem var(--space-page-x);
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

	.mode-btn-active {
		background: var(--primary);
		color: var(--primary-foreground);
	}

	.engine-region {
		min-height: 200px;
	}

	.engine-back {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--muted-foreground);
		background: none;
		border: none;
		padding: 0 0 1rem;
		cursor: pointer;
	}

	.engine-back:hover {
		color: var(--primary);
	}

	.engine-placeholder {
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--muted-foreground);
	}
</style>
