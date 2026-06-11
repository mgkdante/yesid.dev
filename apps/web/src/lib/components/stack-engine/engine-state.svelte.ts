// EngineState (slice-29) — the Tech Stack Engine's single interaction surface.
//
// A Svelte 5 runes class: components are thin views over this state. Pure
// client-side — archetype/tech data comes from the committed content modules
// (zero runtime fetches), matching is the pure matchArchetypes function.
//
// Modes: 'goal' (pick an outcome → blueprint → preview) and 'compose'
// ("what can these build?" — picks rank archetypes; never free-form wiring).
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
	}

	/** Compose mode: tap a tech chip on/off. Matches re-derive automatically. */
	toggleTech(id: string): void {
		if (this.pickedTechs.has(id)) {
			this.pickedTechs.delete(id);
		} else {
			this.pickedTechs.add(id);
		}
	}

	/** Blueprint ⇄ preview. Inert in the select view (nothing to morph yet). */
	toggleBlueprintPreview(): void {
		if (this.view === 'select') return;
		this.view = this.view === 'blueprint' ? 'preview' : 'blueprint';
	}
}
