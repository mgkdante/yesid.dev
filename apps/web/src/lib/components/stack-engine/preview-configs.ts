// preview-configs (slice-29) — CRAFTED product previews, one per archetype.
//
// Scope guardrail: previews are designed by hand per archetype, NEVER
// generated from data (the blueprint is the data-derived artifact; the
// preview is the crafted payoff). Coordinates are logical units inside the
// frame canvas; ProductPreview scales them with CSS.
//
// Each slot names a LAYER; at render the slot is occupied by the archetype's
// tech of that layer (first by sort). The first slot of each layer carries
// data-flip-id=<tech id> so GSAP Flip pairs blueprint box ↔ preview slot.

import type { StackLayer } from '@repo/shared/schemas';

export interface PreviewSlot {
	layer: StackLayer;
	x: number;
	y: number;
	w: number;
	h: number;
	/** Optional role hint ('chart', 'source'…) rendered above the tech name. */
	label?: string;
}

export interface PreviewConfig {
	slug: string;
	frame: 'browser' | 'phone';
	slots: PreviewSlot[];
}

/** Logical canvas per frame kind (slot coordinates live inside these). */
export const FRAME_SIZES = {
	browser: { w: 360, h: 264 },
	phone: { w: 180, h: 320 },
} as const;

export const PREVIEW_CONFIGS: Record<string, PreviewConfig> = {
	// Browser dashboard: topbar + 2 KPI cards (interface), chart (logic),
	// data base bar (data), infra footer chip.
	'data-dashboard': {
		slug: 'data-dashboard',
		frame: 'browser',
		slots: [
			{ layer: 'interface', x: 0, y: 0, w: 360, h: 26, label: 'topbar' },
			{ layer: 'interface', x: 12, y: 38, w: 166, h: 50, label: 'KPI' },
			{ layer: 'interface', x: 190, y: 38, w: 158, h: 50, label: 'KPI' },
			{ layer: 'logic', x: 12, y: 100, w: 336, h: 88, label: 'chart' },
			{ layer: 'data', x: 12, y: 200, w: 336, h: 22, label: 'data' },
			{ layer: 'infra', x: 240, y: 232, w: 108, h: 20, label: 'infra' },
		],
	},
	// Browser pipeline: three horizontal lanes source → transform (logic) →
	// store (data), plus the infra chip.
	'data-pipeline': {
		slug: 'data-pipeline',
		frame: 'browser',
		slots: [
			{ layer: 'logic', x: 12, y: 40, w: 100, h: 120, label: 'source' },
			{ layer: 'logic', x: 130, y: 40, w: 100, h: 120, label: 'transform' },
			{ layer: 'data', x: 248, y: 40, w: 100, h: 120, label: 'store' },
			{ layer: 'infra', x: 12, y: 176, w: 110, h: 20, label: 'infra' },
		],
	},
	// Phone site: hero block (interface), content rows (logic — labeled by the
	// CMS tech occupying the slot), infra chip.
	'fast-website': {
		slug: 'fast-website',
		frame: 'phone',
		slots: [
			{ layer: 'interface', x: 12, y: 36, w: 156, h: 90, label: 'hero' },
			{ layer: 'logic', x: 12, y: 138, w: 156, h: 34, label: 'content' },
			{ layer: 'logic', x: 12, y: 180, w: 156, h: 34, label: 'content' },
			{ layer: 'logic', x: 12, y: 222, w: 156, h: 34, label: 'content' },
			{ layer: 'infra', x: 40, y: 276, w: 100, h: 20, label: 'infra' },
		],
	},
};
