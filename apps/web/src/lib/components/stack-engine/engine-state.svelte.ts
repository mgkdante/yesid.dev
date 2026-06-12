// EngineState (slice-29) — the Tech Stack Engine's single interaction surface.
//
// A Svelte 5 runes class: components are thin views over this state. Pure
// client-side — archetype/tech data comes from the committed content modules
// (zero runtime fetches), matching is the pure matchArchetypes function.
//
// Modes: 'goal' (pick an outcome → blueprint → preview) and 'compose'
// ("what can these build?" — picks filter archetypes with AND semantics,
// every pick must be in a match's stack; never free-form wiring).
// Switching mode resets the view/active archetype but PRESERVES picks, so a
// visitor can bounce between framings without losing work.

import { SvelteSet } from 'svelte/reactivity';
import type { StackArchetype } from '@repo/shared/schemas';
import { stackArchetypes } from '$lib/content/stack-archetypes';
import { matchArchetypes, type Match } from '$lib/utils/stack-matching';

export type EngineMode = 'goal' | 'compose';
export type EngineView = 'select' | 'blueprint' | 'preview';

export class EngineState {
	/**
	 * Archetype catalogue — committed module by default, injectable for tests.
	 * Initialized at declaration (not in the constructor) so the $derived field
	 * initializers below may legally reference it; the constructor override is
	 * visible to them because deriveds evaluate lazily, post-construction.
	 */
	readonly archetypes: readonly StackArchetype[] = stackArchetypes;

	mode = $state<EngineMode>('goal');
	view = $state<EngineView>('select');
	activeArchetype = $state<string | null>(null);
	pickedTechs = new SvelteSet<string>();

	/**
	 * Round 4 nav hook: Engine.svelte wires SvelteKit shallow history here so
	 * opening a drawing pushes ONE history entry (browser back closes the
	 * drawing instead of leaving the page). Optional by design — the class
	 * stays router-free and unit tests never touch history.
	 */
	onDetailOpen: ((slug: string) => void) | null = null;

	/** Ranked compose-mode matches — recomputed whenever picks change. */
	matches: Match[] = $derived(matchArchetypes([...this.pickedTechs], this.archetypes));

	/** The active archetype's full object, or null when none/unknown. */
	active: StackArchetype | null = $derived(
		this.archetypes.find((a) => a.slug === this.activeArchetype) ?? null,
	);

	constructor(archetypes?: readonly StackArchetype[]) {
		if (archetypes) this.archetypes = archetypes;
	}

	/** Switch framing. Resets view + active archetype, PRESERVES picks. */
	setMode(mode: EngineMode): void {
		if (mode === this.mode) return;
		this.mode = mode;
		this.view = 'select';
		this.activeArchetype = null;
	}

	/** Goal mode: a card was chosen — draw its blueprint. */
	selectArchetype(slug: string): void {
		this.activeArchetype = slug;
		this.view = 'blueprint';
		this.onDetailOpen?.(slug);
	}

	/** Compose mode: tap a tech chip on/off. Matches re-derive automatically. */
	toggleTech(id: string): void {
		if (this.pickedTechs.has(id)) {
			this.pickedTechs.delete(id);
		} else {
			this.pickedTechs.add(id);
		}
	}

	/**
	 * Round 4 nav: forget the MOST RECENT pick. SvelteSet preserves insertion
	 * order and toggleTech deletes before re-adding, so the last element is
	 * always the chronologically newest pick.
	 */
	undoLastPick(): void {
		const last = [...this.pickedTechs].at(-1);
		if (last !== undefined) this.pickedTechs.delete(last);
	}

	/** Round 4 nav: start over — drop every pick at once. */
	clearPicks(): void {
		this.pickedTechs.clear();
	}

	/** Blueprint ⇄ preview. Inert in the select view (nothing to morph yet). */
	toggleBlueprintPreview(): void {
		if (this.view === 'select') return;
		this.view = this.view === 'blueprint' ? 'preview' : 'blueprint';
	}

	/** Back out of a blueprint/preview to the mode's select surface. */
	backToSelect(): void {
		this.view = 'select';
		this.activeArchetype = null;
	}

	/**
	 * Round 4 nav: step back ONE surface — preview → blueprint → select.
	 * (backToSelect remains the jump-home; back is the breadcrumb step.)
	 */
	back(): void {
		if (this.view === 'preview') {
			this.view = 'blueprint';
		} else if (this.view === 'blueprint') {
			this.backToSelect();
		}
	}
}
