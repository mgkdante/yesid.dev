#!/usr/bin/env bun
/**
 * Launch Phase 1 + ES pass — PROD promotion (operator-gated).
 *
 * Replays the Phase 1 CMS work against PRODUCTION (cms.yesid.dev) so the prod
 * build (which regenerates the .ts from PROD CMS) ships the launch content:
 *   1. guards     ensure the `es` languages row exists (every es junction row
 *                 below FK-references it)
 *   2. schema     legal_pages(+_translations) + permissions, contact BEST FIT
 *                 columns, footer group-label columns (all idempotent)
 *   3. reconcile  fix-to-new (operator call): replace prod's stale yesid-dev
 *                 impact metrics with dev's launch five; identity-assert the
 *                 services_sections 23→22 remap; build the drop id maps
 *   4. content    seed legal pages (en+fr) + site_pages + footer nav_links,
 *                 About AI line, contact BEST FIT values (en+fr)
 *   5. i18n       remapped es drops behind a full parent pre-flight
 *                 (es BEST FIT rides the drop)
 *
 * Calls each module's exported apply()/applyPlan()/applyDrop() directly, so
 * the per-script dev-only guards (in their main()) are bypassed HERE, in one
 * auditable, PROD-asserted place (pattern: promote-content-services-prod).
 *
 * DRY-RUN BY DEFAULT. PROD-ONLY (refuses any non-prod URL). Run from repo root:
 *   bun apps/cms/scripts/promote-launch-phase1-prod.ts                                      # plan
 *   op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.yesid.dev \
 *     bun apps/cms/scripts/promote-launch-phase1-prod.ts --apply                            # PROD write
 */

import { readFileSync } from 'node:fs';
import { buildPlan as buildLegalSchemaPlan, applyPlan as applyLegalSchemaPlan } from './setup-legal-pages-schema';
import { buildFieldPlan as buildBestFitFieldPlan, applyPlan as applyBestFitFieldPlan } from './setup-contact-best-fit-fields';
import { apply as applyFooterGroups } from './setup-footer-groups';
import { apply as applySeedLegalPages } from './seed-legal-pages';
import { apply as applyAboutAiLine } from './content-about-ai-line';
import { apply as applyContactBestFit } from './content-contact-best-fit';
import { applyDrop, validateDrop, type Drop } from './import-translations';
import { createClient } from './lib/sdk';
import { createLogger } from './lib/logger';
import { type ApplyContext, rest } from './lib/schema-apply';

const log = createLogger('promote-launch-phase1-prod');
const PROD_URL = 'https://cms.yesid.dev';

const DROPS = [
	'ops/i18n/es-2026-07-09.json',
	'ops/i18n/es-projects-2026-07-09.json',
] as const;

function loadDrop(relPath: string): Drop {
	const drop = JSON.parse(readFileSync(new URL(`../${relPath}`, import.meta.url), 'utf-8')) as Drop;
	validateDrop(drop);
	return drop;
}

/**
 * ── Dev/prod id-drift reconcile (operator call 2026-07-09: "fix to new") ──
 *
 * Live comparison (2026-07-09) found two drifts between the dev drops' parent
 * ids and prod:
 *   - projects_impact_metrics: dev's yesid-dev metrics are ids 56-60 with the
 *     LAUNCH copy; prod still carries ids 11-15 with the pre-launch copy
 *     ("62K+ lines of code" era). Fix-to-new: mirror dev's five rows on prod
 *     (values + en/fr labels embedded below, auditable), delete the stale
 *     rows, and remap the drop ids to the fresh prod ids.
 *   - services_sections: dev 23 == prod 22 (web-development "Is this you?",
 *     en/fr content hash-identical) — the row was recreated on dev under a
 *     new id. Pure remap 23 → 22 after an identity assert; no content write.
 */
const YESID_METRICS_NEW = [
	{ devId: 56, sort: 1, value: '3,151', en: 'tests guarding the build', fr: 'tests qui gardent le build' },
	{ devId: 57, sort: 2, value: '0', en: 'CMS calls per visit', fr: 'appels au CMS par visite' },
	{ devId: 58, sort: 3, value: '650', en: 'bilingual strings, locked by a test', fr: 'chaînes bilingues, verrouillées par un test' },
	{ devId: 59, sort: 4, value: '100%', en: 'content from the CMS', fr: 'contenu venu du CMS' },
	{ devId: 60, sort: 5, value: '0', en: 'warnings tolerated in CI', fr: 'avertissements tolérés en CI' },
] as const;

const SECTION_REMAP = { devId: 23, prodId: 22, servicesId: 'web-development', enTitle: 'Is this you?' } as const;

interface MetricRow {
	id: number;
	sort: number;
	value: string;
	translations: Array<{ id: number; languages_code: string; label: string }>;
}

/** Mirror dev's yesid-dev metrics on prod; return devId → prodId. Idempotent:
 *  a prod row already matching (value + en label) is reused, never duplicated;
 *  stale yesid-dev rows (no match in the new set) are deleted with their
 *  translation rows. */
async function reconcileYesidMetrics(ctx: ApplyContext): Promise<Map<number, number>> {
	const res = await rest(
		ctx,
		'GET',
		'/items/projects_impact_metrics?filter[projects_id][_eq]=yesid-dev' +
			'&fields=id,sort,value,translations.id,translations.languages_code,translations.label&limit=50',
	);
	if (res.status >= 400) throw new Error(`GET yesid-dev metrics failed (${res.status}): ${JSON.stringify(res.json)}`);
	const existing = (res.json?.data ?? []) as MetricRow[];
	const enLabel = (row: MetricRow) => row.translations.find((t) => t.languages_code === 'en')?.label;

	const map = new Map<number, number>();
	const matched = new Set<number>();
	for (const spec of YESID_METRICS_NEW) {
		const hit = existing.find((row) => row.value === spec.value && enLabel(row) === spec.en);
		if (hit) {
			map.set(spec.devId, hit.id);
			matched.add(hit.id);
			log.info(`  skip metric "${spec.value} ${spec.en}" already on prod (id ${hit.id})`);
		}
	}

	// Stale rows: yesid-dev metrics that are not part of the new set.
	for (const row of existing) {
		if (matched.has(row.id)) continue;
		const junctionIds = row.translations.map((t) => t.id);
		if (junctionIds.length > 0) {
			const delTr = await rest(ctx, 'DELETE', '/items/projects_impact_metrics_translations', junctionIds);
			if (delTr.status >= 400) {
				throw new Error(`DELETE stale metric ${row.id} translations failed (${delTr.status}): ${JSON.stringify(delTr.json)}`);
			}
		}
		const del = await rest(ctx, 'DELETE', `/items/projects_impact_metrics/${row.id}`);
		if (del.status >= 400) throw new Error(`DELETE stale metric ${row.id} failed (${del.status}): ${JSON.stringify(del.json)}`);
		log.info(`  ok deleted stale metric ${row.id} ("${row.value} ${enLabel(row) ?? '?'}")`);
	}

	// Create what is still missing, capturing the fresh prod ids.
	for (const spec of YESID_METRICS_NEW) {
		if (map.has(spec.devId)) continue;
		const post = await rest(ctx, 'POST', '/items/projects_impact_metrics', {
			projects_id: 'yesid-dev',
			sort: spec.sort,
			value: spec.value,
			translations: [
				{ languages_code: 'en', label: spec.en },
				{ languages_code: 'fr', label: spec.fr },
			],
		});
		if (post.status >= 400 || !post.json?.data?.id) {
			throw new Error(`POST metric "${spec.en}" failed (${post.status}): ${JSON.stringify(post.json)}`);
		}
		map.set(spec.devId, post.json.data.id as number);
		log.info(`  ok created metric "${spec.value} ${spec.en}" (prod id ${post.json.data.id})`);
	}
	return map;
}

/** Assert prod's web-development "Is this you?" row and return the 23→22 map. */
async function assertSectionRemap(ctx: ApplyContext): Promise<Map<number, number>> {
	const res = await rest(
		ctx,
		'GET',
		`/items/services_sections/${SECTION_REMAP.prodId}?fields=id,services_id,translations.languages_code,translations.title`,
	);
	const row = res.json?.data as
		| { services_id: string; translations: Array<{ languages_code: string; title: string }> }
		| undefined;
	const enTitle = row?.translations?.find((t) => t.languages_code === 'en')?.title;
	if (res.status >= 400 || !row || row.services_id !== SECTION_REMAP.servicesId || enTitle !== SECTION_REMAP.enTitle) {
		throw new Error(
			`services_sections/${SECTION_REMAP.prodId} identity assert failed ` +
				`(expected ${SECTION_REMAP.servicesId} "${SECTION_REMAP.enTitle}"; got ${res.status} ${JSON.stringify(row)})`,
		);
	}
	log.info(`  ok section remap ${SECTION_REMAP.devId} → ${SECTION_REMAP.prodId} (identity verified)`);
	return new Map([[SECTION_REMAP.devId, SECTION_REMAP.prodId]]);
}

/** Rewrite drop entry ids through the reconcile maps (only mapped collections). */
function remapDrop(drop: Drop, maps: Record<string, Map<number, number>>): Drop {
	return {
		...drop,
		entries: drop.entries.map((e) => {
			const mapped = maps[e.collection]?.get(Number(e.id));
			return mapped === undefined ? e : { ...e, id: mapped };
		}),
	};
}

/**
 * Fail-fast pre-flight: every drop entry's PARENT row must exist on the target
 * before the drops replay. Dev-exported drops carry dev auto-increment ids;
 * if dev and prod sequences drifted (rows created independently on each), an
 * id can be absent on prod (loud FK failure mid-drop, partial promotion) or —
 * worse — exist as a DIFFERENT row (silent wrong-parent translation). The two
 * KNOWN drifts are reconciled + remapped above; this catches any NEW drift
 * with a complete report before a single junction row is written.
 */
async function preflightDropParents(ctx: ApplyContext, drops: Array<{ path: string; drop: Drop }>): Promise<void> {
	const missing: string[] = [];
	for (const { path, drop } of drops) {
		for (const e of drop.entries) {
			const res = await rest(ctx, 'GET', `/items/${e.collection}/${encodeURIComponent(String(e.id))}?fields=id`);
			if (res.status === 404 || res.status === 403 || !res.json?.data) {
				missing.push(`${path}: ${e.collection}/${e.id}`);
			} else if (res.status >= 400) {
				throw new Error(`preflight GET ${e.collection}/${e.id} failed (${res.status}): ${JSON.stringify(res.json)}`);
			}
		}
	}
	if (missing.length > 0) {
		throw new Error(
			`preflight: ${missing.length} drop parent(s) missing on target — dev/prod id drift; ` +
				`promote the parent content first or remap the drop. Missing:\n  ${missing.join('\n  ')}`,
		);
	}
	log.info('  ok preflight: every drop parent exists on target');
}

/** The es languages row gates every ES junction row below (FK). Create if absent. */
async function ensureEsLanguage(ctx: ApplyContext): Promise<void> {
	const existing = await rest(ctx, 'GET', "/items/languages?filter[code][_eq]=es&fields=code,name");
	if (existing.status >= 400) {
		throw new Error(`GET /items/languages failed (${existing.status}): ${JSON.stringify(existing.json)}`);
	}
	if ((existing.json?.data ?? []).length > 0) {
		log.info('  skip languages.es already exists');
		return;
	}
	const post = await rest(ctx, 'POST', '/items/languages', { code: 'es', name: 'Español', direction: 'ltr' });
	if (post.status >= 400) {
		throw new Error(`POST /items/languages es failed (${post.status}): ${JSON.stringify(post.json)}`);
	}
	log.info('  ok languages.es created (Español, ltr)');
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = process.env.PUBLIC_DIRECTUS_URL ?? PROD_URL;
	log.info(`target: ${url}${apply_ ? ' [APPLY — PROD WRITE]' : ' [dry-run]'}`);

	// Validate the drops on BOTH paths — a malformed drop should fail the plan.
	const drops = DROPS.map((p) => ({ path: p, drop: loadDrop(p) }));

	if (!apply_) {
		log.info('plan (in order):');
		log.info('  1. guards     ensure languages.es row (Español, ltr)');
		log.info('  2. schema     legal_pages(+translations, permissions) / contact BEST FIT columns / footer group labels(+values)');
		log.info('  3. reconcile  fix-to-new: replace prod yesid-dev impact metrics with the launch five:');
		for (const spec of YESID_METRICS_NEW) {
			log.info(`               "${spec.value} ${spec.en}" (drop id ${spec.devId} remaps to the fresh prod id)`);
		}
		log.info(`               services_sections remap ${SECTION_REMAP.devId} → ${SECTION_REMAP.prodId} (identity-asserted, no content write)`);
		log.info('  4. content    seed-legal-pages (5 pages en+fr + site_pages + footer nav_links) / about AI line / contact BEST FIT values (en+fr)');
		log.info('  5. i18n       remapped es junction drops, gated by a full parent pre-flight:');
		for (const { path, drop } of drops) {
			log.info(`               import ${path} (${drop.entries.length} ${drop.locale} junction upserts)`);
		}
		log.info('dry-run complete. Pass --apply (with PUBLIC_DIRECTUS_URL=' + PROD_URL + ') to execute.');
		return;
	}

	// PROD-ONLY guard: this orchestrator is the deliberate production promotion.
	if (url !== PROD_URL) {
		throw new Error(`refusing --apply: this script targets PROD only (${PROD_URL}); got '${url}'.`);
	}
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN in env (run via op run --env-file=apps/cms/.env)');
	const ctx: ApplyContext = { directusUrl: url, token };

	log.info('1/5 guards: es languages row…');
	await ensureEsLanguage(ctx);

	log.info('2/5 schema: legal pages + BEST FIT columns + footer groups (idempotent)…');
	await applyLegalSchemaPlan(buildLegalSchemaPlan(), ctx);
	await applyBestFitFieldPlan(buildBestFitFieldPlan(), ctx);
	await applyFooterGroups(ctx);

	log.info('3/5 reconcile: yesid-dev metrics fix-to-new + section remap…');
	const metricsMap = await reconcileYesidMetrics(ctx);
	const sectionMap = await assertSectionRemap(ctx);
	const remapped = drops.map(({ path, drop }) => ({
		path,
		drop: remapDrop(drop, { projects_impact_metrics: metricsMap, services_sections: sectionMap }),
	}));

	log.info('4/5 content: legal pages, About AI line, BEST FIT values…');
	await applySeedLegalPages(ctx);
	await applyAboutAiLine(ctx);
	await applyContactBestFit(ctx);

	log.info('5/5 translations: parent pre-flight, then the remapped es drops…');
	await preflightDropParents(ctx, remapped);
	const client = createClient(url, token);
	for (const { path, drop } of remapped) {
		const { created, updated } = await applyDrop(client, drop);
		log.info(`  ok ${path}: ${created} created, ${updated} updated (${drop.entries.length} entries)`);
	}
	log.info('PROD launch-phase1 promotion complete. Publish→rebuild picks it up (VERCEL_DEPLOY_HOOK_PROD).');
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[promote-launch-phase1-prod] FAILED:', err);
		process.exit(1);
	});
}
