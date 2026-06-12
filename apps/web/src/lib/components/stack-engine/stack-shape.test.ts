// stack-shape tests (go2/w5, taste round 2) — the build-shape composer and
// the 15-cell coverage matrix behind the engine's always-on teaching card.

import { describe, it, expect } from 'vitest';
import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
import type { TechStackItem } from '$lib/types';
import { composeStackShape, layerArticle, readShape, SHAPE_READINGS } from './stack-shape';
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
