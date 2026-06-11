#!/usr/bin/env bun
/**
 * Create the `site_labels` singleton (global UI microcopy) + the /projects
 * page chrome columns (go2-t1c).
 *
 * site_labels carries the 22 verified hardcoded UI strings (aria labels, card
 * markers, edge titles, email templates) extracted from apps/web components.
 * Columns are prefix-grouped: a11y_ / ui_ / pages_ / email_. The fixture at
 * fixtures/content/site-labels.json is the single source of truth for seeds —
 * the committed apps/web module and the CMS rows both derive from it.
 *
 * Also adds `heading` + `empty_state` to block_projects_page_content_translations
 * and (behind --seed) aligns the /projects chrome row to the currently rendered
 * strings (GO-DAY RULE: visible output must not change; the old orphaned CMS
 * intro is logged for the Notion handoff).
 *
 * Mirrors setup-stack-archetypes-schema.ts (slice-29 house pattern): pure
 * exported plan builder, DRY-RUN BY DEFAULT, idempotent --apply, --seed for
 * content rows.
 *
 * Orchestrator runs (NEVER implementers — live CMS write):
 *   op run --env-file=.env -- env -u DIRECTUS_BUILD_TOKEN \
 *     PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
 *     bun --cwd apps/cms run setup:site-labels -- --apply --seed
 */

import seedsJson from '../fixtures/content/site-labels.json';
import { defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';

export const SITE_LABEL_SEEDS: Record<string, string> = seedsJson;

// --- Plan types (mirror setup-stack-archetypes-schema.ts) -------------------

export type SchemaStepKind = 'collection' | 'field' | 'relation' | 'permission';

export interface SchemaStep {
	kind: SchemaStepKind;
	/** Human-readable target, e.g. 'site_labels' or 'site_labels.translations'. */
	target: string;
	method: 'POST' | 'PATCH';
	path: string;
	payload: Record<string, unknown>;
	/** permission steps only: policy display names resolved to ids at apply time. */
	policyNames?: readonly string[];
}

/** uuid PK — mirrors site_pages.id. */
function uuidPkField() {
	return {
		field: 'id',
		type: 'uuid',
		meta: { hidden: true, special: ['uuid'], readonly: true },
		schema: { is_primary_key: true, is_unique: true },
	};
}

/** integer autoincrement PK — mirrors site_pages_translations.id. */
function autoincrementPkField() {
	return {
		field: 'id',
		type: 'integer',
		meta: { hidden: true },
		schema: { is_primary_key: true, has_auto_increment: true },
	};
}

// --- Pure plan builder (exported for the dry-run test) ----------------------

export function buildSiteLabelsPlan(): SchemaStep[] {
	const labelColumns = Object.entries(SITE_LABEL_SEEDS).map(([field, seed]) => ({
		field,
		type: 'string',
		meta: {
			interface: 'input',
			width: 'half',
			note: `Microcopy (go2-t1c). Group: ${field.split('_')[0]}. Default: "${seed}"`,
			sort: Object.keys(SITE_LABEL_SEEDS).indexOf(field) + 4,
		},
		schema: {},
	}));
	return [
		{
			kind: 'collection', target: 'site_labels', method: 'POST', path: '/collections',
			payload: {
				collection: 'site_labels',
				meta: {
					singleton: true, group: 'site_config', icon: 'sell',
					note: 'Global UI microcopy singleton (go2-t1c): aria labels, card markers, edge titles, email templates. Grouped by field-name prefix: a11y_ / ui_ / pages_ / email_.',
					hidden: false, collapse: 'open', versioning: true, accountability: 'all',
				},
				schema: {},
				fields: [uuidPkField()],
			},
		},
		{
			kind: 'collection', target: 'site_labels_translations', method: 'POST', path: '/collections',
			payload: {
				collection: 'site_labels_translations',
				meta: { hidden: true, icon: 'import_export' },
				schema: {},
				fields: [
					autoincrementPkField(),
					{ field: 'site_labels_id', type: 'uuid', meta: { hidden: true }, schema: {} },
					{ field: 'languages_code', type: 'string', meta: { hidden: true }, schema: {} },
					...labelColumns,
				],
			},
		},
		{
			kind: 'field', target: 'site_labels.translations', method: 'POST', path: '/fields/site_labels',
			payload: {
				field: 'translations', type: 'alias',
				meta: { interface: 'translations', special: ['translations'], options: { languageField: 'name' } },
				schema: null,
			},
		},
		{
			kind: 'relation', target: 'site_labels_translations.site_labels_id', method: 'POST', path: '/relations',
			payload: {
				collection: 'site_labels_translations', field: 'site_labels_id', related_collection: 'site_labels',
				meta: { one_field: 'translations', junction_field: 'languages_code', one_deselect_action: 'nullify' },
				schema: { on_delete: 'CASCADE' },
			},
		},
		{
			kind: 'relation', target: 'site_labels_translations.languages_code', method: 'POST', path: '/relations',
			payload: {
				collection: 'site_labels_translations', field: 'languages_code', related_collection: 'languages',
				meta: { junction_field: 'site_labels_id', one_deselect_action: 'nullify' },
				schema: { on_delete: 'SET NULL' },
			},
		},
		// /projects chrome columns
		{
			kind: 'field', target: 'block_projects_page_content_translations.heading', method: 'POST',
			path: '/fields/block_projects_page_content_translations',
			payload: { field: 'heading', type: 'string', meta: { interface: 'input', width: 'half', note: 'H1 of /projects (go2-t1c).' }, schema: {} },
		},
		{
			kind: 'field', target: 'block_projects_page_content_translations.empty_state', method: 'POST',
			path: '/fields/block_projects_page_content_translations',
			payload: { field: 'empty_state', type: 'string', meta: { interface: 'input', width: 'full', note: 'Empty-filter message on /projects (go2-t1c).' }, schema: {} },
		},
		// permissions (policy ids resolved at apply time, slice-29 pattern)
		...(['site_labels', 'site_labels_translations'] as const).flatMap((c): SchemaStep[] => [
			{ kind: 'permission', target: `${c}:read(build-bot)`, method: 'POST', path: '/permissions', policyNames: ['Build Bot — content read'], payload: { collection: c, action: 'read', fields: ['*'], permissions: {}, validation: null } },
			...(['create', 'read', 'update', 'delete'] as const).map((action): SchemaStep => ({
				kind: 'permission', target: `${c}:${action}(human-editor)`, method: 'POST', path: '/permissions', policyNames: ['Human Editor'], payload: { collection: c, action, fields: ['*'], permissions: {}, validation: null },
			})),
		]),
	];
}

export function parseFlags(argv: readonly string[]): { apply: boolean; seed: boolean } {
	return { apply: argv.includes('--apply'), seed: argv.includes('--seed') };
}

export function describeStep(step: SchemaStep): string {
	return `  ${step.kind.padEnd(12)} ${step.method.padEnd(5)} ${step.path.padEnd(46)} → ${step.target}`;
}

// --- Apply-time I/O (mirrors setup-stack-archetypes-schema.ts) ---------------

const log = createLogger('setup-site-labels');

interface ApplyContext {
	directusUrl: string;
	token: string;
}

async function rest(
	ctx: ApplyContext,
	method: string,
	path: string,
	body?: unknown,
): Promise<{ status: number; json: any }> {
	const res = await fetch(`${ctx.directusUrl}${path}`, {
		method,
		headers: {
			Authorization: `Bearer ${ctx.token}`,
			'Content-Type': 'application/json',
		},
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	const text = await res.text();
	let json: any = null;
	try {
		json = text ? JSON.parse(text) : null;
	} catch {
		json = { raw: text };
	}
	return { status: res.status, json };
}

/** Directus "this already exists" answers — tolerated so re-runs are idempotent. */
function isAlreadyExists(status: number, json: any): boolean {
	if (status < 400) return false;
	const errors: { message?: string; extensions?: { code?: string } }[] = json?.errors ?? [];
	return errors.some(
		(e) =>
			e.extensions?.code === 'RECORD_NOT_UNIQUE' ||
			/already exists/i.test(e.message ?? '') ||
			/already has an associated relationship/i.test(e.message ?? ''),
	);
}

async function applyPermission(ctx: ApplyContext, step: SchemaStep): Promise<void> {
	const policies = await rest(ctx, 'GET', '/policies?fields=id,name&limit=-1');
	if (policies.status >= 400) {
		throw new Error(`GET /policies failed (${policies.status}): ${JSON.stringify(policies.json)}`);
	}
	const names = step.policyNames ?? [];
	const policy = (policies.json?.data ?? []).find((p: { name: string }) => names.includes(p.name));
	if (!policy) {
		// Build Bot exists on prod only — a missing policy on an instance is a
		// skip, not a failure (the prod apply grants it there).
		log.info(`  skip permission — no policy named [${names.join(', ')}] on this instance`);
		return;
	}
	const payload = step.payload as { collection: string; action: string };
	const existing = await rest(
		ctx,
		'GET',
		`/permissions?limit=1&filter[policy][_eq]=${policy.id}` +
			`&filter[collection][_eq]=${payload.collection}&filter[action][_eq]=${payload.action}`,
	);
	if ((existing.json?.data ?? []).length > 0) {
		log.info(`  skip permission — ${policy.name} already has ${payload.action} on ${payload.collection}`);
		return;
	}
	const post = await rest(ctx, 'POST', '/permissions', { ...step.payload, policy: policy.id });
	if (post.status >= 400) {
		throw new Error(
			`POST /permissions ${payload.collection}:${payload.action} failed (${post.status}): ${JSON.stringify(post.json)}`,
		);
	}
	log.info(`  ✓ permission — ${policy.name} ${payload.action} ${payload.collection}`);
}

export async function applySchemaPlan(plan: SchemaStep[], ctx: ApplyContext): Promise<void> {
	for (const step of plan) {
		if (step.kind === 'permission') {
			await applyPermission(ctx, step);
			continue;
		}
		const res = await rest(ctx, step.method, step.path, step.payload);
		if (res.status < 400) {
			log.info(`  ✓ ${step.kind} — ${step.target}`);
			continue;
		}
		if (isAlreadyExists(res.status, res.json)) {
			log.info(`  skip ${step.kind} — ${step.target} already exists`);
			continue;
		}
		throw new Error(
			`${step.method} ${step.path} (${step.target}) failed (${res.status}): ${JSON.stringify(res.json)}`,
		);
	}
}

// --- Seeding (idempotent, behind --seed) -------------------------------------

async function apiGet(ctx: ApplyContext, path: string): Promise<any> {
	const res = await rest(ctx, 'GET', path);
	if (res.status >= 400) throw new Error(`GET ${path} → ${res.status}: ${JSON.stringify(res.json)}`);
	return res.json;
}

async function apiPost(ctx: ApplyContext, path: string, body: unknown): Promise<any> {
	const res = await rest(ctx, 'POST', path, body);
	if (res.status >= 400) throw new Error(`POST ${path} → ${res.status}: ${JSON.stringify(res.json)}`);
	return res.json;
}

async function apiPatch(ctx: ApplyContext, path: string, body: unknown): Promise<any> {
	const res = await rest(ctx, 'PATCH', path, body);
	if (res.status >= 400) throw new Error(`PATCH ${path} → ${res.status}: ${JSON.stringify(res.json)}`);
	return res.json;
}

async function seed(ctx: ApplyContext): Promise<void> {
	// 1. ensure the singleton row exists
	const existing = await apiGet(ctx, '/items/site_labels');
	let parentId = (existing?.data as { id?: string } | null)?.id;
	if (!parentId) {
		const created = await apiPost(ctx, '/items/site_labels', {});
		parentId = (created.data as { id: string }).id;
		log.info(`  created site_labels singleton row ${parentId}`);
	}
	// 2. upsert the EN translation row
	const trs = await apiGet(ctx, `/items/site_labels_translations?filter[languages_code][_eq]=en&limit=1`);
	const enRow = (trs.data as Array<{ id: number }>)[0];
	if (enRow) {
		await apiPatch(ctx, `/items/site_labels_translations/${enRow.id}`, SITE_LABEL_SEEDS);
		log.info(`  updated site_labels_translations#${enRow.id} (en) with ${Object.keys(SITE_LABEL_SEEDS).length} seeds`);
	} else {
		await apiPost(ctx, '/items/site_labels_translations', {
			site_labels_id: parentId,
			languages_code: 'en',
			...SITE_LABEL_SEEDS,
		});
		log.info(`  created site_labels_translations (en) with ${Object.keys(SITE_LABEL_SEEDS).length} seeds`);
	}
	// 3. /projects chrome seeds — GO-DAY RULE: visible output must not change.
	//    heading = current rendered H1; empty_state = current rendered empty message;
	//    intro is OVERWRITTEN to the currently rendered hardcoded subtitle (the old
	//    CMS intro value is recorded in the run log for Notion).
	const ptrs = await apiGet(ctx, `/items/block_projects_page_content_translations?filter[languages_code][_eq]=en&limit=1`);
	const pEn = (ptrs.data as Array<{ id: number; intro: string }>)[0];
	if (!pEn) throw new Error('no EN row on block_projects_page_content_translations');
	log.info(`  replacing /projects intro (was: "${pEn.intro}")`);
	await apiPatch(ctx, `/items/block_projects_page_content_translations/${pEn.id}`, {
		heading: 'Projects',
		intro: 'Projects, pipelines, and systems I have built.',
		empty_state: 'No projects match the selected filters.',
	});
	log.info('  /projects chrome seeded (heading/intro/empty_state).');
}

// --- Main ---------------------------------------------------------------------

async function main(): Promise<void> {
	const { apply, seed: doSeed } = parseFlags(process.argv.slice(2));
	const url = defaultDirectusUrl();
	const plan = buildSiteLabelsPlan();
	log.info(`target: ${url}${apply ? ' [apply]' : ' [dry-run]'}${doSeed ? ' [seed]' : ''}`);
	log.info(`plan: ${plan.length} steps`);
	for (const step of plan) log.info(describeStep(step));

	if (!apply) {
		log.info('dry-run complete (no reads, no writes). Pass --apply to execute, --seed to seed rows.');
		return;
	}

	const token = await getAdminToken(url);
	const ctx: ApplyContext = { directusUrl: url, token };
	await applySchemaPlan(plan, ctx);
	if (doSeed) {
		log.info('seeding…');
		await seed(ctx);
	}
	log.info('apply complete.');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[setup-site-labels] FAILED:', err);
		process.exit(1);
	});
}
