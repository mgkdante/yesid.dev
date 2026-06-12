// stack-shape tests (go2/w5) — the zero-match project-shape composer.

import { describe, it, expect } from 'vitest';
import { STACK_LAYERS } from '@repo/shared/schemas';
import type { TechStackItem } from '$lib/types';
import { composeStackShape } from './stack-shape';
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
