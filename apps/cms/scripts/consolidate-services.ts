#!/usr/bin/env bun
/**
 * GO-2 Track 3 — services consolidation: 6 stations → 4.
 *
 * What it does (one transaction-shaped pass, idempotent re-runs):
 *   1. Rewrites the 4 survivor services' en copy to the merged 4-station
 *      message architecture (services_translations).
 *   2. Patches survivor parent rows (stack json).
 *   3. Renumbers stations to data-flow order 1-4; parks the two archived
 *      rows at 5-6 so the all-rows "sequential from 1" integrity invariant
 *      in apps/web/src/lib/content/integrity.test.ts stays true.
 *   4. Merges station-1 deliverables (8 rows) + appends the absorbed
 *      automation deliverable to data-pipeline; rewrites the station-1
 *      "My Approach" section to the merged speed+safety paragraph.
 *   5. ARCHIVES (visible=false — the collection's archive_field; rows,
 *      translations, deliverables and sections are all preserved for
 *      rollback per archive-not-delete) sql-development + internal-tooling.
 *   6. Remaps every relation that points at an archived id:
 *      projects_services, tech_stack_services (delete when the survivor
 *      pair already exists, remap otherwise), stack_archetypes.service.
 *
 * DRY-RUN BY DEFAULT — no network, no token. Pass --apply to write.
 * LIVE WRITES ARE ORCHESTRATOR-ONLY. Implementers: never pass --apply.
 *
 * Orchestrator runs (repo root):
 *   bun apps/cms/scripts/consolidate-services.ts                  # dry-run plan
 *   op run --env-file=.env -- env PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
 *     bun apps/cms/scripts/consolidate-services.ts --apply        # dev rehearsal
 *
 * DEV-ONLY since the pipeline-safety sweep: assertDevCms in main() refuses a
 * prod URL. The consolidation already shipped to prod (2026-06-12 GO-day);
 * any future prod replay requires a newly reviewed production workflow,
 * not a re-pointing of this DEV-only script.
 *
 * Auth: lib/auth getAdminToken resolves DIRECTUS_BUILD_TOKEN →
 * DIRECTUS_ADMIN_TOKEN → email+password. If the build token is read-scoped
 * and writes 403, re-run with `env -u DIRECTUS_BUILD_TOKEN` so the admin
 * token is used.
 */

import { createItem, deleteItem, readItems, updateItem } from '@directus/sdk';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const log = createLogger('consolidate-services');

// --- Decisions (locked in the GO-2 Track 3 plan) ---------------------------

export const SURVIVOR_BY_ARCHIVED: Record<string, string> = {
	'sql-development': 'database-engineering',
	'internal-tooling': 'data-pipeline',
};
export const ARCHIVED_IDS = Object.keys(SURVIVOR_BY_ARCHIVED);
export const SURVIVOR_IDS = [
	'database-engineering',
	'data-pipeline',
	'analytics-reporting',
	'web-development',
] as const;

/** Applied strictly in order. Temp values 101/102 make the sequence
 *  collision-free even if a unique index is ever added to station. */
export const STATION_MOVES: ReadonlyArray<{ id: string; station: number }> = [
	{ id: 'sql-development', station: 101 },
	{ id: 'internal-tooling', station: 102 },
	{ id: 'database-engineering', station: 1 },
	// data-pipeline stays 2, analytics-reporting stays 3
	{ id: 'web-development', station: 4 },
	{ id: 'sql-development', station: 5 },
	{ id: 'internal-tooling', station: 6 },
];

export interface ServiceTranslationPatch {
	title?: string;
	subtitle?: string | null;
	description?: string;
	value_proposition?: string;
	benefit_headline?: string;
	impact_metric_value?: string;
	impact_metric_label?: string;
}

export const TRANSLATION_PATCHES: Record<string, ServiceTranslationPatch> = {
	'database-engineering': {
		title: 'Databases & SQL',
		subtitle: null,
		description:
			'Schemas, queries, and migrations — a database that stays fast as your data grows.',
		value_proposition:
			"Slow queries and risky migrations are the same problem: a database nobody engineered. I audit the SQL layer, rewrite the expensive queries, design schemas that scale, and run migrations with rollback plans — 500GB+ moved safely so far. Faster dashboards, lower database costs, a database that's an asset, not a liability.",
		benefit_headline: 'Queries that run in seconds, not minutes',
		impact_metric_value: '3x faster',
		impact_metric_label: 'avg query improvement',
	},
	'data-pipeline': {
		title: 'Pipelines & Automation',
		description:
			'Data moves from source to warehouse on schedule — and the manual copy-paste work goes away.',
		value_proposition:
			'Data stuck in silos is data nobody can use — and an ops team copying between spreadsheets is the symptom. I build pipelines and workflow automation that move information from source systems to your warehouse reliably, with logging, retry logic, and schema validation. Your analysts get clean, fresh data every morning; your team stops doing data entry.',
	},
	'analytics-reporting': {
		title: 'Dashboards & Analytics',
		description:
			'One semantic layer, numbers that match in every report — dashboards your team trusts.',
	},
	'web-development': {
		title: 'Websites & E-commerce',
		description:
			'Fast sites and stores wired to your data — storefront to back office.',
	},
};

export const PARENT_PATCHES: Record<string, Record<string, unknown>> = {
	// Merged tool surface for the speed+safety station.
	'database-engineering': { stack: ['PostgreSQL', 'SQL Server', 'PL/pgSQL', 'T-SQL', 'Alembic'] },
	// E-commerce claimed via the stack (capability, not invented case study).
	// Operator ASK #5 confirms Shopify before Gate A.
	'web-development': { stack: ['SvelteKit', 'TypeScript', 'Tailwind CSS', 'Shopify', 'Vercel'] },
};

/** Station-1 "My Approach" — merged speed (sql) + safety (db-eng) paragraph. */
export const DB_ENG_SECTION_CONTENT =
	'I start with your slowest queries — execution plans and profiling find the root cause (missing indexes, implicit conversions, parameter sniffing) — and fix them systematically. Database changes are infrastructure changes: every migration gets a rollback script, and every schema change is benchmarked against production-scale data before deployment.';

/** Union of both old deliverable lists, duplicates collapsed. */
export const DB_ENG_DELIVERABLES: readonly string[] = [
	'Query performance audit',
	'Optimized stored procedures',
	'Schema design and normalization review',
	'Index optimization strategy',
	'Migration scripts with rollback',
	'Backup and recovery plan',
	'Performance benchmarking',
	'Documentation, runbooks, and ER diagrams',
];

export const PIPELINE_NEW_DELIVERABLE =
	'Workflow automation (approval flows, scheduled jobs)';

export const ARCHETYPE_SERVICE_MOVES: ReadonlyArray<{ slug: string; service: string }> = [
	// "A data dashboard" belongs to the Dashboards & Analytics station.
	{ slug: 'data-dashboard', service: 'analytics-reporting' },
];

// --- Row shapes -------------------------------------------------------------

export interface TechJunctionRow {
	id: number;
	tech_stack_id: string;
	services_id: string;
}
export interface ProjectJunctionRow {
	id: number;
	project_id: string;
	service_id: string;
}
export interface DeliverableRow {
	id: number;
	sort: number | null;
	translations?: Array<{ id: number; languages_code: string; label?: string | null }>;
}

interface Schema {
	services: Array<{ id: string; station: number; visible: boolean | null }>;
	services_translations: Array<{ id: number; services_id: string; languages_code: string }>;
	services_deliverables: Array<DeliverableRow & { services_id: string }>;
	services_deliverables_translations: Array<{ id: number; label: string | null }>;
	services_sections: Array<{
		id: number;
		services_id: string;
		translations?: Array<{ id: number; languages_code: string }>;
	}>;
	projects_services: ProjectJunctionRow[];
	tech_stack_services: TechJunctionRow[];
	stack_archetypes: Array<{ id: string; slug: string; service: string | null }>;
}

// --- Pure helpers (exported for tests) --------------------------------------

export function parseFlags(argv: readonly string[]): { apply: boolean } {
	return { apply: argv.includes('--apply') };
}

/** Replays STATION_MOVES over an initial id→station map; returns every
 *  intermediate state so tests can assert no two rows ever collide. */
export function simulateStationMoves(
	initial: Record<string, number>,
	moves: ReadonlyArray<{ id: string; station: number }>,
): Array<Record<string, number>> {
	const states: Array<Record<string, number>> = [];
	let current = { ...initial };
	for (const move of moves) {
		current = { ...current, [move.id]: move.station };
		states.push(current);
	}
	return states;
}

export type TechJunctionAction =
	| { op: 'remap'; id: number; to: string; tech: string; from: string }
	| { op: 'delete'; id: number; tech: string; from: string };

export function buildTechJunctionPlan(rows: readonly TechJunctionRow[]): TechJunctionAction[] {
	const have = new Set(rows.map((r) => `${r.tech_stack_id}::${r.services_id}`));
	const actions: TechJunctionAction[] = [];
	for (const r of rows) {
		const to = SURVIVOR_BY_ARCHIVED[r.services_id];
		if (!to) continue;
		if (have.has(`${r.tech_stack_id}::${to}`)) {
			actions.push({ op: 'delete', id: r.id, tech: r.tech_stack_id, from: r.services_id });
		} else {
			actions.push({ op: 'remap', id: r.id, to, tech: r.tech_stack_id, from: r.services_id });
			have.add(`${r.tech_stack_id}::${to}`);
		}
	}
	return actions;
}

export type ProjectJunctionAction =
	| { op: 'remap'; id: number; to: string; project: string; from: string }
	| { op: 'delete'; id: number; project: string; from: string };

export function buildProjectJunctionPlan(
	rows: readonly ProjectJunctionRow[],
): ProjectJunctionAction[] {
	const have = new Set(rows.map((r) => `${r.project_id}::${r.service_id}`));
	const actions: ProjectJunctionAction[] = [];
	for (const r of rows) {
		const to = SURVIVOR_BY_ARCHIVED[r.service_id];
		if (!to) continue;
		if (have.has(`${r.project_id}::${to}`)) {
			actions.push({ op: 'delete', id: r.id, project: r.project_id, from: r.service_id });
		} else {
			actions.push({ op: 'remap', id: r.id, to, project: r.project_id, from: r.service_id });
			have.add(`${r.project_id}::${to}`);
		}
	}
	return actions;
}

export type DeliverablePlanAction =
	| { op: 'patch'; rowId: number; trId: number | null; sort: number; label: string }
	| { op: 'create'; sort: number; label: string };

export function buildDeliverablesPlan(
	existing: readonly DeliverableRow[],
	target: readonly string[],
): DeliverablePlanAction[] {
	const sorted = [...existing].sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
	return target.map((label, i) => {
		const row = sorted[i];
		if (!row) return { op: 'create', sort: i + 1, label };
		const en = row.translations?.find((t) => t.languages_code === 'en');
		return { op: 'patch', rowId: row.id, trId: en?.id ?? null, sort: i + 1, label };
	});
}

// --- I/O ---------------------------------------------------------------------

type Client = ReturnType<typeof createClient<Schema>>;

async function enTranslationRowId(client: Client, serviceId: string): Promise<number> {
	const rows = (await client.request(
		readItems('services_translations', {
			filter: { services_id: { _eq: serviceId }, languages_code: { _eq: 'en' } },
			fields: ['id'],
			limit: 1,
		}),
	)) as Array<{ id: number }>;
	if (rows.length === 0) {
		throw new Error(`[consolidate-services] no en translation row for service '${serviceId}'`);
	}
	return rows[0].id;
}

export async function applyConsolidation(opts: { directusUrl: string; token: string }): Promise<void> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);

	// 0. Sanity: all 6 expected rows exist.
	const services = (await client.request(
		readItems('services', { fields: ['id', 'station', 'visible'], limit: -1 }),
	)) as Schema['services'];
	const ids = new Set(services.map((s) => s.id));
	for (const id of [...SURVIVOR_IDS, ...ARCHIVED_IDS]) {
		if (!ids.has(id)) throw new Error(`[consolidate-services] expected service '${id}' missing`);
	}
	log.info(`found ${services.length} services — proceeding`);

	// 1. Survivor translation patches (en rows only — archived copy untouched).
	for (const [serviceId, patch] of Object.entries(TRANSLATION_PATCHES)) {
		const trId = await enTranslationRowId(client, serviceId);
		await client.request(updateItem('services_translations', trId, patch as object));
		log.info(`  ✓ translations ${serviceId} (#${trId}) patched`);
	}

	// 2. Survivor parent patches (stack).
	for (const [serviceId, patch] of Object.entries(PARENT_PATCHES)) {
		await client.request(updateItem('services', serviceId, patch));
		log.info(`  ✓ parent ${serviceId} stack patched`);
	}

	// 3. Station renumber — strict order, collision-free.
	for (const move of STATION_MOVES) {
		await client.request(updateItem('services', move.id, { station: move.station }));
		log.info(`  ✓ station ${move.id} -> ${move.station}`);
	}

	// 4a. Station-1 deliverables merge.
	const dbEngDeliverables = (await client.request(
		readItems('services_deliverables', {
			filter: { services_id: { _eq: 'database-engineering' } },
			fields: ['id', 'sort', { translations: ['id', 'languages_code', 'label'] } as unknown as string],
			limit: -1,
		}),
	)) as unknown as DeliverableRow[];
	for (const action of buildDeliverablesPlan(dbEngDeliverables, DB_ENG_DELIVERABLES)) {
		if (action.op === 'create') {
			await client.request(
				createItem('services_deliverables', {
					services_id: 'database-engineering',
					sort: action.sort,
					translations: [{ languages_code: 'en', label: action.label }],
				} as object),
			);
			log.info(`  ✓ deliverable created (sort ${action.sort}): ${action.label}`);
		} else {
			await client.request(updateItem('services_deliverables', action.rowId, { sort: action.sort }));
			if (action.trId !== null) {
				await client.request(
					updateItem('services_deliverables_translations', action.trId, { label: action.label }),
				);
			} else {
				await client.request(
					updateItem('services_deliverables', action.rowId, {
						translations: [{ languages_code: 'en', label: action.label }],
					} as object),
				);
			}
			log.info(`  ✓ deliverable #${action.rowId} -> ${action.label}`);
		}
	}

	// 4b. Pipeline gains the absorbed automation deliverable (idempotent).
	const pipelineDeliverables = (await client.request(
		readItems('services_deliverables', {
			filter: { services_id: { _eq: 'data-pipeline' } },
			fields: ['id', 'sort', { translations: ['id', 'languages_code', 'label'] } as unknown as string],
			limit: -1,
		}),
	)) as unknown as DeliverableRow[];
	const hasAutomation = pipelineDeliverables.some((d) =>
		d.translations?.some((t) => t.languages_code === 'en' && t.label === PIPELINE_NEW_DELIVERABLE),
	);
	if (!hasAutomation) {
		const maxSort = Math.max(0, ...pipelineDeliverables.map((d) => d.sort ?? 0));
		await client.request(
			createItem('services_deliverables', {
				services_id: 'data-pipeline',
				sort: maxSort + 1,
				translations: [{ languages_code: 'en', label: PIPELINE_NEW_DELIVERABLE }],
			} as object),
		);
		log.info(`  ✓ pipeline deliverable appended: ${PIPELINE_NEW_DELIVERABLE}`);
	} else {
		log.info('  = pipeline automation deliverable already present (no-op)');
	}

	// 4c. Station-1 "My Approach" merged paragraph.
	const dbEngSections = (await client.request(
		readItems('services_sections', {
			filter: { services_id: { _eq: 'database-engineering' } },
			fields: ['id', { translations: ['id', 'languages_code'] } as unknown as string],
			limit: -1,
		}),
	)) as unknown as Schema['services_sections'];
	for (const section of dbEngSections) {
		const en = section.translations?.find((t) => t.languages_code === 'en');
		if (en) {
			await client.request(
				updateItem('services_sections_translations' as never, en.id as never, {
					content: DB_ENG_SECTION_CONTENT,
				} as never),
			);
			log.info(`  ✓ section #${section.id} content merged`);
		}
	}

	// 5. ARCHIVE (visible=false) — copy preserved, rows recoverable.
	for (const id of ARCHIVED_IDS) {
		await client.request(updateItem('services', id, { visible: false }));
		log.info(`  ✓ ${id} archived (visible=false)`);
	}

	// 6a. projects_services remap.
	const projectJunction = (await client.request(
		readItems('projects_services', { fields: ['id', 'project_id', 'service_id'], limit: -1 }),
	)) as ProjectJunctionRow[];
	for (const action of buildProjectJunctionPlan(projectJunction)) {
		if (action.op === 'remap') {
			await client.request(updateItem('projects_services', action.id, { service_id: action.to }));
			log.info(`  ✓ projects_services #${action.id} ${action.project}: ${action.from} -> ${action.to}`);
		} else {
			await client.request(deleteItem('projects_services', action.id));
			log.info(`  ✓ projects_services #${action.id} ${action.project}: duplicate ${action.from} link removed`);
		}
	}

	// 6b. tech_stack_services remap.
	const techJunction = (await client.request(
		readItems('tech_stack_services', { fields: ['id', 'tech_stack_id', 'services_id'], limit: -1 }),
	)) as TechJunctionRow[];
	for (const action of buildTechJunctionPlan(techJunction)) {
		if (action.op === 'remap') {
			await client.request(updateItem('tech_stack_services', action.id, { services_id: action.to }));
			log.info(`  ✓ tech_stack_services #${action.id} ${action.tech}: ${action.from} -> ${action.to}`);
		} else {
			await client.request(deleteItem('tech_stack_services', action.id));
			log.info(`  ✓ tech_stack_services #${action.id} ${action.tech}: duplicate ${action.from} link removed`);
		}
	}

	// 6c. stack_archetypes service FK.
	for (const move of ARCHETYPE_SERVICE_MOVES) {
		const rows = (await client.request(
			readItems('stack_archetypes', {
				filter: { slug: { _eq: move.slug } },
				fields: ['id', 'slug', 'service'],
				limit: 1,
			}),
		)) as Schema['stack_archetypes'];
		if (rows.length === 0) throw new Error(`[consolidate-services] archetype '${move.slug}' not found`);
		if (rows[0].service === move.service) {
			log.info(`  = archetype ${move.slug} already -> ${move.service} (no-op)`);
		} else {
			await client.request(updateItem('stack_archetypes', rows[0].id, { service: move.service }));
			log.info(`  ✓ archetype ${move.slug}: service -> ${move.service}`);
		}
	}

	// 7. Verify.
	const after = (await client.request(
		readItems('services', { fields: ['id', 'station', 'visible'], limit: -1 }),
	)) as Schema['services'];
	const visible = after.filter((s) => s.visible !== false).map((s) => s.id).sort();
	const expectVisible = [...SURVIVOR_IDS].sort();
	if (JSON.stringify(visible) !== JSON.stringify(expectVisible)) {
		throw new Error(`[consolidate-services] verify failed — visible set is ${visible.join(',')}`);
	}
	const stations = after.map((s) => s.station).sort((a, b) => a - b);
	if (JSON.stringify(stations) !== JSON.stringify([1, 2, 3, 4, 5, 6])) {
		throw new Error(`[consolidate-services] verify failed — stations are ${stations.join(',')}`);
	}
	const staleTech = (await client.request(
		readItems('tech_stack_services', {
			filter: { services_id: { _in: ARCHIVED_IDS } },
			fields: ['id'],
			limit: -1,
		}),
	)) as TechJunctionRow[];
	const staleProjects = (await client.request(
		readItems('projects_services', {
			filter: { service_id: { _in: ARCHIVED_IDS } },
			fields: ['id'],
			limit: -1,
		}),
	)) as ProjectJunctionRow[];
	if (staleTech.length + staleProjects.length > 0) {
		throw new Error('[consolidate-services] verify failed — junction rows still reference archived ids');
	}
	log.info('verified: 4 visible stations (1-4), archived rows parked at 5-6, zero stale relations.');
}

async function main(): Promise<void> {
	const { apply } = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	assertDevCms(url);
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}`);

	if (!apply) {
		log.info('dry-run plan (no reads, no writes):');
		for (const id of Object.keys(TRANSLATION_PATCHES)) log.info(`  ~ services_translations(en) ${id}: rewrite to 4-station copy`);
		for (const id of Object.keys(PARENT_PATCHES)) log.info(`  ~ services ${id}: stack patch`);
		for (const m of STATION_MOVES) log.info(`  ~ services ${m.id}: station -> ${m.station}`);
		log.info(`  ~ services_deliverables database-engineering: merge to ${DB_ENG_DELIVERABLES.length} rows`);
		log.info(`  ~ services_deliverables data-pipeline: append '${PIPELINE_NEW_DELIVERABLE}'`);
		log.info('  ~ services_sections database-engineering: merged My Approach paragraph');
		for (const id of ARCHIVED_IDS) log.info(`  ~ services ${id}: visible -> false (ARCHIVE)`);
		log.info('  ~ projects_services / tech_stack_services: remap-or-dedupe rows pointing at archived ids');
		for (const m of ARCHETYPE_SERVICE_MOVES) log.info(`  ~ stack_archetypes ${m.slug}: service -> ${m.service}`);
		log.info('dry-run complete. Pass --apply to execute (ORCHESTRATOR ONLY).');
		return;
	}

	const token = await getAdminToken(url);
	try {
		await applyConsolidation({ directusUrl: url, token });
	} catch (err) {
		if (err instanceof DirectusError) throw err;
		throw new DirectusError(500, `consolidation failed: ${parseErrors(err).join(' · ')}`);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[consolidate-services] FAILED:', err);
		process.exit(1);
	});
}
