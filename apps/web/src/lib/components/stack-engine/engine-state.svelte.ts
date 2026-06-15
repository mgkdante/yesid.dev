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

/**
 * slice-34.2 — the locale-free seed the engine boots from on a switch-restore
 * or an inbound deep-link. Every field is a primitive/array of ids (no
 * translated text — those re-render and aren't portable across locales), so the
 * same seed is valid in any locale. `view` is DERIVED at apply time (blueprint
 * when an archetype is present), never carried — it's redundant with `archetype`
 * and the translated teach copy must never persist.
 */
export interface EngineSeed {
	mode: EngineMode;
	/** Archetype slug, or null for compose-mode / no active drawing. */
	archetype: string | null;
	/** Picked/stack tech ids, insertion order preserved, deduped. */
	techs: string[];
}

const ENGINE_MODES: readonly EngineMode[] = ['goal', 'compose'];

const SEED_SLUG_RE = /^[a-z0-9-]+$/;

/**
 * Build an EngineSeed from `page.url.searchParams` (inbound deep-link) — pure,
 * never throws. Unknown/garbage values are stripped against the live archetype
 * catalogue and the [a-z0-9-] id grammar, so a hand-edited URL can never seed a
 * bogus mode or a non-existent archetype:
 *   ?mode=compose&archetype=data-dashboard&techs=sveltekit.postgresql
 *   - mode:      whitelisted to 'goal' | 'compose' (default 'goal')
 *   - archetype: kept only if it resolves to a real archetype slug, else null
 *   - techs:     '.'-joined ids, each [a-z0-9-]; deduped, insertion order kept
 * Returns null when NOTHING usable is present (no mode/archetype/techs) so the
 * caller falls through to defaults instead of a no-op seed.
 */
export function seedFromParams(
	params: URLSearchParams,
	archetypes: readonly StackArchetype[],
): EngineSeed | null {
	const rawMode = params.get('mode');
	const rawArchetype = params.get('archetype');
	const rawTechs = params.get('techs');
	if (rawMode === null && rawArchetype === null && rawTechs === null) return null;

	const mode: EngineMode = ENGINE_MODES.includes(rawMode as EngineMode)
		? (rawMode as EngineMode)
		: 'goal';

	const archetype =
		rawArchetype && archetypes.some((a) => a.slug === rawArchetype) ? rawArchetype : null;

	const techs = dedupeTechs(
		rawTechs && rawTechs.length > 0 ? rawTechs.split('.').filter((id) => SEED_SLUG_RE.test(id)) : [],
	);

	return { mode, archetype, techs };
}

/** Coerce an unknown restore value (from the orchestrator blob) into an EngineSeed, or null. */
export function coerceEngineSeed(
	value: unknown,
	archetypes: readonly StackArchetype[],
): EngineSeed | null {
	if (!value || typeof value !== 'object') return null;
	const v = value as Record<string, unknown>;
	const mode: EngineMode = ENGINE_MODES.includes(v.mode as EngineMode)
		? (v.mode as EngineMode)
		: 'goal';
	const archetype =
		typeof v.archetype === 'string' && archetypes.some((a) => a.slug === v.archetype)
			? v.archetype
			: null;
	const techs = dedupeTechs(
		Array.isArray(v.techs)
			? v.techs.filter((id): id is string => typeof id === 'string' && SEED_SLUG_RE.test(id))
			: [],
	);
	return { mode, archetype, techs };
}

function dedupeTechs(techs: string[]): string[] {
	return [...new Set(techs)];
}

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

	constructor(archetypes?: readonly StackArchetype[], seed?: EngineSeed | null) {
		if (archetypes) this.archetypes = archetypes;
		if (seed) this.applySeed(seed);
	}

	/**
	 * slice-34.2 — seed mode/archetype/view/picks from a restore-or-deep-link
	 * EngineSeed. Called ONLY from the constructor (the engine remounts on a
	 * switch — there is no surviving singleton to live-set into). view is DERIVED
	 * here, never carried: blueprint when the archetype is present (and known),
	 * else select. Picks land via `.add()` so the ORIGINAL SvelteSet instance the
	 * `matches`/`shape` deriveds captured at field-init is preserved (reassigning
	 * the field would orphan those deriveds). onDetailOpen is NOT fired — seeding
	 * is not a user "open" and must not push a shallow-history entry.
	 */
	private applySeed(seed: EngineSeed): void {
		this.mode = ENGINE_MODES.includes(seed.mode) ? seed.mode : 'goal';
		for (const id of seed.techs) this.pickedTechs.add(id);

		const known = seed.archetype && this.archetypes.some((a) => a.slug === seed.archetype);
		if (known) {
			this.activeArchetype = seed.archetype;
			this.view = 'blueprint';
		} else {
			this.activeArchetype = null;
			this.view = 'select';
		}
	}

	/**
	 * slice-34.2 — snapshot the live build as a locale-free EngineSeed for the
	 * locale-handoff orchestrator's `get`. Reads the CURRENT mode/archetype/picks
	 * so beforeNavigate captures exactly what the visitor composed; view + the
	 * translated teach copy are deliberately omitted (view re-derives from
	 * archetype; teach text must never persist).
	 */
	serialize(): EngineSeed {
		return {
			mode: this.mode,
			archetype: this.activeArchetype,
			techs: [...this.pickedTechs],
		};
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
