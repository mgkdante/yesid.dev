// ShapeBlueprint tests (go2/w5 round 3) — the build shape IS a blueprint.
//
// The always-teaching surface renders the composed pick-set as a real
// mini-blueprint over the existing layoutBlueprint machinery: picked techs as
// SOLID boxes in their layer rows, every MISSING layer as one ghosted/dashed
// placeholder (bp-ghost treatment) with an '+ add a {layer} layer' annotation,
// connectors between adjacent rows (dashed when they touch a ghost).
//
// The 15-subset totality extension lives here: for EVERY non-empty layer
// subset of the SHAPE_READINGS matrix, the drawing must render with
// solid count = picked and ghost count = missing layers — in BOTH the wide
// and the stacked (mobile) variants.

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { STACK_LAYERS, type StackLayer } from '@repo/shared/schemas';
import ShapeBlueprint from './ShapeBlueprint.svelte';

interface Pick {
	id: string;
	name: string;
	layer: StackLayer;
}

const pick = (id: string, layer: StackLayer, name = id): Pick => ({ id, name, layer });

const missingOf = (present: readonly StackLayer[]): StackLayer[] =>
	STACK_LAYERS.filter((l) => !present.includes(l));

/** Every non-empty subset of STACK_LAYERS — the SHAPE_READINGS key space. */
const subsets: StackLayer[][] = [];
for (let mask = 1; mask < 1 << STACK_LAYERS.length; mask++) {
	subsets.push(STACK_LAYERS.filter((_, i) => mask & (1 << i)));
}

describe('ShapeBlueprint — the mini-blueprint is total over the 15-subset matrix', () => {
	it('enumerates all 15 non-empty layer subsets', () => {
		expect(subsets).toHaveLength(15);
	});

	for (const variant of ['wide', 'stacked'] as const) {
		it(`${variant}: every subset draws solid count = picked, ghost count = missing layers`, () => {
			for (const present of subsets) {
				const picked = present.map((l) => pick(`tech-${l}`, l));
				const missing = missingOf(present);
				const { unmount, container } = render(ShapeBlueprint, {
					props: { picked, missing, stacked: variant === 'stacked' },
				});
				const svg = container.querySelector('[data-testid="shape-blueprint"]')!;
				expect(svg, `subset ${present.join('+')} must draw`).toBeTruthy();
				expect(
					svg.querySelectorAll('.sbp-box-solid'),
					`subset ${present.join('+')}: solid boxes = picks`,
				).toHaveLength(picked.length);
				expect(
					svg.querySelectorAll('.sbp-box-ghost'),
					`subset ${present.join('+')}: ghost boxes = missing layers`,
				).toHaveLength(missing.length);
				// All four rows are always on the drawing (ghosts fill the gaps)
				// → with one box per row, three connectors chain them.
				expect(svg.querySelectorAll('.sbp-connector')).toHaveLength(3);
				unmount();
			}
		});
	}

	it('each ghost is labeled with its layer name AND an add-a-layer annotation (article-correct)', () => {
		// logic + data picked → interface and infra ghost.
		const { container } = render(ShapeBlueprint, {
			props: {
				picked: [pick('node-js', 'logic', 'Node.js'), pick('postgresql', 'data', 'PostgreSQL')],
				missing: ['interface', 'infra'] satisfies StackLayer[],
			},
		});
		const svg = container.querySelector('[data-testid="shape-blueprint"]')!;
		for (const layer of ['interface', 'infra'] as const) {
			const ghost = svg.querySelector(`[data-testid="sbp-ghost-${layer}"]`)!;
			expect(ghost, `${layer} ghost box`).toBeTruthy();
			expect(ghost.classList.contains('sbp-box-ghost')).toBe(true);
			expect(ghost.textContent).toContain(layer);
			// 'an interface'/'an infra' — same article source as the gap line.
			expect(
				svg.querySelector(`[data-testid="sbp-annotation-${layer}"]`)?.textContent,
			).toContain(`+ add an ${layer} layer`);
		}
		// The picked layers carry no ghosts and no annotations.
		expect(svg.querySelector('[data-testid="sbp-ghost-logic"]')).toBeNull();
		expect(svg.querySelector('[data-testid="sbp-annotation-data"]')).toBeNull();
	});

	it("solid boxes print the tech's display name and its layer tab", () => {
		const { container } = render(ShapeBlueprint, {
			props: {
				picked: [pick('postgresql', 'data', 'PostgreSQL')],
				missing: ['interface', 'logic', 'infra'] satisfies StackLayer[],
			},
		});
		const svg = container.querySelector('[data-testid="shape-blueprint"]')!;
		const solid = svg.querySelector('[data-testid="sbp-box-postgresql"]')!;
		expect(solid.textContent).toContain('PostgreSQL');
		expect(solid.querySelector('.sbp-box-tab')?.classList.contains('sbp-fill-data')).toBe(true);
		// Fun pass: the solid box carries the settle pop (keyed each → only new
		// boxes animate; a ghost flipping solid is visible IN the drawing).
		expect(solid.classList.contains('sbp-box-solid')).toBe(true);
	});

	it('connectors touching a ghost are dashed; solid-to-solid wiring is not', () => {
		// interface + logic picked, data + infra ghosted →
		// interface→logic solid, logic→data and data→infra ghost-dashed.
		const { container } = render(ShapeBlueprint, {
			props: {
				picked: [pick('sveltekit', 'interface', 'SvelteKit'), pick('rest-api', 'logic', 'REST API')],
				missing: ['data', 'infra'] satisfies StackLayer[],
			},
		});
		const svg = container.querySelector('[data-testid="shape-blueprint"]')!;
		const connectors = [...svg.querySelectorAll('.sbp-connector')];
		expect(connectors).toHaveLength(3);
		const ghostly = connectors.filter((c) => c.classList.contains('sbp-connector-ghost'));
		expect(ghostly).toHaveLength(2);
		const solidWire = connectors.find((c) => !c.classList.contains('sbp-connector-ghost'))!;
		expect(solidWire.getAttribute('data-from')).toBe('sveltekit');
		expect(solidWire.getAttribute('data-to')).toBe('rest-api');
		for (const wire of ghostly) {
			const ends = [wire.getAttribute('data-from'), wire.getAttribute('data-to')];
			expect(ends.some((id) => id?.startsWith('ghost-'))).toBe(true);
		}
	});

	it('multi-pick layers widen their row: connectors fan per box AND a rail ties the siblings (finale)', () => {
		const { container } = render(ShapeBlueprint, {
			props: {
				picked: [
					pick('sveltekit', 'interface', 'SvelteKit'),
					pick('threejs-threlte', 'interface', 'Three.js + Threlte'),
					pick('postgresql', 'data', 'PostgreSQL'),
				],
				missing: ['logic', 'infra'] satisfies StackLayer[],
			},
		});
		const svg = container.querySelector('[data-testid="shape-blueprint"]')!;
		expect(svg.querySelectorAll('.sbp-box-solid')).toHaveLength(3);
		expect(svg.querySelectorAll('.sbp-box-ghost')).toHaveLength(2);
		// Rows: [iface, iface], [ghost-logic], [pg], [ghost-infra] →
		// 2 + 1 + 1 = 4 flow wires + ONE sibling rail (total connectivity:
		// no orphan boxes, the two interface picks share the circuit).
		expect(
			svg.querySelectorAll('.sbp-connector:not(.sbp-connector-rail)'),
		).toHaveLength(4);
		const rails = svg.querySelectorAll('.sbp-connector-rail');
		expect(rails).toHaveLength(1);
		expect(rails[0].getAttribute('data-from')).toBe('sveltekit');
		expect(rails[0].getAttribute('data-to')).toBe('threejs-threlte');
	});

	it('finale 4b readability floor: the drawing renders 1:1 in a pan wrapper and WRAPS crowded layers', () => {
		// 6 interface picks + 1 data → the interface band wraps into 4 + 2.
		const picked = [
			...Array.from({ length: 6 }, (_, i) => pick(`ui-${i}`, 'interface', `UI ${i}`)),
			pick('postgresql', 'data', 'PostgreSQL'),
		];
		const { container } = render(ShapeBlueprint, {
			props: { picked, missing: ['logic', 'infra'] satisfies StackLayer[] },
		});
		// Natural width caps at the 4-box wrap line: 4×160 + 3×24 = 712, plus
		// 2×PAD 48 + LABEL_GUTTER 64 = 824 — and the svg renders EXACTLY that
		// wide (render scale = 1, the floor), inside the horizontal pan rail.
		const svg = container.querySelector(
			'[data-testid="shape-blueprint"]',
		) as SVGSVGElement;
		expect(svg.style.width).toBe('824px');
		expect(svg.style.maxWidth).toBe('');
		expect(container.querySelector('[data-testid="shape-blueprint-pan"]')).toBeTruthy();
		// The interface band holds two lines; every box keeps full geometry.
		const uiYs = new Set(
			[...svg.querySelectorAll('.sbp-box-solid .sbp-box-rect')].map((r) =>
				r.getAttribute('y'),
			),
		);
		expect(uiYs.size).toBeGreaterThanOrEqual(3); // 2 interface lines + data row
		for (const rect of svg.querySelectorAll('.sbp-box-rect')) {
			expect(rect.getAttribute('width')).toBe('160');
			expect(rect.getAttribute('height')).toBe('48');
		}
		// One label per LAYER BAND — wrapped lines never duplicate their name.
		const labels = [...svg.querySelectorAll('.sbp-row-label')].map((l) => l.textContent?.trim());
		expect(labels).toEqual(['interface', 'logic', 'data', 'infra']);
	});

	it('title block: REV 0 while drafting, REV A when all four layers are covered', () => {
		const drafting = render(ShapeBlueprint, {
			props: {
				picked: [pick('postgresql', 'data', 'PostgreSQL')],
				missing: ['interface', 'logic', 'infra'] satisfies StackLayer[],
			},
		});
		let stamp = drafting.container.querySelector('[data-testid="shape-blueprint-stamp"]')!;
		expect(stamp.textContent).toContain('YOUR BUILD');
		expect(stamp.textContent).toContain('REV 0 · 1 part · 1/4 layers');
		drafting.unmount();

		render(ShapeBlueprint, {
			props: {
				picked: [
					pick('sveltekit', 'interface', 'SvelteKit'),
					pick('rest-api', 'logic', 'REST API'),
					pick('postgresql', 'data', 'PostgreSQL'),
					pick('docker', 'infra', 'Docker'),
				],
				missing: [] satisfies StackLayer[],
			},
		});
		stamp = screen.getByTestId('shape-blueprint-stamp');
		expect(stamp.textContent).toContain('REV A · 4 parts · 4/4 layers');
	});

	it('aria-label narrates the drawing; drafting furniture is decorative', () => {
		const { container } = render(ShapeBlueprint, {
			props: {
				picked: [pick('node-js', 'logic', 'Node.js'), pick('github-actions', 'infra', 'GitHub Actions')],
				missing: ['interface', 'data'] satisfies StackLayer[],
			},
		});
		const svg = container.querySelector('[data-testid="shape-blueprint"]')!;
		expect(svg.getAttribute('role')).toBe('img');
		expect(svg.getAttribute('aria-label')).toBe(
			'Your build blueprint: 2 parts placed, 2 layers still to add',
		);
		expect(svg.querySelector('.sbp-grid')?.getAttribute('aria-hidden')).toBe('true');
		expect(svg.querySelectorAll('.sbp-reg-ticks path')).toHaveLength(4);
	});

	it('wide variant prints all four layer row labels (ghosts keep every row occupied); stacked prints none', () => {
		const props = {
			picked: [pick('postgresql', 'data', 'PostgreSQL')],
			missing: ['interface', 'logic', 'infra'] satisfies StackLayer[],
		};
		const wide = render(ShapeBlueprint, { props });
		const labels = [...wide.container.querySelectorAll('.sbp-row-label')].map((l) =>
			l.textContent?.trim(),
		);
		expect(labels).toEqual(['interface', 'logic', 'data', 'infra']);
		wide.unmount();

		const stacked = render(ShapeBlueprint, { props: { ...props, stacked: true } });
		expect(stacked.container.querySelectorAll('.sbp-row-label')).toHaveLength(0);
	});

	it('stacked mode is the blueprint-layout single column: straight wires, no gutter', () => {
		const { container } = render(ShapeBlueprint, {
			props: {
				picked: [pick('node-js', 'logic', 'Node.js'), pick('github-actions', 'infra', 'GitHub Actions')],
				missing: ['interface', 'data'] satisfies StackLayer[],
				stacked: true,
				testid: 'shape-blueprint-stacked',
			},
		});
		const svg = container.querySelector('[data-testid="shape-blueprint-stacked"]')!;
		// Stacked layout: width = BOX_W 160 + 2×PAD 24 = 208, no label gutter —
		// rendered 1:1 (finale floor: style.width, not a shrinkable max-width).
		expect((svg as SVGSVGElement).style.width).toBe('208px');
		// Straight verticals (L commands), not the wide variant's cubic curves.
		for (const wire of svg.querySelectorAll('.sbp-connector')) {
			expect(wire.getAttribute('d')).toContain('L');
			expect(wire.getAttribute('d')).not.toContain('C');
		}
	});

	it('round 4: flip tags solid boxes only — and only when asked', () => {
		const props = {
			picked: [pick('postgresql', 'data', 'PostgreSQL')],
			missing: ['interface', 'logic', 'infra'] satisfies StackLayer[],
		};
		// flip: solid boxes carry data-flip-id (morph into the composed
		// product preview); ghosts never (no slot to fly to).
		const flipped = render(ShapeBlueprint, { props: { ...props, flip: true } });
		const svg = flipped.container.querySelector('[data-testid="shape-blueprint"]')!;
		expect(
			svg.querySelector('[data-testid="sbp-box-postgresql"]')?.getAttribute('data-flip-id'),
		).toBe('postgresql');
		expect(svg.querySelectorAll('[data-flip-id]')).toHaveLength(1);
		flipped.unmount();

		// Default: untagged — only the card's visible variant ever flip-tags.
		const plain = render(ShapeBlueprint, { props });
		expect(plain.container.querySelectorAll('[data-flip-id]')).toHaveLength(0);
	});

	it('defensive: zero drawable picks still draws — four ghosts, fully sketched', () => {
		const { container } = render(ShapeBlueprint, {
			props: { picked: [], missing: [...STACK_LAYERS] },
		});
		const svg = container.querySelector('[data-testid="shape-blueprint"]')!;
		expect(svg.querySelectorAll('.sbp-box-solid')).toHaveLength(0);
		expect(svg.querySelectorAll('.sbp-box-ghost')).toHaveLength(4);
		const connectors = [...svg.querySelectorAll('.sbp-connector')];
		expect(connectors).toHaveLength(3);
		expect(connectors.every((c) => c.classList.contains('sbp-connector-ghost'))).toBe(true);
	});
});
