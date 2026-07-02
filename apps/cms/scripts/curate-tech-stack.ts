/**
 * curate-tech-stack.ts - two non-destructive curation passes on tech_stack:
 *
 *  A. Give every PROJECT tech a home in a SERVICE (operator rule: "if I used a
 *     stack in a project, I've used it, so it belongs in my services"). Adds the
 *     8 project-only techs to the service that best represents them, appended
 *     after that service's existing stack.
 *
 *  B. Fill in the missing `layer` (interface / logic / data / infra) so every
 *     tech lands in the right group in the stack ENGINE (TechMatcher reads
 *     techStackItems grouped by layer) and on the tech-stack page. Layers are a
 *     best-guess default: recategorize freely in the CMS dropdown.
 *
 * DEV-ONLY (hard guard). Dry-run by default; --apply to execute.
 */

import { readItems, createItems, updateItem } from '@directus/sdk';
import { runMain } from './lib/cli';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

// A: tech id -> service id it should be wired into (single best home).
const ADD_TO_SERVICE: Record<string, string> = {
	'svelte-5': 'web-development',
	gsap: 'web-development',
	directus: 'web-development',
	bun: 'web-development',
	turbo: 'web-development',
	figma: 'web-development',
	liquid: 'web-development',
	neon: 'database-engineering',
};

// B: best-guess layers for the currently layer-less techs.
const SET_LAYER: Record<string, 'interface' | 'logic' | 'data' | 'infra'> = {
	figma: 'interface',
	liquid: 'interface',
	directus: 'logic',
	neon: 'data',
	turbo: 'infra',
	sql: 'data',
	'pl-pgsql': 'data',
	retool: 'interface',
};

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	// A: append tech to services (skip if already linked).
	const byService: Record<string, string[]> = {};
	for (const [tech, svc] of Object.entries(ADD_TO_SERVICE)) (byService[svc] ??= []).push(tech);

	for (const [svc, techs] of Object.entries(byService)) {
		const existing = (await client.request(
			readItems('tech_stack_services', { limit: -1, fields: ['tech_stack_id', 'sort'], filter: { services_id: { _eq: svc } } }),
		)) as Array<{ tech_stack_id: string; sort: number | null }>;
		const have = new Set(existing.map((r) => r.tech_stack_id));
		let nextSort = existing.reduce((m, r) => Math.max(m, r.sort ?? 0), -1) + 1;
		const rows = techs
			.filter((t) => !have.has(t))
			.map((t) => ({ services_id: svc, tech_stack_id: t, sort: nextSort++ }));
		log.push(`A] ${svc}: +${rows.length} [${rows.map((r) => r.tech_stack_id).join(', ')}]${rows.length < techs.length ? ` (skipped already-linked: ${techs.filter((t) => have.has(t)).join(', ')})` : ''}`);
		if (!dryRun && rows.length > 0) await client.request(createItems('tech_stack_services', rows));
	}

	// B: set layers.
	log.push('B] layers:');
	for (const [id, layer] of Object.entries(SET_LAYER)) {
		log.push(`   ${id} -> ${layer}`);
		if (!dryRun) await client.request(updateItem('tech_stack', id, { layer }));
	}

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	assertDevCms(directusUrl);
	const token = await getAdminToken(directusUrl);
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

runMain(main, import.meta);
