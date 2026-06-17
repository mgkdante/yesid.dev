/**
 * tech-icons-new.ts
 *
 * Wires CMS icon records for the newer tech_stack rows that were created
 * during the stack normalization pass but still had icon_id=null.
 *
 * DEV-ONLY. Dry-run by default; pass --apply to execute.
 */

import { createItems, readItems, updateItem } from '@directus/sdk';
import { createClient, defaultDirectusUrl, requireEnv } from './lib/sdk';

export const TECH_ICON_TARGETS = [
	{ id: 'shopify', name: 'Shopify', iconify_id: 'logos:shopify' },
	{ id: 'dbt', name: 'dbt', iconify_id: 'simple-icons:dbt' },
	{ id: 'directus', name: 'Directus', iconify_id: 'simple-icons:directus' },
	{ id: 'neon', name: 'Neon', iconify_id: 'simple-icons:neon' },
	{ id: 'turbo', name: 'Turbo', iconify_id: 'simple-icons:turborepo' },
	{ id: 'figma', name: 'Figma', iconify_id: 'logos:figma' },
	{ id: 'liquid', name: 'Liquid', iconify_id: 'vscode-icons:file-type-liquid' },
	{ id: 'retool', name: 'Retool', iconify_id: 'simple-icons:retool' },
	{ id: 'sql', name: 'SQL', iconify_id: 'mdi:database-search' },
	{ id: 'pl-pgsql', name: 'PL/pgSQL', iconify_id: 'logos:postgresql' },
] as const;

type Client = ReturnType<typeof createClient>;

interface IconRow {
	id: string;
	name: string;
	iconify_id: string | null;
	sort: number | null;
}

interface TechStackRow {
	id: string;
	icon_id: string | { id: string } | null;
}

function normalizeIconId(icon_id: TechStackRow['icon_id']): string | null {
	if (!icon_id) return null;
	if (typeof icon_id === 'string') return icon_id;
	return icon_id.id;
}

export async function apply(opts: { directusUrl: string; token: string; dryRun?: boolean }): Promise<string[]> {
	const dryRun = opts.dryRun ?? false;
	const client: Client = createClient(opts.directusUrl, opts.token);
	const log: string[] = [];

	const [icons, techRows] = await Promise.all([
		client.request(readItems('icons', { fields: ['id', 'name', 'iconify_id', 'sort'], limit: -1 })) as Promise<IconRow[]>,
		client.request(readItems('tech_stack', { fields: ['id', 'icon_id'], filter: { id: { _in: TECH_ICON_TARGETS.map((t) => t.id) } }, limit: -1 })) as Promise<TechStackRow[]>,
	]);

	const iconsById = new Map(icons.map((icon) => [icon.id, icon]));
	const techById = new Map(techRows.map((tech) => [tech.id, tech]));
	let nextSort = icons.reduce((max, icon) => Math.max(max, icon.sort ?? 0), 0);

	const missingIconRows = TECH_ICON_TARGETS
		.filter((target) => !iconsById.has(target.id))
		.map((target) => ({
			id: target.id,
			name: target.name,
			iconify_id: target.iconify_id,
			svg_override: null,
			category: ['tech-stack'],
			notes: null,
			status: 'published',
			sort: ++nextSort,
		}));

	log.push(`icons: ${missingIconRows.length} create, ${TECH_ICON_TARGETS.length - missingIconRows.length} existing`);
	for (const row of missingIconRows) {
		log.push(`  create icons.${row.id} iconify_id=${row.iconify_id}`);
	}
	if (!dryRun && missingIconRows.length > 0) {
		await client.request(createItems('icons', missingIconRows));
	}

	for (const target of TECH_ICON_TARGETS) {
		const existingIcon = iconsById.get(target.id);
		if (existingIcon && (existingIcon.name !== target.name || existingIcon.iconify_id !== target.iconify_id)) {
			log.push(`  update icons.${target.id} iconify_id=${target.iconify_id}`);
			if (!dryRun) {
				await client.request(updateItem('icons', target.id, { name: target.name, iconify_id: target.iconify_id }));
			}
		}

		const tech = techById.get(target.id);
		if (!tech) {
			log.push(`  skip tech_stack.${target.id}: missing row`);
			continue;
		}
		const currentIconId = normalizeIconId(tech.icon_id);
		if (currentIconId === target.id) {
			log.push(`  skip tech_stack.${target.id}: already wired`);
			continue;
		}
		log.push(`  wire tech_stack.${target.id} icon_id=${target.id}`);
		if (!dryRun) {
			await client.request(updateItem('tech_stack', target.id, { icon_id: target.id }));
		}
	}

	return log;
}

async function main(): Promise<void> {
	const dryRun = !process.argv.includes('--apply');
	const directusUrl = defaultDirectusUrl();
	if (!directusUrl.includes('cms.dev.yesid.dev')) {
		throw new Error(`Refusing non-dev CMS: ${directusUrl}. DEV-ONLY.`);
	}
	const token = requireEnv('DIRECTUS_ADMIN_TOKEN', 'dev CMS admin token');
	const log = await apply({ directusUrl, token, dryRun });
	console.log(log.join('\n'));
	console.log(`\n${dryRun ? 'DRY-RUN' : 'APPLIED'}. ${dryRun ? 'Re-run with --apply.' : ''}`);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error(error);
		process.exit(1);
	});
}
