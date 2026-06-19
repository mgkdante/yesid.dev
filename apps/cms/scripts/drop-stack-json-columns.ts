/**
 * drop-stack-json-columns.ts - final step of the tech-stack normalization:
 * delete the now-redundant denormalized `stack` json columns from `projects`
 * and `services`. The tech_stack M2M (rebuilt by normalize-tech-stack-m2m.ts)
 * is the single source; the fetchers read it; nothing reads the json columns.
 *
 * RUN ORDER (prod replay): normalize-tech-stack-m2m.ts MUST run first (it reads
 * the json to build the M2M); only then drop the columns.
 *
 * DEV-ONLY (hard guard). Dry-run by default; --apply to execute. Destructive.
 */

import { deleteField, readFieldsByCollection } from '@directus/sdk';
import { runMain } from './lib/cli';
import { getAdminToken } from './lib/auth';
import { assertDevCms, createClient, defaultDirectusUrl } from './lib/sdk';

const TARGETS = [
	{ collection: 'projects', field: 'stack' },
	{ collection: 'services', field: 'stack' },
] as const;

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];
	for (const t of TARGETS) {
		const fields = await client.request(readFieldsByCollection(t.collection));
		if (!fields.some((f) => f.field === t.field)) {
			log.push(`  [skip] ${t.collection}.${t.field} already gone`);
			continue;
		}
		log.push(`  [drop] ${t.collection}.${t.field}`);
		if (!dryRun) await client.request(deleteField(t.collection, t.field));
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
	console.log(`\n${dryRun ? 'DRY-RUN (no columns dropped)' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

runMain(main);
