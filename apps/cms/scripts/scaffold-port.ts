#!/usr/bin/env bun
//
// scaffold-port.ts — generate boilerplate for a new Directus content port.
//
// Slice 18 18c Task 54. Eliminates the rote setup work when adding a new
// collection (projects, blog, tech-stack, etc.) in 18d onward.
//
// Usage:
//   bun scripts/scaffold-port.ts --collection projects
//   bun scripts/scaffold-port.ts --collection projects --write
//   bun scripts/scaffold-port.ts --collection projects --has-translations
//
// Flags:
//   --collection <name>    REQUIRED — snake_case collection name (projects, blog_posts, ...)
//   --has-translations     collection has a *_translations junction (default: false)
//   --write                actually create files (default: dry-run preview)
//   --force                overwrite existing files
//
// What it scaffolds (dry-run by default):
//   1. apps/cms/fixtures/<collection>.json       — empty array skeleton
//   2. 4 ai-editor permission rows (to be spliced into permissions.json)
//   3. Adapter port skeleton (prints to stdout — human pastes into directus.ts)
//   4. Contract test skeleton (prints to stdout — human pastes into test file)
//
// Philosophy: the output is NEVER auto-applied to permissions.json or
// directus.ts. The script emits ready-to-paste snippets; the human reviews
// and commits deliberately. That keeps code review focused + catches
// collection-specific nuance the scaffolder can't know (field shape, filters,
// M2M relations, etc.).

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

interface Options {
	collection: string;
	hasTranslations: boolean;
	write: boolean;
	force: boolean;
}

function parseArgs(argv: readonly string[]): Options {
	let collection: string | undefined;
	let hasTranslations = false;
	let write = false;
	let force = false;

	for (let i = 2; i < argv.length; i++) {
		const arg = argv[i];
		switch (arg) {
			case '--collection':
				collection = argv[++i];
				break;
			case '--has-translations':
				hasTranslations = true;
				break;
			case '--write':
				write = true;
				break;
			case '--force':
				force = true;
				break;
			case '-h':
			case '--help':
				printHelp();
				process.exit(0);
				break;
			default:
				throw new Error(`Unknown flag: ${arg}`);
		}
	}

	if (!collection) {
		throw new Error('Missing --collection <name>');
	}
	if (!/^[a-z][a-z0-9_]*$/.test(collection)) {
		throw new Error(
			`--collection must be snake_case (got "${collection}"). Examples: projects, blog_posts, tech_stack.`,
		);
	}
	return { collection, hasTranslations, write, force };
}

function printHelp(): void {
	// eslint-disable-next-line no-console
	console.log(`\
scaffold-port.ts — generate boilerplate for a new Directus content port.

Usage:
  bun scripts/scaffold-port.ts --collection <name> [--has-translations] [--write] [--force]

Flags:
  --collection <name>    REQUIRED — snake_case collection name
  --has-translations     collection has a <name>_translations junction
  --write                actually create files (default: dry-run preview)
  --force                overwrite existing files

See the Notion slice-18 conventions page for what the scaffolder targets.
`);
}

// ---------------------------------------------------------------------------
// Name transformers
// ---------------------------------------------------------------------------

function toPascalCase(snake: string): string {
	return snake
		.split('_')
		.map((part) => part.charAt(0).toUpperCase() + part.slice(1))
		.join('');
}

function toSingular(snake: string): string {
	// Crude singularization — covers the common Directus patterns:
	//   projects → project, blog_posts → blog_post, tech_stack → tech_stack (unchanged)
	if (snake.endsWith('ies')) return snake.slice(0, -3) + 'y';
	if (snake.endsWith('s') && !snake.endsWith('ss')) return snake.slice(0, -1);
	return snake;
}

// ---------------------------------------------------------------------------
// Artefact generators
// ---------------------------------------------------------------------------

function fixtureSkeleton(): string {
	return '[]\n';
}

function permissionRows(collection: string, hasTranslations: boolean): Array<Record<string, unknown>> {
	const base = (col: string, action: string, idx: number) => ({
		collection: col,
		action,
		permissions: {},
		validation: null,
		presets: null,
		fields: ['*'],
		policy: '_sync_ai_editor_policy',
		// _syncId uses a readable prefix so the diff is easy to scan; directus-sync
		// accepts non-UUID _syncIds as long as they're unique across the file.
		_syncId: `ae-${col}-${action}-${String(idx).padStart(4, '0')}`,
	});

	const rows: Array<Record<string, unknown>> = [
		base(collection, 'read', 1),
		base(collection, 'create', 2),
		base(collection, 'update', 3),
	];
	if (hasTranslations) {
		const t = `${collection}_translations`;
		rows.push(base(t, 'read', 4), base(t, 'create', 5), base(t, 'update', 6));
	}
	return rows;
}

function adapterPortSkeleton(collection: string, hasTranslations: boolean): string {
	const Pascal = toPascalCase(collection);
	const Singular = toPascalCase(toSingular(collection));
	const translationsFetch = hasTranslations ? "\n\t\t\t\t{ translations: ['*'] }," : '';

	return `\
// -- ${Pascal} port scaffold (scaffold-port.ts — 18c Task 54) --
// Paste into apps/web/src/lib/adapters/directus.ts below the services port.
// Replace the TODOs with real field names + domain type mapping.

export interface Directus${Singular} {
\tid: string;
\t// TODO: add fields matching directus/snapshot/fields/${collection}/*.json${hasTranslations ? `\n\ttranslations?: Directus${Singular}Translation[];` : ''}
}
${
	hasTranslations
		? `\nexport interface Directus${Singular}Translation {
\tlanguages_code: string;
\t// TODO: add localized field columns
}`
		: ''
}

export function to${Singular}(row: Directus${Singular}): ${Singular} {
\tconst ${toSingular(collection)}: ${Singular} = {
\t\tid: row.id,
\t\t// TODO: map remaining fields; use toLocalizedString for *_translations
\t};
\treturn ${toSingular(collection)};
}

async function fetch${Pascal}(
\tfilter?: Record<string, unknown>,
): Promise<${Singular}[]> {
\tconst rows = await client().request(
\t\treadItems('${collection}', {
\t\t\tfields: ['*',${translationsFetch}
\t\t\t],
\t\t\tlimit: -1,
\t\t\t...(filter ? { filter } : {}),
\t\t}),
\t);
\treturn (rows as unknown as Directus${Singular}[]).map(to${Singular});
}

// Add to directusAdapter composite:
//     ${toSingular(collection)}: {
//         all: async (ctx) =>
//             parsePort('${toSingular(collection)}.all', z.array(${Singular}Schema), await fetch${Pascal}()),
//         byId: async (id, ctx) => {
//             const rows = await fetch${Pascal}({ id: { _eq: id } });
//             return parsePort('${toSingular(collection)}.byId', ${Singular}Schema.optional(), rows[0]);
//         },
//     },
`;
}

function contractTestSkeleton(collection: string): string {
	const Pascal = toPascalCase(collection);
	const Singular = toPascalCase(toSingular(collection));

	return `\
// Paste into apps/web/src/lib/adapters/directus.mocked.test.ts — new describe() block.

describe('directusAdapter.${toSingular(collection)} — fetch contract', () => {
\tit('${toSingular(collection)}.all hits /items/${collection} with expected fields', async () => {
\t\tsharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

\t\tawait directusAdapter.${toSingular(collection)}.all();

\t\tconst { pathname, search } = parseCapturedUrl();
\t\texpect(pathname).toBe('/items/${collection}');
\t\texpect(search.get('fields')).toContain('*');
\t\texpect(search.get('limit')).toBe('-1');
\t});

\tit('${toSingular(collection)}.byId filters by id._eq', async () => {
\t\tsharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

\t\tawait directusAdapter.${toSingular(collection)}.byId('test-id');

\t\tconst { search } = parseCapturedUrl();
\t\tconst filter = search.get('filter');
\t\texpect(filter).toContain('id');
\t\texpect(filter).toContain('_eq');
\t\texpect(filter).toContain('test-id');
\t});
});
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function repoRoot(): string {
	// scripts/ lives at apps/cms/scripts/ — two levels up is the monorepo root.
	return resolve(__dirname, '..', '..', '..');
}

function writeFileIfOk(path: string, content: string, opts: Options): void {
	if (existsSync(path) && !opts.force) {
		// eslint-disable-next-line no-console
		console.log(`  ⏭️  skip (exists — re-run with --force): ${path}`);
		return;
	}
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, content);
	// eslint-disable-next-line no-console
	console.log(`  ✅ wrote: ${path}`);
}

function main(): void {
	const opts = parseArgs(process.argv);
	const root = repoRoot();
	const fixturePath = resolve(root, 'apps/cms/fixtures', `${opts.collection}.json`);
	const permissionsPath = resolve(root, 'apps/cms/directus/collections/permissions.json');

	// eslint-disable-next-line no-console
	console.log(`\n🏗️  scaffold-port: collection="${opts.collection}" translations=${opts.hasTranslations} mode=${opts.write ? 'WRITE' : 'DRY-RUN'}\n`);

	// 1. Fixture skeleton
	// eslint-disable-next-line no-console
	console.log(`[1/4] Fixture skeleton`);
	if (opts.write) {
		writeFileIfOk(fixturePath, fixtureSkeleton(), opts);
	} else {
		// eslint-disable-next-line no-console
		console.log(`  would write: ${fixturePath}`);
	}

	// 2. Permission rows (emitted to stdout — human splices into permissions.json)
	const rows = permissionRows(opts.collection, opts.hasTranslations);
	// eslint-disable-next-line no-console
	console.log(`\n[2/4] Permission rows — paste into ${permissionsPath}\n`);
	// eslint-disable-next-line no-console
	console.log(JSON.stringify(rows, null, 2));

	// 3. Adapter port skeleton
	// eslint-disable-next-line no-console
	console.log(`\n[3/4] Adapter port skeleton — paste into apps/web/src/lib/adapters/directus.ts\n`);
	// eslint-disable-next-line no-console
	console.log(adapterPortSkeleton(opts.collection, opts.hasTranslations));

	// 4. Contract test skeleton
	// eslint-disable-next-line no-console
	console.log(`\n[4/4] Contract test skeleton — paste into apps/web/src/lib/adapters/directus.mocked.test.ts\n`);
	// eslint-disable-next-line no-console
	console.log(contractTestSkeleton(opts.collection));

	// eslint-disable-next-line no-console
	console.log(`\n✨ Done. Next steps:`);
	// eslint-disable-next-line no-console
	console.log(`   1. Design the ${opts.collection} collection in Data Studio (fields, interfaces, translations)`);
	// eslint-disable-next-line no-console
	console.log(`   2. bun run sync:pull   — capture schema into apps/cms/directus/`);
	// eslint-disable-next-line no-console
	console.log(`   3. Splice the permission rows above into apps/cms/directus/collections/permissions.json`);
	// eslint-disable-next-line no-console
	console.log(`   4. Paste + tailor the adapter port + contract test above`);
	// eslint-disable-next-line no-console
	console.log(`   5. Write seed script (copy apps/cms/scripts/seed-services.ts as template)`);
	// eslint-disable-next-line no-console
	console.log(`   6. bun run sync:push + seed + flip ports in apps/web/src/lib/adapters/index.ts\n`);
}

main();
