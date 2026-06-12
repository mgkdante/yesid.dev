// blueprint-connectivity (go2/w5 finale, 4b) — TOTAL CONNECTIVITY lock.
//
// "We really want a complete engine": no orphan boxes EVER. Every rendered
// box must participate in the connector graph — boxes + connectors form ONE
// connected component, ghosts included. This suite proves it over
// layoutBlueprint output for:
//   - all 12 committed archetypes (wide AND stacked) — data-driven, so the
//     28-tech roster landing at the next regen is covered automatically;
//   - every one of the 15 layer subsets, ghost-filled the way ShapeBlueprint
//     synthesizes them;
//   - multi-box rows (the parallel-chain trap: [A B] over [C D] used to split
//     into two chains under nearest-only wiring — rails forbid it);
//   - big wrapped pick sets (8, 15, 21 = every committed tech at once).

import { describe, it, expect } from 'vitest';
import { STACK_LAYERS, type ArchetypeTechLink, type StackLayer } from '@repo/shared/schemas';
import { layoutBlueprint, type BlueprintLayout } from './blueprint-layout';
import { stackArchetypes } from '$lib/content/stack-archetypes';
import { techStackItems } from '$lib/content/tech-stack';

const link = (id: string, layer: StackLayer, sort = 0): ArchetypeTechLink => ({
	id,
	layer,
	sort,
});

/** Union-find connected-component count over a layout's boxes + connectors. */
function componentCount(layout: BlueprintLayout): number {
	const parent = new Map<string, string>();
	const find = (x: string): string => {
		let root = x;
		while (parent.get(root) !== root) root = parent.get(root)!;
		return root;
	};
	for (const box of layout.boxes) parent.set(box.id, box.id);
	for (const c of layout.connectors) {
		// Every connector endpoint must be a real rendered box — no dangling wires.
		expect(parent.has(c.from), `connector from unknown box ${c.from}`).toBe(true);
		expect(parent.has(c.to), `connector to unknown box ${c.to}`).toBe(true);
		parent.set(find(c.from), find(c.to));
	}
	return new Set([...parent.keys()].map(find)).size;
}

const expectConnected = (links: readonly ArchetypeTechLink[], label: string): void => {
	for (const stacked of [false, true]) {
		const layout = layoutBlueprint(links, { stacked });
		if (layout.boxes.length === 0) continue;
		expect(
			componentCount(layout),
			`${label} (${stacked ? 'stacked' : 'wide'}) must be ONE component`,
		).toBe(1);
	}
};

describe('finale connectivity — every box joins one connected graph', () => {
	it('all 12 committed archetypes draw as a single component (wide + stacked)', () => {
		expect(stackArchetypes.length).toBeGreaterThanOrEqual(12);
		for (const archetype of stackArchetypes) {
			expectConnected(archetype.tech, archetype.slug);
		}
	});

	it('every one of the 15 layer subsets, ghost-filled like ShapeBlueprint, is one component', () => {
		const layers = [...STACK_LAYERS];
		for (let mask = 1; mask < 1 << layers.length; mask++) {
			const present = layers.filter((_, i) => mask & (1 << i));
			const missing = layers.filter((l) => !present.includes(l));
			const links = [
				...present.map((l, i) => link(`tech-${l}`, l, i)),
				...missing.map((l) => link(`ghost-${l}`, l)),
			];
			expectConnected(links, `subset ${present.join('+')}`);
		}
	});

	it('the parallel-chain trap: 2×2 (and 3×3) multi-box rows stay one component', () => {
		expectConnected(
			[link('a', 'interface', 1), link('b', 'interface', 2), link('c', 'data', 1), link('d', 'data', 2)],
			'2×2 parallel rows',
		);
		expectConnected(
			Array.from({ length: 3 }, (_, i) => [
				link(`ui${i}`, 'interface', i),
				link(`db${i}`, 'data', i),
			]).flat(),
			'3×3 parallel rows',
		);
	});

	it('big wrapped pick sets (8 and 15 picks, ghosts included) stay one component', () => {
		const heavy = (n: number): ArchetypeTechLink[] =>
			Array.from({ length: n }, (_, i) => {
				const layer =
					i < Math.ceil(n / 2) ? 'interface' : (['logic', 'data'] as const)[i % 2];
				return link(`t${i}`, layer, i);
			});
		expectConnected([...heavy(8), link('ghost-infra', 'infra')], '8 picks + ghost');
		expectConnected([...heavy(15), link('ghost-infra', 'infra')], '15 picks + ghost');
	});

	it('the WHOLE committed roster picked at once is one component (data-driven: any future roster too)', () => {
		const links = techStackItems
			.filter((t): t is typeof t & { layer: StackLayer } =>
				Boolean(t.layer && (STACK_LAYERS as readonly string[]).includes(t.layer)),
			)
			.map((t, i) => link(t.id, t.layer, i));
		expect(links.length).toBeGreaterThanOrEqual(21);
		expectConnected(links, 'entire committed roster');
	});
});
