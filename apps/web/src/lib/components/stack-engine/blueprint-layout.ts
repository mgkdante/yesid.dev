// blueprint-layout (slice-29) — pure auto-layout for the living blueprint.
//
// The blueprint derives ENTIRELY from layer data: rows follow STACK_LAYERS
// render order (interface on top), boxes center within fixed geometry, and
// connectors run from each box to the nearest box in the next occupied row.
// NO hand coordinates anywhere — scope guardrail of the slice.
//
// Deterministic: same links in, byte-identical layout out (tested).

import { STACK_LAYERS, type ArchetypeTechLink, type StackLayer } from '@repo/shared/schemas';

export const BOX_W = 160;
export const BOX_H = 48;
export const GUTTER = 24;
export const ROW_GAP = 64;

export interface BlueprintBox {
	id: string;
	layer: StackLayer;
	x: number;
	y: number;
	w: number;
	h: number;
}

export interface BlueprintConnector {
	from: string;
	to: string;
	/** SVG path — cubic curve (normal) or straight vertical (stacked). */
	path: string;
}

export interface BlueprintLayout {
	width: number;
	height: number;
	boxes: BlueprintBox[];
	connectors: BlueprintConnector[];
}

const rowWidth = (count: number): number => count * BOX_W + (count - 1) * GUTTER;

export function layoutBlueprint(
	links: readonly ArchetypeTechLink[],
	opts: { stacked?: boolean } = {},
): BlueprintLayout {
	// Occupied rows in STACK_LAYERS render order; empty layers vanish.
	// Links arrive layer-major from the content module, but re-grouping here
	// keeps the layout correct for any input order (compose mode included).
	const rows: ArchetypeTechLink[][] = STACK_LAYERS.map((layer) =>
		links.filter((l) => l.layer === layer),
	).filter((row) => row.length > 0);

	if (opts.stacked) {
		// Single centered column: one box per "row", layer-major order.
		const flat = rows.flat();
		const boxes: BlueprintBox[] = flat.map((link, i) => ({
			id: link.id,
			layer: link.layer,
			x: 0,
			y: i * (BOX_H + ROW_GAP),
			w: BOX_W,
			h: BOX_H,
		}));
		const connectors: BlueprintConnector[] = boxes.slice(0, -1).map((box, i) => {
			const next = boxes[i + 1];
			const cx = box.x + box.w / 2;
			return {
				from: box.id,
				to: next.id,
				path: `M ${cx} ${box.y + box.h} L ${cx} ${next.y}`,
			};
		});
		return {
			width: BOX_W,
			height: boxes.length > 0 ? boxes.length * BOX_H + (boxes.length - 1) * ROW_GAP : 0,
			boxes,
			connectors,
		};
	}

	const width = rows.length > 0 ? Math.max(...rows.map((row) => rowWidth(row.length))) : 0;

	const boxes: BlueprintBox[] = rows.flatMap((row, rowIndex) => {
		const offset = (width - rowWidth(row.length)) / 2;
		return row.map((link, i) => ({
			id: link.id,
			layer: link.layer,
			x: offset + i * (BOX_W + GUTTER),
			y: rowIndex * (BOX_H + ROW_GAP),
			w: BOX_W,
			h: BOX_H,
		}));
	});

	// Connectors: every box (except the last row's) curves down to the nearest
	// box — by center-x distance, first-in-row on ties — in the NEXT occupied row.
	const boxesByRow: BlueprintBox[][] = [];
	for (const row of rows) {
		boxesByRow.push(row.map((link) => boxes.find((b) => b.id === link.id)!));
	}

	const connectors: BlueprintConnector[] = [];
	for (let r = 0; r < boxesByRow.length - 1; r++) {
		for (const box of boxesByRow[r]) {
			const fromCx = box.x + box.w / 2;
			let target = boxesByRow[r + 1][0];
			let best = Infinity;
			for (const candidate of boxesByRow[r + 1]) {
				const d = Math.abs(candidate.x + candidate.w / 2 - fromCx);
				if (d < best) {
					best = d;
					target = candidate;
				}
			}
			const toCx = target.x + target.w / 2;
			const fromY = box.y + box.h;
			const toY = target.y;
			const midGap = ROW_GAP / 2;
			connectors.push({
				from: box.id,
				to: target.id,
				path: `M ${fromCx} ${fromY} C ${fromCx} ${fromY + midGap}, ${toCx} ${toY - midGap}, ${toCx} ${toY}`,
			});
		}
	}

	return {
		width,
		height: rows.length > 0 ? rows.length * BOX_H + (rows.length - 1) * ROW_GAP : 0,
		boxes,
		connectors,
	};
}
