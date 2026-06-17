/**
 * wire-orphan-tech.ts - give the remaining homeless (but real) tech a home, per
 * the operator's actual-usage mapping:
 *   - infra/testing tools → the PROJECTS that used them
 *   - dormant tools       → the SERVICE that fits their nature
 * Appends to the tech_stack_projects / tech_stack_services M2M (sort = append),
 * idempotent (skips already-linked). SSIS intentionally left out (operator's call).
 *
 * DEV-ONLY (hard guard). Dry-run by default; --apply to execute.
 */

import { readItems, createItems } from '@directus/sdk';
import { createClient, defaultDirectusUrl, requireEnv } from './lib/sdk';

// tech id -> project ids that actually used it.
const ADD_TO_PROJECTS: Record<string, string[]> = {
	docker: ['transit-data-pipeline'],
	'github-actions': ['yesid-dev', 'transit-data-pipeline'],
	playwright: ['yesid-dev', 'transit-data-pipeline', 'cafe-arona'],
	vitest: ['yesid-dev', 'transit-data-pipeline'],
};

// dormant tech -> the service that best represents it (by nature).
const ADD_TO_SERVICES: Record<string, string[]> = {
	mysql: ['database-engineering'],
	react: ['web-development'],
	ssrs: ['analytics-reporting'],
	ssis: ['data-pipeline'],
	'threejs-threlte': ['web-development'],
};

type Client = ReturnType<typeof createClient>;

/** Append techs to a parent's M2M junction; returns a log line. */
async function appendTech(
	client: Client,
	junction: string,
	parentField: string,
	parentId: string,
	techByParent: Map<string, string[]>,
	dryRun: boolean,
): Promise<string> {
	const techs = techByParent.get(parentId) ?? [];
	const existing = (await client.request(
		readItems(junction, { limit: -1, fields: ['tech_stack_id', 'sort'], filter: { [parentField]: { _eq: parentId } } }),
	)) as Array<{ tech_stack_id: string; sort: number | null }>;
	const have = new Set(existing.map((r) => r.tech_stack_id));
	let nextSort = existing.reduce((m, r) => Math.max(m, r.sort ?? 0), -1) + 1;
	const rows = techs.filter((t) => !have.has(t)).map((t) => ({ [parentField]: parentId, tech_stack_id: t, sort: nextSort++ }));
	if (rows.length > 0 && !dryRun) await client.request(createItems(junction, rows));
	return `  ${parentId}: +${rows.length} [${rows.map((r) => r.tech_stack_id).join(', ')}]`;
}

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	// invert tech->parents into parent->techs.
	const projectsToTech = new Map<string, string[]>();
	for (const [tech, projects] of Object.entries(ADD_TO_PROJECTS))
		for (const p of projects) projectsToTech.set(p, [...(projectsToTech.get(p) ?? []), tech]);
	const servicesToTech = new Map<string, string[]>();
	for (const [tech, services] of Object.entries(ADD_TO_SERVICES))
		for (const s of services) servicesToTech.set(s, [...(servicesToTech.get(s) ?? []), tech]);

	log.push('Projects (tech_stack_projects):');
	for (const p of projectsToTech.keys())
		log.push(await appendTech(client, 'tech_stack_projects', 'projects_id', p, projectsToTech, dryRun));
	log.push('Services (tech_stack_services):');
	for (const s of servicesToTech.keys())
		log.push(await appendTech(client, 'tech_stack_services', 'services_id', s, servicesToTech, dryRun));

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	if (!directusUrl.includes('cms.dev.yesid.dev')) throw new Error(`Refusing non-dev CMS: ${directusUrl}. DEV-ONLY.`);
	const token = requireEnv('DIRECTUS_ADMIN_TOKEN', 'dev CMS admin token');
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

if (import.meta.main) {
	main().catch((e) => {
		console.error(e);
		process.exit(1);
	});
}
