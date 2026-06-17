/**
 * drop-proof-reel-legacy-fields.ts
 *
 * Delete the old `block_proof_reel.slugs` and `.images` JSON fields. Featured
 * project membership now lives on project rows through the `featured` toggle,
 * and card imagery comes from project hero media.
 *
 * DEV-ONLY hard guard. Dry-run by default; pass --apply to execute.
 */

import { deleteField, readFieldsByCollection } from '@directus/sdk';
import { createClient, defaultDirectusUrl, requireEnv } from './lib/sdk';

const TARGETS = [
	{ collection: 'block_proof_reel', field: 'slugs' },
	{ collection: 'block_proof_reel', field: 'images' },
] as const;

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	for (const target of TARGETS) {
		const fields = await client.request(readFieldsByCollection(target.collection));
		if (!fields.some((field) => field.field === target.field)) {
			log.push(`  [skip] ${target.collection}.${target.field} already gone`);
			continue;
		}
		log.push(`  [drop] ${target.collection}.${target.field}`);
		if (!dryRun) await client.request(deleteField(target.collection, target.field));
	}

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	if (!directusUrl.includes('cms.dev.yesid.dev')) {
		throw new Error(`Refusing to run against non-dev CMS: ${directusUrl}. DEV-ONLY; prod runs via the gated promotion path.`);
	}
	const token = requireEnv('DIRECTUS_ADMIN_TOKEN', 'dev CMS admin token');
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN (no fields dropped)' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
