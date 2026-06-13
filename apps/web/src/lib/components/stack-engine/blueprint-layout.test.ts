// blueprint-layout tests (slice-29 Task 10, go2/w5 finale) — written FIRST
// per TDD. The blueprint auto-layouts from layer data — NO hand coordinates
// anywhere. Finale adds the READABILITY FLOOR (wrap, never shrink) and the
// sibling RAILS that make the connector graph total.

import { describe, it, expect } from 'vitest';
import type { ArchetypeTechLink } from '@repo/shared/schemas';
import {
	layoutBlueprint,
	BOX_W,
	BOX_H,
	GUTTER,
	ROW_GAP,
	LINE_GAP,
	MAX_ROW_BOXES,
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
	it('flow count = boxes minus last-row boxes; rails tie same-row siblings (finale)', () => {
		const links = [
			link('a', 'interface', 1),
			link('b', 'interface', 2),
			link('c', 'logic', 1),
			link('d', 'data', 1),
			link('e', 'data', 2),
			link('f', 'data', 3),
		];
		const { boxes, connectors } = layoutBlueprint(links);
		const flows = connectors.filter((c) => c.kind === 'flow');
		const rails = connectors.filter((c) => c.kind === 'rail');
		const lastRowCount = boxes.filter((b) => b.layer === 'data').length;
		expect(flows).toHaveLength(boxes.length - lastRowCount);
		// One rail per adjacent sibling pair: interface (2 → 1) + data (3 → 2).
		expect(rails).toHaveLength(3);
	});

	it('each flow connector targets the nearest box (by center x) in the next occupied row', () => {
		const links = [
			link('left-top', 'interface', 1),
			link('right-top', 'interface', 2),
			link('left-bottom', 'data', 1),
			link('right-bottom', 'data', 2),
		];
		const { connectors } = layoutBlueprint(links);
		const targets = Object.fromEntries(
			connectors.filter((c) => c.kind === 'flow').map((c) => [c.from, c.to]),
		);
		expect(targets['left-top']).toBe('left-bottom');
		expect(targets['right-top']).toBe('right-bottom');
	});

	it('rails are straight horizontals between sibling edges at mid-height', () => {
		const links = [
			link('left-top', 'interface', 1),
			link('right-top', 'interface', 2),
			link('bottom', 'data', 1),
		];
		const { connectors, boxes } = layoutBlueprint(links);
		const rails = connectors.filter((c) => c.kind === 'rail');
		expect(rails).toHaveLength(1);
		const byId = Object.fromEntries(boxes.map((b) => [b.id, b]));
		const left = byId['left-top'];
		const right = byId['right-top'];
		expect(rails[0].from).toBe('left-top');
		expect(rails[0].to).toBe('right-top');
		expect(rails[0].path).toBe(
			`M ${left.x + left.w} ${left.y + left.h / 2} L ${right.x} ${right.y + right.h / 2}`,
		);
	});

	it('flow paths are cubic curves anchored to box edges', () => {
		const { connectors, boxes } = layoutBlueprint(DASHBOARD_LINKS);
		const byId = Object.fromEntries(boxes.map((b) => [b.id, b]));
		expect(connectors.every((c) => c.kind === 'flow')).toBe(true);
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
		// go2/w5 legibility pass: 160×48 → 192×56 — boxes hold --text-body
		// (16px mono) labels with honest margins ("Three.js / Threlte" fits).
		expect(BOX_W).toBe(192);
		expect(BOX_H).toBe(56);
		expect(GUTTER).toBe(24);
		// 64 → 48 (GO-w2t5): rows had more air than box (gap 64 > box 48);
		// tightening keeps the whole blueprint inside one viewport.
		expect(ROW_GAP).toBe(48);
		// Finale (4b): the wrap point and the intra-band line gap.
		expect(MAX_ROW_BOXES).toBe(4);
		expect(LINE_GAP).toBe(16);
	});
});

// ── Finale (4b): the READABILITY FLOOR — boxes never shrink; layout grows. ──

/** N picks, interface-heavy (like a real big pick set) — N=15 puts 8 boxes
 *  in one layer, forcing the wrap the floor relies on. */
const spread = (n: number): ArchetypeTechLink[] =>
	Array.from({ length: n }, (_, i) => {
		const layer =
			i < Math.ceil(n / 2) ? 'interface' : (['logic', 'data', 'infra'] as const)[i % 3];
		return link(`t${i}`, layer, i);
	});

describe('finale readability floor — wrap, never shrink', () => {
	const MAX_LINE_W = MAX_ROW_BOXES * BOX_W + (MAX_ROW_BOXES - 1) * GUTTER;

	for (const n of [3, 8, 15]) {
		it(`N=${n}: every box keeps full geometry and width never exceeds the wrap cap`, () => {
			const layout = layoutBlueprint(spread(n));
			expect(layout.boxes).toHaveLength(n);
			for (const b of layout.boxes) {
				expect(b.w).toBe(BOX_W);
				expect(b.h).toBe(BOX_H);
			}
			expect(layout.width).toBeLessThanOrEqual(MAX_LINE_W);
		});
	}

	it('a 6-box layer wraps into lines of ≤ MAX_ROW_BOXES, LINE_GAP apart inside the band', () => {
		const links = [
			...Array.from({ length: 6 }, (_, i) => link(`ui${i}`, 'interface', i)),
			link('pg', 'data', 0),
		];
		const { boxes, width } = layoutBlueprint(links);
		const uiYs = [...new Set(boxes.filter((b) => b.layer === 'interface').map((b) => b.y))].sort(
			(a, b) => a - b,
		);
		expect(uiYs).toHaveLength(2); // 6 → 4 + 2
		expect(uiYs[1] - uiYs[0]).toBe(BOX_H + LINE_GAP);
		// The band's widest line defines the drawing width (4-box line).
		expect(width).toBe(4 * BOX_W + 3 * GUTTER);
		// The next LAYER sits a full ROW_GAP below the band's last line.
		const dataY = boxes.find((b) => b.id === 'pg')!.y;
		expect(dataY - uiYs[1]).toBe(BOX_H + ROW_GAP);
	});

	it('height grows with the pick count (the drawing gets taller, not smaller)', () => {
		const h8 = layoutBlueprint(spread(8)).height;
		const h15 = layoutBlueprint(spread(15)).height;
		expect(h15).toBeGreaterThan(h8);
	});

	it('wrapped layouts stay deterministic', () => {
		expect(layoutBlueprint(spread(15))).toEqual(layoutBlueprint(spread(15)));
	});
});
