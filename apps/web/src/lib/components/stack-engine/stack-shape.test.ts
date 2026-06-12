// stack-shape tests (go2/w5, taste round 2 + finale 4c) — the build-shape
// composer, the 15-cell coverage matrix, and the PHRASE BUILDER behind the
// engine's always-on teaching card.

import { describe, it, expect } from 'vitest';
import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
import type { TechStackItem } from '$lib/types';
import {
	AVAILABILITY_LINE,
	composePhrase,
	composeStackShape,
	JOURNEY_STEPS,
	layerArticle,
	readShape,
	SHAPE_READINGS,
	TECH_VOICES,
	type PhrasePick,
} from './stack-shape';
import { techStackItems } from '$lib/content/tech-stack';

// Minimal fixture items — only id + layer matter to the composer.
const item = (id: string, layer?: TechStackItem['layer']): TechStackItem =>
	({ id, name: id, layer }) as TechStackItem;

const FIXTURE: TechStackItem[] = [
	item('svelte', 'interface'),
	item('three', 'interface'),
	item('api', 'logic'),
	item('pg', 'data'),
	item('docker', 'infra'),
	item('layerless'),
];

describe('composeStackShape', () => {
	it('empty picks → nothing present, all four layers missing (STACK_LAYERS order)', () => {
		const shape = composeStackShape([], FIXTURE);
		expect(shape.present).toEqual([]);
		expect(shape.missing).toEqual([...STACK_LAYERS]);
	});

	it('one interface pick → present [interface], missing the other three in order', () => {
		const shape = composeStackShape(['three'], FIXTURE);
		expect(shape.present).toEqual(['interface']);
		expect(shape.missing).toEqual(['logic', 'data', 'infra']);
	});

	it('dedups layers and orders present by STACK_LAYERS regardless of pick order', () => {
		const shape = composeStackShape(['docker', 'svelte', 'three'], FIXTURE);
		expect(shape.present).toEqual(['interface', 'infra']);
		expect(shape.missing).toEqual(['logic', 'data']);
	});

	it('all four layers covered → missing empty (the complete shape)', () => {
		const shape = composeStackShape(['svelte', 'api', 'pg', 'docker'], FIXTURE);
		expect(shape.present).toEqual([...STACK_LAYERS]);
		expect(shape.missing).toEqual([]);
	});

	it('ignores unknown ids and layerless techs (defensive)', () => {
		const shape = composeStackShape(['layerless', 'nope', 'pg'], FIXTURE);
		expect(shape.present).toEqual(['data']);
		expect(shape.missing).toEqual(['interface', 'logic', 'infra']);
	});

	it('works against the committed tech module (threejs-threlte → interface-only shape)', () => {
		const shape = composeStackShape(['threejs-threlte'], techStackItems);
		expect(shape.present).toEqual(['interface']);
		expect(shape.missing).toEqual(['logic', 'data', 'infra']);
	});
});

describe('readShape — the coverage matrix is TOTAL (taste round 2)', () => {
	it('has a hand-written reading for every one of the 15 non-empty layer combinations', () => {
		// Enumerate the powerset of STACK_LAYERS minus the empty set.
		const layers = [...STACK_LAYERS];
		const subsets: StackLayer[][] = [];
		for (let mask = 1; mask < 1 << layers.length; mask++) {
			subsets.push(layers.filter((_, i) => mask & (1 << i)));
		}
		expect(subsets).toHaveLength(15);
		expect(Object.keys(SHAPE_READINGS)).toHaveLength(15);
		for (const subset of subsets) {
			const reading = readShape(subset);
			expect(reading, `subset ${subset.join('+')} must have its own reading`).toBe(
				SHAPE_READINGS[subset.join('+')],
			);
			expect(reading.length).toBeGreaterThan(0);
			// One scannable line — readings are card copy, not paragraphs.
			expect(reading.length).toBeLessThanOrEqual(90);
		}
	});

	it("pins the operator's example: logic + infra reads as an automation", () => {
		expect(readShape(['logic', 'infra'])).toBe(
			'code with ground to run on — a bot, a scheduled job, an automation',
		);
	});

	it('pins the complete shape reading', () => {
		expect(readShape([...STACK_LAYERS])).toBe(
			'all four layers — the shape of a complete, working product',
		);
	});

	it('empty coverage (defensive — layerless-only picks) gets a prompt, never a blank', () => {
		expect(readShape([])).toContain('no layers covered yet');
	});
});

describe('layerArticle — one source for the gap line AND the ghost annotations (round 3)', () => {
	it('an interface / a logic / a data / an infra', () => {
		expect(layerArticle('interface')).toBe('an');
		expect(layerArticle('logic')).toBe('a');
		expect(layerArticle('data')).toBe('a');
		expect(layerArticle('infra')).toBe('an');
	});
});

// ── Finale (4c): THE PHRASE BUILDER. ────────────────────────────────────────

describe('composePhrase — the layer grammar speaks market, not category', () => {
	const pick = (id: string, layer: StackLayer): PhrasePick => ({ id, layer });
	const layersOf = (picks: readonly PhrasePick[]): StackLayer[] =>
		STACK_LAYERS.filter((l) => picks.some((p) => p.layer === l));
	const phrase = (picks: readonly PhrasePick[]): string =>
		composePhrase(picks, layersOf(picks)).en;

	it('OPERATOR PIN: sveltekit+shopify+postgresql+power-bi speaks storefront, checkout, orders, reports', () => {
		// shopify lands at the next regen — the grammar already speaks it
		// (vocabulary is keyed by id, picks carry their layer: data-driven).
		const sentence = phrase([
			pick('sveltekit', 'interface'),
			pick('shopify', 'interface'),
			pick('postgresql', 'data'),
			pick('power-bi', 'data'),
		]);
		expect(sentence).toContain('storefront');
		expect(sentence).toContain('checkout');
		expect(sentence).toMatch(/remembers/i);
		expect(sentence).toContain('order');
		expect(sentence).toContain('reports');
		// One confident product sentence — capitalized, period-closed.
		expect(sentence).toMatch(/^[A-Z]/);
		expect(sentence.endsWith('.')).toBe(true);
	});

	it('OPERATOR PIN: node.js + github-actions composes an automation phrase', () => {
		const sentence = phrase([pick('node-js', 'logic'), pick('github-actions', 'infra')]);
		expect(sentence).toMatch(/automation/i);
		expect(sentence).toContain('ships itself reliably');
	});

	it('airflow/dbt color the sentence with pipeline language', () => {
		const sentence = phrase([pick('airflow', 'logic'), pick('dbt', 'logic')]);
		expect(sentence).toMatch(/pipeline/);
	});

	it('dax speaks reporting even as the only voiced pick', () => {
		const sentence = phrase([pick('dax', 'data')]);
		expect(sentence).toContain('report');
	});

	it("a domain voice only speaks when its slot's layer is covered (shopify alone ≠ orders)", () => {
		const sentence = phrase([pick('shopify', 'interface')]);
		expect(sentence).toContain('storefront');
		expect(sentence).not.toContain('order');
	});

	it('TOTAL: every one of the 15 layer subsets with UNKNOWN techs composes a full sentence', () => {
		const layers = [...STACK_LAYERS];
		for (let mask = 1; mask < 1 << layers.length; mask++) {
			const present = layers.filter((_, i) => mask & (1 << i));
			const picks = present.map((l) => pick(`future-tech-${l}`, l));
			const sentence = phrase(picks);
			expect(sentence.length, `subset ${present.join('+')}`).toBeGreaterThan(10);
			expect(sentence).toMatch(/^[A-Z]/);
			expect(sentence.endsWith('.')).toBe(true);
			// Layer-generic fragments carry unknown techs (self-extending grammar).
			if (present[0] === 'logic') expect(sentence).toContain('automation');
			if (present.includes('infra')) expect(sentence).toContain('ships itself reliably');
		}
	});

	it('deterministic: same picks in, identical sentence out — pick order does not matter', () => {
		const a = [pick('postgresql', 'data'), pick('sveltekit', 'interface')];
		const b = [pick('sveltekit', 'interface'), pick('postgresql', 'data')];
		expect(composePhrase(a, layersOf(a))).toEqual(composePhrase(b, layersOf(b)));
	});

	it('LocalizedString-shaped, en-only for now (FR can come later); empty picks get a gentle prompt', () => {
		const result = composePhrase([], []);
		expect(Object.keys(result)).toEqual(['en']);
		expect(result.en).toContain('Pick a part');
		// Every vocabulary fragment is a plain string — the lean code-owned map.
		for (const voice of Object.values(TECH_VOICES)) {
			for (const fragment of Object.values(voice)) {
				expect(typeof fragment).toBe('string');
			}
		}
	});
});

describe('finale 4c — journey steps + the availability line (code-owned, en fallback)', () => {
	it('the stepper walks pick → read → product → take it with you', () => {
		expect(JOURNEY_STEPS.map((s) => s.en)).toEqual([
			'pick parts',
			'read your build',
			'see it as a product',
			'take it with you',
		]);
	});

	it("the operator's open door is warm, small, and homey", () => {
		expect(AVAILABILITY_LINE.en).toBe("Questions? I'm online — ask me anything.");
	});
});
