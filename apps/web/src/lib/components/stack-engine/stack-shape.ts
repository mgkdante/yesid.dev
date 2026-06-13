// stack-shape (go2/w5 — engine layered learning, taste round 2, finale 4c) —
// the pure helpers behind the engine's ALWAYS-ON build-shape teaching.
//
// Taste round 2 (operator verdict): the composed project shape is no longer a
// zero-match fallback — it is the PRIMARY teaching surface of compose mode.
// The matrix is layer coverage, not tech pairs: every pick maps to one of the
// four STACK_LAYERS, so any pick set covers one of 15 possible layer
// combinations — and every combination has a hand-written reading of what
// those layers can do TOGETHER. Total function: no pick combo ever teaches
// nothing. (AND-matched archetypes remain a bonus rail of "known builds".)
//
// Finale (4c) — THE PHRASE BUILDER: composePhrase() turns a pick set into a
// market-friendly product sentence via a layer grammar (subject from the
// leading layer + one clause per covered layer), enriched by a small
// code-owned TECH_VOICES vocabulary (shopify speaks storefront/checkout,
// power-bi/dax speak reporting, airflow/dbt speak pipelines). Unknown/future
// techs fall back to layer-generic fragments, so the grammar is TOTAL and
// self-extending — the 28-tech roster landing at the next regen Just Works.
// Deterministic, en-only for now, LocalizedString-shaped so FR can follow.
//
// Pure data-in/data-out — fully covered by stack-shape.test.ts.

import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
import type { LocalizedString, TechStackItem } from '$lib/types';

export interface StackShape {
	/** Dedup'd layers of the picked techs, in STACK_LAYERS render order. */
	present: StackLayer[];
	/** STACK_LAYERS minus present, same order. */
	missing: StackLayer[];
}

/**
 * Compose the project shape of a set of picked tech ids.
 * Ids without a committed layer (or unknown ids) are ignored — defensive.
 */
export function composeStackShape(
	pickedIds: readonly string[],
	techItems: readonly TechStackItem[],
): StackShape {
	const layerById = new Map(techItems.map((t) => [t.id, t.layer]));
	const covered = new Set<StackLayer>();
	for (const id of pickedIds) {
		const layer = layerById.get(id);
		if (layer && (STACK_LAYERS as readonly string[]).includes(layer)) {
			covered.add(layer);
		}
	}
	return {
		present: STACK_LAYERS.filter((l) => covered.has(l)),
		missing: STACK_LAYERS.filter((l) => !covered.has(l)),
	};
}

/**
 * The full coverage matrix: one homey-teacher reading per possible layer
 * combination (2⁴ − 1 = 15 — small enough to write every cell by hand).
 * Keys are present layers joined with '+', in STACK_LAYERS render order.
 * Every reading says what the covered layers can do TOGETHER, in human words.
 */
export const SHAPE_READINGS: Record<string, string> = {
	interface: 'a face with nothing behind it yet — pure look and feel',
	logic: 'thinking with nowhere to show it — a script, the seed of an automation',
	data: 'memory with nothing using it yet — records kept safe and queryable',
	infra: 'ground with nothing standing on it yet — a place for software to live',
	'interface+logic': 'a face that thinks — an app that computes but forgets on every refresh',
	'interface+data': 'a face on memory — records people can browse, nothing computes yet',
	'interface+infra': 'a live page on real ground — no brain or memory behind it yet',
	'logic+data': 'thinking over memory — the working core of a pipeline or a report',
	'logic+infra': 'code with ground to run on — a bot, a scheduled job, an automation',
	'data+infra': 'memory on real ground — a hosted database, ready for tools on top',
	'interface+logic+data': 'a whole app missing only ground — it works, it just needs somewhere to live',
	'interface+logic+infra': 'a live app that forgets — give it memory and it keeps records',
	'interface+data+infra': 'a live window onto records — add thinking and it can act on them',
	'logic+data+infra': 'a headless system — an automation with memory; only the face is missing',
	'interface+logic+data+infra': 'all four layers — the shape of a complete, working product',
};

/**
 * Read a shape's coverage from the matrix. Total over every present-set the
 * engine can produce; the empty set (defensive — every published tech carries
 * a layer today) gets a gentle prompt instead of a blank.
 */
export function readShape(present: readonly StackLayer[]): string {
	return (
		SHAPE_READINGS[present.join('+')] ??
		'no layers covered yet — pick a part with a layer to give the build a shape'
	);
}

/**
 * English indefinite article for a layer name — ONE source so the gap line
 * ("add an interface layer + a data layer…") and the mini-blueprint ghost
 * annotations ("+ add an interface layer") can never disagree (round 3).
 */
export function layerArticle(layer: StackLayer): 'a' | 'an' {
	return layer === 'interface' || layer === 'infra' ? 'an' : 'a';
}

// ── Finale (4c): THE PHRASE BUILDER — the layer grammar. ────────────────────

/** A drawable pick, as the matcher already shapes them. */
export interface PhrasePick {
	id: string;
	layer: StackLayer;
}

/** A phrase slot: 'subject' opens the sentence; the layer slots clause it. */
type PhraseSlot = 'subject' | StackLayer;

/**
 * The market-domain vocabulary — small, code-owned, deliberately LEAN. Each
 * entry lets a tech re-voice phrase slots with its domain language; slots it
 * doesn't claim (and every tech NOT in this map — unknown and future roster
 * techs included) fall back to the layer-generic fragments below, so the
 * grammar stays total and self-extending. A tech's fragment for a slot only
 * speaks when that slot's layer is actually covered by the picks.
 */
export const TECH_VOICES: Record<string, Partial<Record<PhraseSlot, string>>> = {
	// Commerce — shopify makes the whole sentence speak storefront/checkout.
	shopify: {
		subject: 'a fast storefront with built-in checkout',
		data: 'remembers every order',
	},
	// Reporting — the numbers people actually read on Monday.
	'power-bi': { data: 'turns the numbers into reports anyone can read' },
	dax: { data: 'does the report math honestly' },
	// Pipelines — moving and cleaning data on schedule.
	airflow: { logic: 'runs the data pipeline on schedule' },
	dbt: { logic: 'keeps every pipeline transform clean and tested' },
};

/** Layer-generic subject (when that layer LEADS the sentence). */
const PHRASE_SUBJECTS: Record<StackLayer, string> = {
	interface: 'a fast, friendly site',
	logic: 'an automation',
	data: 'a well-kept memory',
	infra: 'solid, dependable ground',
};

/** Layer-generic clause (what the covered layer DOES, market voice). The
 *  interface clause never fires today (interface always leads when present —
 *  STACK_LAYERS order) but is defined so the grammar stays total. */
const PHRASE_CLAUSES: Record<StackLayer, string> = {
	interface: 'puts a friendly face on it',
	logic: 'runs the busy work on its own',
	data: 'keeps clean records',
	infra: 'ships itself reliably',
};

const layerIndex = new Map<StackLayer, number>(STACK_LAYERS.map((l, i) => [l, i]));

/**
 * Compose the market-friendly product sentence for a pick set (finale 4c).
 *
 * Grammar: SUBJECT (from the leading covered layer) + 'that' + one clause per
 * remaining covered layer, joined as a list. Each slot prefers the domain
 * voices of the picked techs (TECH_VOICES, roster order, deduped — ANY pick
 * may enrich any covered slot, so shopify colors the data clause with orders
 * even from the interface row); a slot nobody voices falls back to its
 * layer-generic fragment. Deterministic; total over every pick set including
 * the empty one (defensive prompt). en-only today, LocalizedString-shaped so
 * FR can come later.
 */
export function composePhrase(
	picks: readonly PhrasePick[],
	layers: readonly StackLayer[],
): LocalizedString {
	// Normalize defensively: drawable picks only, STACK_LAYERS-ordered roster
	// (stable within a layer), covered layers re-derived in render order.
	const roster = picks
		.filter((p) => layerIndex.has(p.layer))
		.map((p, i) => ({ ...p, i }))
		.sort((a, b) => layerIndex.get(a.layer)! - layerIndex.get(b.layer)! || a.i - b.i);
	const covered = new Set(layers.filter((l) => layerIndex.has(l)));
	for (const p of roster) covered.add(p.layer);
	const present = STACK_LAYERS.filter((l) => covered.has(l));

	if (present.length === 0 || roster.length === 0) {
		return { en: 'Pick a part — the sentence writes itself as you build.' };
	}

	const voiced = (slot: PhraseSlot, fromLayer?: StackLayer): string[] => {
		const out: string[] = [];
		for (const p of roster) {
			if (fromLayer && p.layer !== fromLayer) continue;
			const fragment = TECH_VOICES[p.id]?.[slot];
			if (fragment && !out.includes(fragment)) out.push(fragment);
		}
		return out;
	};

	// Subject: the leading covered layer names the product — its own picks may
	// re-voice it (first domain voice in roster order wins).
	const lead = present[0];
	const subject = voiced('subject', lead)[0] ?? PHRASE_SUBJECTS[lead];

	// Clauses: every covered layer except interface speaks once (interface is
	// pure face — it only ever leads). A leading non-interface layer still
	// clauses: an automation RUNS things. Domain voices of ANY pick first,
	// layer-generic fragment when nobody claims the slot.
	const clauses = present
		.filter((l) => l !== 'interface')
		.flatMap((l) => {
			const fragments = voiced(l);
			return fragments.length > 0 ? fragments : [PHRASE_CLAUSES[l]];
		});

	let sentence: string;
	if (clauses.length === 0) {
		sentence = `${subject}.`;
	} else if (clauses.length <= 2) {
		sentence = `${subject} that ${clauses.join(' and ')}.`;
	} else {
		sentence = `${subject} that ${clauses.slice(0, -1).join(', ')}, and ${clauses.at(-1)}.`;
	}

	return { en: sentence.charAt(0).toUpperCase() + sentence.slice(1) };
}

// ── Finale (4c): the guided journey + the operator's open door. ─────────────

/** The compose journey's stepper labels — teaching voice, code-owned,
 *  LocalizedString-shaped (en fallback today, FR can come later). */
export const JOURNEY_STEPS: readonly LocalizedString[] = [
	{ en: 'pick parts' },
	{ en: 'read your build' },
	{ en: 'see it as a product' },
	{ en: 'take it with you' },
];

/** The warm availability line woven next to the CTA — links to /contact.
 *  Small and homey, not a widget. */
export const AVAILABILITY_LINE: LocalizedString = {
	en: 'Questions? Ask me anything.',
};
