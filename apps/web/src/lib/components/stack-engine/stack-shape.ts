// stack-shape (go2/w5 — engine layered learning, taste round 2, finale 4c) —
// the pure helpers behind the engine's ALWAYS-ON build-shape teaching.
//
// Taste round 2 (operator verdict): the composed project shape is no longer a
// zero-match fallback — it is the PRIMARY teaching surface of compose mode.
// The matrix is layer coverage, not tech pairs: every pick maps to one of the
// four STACK_LAYERS, so any pick set covers one of 15 possible layer
// combinations, and every combination has a hand-written reading of what
// those layers can do TOGETHER. Total function: no pick combo ever teaches
// nothing. (AND-matched archetypes remain a bonus rail of "known builds".)
//
// Finale (4c) — THE PHRASE BUILDER: composePhrase() turns a pick set into a
// market-friendly product sentence via a layer grammar (subject from the
// leading layer + one clause per covered layer), enriched by a small
// code-owned TECH_VOICES vocabulary (shopify speaks storefront/checkout,
// power-bi/dax speak reporting, airflow/dbt speak pipelines). Unknown/future
// techs fall back to layer-generic fragments, so the grammar is TOTAL and
// self-extending, the 28-tech roster landing at the next regen Just Works.
//
// go2 FR pass: every user-visible reading/voice/fragment is now LocalizedString
// ({ en, fr }) and composePhrase builds BOTH locales (the grammar joins are
// locale-aware: EN "that … and …", QC FR "qui … pis …"). Tech/product names
// (shopify, power-bi, dax, …) are never translated.
//
// Pure data-in/data-out — fully covered by stack-shape.test.ts.

import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
import type { Locale, LocalizedString, TechStackItem } from '$lib/types';
import { resolveLocale } from '$lib/utils/locale';

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
export const SHAPE_READINGS: Record<string, LocalizedString> = {
	interface: {
		en: 'a face with nothing behind it yet, pure look and feel',
		fr: 'une façade sans rien en arrière encore, juste le look pis le feeling',
	},
	logic: {
		en: 'thinking with nowhere to show it, a script, the seed of an automation',
		fr: 'de la réflexion sans place pour la montrer, un script, le début d\'une automatisation',
	},
	data: {
		en: 'memory with nothing using it yet, records kept safe and queryable',
		fr: 'de la mémoire sans rien qui s\'en sert encore, des données gardées au chaud pis interrogeables',
	},
	infra: {
		en: 'ground with nothing standing on it yet, a place for software to live',
		fr: 'du terrain sans rien dessus encore, une place où le logiciel peut vivre',
	},
	'interface+logic': {
		en: 'a face that thinks, an app that computes but forgets on every refresh',
		fr: 'une façade qui réfléchit, une app qui calcule mais oublie tout à chaque refresh',
	},
	'interface+data': {
		en: 'a face on memory, records people can browse, nothing computes yet',
		fr: 'une façade sur de la mémoire, des données que le monde peut fouiller, rien calcule encore',
	},
	'interface+infra': {
		en: 'a live page on real ground, no brain or memory behind it yet',
		fr: 'une page en ligne sur du vrai terrain, pas encore de cerveau ni de mémoire en arrière',
	},
	'logic+data': {
		en: 'thinking over memory, the working core of a pipeline or a report',
		fr: 'de la réflexion sur de la mémoire, le cœur d\'un pipeline ou d\'un rapport',
	},
	'logic+infra': {
		en: 'code with ground to run on, a bot, a scheduled job, an automation',
		fr: 'du code avec du terrain pour rouler, un bot, une job planifiée, une automatisation',
	},
	'data+infra': {
		en: 'memory on real ground, a hosted database, ready for tools on top',
		fr: 'de la mémoire sur du vrai terrain, une base de données hébergée, prête pour des outils par-dessus',
	},
	'interface+logic+data': {
		en: 'a whole app missing only ground, it works, it just needs somewhere to live',
		fr: 'une app au complet à qui il manque juste le terrain, ça marche, ça a juste besoin d\'une place pour vivre',
	},
	'interface+logic+infra': {
		en: 'a live app that forgets, give it memory and it keeps records',
		fr: 'une app en ligne qui oublie, donne-y de la mémoire pis a garde les données',
	},
	'interface+data+infra': {
		en: 'a live window onto records, add thinking and it can act on them',
		fr: 'une fenêtre en ligne sur les données, ajoute de la réflexion pis a peut agir dessus',
	},
	'logic+data+infra': {
		en: 'a headless system, an automation with memory; only the face is missing',
		fr: 'un système sans façade, une automatisation avec de la mémoire; il manque juste la face',
	},
	'interface+logic+data+infra': {
		en: 'all four layers, the shape of a complete, working product',
		fr: 'les quatre couches, la forme d\'un produit complet pis fonctionnel',
	},
};

/** Defensive prompt when no layer is covered (every published tech carries a
 *  layer today, so this is a guard, never a normal path). */
const EMPTY_SHAPE_READING: LocalizedString = {
	en: 'no layers covered yet, pick a part with a layer to give the build a shape',
	fr: 'aucune couche couverte encore, choisis un morceau avec une couche pour donner une forme au build',
};

/**
 * Read a shape's coverage from the matrix. Total over every present-set the
 * engine can produce; the empty set (defensive — every published tech carries
 * a layer today) gets a gentle prompt instead of a blank.
 */
export function readShape(present: readonly StackLayer[]): LocalizedString {
	return SHAPE_READINGS[present.join('+')] ?? EMPTY_SHAPE_READING;
}

/**
 * English indefinite article for a layer name — ONE source so the gap line
 * ("add an interface layer + a data layer…") and the mini-blueprint ghost
 * annotations ("+ add an interface layer") can never disagree (round 3).
 */
export function layerArticle(layer: StackLayer): 'a' | 'an' {
	return layer === 'interface' || layer === 'infra' ? 'an' : 'a';
}

/** The Québécois gap-line fragment for a missing layer ("une couche interface"
 *  etc.). The layer KEY stays verbatim (it doubles as the printed label); only
 *  the article + "couche" wrap it. ONE source for the FR gap line and the FR
 *  ghost annotations so they can never disagree (round 3 parity). */
export function layerGapFr(layer: StackLayer): string {
	return `une couche ${layer}`;
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
 * Values are LocalizedString ({ en, fr }); the tech KEYS are product names and
 * stay verbatim.
 */
export const TECH_VOICES: Record<string, Partial<Record<PhraseSlot, LocalizedString>>> = {
	// Commerce — shopify makes the whole sentence speak storefront/checkout.
	shopify: {
		subject: {
			en: 'a fast storefront with built-in checkout',
			fr: 'un storefront rapide avec le checkout intégré',
		},
		data: { en: 'remembers every order', fr: 'se souvient de chaque order' },
	},
	// Reporting — the numbers people actually read on Monday.
	'power-bi': {
		data: {
			en: 'turns the numbers into reports anyone can read',
			fr: 'transforme les chiffres en reports que tout le monde peut lire',
		},
	},
	dax: {
		data: { en: 'does the report math honestly', fr: 'fait le calcul des reports comme du monde' },
	},
	// Pipelines — moving and cleaning data on schedule.
	airflow: {
		logic: { en: 'runs the data pipeline on schedule', fr: 'roule le pipeline de données sur l\'horaire' },
	},
	dbt: {
		logic: {
			en: 'keeps every pipeline transform clean and tested',
			fr: 'garde chaque transformation du pipeline propre pis testée',
		},
	},
};

/** Layer-generic subject (when that layer LEADS the sentence). */
const PHRASE_SUBJECTS: Record<StackLayer, LocalizedString> = {
	interface: { en: 'a fast, friendly site', fr: 'un site rapide pis accueillant' },
	logic: { en: 'an automation', fr: 'une automatisation' },
	data: { en: 'a well-kept memory', fr: 'une mémoire bien tenue' },
	infra: { en: 'solid, dependable ground', fr: 'du terrain solide pis fiable' },
};

/** Layer-generic clause (what the covered layer DOES, market voice). The
 *  interface clause never fires today (interface always leads when present —
 *  STACK_LAYERS order) but is defined so the grammar stays total. */
const PHRASE_CLAUSES: Record<StackLayer, LocalizedString> = {
	interface: { en: 'puts a friendly face on it', fr: 'y met une face accueillante' },
	logic: { en: 'runs the busy work on its own', fr: 'fait l\'ouvrage plate tout seul' },
	data: { en: 'keeps clean records', fr: 'garde des données propres' },
	infra: { en: 'ships itself reliably', fr: 'se déploie tout seul, fiable' },
};

/** Sentence-assembly grammar per locale: the connector after the subject and
 *  the final-list conjunction. EN "that … and …"; QC FR "qui … pis …". */
const PHRASE_GRAMMAR: Record<Locale, { connector: string; and: string }> = {
	en: { connector: 'that', and: 'and' },
	fr: { connector: 'qui', and: 'pis' },
	es: { connector: 'that', and: 'and' },
};

/** The gentle empty-pick prompt — the sentence writes itself as you build. */
const PHRASE_EMPTY: LocalizedString = {
	en: 'Pick a part, the sentence writes itself as you build.',
	fr: 'Choisis un morceau, la phrase s\'écrit toute seule à mesure que tu bâtis.',
};

const layerIndex = new Map<StackLayer, number>(STACK_LAYERS.map((l, i) => [l, i]));

/**
 * Compose the market-friendly product sentence for a pick set (finale 4c).
 *
 * Grammar: SUBJECT (from the leading covered layer) + connector + one clause
 * per remaining covered layer, joined as a list. Each slot prefers the domain
 * voices of the picked techs (TECH_VOICES, roster order, deduped — ANY pick
 * may enrich any covered slot, so shopify colors the data clause with orders
 * even from the interface row); a slot nobody voices falls back to its
 * layer-generic fragment. Deterministic; total over every pick set including
 * the empty one (defensive prompt). Built in EN and QC FR.
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
		return { ...PHRASE_EMPTY };
	}

	const voiced = (slot: PhraseSlot, locale: Locale, fromLayer?: StackLayer): string[] => {
		const out: string[] = [];
		for (const p of roster) {
			if (fromLayer && p.layer !== fromLayer) continue;
			const value = TECH_VOICES[p.id]?.[slot];
			if (!value) continue;
			const fragment = resolveLocale(value, locale);
			if (!out.includes(fragment)) out.push(fragment);
		}
		return out;
	};

	const lead = present[0];

	const buildFor = (locale: Locale): string => {
		// Subject: the leading covered layer names the product — its own picks
		// may re-voice it (first domain voice in roster order wins).
		const subject = voiced('subject', locale, lead)[0] ?? resolveLocale(PHRASE_SUBJECTS[lead], locale);

		// Clauses: every covered layer except interface speaks once (interface
		// is pure face — it only ever leads). A leading non-interface layer
		// still clauses: an automation RUNS things. Domain voices of ANY pick
		// first, layer-generic fragment when nobody claims the slot.
		const clauses = present
			.filter((l) => l !== 'interface')
			.flatMap((l) => {
				const fragments = voiced(l, locale);
				return fragments.length > 0 ? fragments : [resolveLocale(PHRASE_CLAUSES[l], locale)];
			});

		const g = PHRASE_GRAMMAR[locale];
		let sentence: string;
		if (clauses.length === 0) {
			sentence = `${subject}.`;
		} else if (clauses.length <= 2) {
			sentence = `${subject} ${g.connector} ${clauses.join(` ${g.and} `)}.`;
		} else {
			sentence = `${subject} ${g.connector} ${clauses.slice(0, -1).join(', ')}, ${g.and} ${clauses.at(-1)}.`;
		}
		return sentence.charAt(0).toUpperCase() + sentence.slice(1);
	};

	return { en: buildFor('en'), fr: buildFor('fr') };
}

// ── Finale (4c): the guided journey + the operator's open door. ─────────────

/** The compose journey's stepper labels — teaching voice, code-owned,
 *  LocalizedString ({ en, fr }). */
export const JOURNEY_STEPS: readonly LocalizedString[] = [
	{ en: 'pick parts', fr: 'choisis des morceaux' },
	{ en: 'read your build', fr: 'lis ton build' },
	{ en: 'see it as a product', fr: 'vois-le comme un produit' },
	{ en: 'take it with you', fr: 'apporte-le avec toi' },
];

/** The warm availability line woven next to the CTA — links to /contact.
 *  Small and homey, not a widget. */
export const AVAILABILITY_LINE: LocalizedString = {
	en: 'Questions? Ask me anything.',
	fr: 'Des questions? Demande-moi n\'importe quoi.',
};
