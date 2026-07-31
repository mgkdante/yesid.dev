// blueprint-layout (slice-29, go2/w5 finale) — pure auto-layout for the
// living blueprint.
//
// The blueprint derives ENTIRELY from layer data: layer bands follow
// STACK_LAYERS render order (interface on top), boxes center within fixed
// geometry, and connectors run from each box to the nearest box in the next
// line. NO hand coordinates anywhere — scope guardrail of the slice.
//
// Finale (4b) — the READABILITY FLOOR: boxes never shrink to fit. A layer
// band holding more than MAX_ROW_BOXES techs WRAPS into multiple lines
// (LINE_GAP apart, tighter than the ROW_GAP between layers) so the drawing
// grows vertically instead of scaling down. Box geometry is constant at any
// pick count.
//
// Finale (4b) — TOTAL CONNECTIVITY: every box participates in one connected
// graph. Two connector kinds guarantee it by construction:
//   flow — every box (except the last line's) curves to the nearest box in
//          the next line; parallel chains alone could still split the graph…
//   rail — …so adjacent boxes within a line are tied by a short horizontal
//          rail. Lines are internally connected, every line reaches the next
//          ⇒ single component, always (locked by blueprint-connectivity.test).
//
// Deterministic: same links in, byte-identical layout out (tested).

import { STACK_LAYERS, type ArchetypeTechLink, type StackLayer } from '@repo/shared/schemas';

// go2/w5 legibility pass: 160×48 → 192×56 so the box labels can wear
// --text-body (16px mono) with honest margins — the longest committed name
// ("Three.js / Threlte", 18ch ≈ 173px at 16px) clears the 3px layer tab and
// both rounded corners. The readability-floor probes (e2e ≥180×53) ride this.
export const BOX_W = 192;
export const BOX_H = 56;
export const GUTTER = 24;
// GO-w2t5: 64 → 48. At ROW_GAP 64 the column had more air than box
// (gap 64 > BOX_H 48) — the blueprint overflowed a viewport at render
// scale 1. Connector curves derive from this, so they tighten with it.
export const ROW_GAP = 48;
// Finale (4b): wrapped lines of the SAME layer sit closer than layer bands —
// the band reads as one shelf holding several lines.
export const LINE_GAP = 16;
// Finale (4b): the readability floor's wrap point. A line never holds more
// than this many boxes, so natural width is capped and render scale can stay
// 1:1 — the drawing grows DOWN, never shrinks. Data-driven: any roster size
// (21 committed today, 28 at next regen) wraps the same way.
export const MAX_ROW_BOXES = 4;

// Slice 037: the published archetype class tops out at two boxes across and
// four occupied rows. That 408×368 drawing area plus the shared 24px paper
// padding, 84px row-label gutter, and 36px stamp yields one 540×452 slot.
export const BLUEPRINT_PAD = 24;
export const BLUEPRINT_STAMP_H = 36;
export const BLUEPRINT_LABEL_GUTTER = 84;
export const BLUEPRINT_DRAWING_WIDTH = 2 * BOX_W + GUTTER;
export const BLUEPRINT_DRAWING_HEIGHT = 4 * BOX_H + 3 * ROW_GAP;
export const BLUEPRINT_FRAME = { width: 540, height: 452 } as const;

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
	/** SVG path — cubic curve (flow), straight vertical (stacked flow), or
	 *  straight horizontal (rail). */
	path: string;
	/** flow = wiring toward the next line; rail = same-line sibling tie. */
	kind: 'flow' | 'rail';
}

export interface BlueprintRowGuide {
	layer: StackLayer;
	/** Frame-relative SVG path extending a centered short row to both edges. */
	path: string;
}

export interface BlueprintLayout {
	/** Intrinsic box-and-connector geometry before reserved-frame centering. */
	width: number;
	height: number;
	/** Render slot derived from the intrinsic layout. Published archetypes all
	 *  resolve to BLUEPRINT_FRAME; larger compose layouts expand instead of
	 *  shrinking the readability-floor box geometry. */
	frame: {
		width: number;
		height: number;
		drawingWidth: number;
		drawingHeight: number;
		offsetX: number;
		offsetY: number;
		labelGutter: number;
	};
	boxes: BlueprintBox[];
	connectors: BlueprintConnector[];
	/** G3: quiet drafting extensions occupy the horizontal space around
	 *  centered short rows without stretching the fixed-size boxes. */
	rowGuides: BlueprintRowGuide[];
}

const rowWidth = (count: number): number => count * BOX_W + (count - 1) * GUTTER;

function blueprintFrame(
	width: number,
	height: number,
	stacked: boolean,
): BlueprintLayout['frame'] {
	// Mobile stacked compose drawings keep their intrinsic single-column slot;
	// the 12 published archetypes use the non-stacked reserved frame.
	const labelGutter = stacked ? 0 : BLUEPRINT_LABEL_GUTTER;
	const drawingWidth = stacked ? width : Math.max(BLUEPRINT_DRAWING_WIDTH, width);
	const drawingHeight = stacked ? height : Math.max(BLUEPRINT_DRAWING_HEIGHT, height);
	return {
		width: drawingWidth + BLUEPRINT_PAD * 2 + labelGutter,
		height: drawingHeight + BLUEPRINT_STAMP_H + BLUEPRINT_PAD * 2,
		drawingWidth,
		drawingHeight,
		offsetX: (drawingWidth - width) / 2,
		offsetY: (drawingHeight - height) / 2,
		labelGutter,
	};
}

/** Ghost id for a missing layer in the compose ("Your build") drawing — ONE
 *  definition so link construction and ghost detection can never drift. */
export const shapeGhostId = (layer: StackLayer): string => `ghost-${layer}`;

/** The compose drawing's link list: picks in pick order + one ghost per
 *  missing layer. Shared by ShapeBlueprint (rendering) and BuildShapeCard
 *  (the wrapper's definite width — S5-442 finding 1: a flex item with only a
 *  max-width on the replaced SVG contributes the 300×150 CSS default object
 *  size, so the wide drawing froze at ~300px at every viewport). */
export function shapeLinks(
	picked: readonly { id: string; layer: StackLayer }[],
	missing: readonly StackLayer[],
): ArchetypeTechLink[] {
	return [
		...picked.map((p, i) => ({ id: p.id, layer: p.layer, sort: i })),
		...missing.map((layer) => ({ id: shapeGhostId(layer), layer, sort: 0 })),
	];
}

export function layoutBlueprint(
	links: readonly ArchetypeTechLink[],
	opts: { stacked?: boolean; maxPerRow?: number } = {},
): BlueprintLayout {
	// Occupied layers in STACK_LAYERS render order; empty layers vanish.
	// Links arrive layer-major from the content module, but re-grouping here
	// keeps the layout correct for any input order (compose mode included).
	const layerRows: ArchetypeTechLink[][] = STACK_LAYERS.map((layer) =>
		links.filter((l) => l.layer === layer),
	).filter((row) => row.length > 0);

	if (opts.stacked) {
		// Single centered column: one box per "row", layer-major order.
		const flat = layerRows.flat();
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
				kind: 'flow' as const,
			};
		});
		return {
			width: BOX_W,
			height: boxes.length > 0 ? boxes.length * BOX_H + (boxes.length - 1) * ROW_GAP : 0,
			frame: blueprintFrame(
				BOX_W,
				boxes.length > 0 ? boxes.length * BOX_H + (boxes.length - 1) * ROW_GAP : 0,
				true,
			),
			boxes,
			connectors,
			rowGuides: [],
		};
	}

	// Finale (4b): chunk each layer band into LINES of ≤ maxPerRow boxes —
	// the wrap that keeps box scale at the readable floor.
	const maxPerRow = Math.max(1, opts.maxPerRow ?? MAX_ROW_BOXES);
	const lines: { layer: StackLayer; links: ArchetypeTechLink[] }[] = [];
	for (const row of layerRows) {
		for (let i = 0; i < row.length; i += maxPerRow) {
			lines.push({ layer: row[0].layer, links: row.slice(i, i + maxPerRow) });
		}
	}

	const width = lines.length > 0 ? Math.max(...lines.map((l) => rowWidth(l.links.length))) : 0;

	// Vertical rhythm: LINE_GAP inside a layer band, ROW_GAP between bands.
	const lineYs: number[] = [];
	let y = 0;
	for (let i = 0; i < lines.length; i++) {
		if (i > 0) {
			y += BOX_H + (lines[i].layer === lines[i - 1].layer ? LINE_GAP : ROW_GAP);
		}
		lineYs.push(y);
	}

	const boxesByLine: BlueprintBox[][] = lines.map((line, lineIndex) => {
		const offset = (width - rowWidth(line.links.length)) / 2;
		return line.links.map((link, i) => ({
			id: link.id,
			layer: link.layer,
			x: offset + i * (BOX_W + GUTTER),
			y: lineYs[lineIndex],
			w: BOX_W,
			h: BOX_H,
		}));
	});
	const boxes: BlueprintBox[] = boxesByLine.flat();

	const connectors: BlueprintConnector[] = [];

	// Flow: every box (except the last line's) curves down to the nearest box
	// — by center-x distance, first-in-line on ties — in the NEXT line. The
	// curve's control points derive from the actual gap, so band-internal
	// hops (LINE_GAP) tighten while layer hops keep the classic ROW_GAP arc.
	for (let r = 0; r < boxesByLine.length - 1; r++) {
		for (const box of boxesByLine[r]) {
			const fromCx = box.x + box.w / 2;
			let target = boxesByLine[r + 1][0];
			let best = Infinity;
			for (const candidate of boxesByLine[r + 1]) {
				const d = Math.abs(candidate.x + candidate.w / 2 - fromCx);
				if (d < best) {
					best = d;
					target = candidate;
				}
			}
			const toCx = target.x + target.w / 2;
			const fromY = box.y + box.h;
			const toY = target.y;
			const midGap = (toY - fromY) / 2;
			connectors.push({
				from: box.id,
				to: target.id,
				path: `M ${fromCx} ${fromY} C ${fromCx} ${fromY + midGap}, ${toCx} ${toY - midGap}, ${toCx} ${toY}`,
				kind: 'flow',
			});
		}
	}

	// Rails (4b connectivity): tie adjacent siblings within every line. Flow
	// edges alone can split parallel chains ([A B] over [C D] → A–C, B–D);
	// with each line internally railed, the graph is ONE component for any
	// input — no orphan boxes, ever.
	for (const line of boxesByLine) {
		for (let i = 0; i < line.length - 1; i++) {
			const left = line[i];
			const right = line[i + 1];
			const railY = left.y + left.h / 2;
			connectors.push({
				from: left.id,
				to: right.id,
				path: `M ${left.x + left.w} ${railY} L ${right.x} ${railY}`,
				kind: 'rail',
			});
		}
	}

	const height = lines.length > 0 ? lineYs[lineYs.length - 1] + BOX_H : 0;
	const frame = blueprintFrame(width, height, false);
	const rowGuides: BlueprintRowGuide[] = boxesByLine.flatMap((line) => {
		const first = line[0];
		const last = line[line.length - 1];
		const left = frame.offsetX + first.x;
		const right = frame.offsetX + last.x + last.w;
		if (left <= 0 && right >= frame.drawingWidth) return [];

		const guideY = frame.offsetY + first.y + first.h / 2;
		const segments: string[] = [];
		if (left > 0) segments.push(`M 0 ${guideY} H ${left}`);
		if (right < frame.drawingWidth) {
			segments.push(`M ${right} ${guideY} H ${frame.drawingWidth}`);
		}
		return [{ layer: first.layer, path: segments.join(' ') }];
	});
	return {
		width,
		height,
		frame,
		boxes,
		connectors,
		rowGuides,
	};
}
