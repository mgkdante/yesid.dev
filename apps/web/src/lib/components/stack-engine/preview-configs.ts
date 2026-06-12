// preview-configs (slice-29, completed go2/w5 round 4) — CRAFTED product
// previews, one per archetype. EVERY published archetype now has one
// (totality pinned by preview-configs.test.ts).
//
// Scope guardrail: archetype previews are designed by hand per archetype,
// NEVER generated from data (the blueprint is the data-derived artifact; the
// preview is the crafted payoff). Coordinates are logical units inside the
// frame canvas; ProductPreview scales them with CSS.
//
// Each slot names a LAYER (+ optional `pick` index into that layer's sorted
// techs — round 4, so second-of-layer techs like Alembic or SQL Server get
// their own slot). At render the slot is occupied by that tech; the FIRST
// slot of each RESOLVED TECH carries data-flip-id=<tech id> so GSAP Flip
// pairs blueprint box ↔ preview slot.
//
// Round 4 dual-role rule: every slot carries a `role` — the slot's job in
// THIS product, story voice. When one tech occupies two slots (Python as
// source AND transform in the pipeline), the roles MUST differ so the
// duplication explains itself ("why are there two Pythons?" — because one
// pulls the raw feeds and one cleans & reshapes). Roles live HERE in code
// (zero CMS schema changes); the audit test enforces distinctness.

import { STACK_LAYERS, type StackArchetype, type StackLayer } from '@repo/shared/schemas';

export interface PreviewSlot {
	layer: StackLayer;
	/** Which tech of the layer occupies the slot — index into the archetype's
	 *  layer techs sorted by `sort` (default 0; out of range falls back to 0). */
	pick?: number;
	x: number;
	y: number;
	w: number;
	h: number;
	/** The slot's job in this product — story voice, rendered above the tech
	 *  name and read into the tap caption. Required (round 4 dual-role rule). */
	role: string;
}

export interface PreviewConfig {
	slug: string;
	frame: 'browser' | 'phone';
	slots: PreviewSlot[];
}

/** A slot with its occupant resolved — what ProductPreview actually renders. */
export interface ResolvedPreviewSlot {
	layer: StackLayer;
	role: string;
	x: number;
	y: number;
	w: number;
	h: number;
	techId: string;
	/** First slot of this RESOLVED tech — carries data-flip-id for the morph. */
	flip: boolean;
}

export interface ResolvedPreview {
	frame: 'browser' | 'phone';
	slots: ResolvedPreviewSlot[];
}

/** Logical canvas per frame kind (slot coordinates live inside these). */
export const FRAME_SIZES = {
	browser: { w: 360, h: 264 },
	phone: { w: 180, h: 320 },
} as const;

export const PREVIEW_CONFIGS: Record<string, PreviewConfig> = {
	// ── The 3 seeds (roles upgraded to round-4 story voice). ────────────────
	// Browser dashboard: topbar + 2 KPI cards (interface ×3 — three SvelteKit
	// boxes, three distinct jobs), chart (logic), data base bar, infra chip.
	'data-dashboard': {
		slug: 'data-dashboard',
		frame: 'browser',
		slots: [
			{ layer: 'interface', x: 0, y: 0, w: 360, h: 26, role: 'the nav up top' },
			{ layer: 'interface', x: 12, y: 38, w: 166, h: 50, role: 'this revenue card' },
			{ layer: 'interface', x: 190, y: 38, w: 158, h: 50, role: 'this traffic card' },
			{ layer: 'logic', x: 12, y: 100, w: 336, h: 88, role: 'feeds the chart live numbers' },
			{ layer: 'data', x: 12, y: 200, w: 336, h: 22, role: 'where the numbers live' },
			{ layer: 'infra', x: 240, y: 232, w: 108, h: 20, role: 'ships it anywhere' },
		],
	},
	// Browser pipeline: the operator's dual-Python case — source AND transform
	// lanes are both logic, both Python, each telling its own story.
	'data-pipeline': {
		slug: 'data-pipeline',
		frame: 'browser',
		slots: [
			{ layer: 'logic', x: 12, y: 40, w: 100, h: 120, role: 'pulls the raw feeds' },
			{ layer: 'logic', x: 130, y: 40, w: 100, h: 120, role: 'cleans & reshapes' },
			{ layer: 'data', x: 248, y: 40, w: 100, h: 120, role: 'lands the clean tables' },
			{ layer: 'infra', x: 12, y: 176, w: 110, h: 20, role: 'runs the whole line' },
		],
	},
	// Phone site: hero block (interface), three content sections (logic —
	// TypeScript ×3, each section its own story), infra chip.
	'fast-website': {
		slug: 'fast-website',
		frame: 'phone',
		slots: [
			{ layer: 'interface', x: 12, y: 36, w: 156, h: 90, role: 'the page people land on' },
			{ layer: 'logic', x: 12, y: 138, w: 156, h: 34, role: 'the services section, typed' },
			{ layer: 'logic', x: 12, y: 180, w: 156, h: 34, role: 'the projects section, typed' },
			{ layer: 'logic', x: 12, y: 222, w: 156, h: 34, role: 'the contact form, typed' },
			{ layer: 'infra', x: 40, y: 276, w: 100, h: 20, role: 'served from the edge' },
		],
	},
	// ── Round 4: the remaining 9 — every archetype previews as a product. ───
	// Job console: one wide worker lane, a run-log panel, a schedule chip.
	'automated-workflow': {
		slug: 'automated-workflow',
		frame: 'browser',
		slots: [
			{ layer: 'logic', x: 12, y: 40, w: 220, h: 120, role: 'runs the job, hands-free' },
			{ layer: 'data', x: 248, y: 40, w: 100, h: 120, role: 'logs every run' },
			{ layer: 'infra', x: 12, y: 176, w: 150, h: 20, role: 'fires it on schedule' },
		],
	},
	// DB admin window: the tables themselves + the migration rail beside them
	// (pick 1 = Alembic, the SECOND data tech, gets its own slot).
	'database-that-scales': {
		slug: 'database-that-scales',
		frame: 'browser',
		slots: [
			{ layer: 'data', x: 12, y: 40, w: 220, h: 148, role: 'the tables, source of truth' },
			{ layer: 'data', pick: 1, x: 248, y: 40, w: 100, h: 148, role: 'migrates the schema safely' },
			{ layer: 'infra', x: 12, y: 204, w: 160, h: 20, role: 'same database, any machine' },
		],
	},
	// Whole-system window: site topbar, pipeline lane, dashboard panel
	// (pick 1 = Power BI), one base bar feeding it all, infra chip.
	'full-data-backbone': {
		slug: 'full-data-backbone',
		frame: 'browser',
		slots: [
			{ layer: 'interface', x: 0, y: 0, w: 360, h: 26, role: 'the site everyone sees' },
			{ layer: 'logic', x: 12, y: 38, w: 166, h: 98, role: 'moves & cleans the data' },
			{ layer: 'data', pick: 1, x: 190, y: 38, w: 158, h: 98, role: 'the boardroom dashboard' },
			{ layer: 'data', x: 12, y: 148, w: 336, h: 26, role: 'one database feeds it all' },
			{ layer: 'infra', x: 240, y: 204, w: 108, h: 20, role: 'every piece runs the same' },
		],
	},
	// Team app: sidebar of screens, a checked form, the records table.
	'internal-tool': {
		slug: 'internal-tool',
		frame: 'browser',
		slots: [
			{ layer: 'interface', x: 0, y: 0, w: 84, h: 264, role: 'the screens your team taps' },
			{ layer: 'logic', x: 96, y: 40, w: 252, h: 96, role: 'checks every entry' },
			{ layer: 'data', x: 96, y: 148, w: 252, h: 96, role: 'the records, one source' },
		],
	},
	// Shopping happens on phones: shop window, honest checkout, stock memory.
	'online-store': {
		slug: 'online-store',
		frame: 'phone',
		slots: [
			{ layer: 'interface', x: 12, y: 36, w: 156, h: 112, role: 'the shop window' },
			{ layer: 'logic', x: 12, y: 160, w: 156, h: 40, role: 'keeps checkout honest' },
			{ layer: 'data', x: 12, y: 212, w: 156, h: 32, role: 'remembers stock & orders' },
			{ layer: 'infra', x: 40, y: 276, w: 100, h: 20, role: 'fast for every visitor' },
		],
	},
	// Health console: watcher lane + health board, TWO infra chips with two
	// jobs (pick 1 = GitHub Actions beside Docker).
	'ops-autopilot': {
		slug: 'ops-autopilot',
		frame: 'browser',
		slots: [
			{ layer: 'logic', x: 12, y: 40, w: 166, h: 120, role: 'watches every run' },
			{ layer: 'data', x: 190, y: 40, w: 158, h: 120, role: 'the health board' },
			{ layer: 'infra', x: 12, y: 176, w: 160, h: 20, role: 'the boxes it runs in' },
			{ layer: 'infra', pick: 1, x: 190, y: 176, w: 158, h: 20, role: 'reruns & alerts' },
		],
	},
	// Query console over BOTH stores (pick 1 = SQL Server beside Postgres).
	'queries-that-fly': {
		slug: 'queries-that-fly',
		frame: 'browser',
		slots: [
			{ layer: 'logic', x: 12, y: 40, w: 336, h: 56, role: 'profiles the slow queries' },
			{ layer: 'data', x: 12, y: 112, w: 160, h: 112, role: 'your Postgres, tuned' },
			{ layer: 'data', pick: 1, x: 188, y: 112, w: 160, h: 112, role: 'the SQL Server estate' },
		],
	},
	// The Monday report: report canvas, the numbers' home (pick 1 = SQL
	// Server), the overnight compiler.
	'report-writes-itself': {
		slug: 'report-writes-itself',
		frame: 'browser',
		slots: [
			{ layer: 'data', x: 12, y: 40, w: 220, h: 148, role: 'the Monday report, drawn' },
			{ layer: 'data', pick: 1, x: 248, y: 40, w: 100, h: 148, role: 'where the numbers live' },
			{ layer: 'logic', x: 12, y: 204, w: 200, h: 22, role: 'compiles it overnight' },
		],
	},
	// Storefront with a dashboard heart: shop topbar, sales chart (pick 1 =
	// Power BI), honest cart logic, one base under both.
	'store-knows-numbers': {
		slug: 'store-knows-numbers',
		frame: 'browser',
		slots: [
			{ layer: 'interface', x: 0, y: 0, w: 360, h: 26, role: 'the storefront people browse' },
			{ layer: 'data', pick: 1, x: 12, y: 38, w: 166, h: 110, role: 'what sold, drawn daily' },
			{ layer: 'logic', x: 190, y: 38, w: 158, h: 110, role: 'keeps cart & counts honest' },
			{ layer: 'data', x: 12, y: 162, w: 336, h: 26, role: 'orders & products, one base' },
		],
	},
};

/**
 * Resolve a crafted config against its archetype: each slot is occupied by
 * the archetype tech of its layer at index `pick` (sorted by `sort`; out of
 * range falls back to the first — never blank when the layer is occupied).
 * Slots whose layer the archetype doesn't cover are skipped (defensive).
 * The FIRST slot of each resolved tech is flip-tagged.
 */
export function resolveArchetypePreview(archetype: StackArchetype): ResolvedPreview | null {
	const config = PREVIEW_CONFIGS[archetype.slug];
	if (!config) return null;
	const idsByLayer = new Map<StackLayer, string[]>(
		STACK_LAYERS.map((layer) => [
			layer,
			archetype.tech
				.filter((l) => l.layer === layer)
				.sort((a, b) => a.sort - b.sort)
				.map((l) => l.id),
		]),
	);
	const flipTagged = new Set<string>();
	const slots: ResolvedPreviewSlot[] = [];
	for (const slot of config.slots) {
		const ids = idsByLayer.get(slot.layer) ?? [];
		if (ids.length === 0) continue;
		const techId = ids[slot.pick ?? 0] ?? ids[0];
		const flip = !flipTagged.has(techId);
		flipTagged.add(techId);
		const { layer, role, x, y, w, h } = slot;
		slots.push({ layer, role, x, y, w, h, techId, flip });
	}
	return { frame: config.frame, slots };
}

/** Generic role per layer for the composed build preview (picks are unique
 *  ids, so the dual-role rule is satisfied by construction here). */
export const COMPOSED_ROLES: Record<StackLayer, string> = {
	interface: 'what people see',
	logic: 'does the thinking',
	data: 'keeps the records',
	infra: 'the ground it runs on',
};

/** Layer bands for the composed preview — fixed rows; a missing layer leaves
 *  honest whitespace (the drawing's ghosts teach the gap; the product shows
 *  only what the picks already buy). */
const COMPOSED_BANDS: Record<'browser' | 'phone', Record<StackLayer, { y: number; h: number }>> = {
	browser: {
		interface: { y: 26, h: 64 },
		logic: { y: 102, h: 64 },
		data: { y: 178, h: 36 },
		infra: { y: 230, h: 20 },
	},
	phone: {
		interface: { y: 36, h: 104 },
		logic: { y: 152, h: 64 },
		data: { y: 228, h: 34 },
		infra: { y: 276, h: 20 },
	},
};

/**
 * Round 4: the composed build-shape's GENERIC product preview — 'see your
 * build as a product'. Frame derives from covered layers (interface with no
 * data reads site-shaped → phone, like fast-website; anything else reads
 * app/system-shaped → browser). One slot per pick, layer-banded, width split
 * within the band. Every slot flip-tags (pick ids are unique).
 */
export function buildComposedPreview(
	picks: readonly { id: string; layer: StackLayer }[],
): ResolvedPreview {
	const covered = new Set(picks.map((p) => p.layer));
	const frame: 'browser' | 'phone' =
		covered.has('interface') && !covered.has('data') ? 'phone' : 'browser';
	const { w: frameW } = FRAME_SIZES[frame];
	const bands = COMPOSED_BANDS[frame];
	const GUTTER = 12;
	const seen = new Set<string>();
	const slots: ResolvedPreviewSlot[] = [];
	for (const layer of STACK_LAYERS) {
		const layerPicks = picks.filter((p) => p.layer === layer);
		if (layerPicks.length === 0) continue;
		const band = bands[layer];
		const w = (frameW - GUTTER * 2 - GUTTER * (layerPicks.length - 1)) / layerPicks.length;
		layerPicks.forEach((p, i) => {
			const flip = !seen.has(p.id);
			seen.add(p.id);
			slots.push({
				layer,
				role: COMPOSED_ROLES[layer],
				x: GUTTER + i * (w + GUTTER),
				y: band.y,
				w,
				h: band.h,
				techId: p.id,
				flip,
			});
		});
	}
	return { frame, slots };
}
