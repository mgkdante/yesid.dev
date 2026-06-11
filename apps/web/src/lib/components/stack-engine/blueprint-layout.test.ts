// blueprint-layout tests (slice-29 Task 10) — written FIRST per TDD.
// The blueprint auto-layouts from layer data — NO hand coordinates anywhere.

import { describe, it, expect } from 'vitest';
import type { ArchetypeTechLink } from '@repo/shared/schemas';
import {
	layoutBlueprint,
	BOX_W,
	BOX_H,
	GUTTER,
	ROW_GAP,
} from './blueprint-layout';

const link = (
	id: string,
	layer: ArchetypeTechLink['layer'],
	sort = 0,
): ArchetypeTechLink => ({ id, layer, sort });

// Mirrors the data-dashboard seed: one box per layer.
const DASHBOARD_LINKS: ArchetypeTechLink[] = [
	link('sveltekit', 'interface', 1),
	link('rest-api', 'logic', 2),
	link('postgresql', 'data', 3),
	link('docker', 'infra', 4),
];

describe('layoutBlueprint rows', () => {
	it('lays a 4-layer archetype as 4 rows in STACK_LAYERS order (interface top)', () => {
		const { boxes } = layoutBlueprint(DASHBOARD_LINKS);
		const byId = Object.fromEntries(boxes.map((b) => [b.id, b]));
		expect(boxes).toHaveLength(4);
		expect(byId['sveltekit'].y).toBeLessThan(byId['rest-api'].y);
		expect(byId['rest-api'].y).toBeLessThan(byId['postgresql'].y);
		expect(byId['postgresql'].y).toBeLessThan(byId['docker'].y);
		// Fixed geometry, row pitch = BOX_H + ROW_GAP.
		expect(byId['rest-api'].y - byId['sveltekit'].y).toBe(BOX_H + ROW_GAP);
		for (const b of boxes) {
			expect(b.w).toBe(BOX_W);
			expect(b.h).toBe(BOX_H);
		}
	});

	it('skips empty layers — occupied rows stack with no gaps', () => {
		const { boxes, height } = layoutBlueprint([
			link('python', 'logic'),
			link('postgresql', 'data'),
		]);
		expect(boxes).toHaveLength(2);
		expect(boxes[0].y).toBe(0);
		expect(boxes[1].y).toBe(BOX_H + ROW_GAP);
		expect(height).toBe(2 * BOX_H + ROW_GAP);
	});

	it('centers 2 boxes in a row symmetrically around the canvas center', () => {
		const links = [
			link('a-tech', 'logic', 1),
			link('b-tech', 'logic', 2),
			// wider row below forces the logic row to center against it
			link('c-tech', 'data', 1),
			link('d-tech', 'data', 2),
			link('e-tech', 'data', 3),
		];
		const { boxes, width } = layoutBlueprint(links);
		const logicRow = boxes.filter((b) => b.layer === 'logic');
		expect(logicRow).toHaveLength(2);
		const [left, right] = [...logicRow].sort((p, q) => p.x - q.x);
		// Symmetric: left margin == right margin.
		expect(left.x).toBeCloseTo(width - (right.x + right.w), 6);
		// Adjacent boxes sit one gutter apart.
		expect(right.x - (left.x + left.w)).toBe(GUTTER);
		// Data row (3 boxes) spans the full width.
		const dataRow = boxes.filter((b) => b.layer === 'data');
		expect(Math.min(...dataRow.map((b) => b.x))).toBe(0);
		expect(Math.max(...dataRow.map((b) => b.x + b.w))).toBe(width);
	});
});

describe('layoutBlueprint connectors', () => {
	it('connector count = boxes minus last-row boxes (nearest-next mapping)', () => {
		const links = [
			link('a', 'interface', 1),
			link('b', 'interface', 2),
			link('c', 'logic', 1),
			link('d', 'data', 1),
			link('e', 'data', 2),
			link('f', 'data', 3),
		];
		const { boxes, connectors } = layoutBlueprint(links);
		const lastRowCount = boxes.filter((b) => b.layer === 'data').length;
		expect(connectors).toHaveLength(boxes.length - lastRowCount);
	});

	it('each connector targets the nearest box (by center x) in the next occupied row', () => {
		const links = [
			link('left-top', 'interface', 1),
			link('right-top', 'interface', 2),
			link('left-bottom', 'data', 1),
			link('right-bottom', 'data', 2),
		];
		const { connectors } = layoutBlueprint(links);
		const targets = Object.fromEntries(connectors.map((c) => [c.from, c.to]));
		expect(targets['left-top']).toBe('left-bottom');
		expect(targets['right-top']).toBe('right-bottom');
	});

	it('connector paths are cubic curves anchored to box edges', () => {
		const { connectors, boxes } = layoutBlueprint(DASHBOARD_LINKS);
		const byId = Object.fromEntries(boxes.map((b) => [b.id, b]));
		for (const c of connectors) {
			expect(c.path).toMatch(/^M [\d.-]+ [\d.-]+ C /);
			const from = byId[c.from];
			expect(c.path.startsWith(`M ${from.x + from.w / 2} ${from.y + from.h}`)).toBe(true);
		}
	});

	it('is deterministic — repeat call returns identical output', () => {
		expect(layoutBlueprint(DASHBOARD_LINKS)).toEqual(layoutBlueprint(DASHBOARD_LINKS));
	});
});

describe('layoutBlueprint stacked mode', () => {
	it('stacks every box in a single centered column', () => {
		const { boxes, width } = layoutBlueprint(DASHBOARD_LINKS, { stacked: true });
		expect(boxes).toHaveLength(4);
		expect(width).toBe(BOX_W);
		for (const [i, b] of boxes.entries()) {
			expect(b.x).toBe(0);
			expect(b.y).toBe(i * (BOX_H + ROW_GAP));
		}
	});

	it('stacked connectors are straight verticals', () => {
		const { connectors } = layoutBlueprint(DASHBOARD_LINKS, { stacked: true });
		expect(connectors).toHaveLength(3);
		for (const c of connectors) {
			expect(c.path).toMatch(/^M [\d.-]+ [\d.-]+ L [\d.-]+ [\d.-]+$/);
			const [, x1, x2] = c.path.match(/^M ([\d.-]+) [\d.-]+ L ([\d.-]+) [\d.-]+$/)!;
			expect(x1).toBe(x2);
		}
	});
});

describe('GO-w2t5 at-a-glance geometry contract', () => {
	it('pins the blueprint constants the sizing fix relies on', () => {
		expect(BOX_W).toBe(160);
		expect(BOX_H).toBe(48);
		expect(GUTTER).toBe(24);
		// 64 → 48 (GO-w2t5): rows had more air than box (gap 64 > box 48);
		// tightening keeps the whole blueprint inside one viewport.
		expect(ROW_GAP).toBe(48);
	});
});
