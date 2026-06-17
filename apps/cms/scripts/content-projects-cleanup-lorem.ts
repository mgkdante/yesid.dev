#!/usr/bin/env bun
/**
 * content-projects slice - remove the 4 lorem-* placeholder projects.
 *
 * Deletes each project's children FIRST (sections + their translations,
 * impact_metrics + their translations, projects_translations, any
 * projects_services junctions) then the project row, so no orphan rows remain.
 * (The lorem-* service junctions were already dropped in content-services.)
 *
 * Idempotent: a project that's already gone is skipped.
 *
 * DRY-RUN BY DEFAULT. Dev-only guard (prod gets it via the slice's prod
 * promotion). Run from repo root:
 *   bun apps/cms/scripts/content-projects-cleanup-lorem.ts                                       # plan
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-projects-cleanup-lorem.ts --apply   # dev
 */

import { deleteItem, deleteItems, readItem } from '@directus/sdk';
import { createClient, defaultDirectusUrl } from './lib/sdk';
import { createLogger } from './lib/logger';
import { DirectusError, parseErrors } from './lib/catch-error';

const log = createLogger('content-projects-cleanup-lorem');

export const LOREM_IDS = [
	'lorem-analytics-dashboard',
	'lorem-database-migration',
	'lorem-query-optimizer',
	'lorem-retool-admin',
] as const;

interface ProjectChildren {
	id: string;
	translations?: Array<{ id: number }>;
	sections?: Array<{ id: number; translations?: Array<{ id: number }> }>;
	impact_metrics?: Array<{ id: number; translations?: Array<{ id: number }> }>;
	services?: Array<{ id: number }>;
}
interface Schema {
	projects: ProjectChildren[];
}
type Client = ReturnType<typeof createClient<Schema>>;

async function delMany(client: Client, collection: string, ids: number[]): Promise<void> {
	if (ids.length === 0) return;
	await client.request(deleteItems(collection as never, ids as never));
}

export async function apply(opts: { directusUrl: string; token: string }): Promise<void> {
	const client = createClient<Schema>(opts.directusUrl, opts.token);
	for (const id of LOREM_IDS) {
		let proj: ProjectChildren;
		try {
			proj = (await client.request(
				readItem('projects', id, {
					fields: [
						'id',
						{ translations: ['id'] },
						{ sections: ['id', { translations: ['id'] }] },
						{ impact_metrics: ['id', { translations: ['id'] }] },
						{ services: ['id'] },
					] as unknown as string[],
				}),
			)) as ProjectChildren;
		} catch {
			log.info(`  - ${id}: not found (already deleted), skipping`);
			continue;
		}

		const sectionTrIds = (proj.sections ?? []).flatMap((s) => (s.translations ?? []).map((t) => t.id));
		const sectionIds = (proj.sections ?? []).map((s) => s.id);
		const metricTrIds = (proj.impact_metrics ?? []).flatMap((m) => (m.translations ?? []).map((t) => t.id));
		const metricIds = (proj.impact_metrics ?? []).map((m) => m.id);
		const trIds = (proj.translations ?? []).map((t) => t.id);
		const junctionIds = (proj.services ?? []).map((j) => j.id);

		// Children first (avoids FK/RESTRICT violations + orphan rows), then parent.
		await delMany(client, 'projects_sections_translations', sectionTrIds);
		await delMany(client, 'projects_sections', sectionIds);
		await delMany(client, 'projects_impact_metrics_translations', metricTrIds);
		await delMany(client, 'projects_impact_metrics', metricIds);
		await delMany(client, 'projects_translations', trIds);
		await delMany(client, 'projects_services', junctionIds);
		await client.request(deleteItem('projects', id));
		log.info(
			`  ✓ deleted '${id}' (+${sectionIds.length} sections, ${metricIds.length} metrics, ${trIds.length} translations, ${junctionIds.length} junctions)`,
		);
	}
}

async function main(): Promise<void> {
	const apply_ = process.argv.includes('--apply');
	const url = defaultDirectusUrl();
	log.info(`target: ${url}${apply_ ? ' [apply]' : ' [dry-run]'}`);

	if (!apply_) {
		for (const id of LOREM_IDS) log.info(`  ~ would delete project '${id}' + all children`);
		log.info('dry-run complete. Pass --apply to execute.');
		return;
	}

	if (!url.includes('cms.dev.yesid.dev')) {
		throw new Error(
			`refusing --apply against non-dev URL '${url}'. Run via op run --env-file=apps/cms/.env -- bun apps/cms/scripts/content-projects-cleanup-lorem.ts --apply`,
		);
	}
	const token = process.env.DIRECTUS_ADMIN_TOKEN;
	if (!token) throw new Error('no DIRECTUS_ADMIN_TOKEN (run via op run --env-file=apps/cms/.env)');
	try {
		await apply({ directusUrl: url, token });
		log.info('done.');
	} catch (err) {
		if (err instanceof DirectusError) throw err;
		throw new DirectusError(500, `lorem cleanup failed: ${parseErrors(err).join(' · ')}`);
	}
}

if (import.meta.main) {
	main().catch((err) => {
		console.error('[content-projects-cleanup-lorem] FAILED:', err);
		process.exit(1);
	});
}
