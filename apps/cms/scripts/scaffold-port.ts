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
	/**
	 * Sub-collections (O2M children). Each entry gets:
	 *   - `<collection>_<sub>` table itself (+ parent FK)
	 *   - `<collection>_<sub>_translations` if its own copy needs per-locale fields
	 * Per-sub permission rows + adapter deep-fields entry are emitted automatically.
	 * Example: `--sub sections,impact_metrics` for projects.
	 */
	subCollections: readonly string[];
	/**
	 * M2M junction collections. Each entry creates a `<collection>_<other>`
	 * junction with `<collection>_id` + `<other>_id` columns.
	 * Example: `--m2m services` for projects → emits `projects_services` rows.
	 */
	m2mJunctions: readonly string[];
	write: boolean;
	force: boolean;
}

function parseArgs(argv: readonly string[]): Options {
	let collection: string | undefined;
	let hasTranslations = false;
	const subCollections: string[] = [];
	const m2mJunctions: string[] = [];
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
			case '--sub':
				subCollections.push(
					...argv[++i].split(',').map((s) => s.trim()).filter(Boolean),
				);
				break;
			case '--m2m':
				m2mJunctions.push(
					...argv[++i].split(',').map((s) => s.trim()).filter(Boolean),
				);
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
	for (const name of [...subCollections, ...m2mJunctions]) {
		if (!/^[a-z][a-z0-9_]*$/.test(name)) {
			throw new Error(`--sub/--m2m entries must be snake_case (got "${name}").`);
		}
	}
	return { collection, hasTranslations, subCollections, m2mJunctions, write, force };
}

function printHelp(): void {
	// eslint-disable-next-line no-console
	console.log(`\
scaffold-port.ts — generate boilerplate for a new Directus content port.

Usage:
  bun scripts/scaffold-port.ts --collection <name> [flags]

Flags:
  --collection <name>    REQUIRED — snake_case collection name
  --has-translations     collection has a <name>_translations junction
  --sub <a,b,...>        sub-collections (O2M children, each with own translations)
                         Example: --sub sections,impact_metrics
  --m2m <a,b,...>        M2M junction collections (creates <name>_<other>)
                         Example: --m2m services,tags
  --write                actually create files (default: dry-run preview)
  --force                overwrite existing files

Examples:
  bun scripts/scaffold-port.ts --collection comments --has-translations
  bun scripts/scaffold-port.ts --collection projects --has-translations \\
      --sub sections,impact_metrics --m2m services

The richer flags (--sub, --m2m) target M2M-heavy collections (GH #42) and emit:
  - per-sub permission rows (parent + parent_translations)
  - per-junction permission rows (one M2M row, no translations)
  - deep-fields adapter template that expands all children in one query
  - cascade FK Public-policy filter templates for child read access

See the Notion slice-18 conventions page for the full pattern.
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

function permissionRows(
	collection: string,
	hasTranslations: boolean,
	subCollections: readonly string[],
	m2mJunctions: readonly string[],
): Array<Record<string, unknown>> {
	let idx = 0;
	const base = (col: string, action: string) => {
		idx++;
		return {
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
		};
	};

	const rows: Array<Record<string, unknown>> = [];

	// Parent collection — full CRUD for the AI editor.
	rows.push(base(collection, 'read'));
	rows.push(base(collection, 'create'));
	rows.push(base(collection, 'update'));

	// Parent translations (if it has them).
	if (hasTranslations) {
		const t = `${collection}_translations`;
		rows.push(base(t, 'read'));
		rows.push(base(t, 'create'));
		rows.push(base(t, 'update'));
	}

	// Sub-collections (O2M children) — each gets full CRUD + its own translations.
	for (const sub of subCollections) {
		const child = `${collection}_${sub}`;
		const childT = `${child}_translations`;
		rows.push(base(child, 'read'));
		rows.push(base(child, 'create'));
		rows.push(base(child, 'update'));
		rows.push(base(childT, 'read'));
		rows.push(base(childT, 'create'));
		rows.push(base(childT, 'update'));
	}

	// M2M junctions — read/create/update only (no translations on junctions).
	for (const other of m2mJunctions) {
		const junction = `${collection}_${other}`;
		rows.push(base(junction, 'read'));
		rows.push(base(junction, 'create'));
		rows.push(base(junction, 'update'));
	}

	return rows;
}

/**
 * Public-policy permission rows for cascade FK read access.
 *
 * Each child collection (sub-collections + their translations + M2M junctions
 * + parent_translations) gets a Public read row that filters by the parent's
 * published status. Without these, the public REST surface would 401 on
 * deep-field expansions even though the parent collection itself is readable.
 *
 * Pattern matches what slice-18i ironed out for the M2A pages collection.
 */
function publicCascadePermissionRows(
	collection: string,
	hasTranslations: boolean,
	subCollections: readonly string[],
	m2mJunctions: readonly string[],
): Array<Record<string, unknown>> {
	let idx = 0;
	const cascadeRead = (col: string, parentFkPath: string) => {
		idx++;
		return {
			collection: col,
			action: 'read',
			permissions: {
				// Cascade filter: only allow public read when the parent row's
				// status is 'published'. parentFkPath e.g. '<collection>_id.status'.
				[parentFkPath]: { _eq: 'published' },
			},
			validation: null,
			presets: null,
			fields: ['*'],
			policy: '_public_policy',
			_syncId: `pub-${col}-read-${String(idx).padStart(4, '0')}`,
		};
	};

	const rows: Array<Record<string, unknown>> = [];
	if (hasTranslations) {
		rows.push(cascadeRead(`${collection}_translations`, `${collection}_id.status`));
	}
	for (const sub of subCollections) {
		const child = `${collection}_${sub}`;
		rows.push(cascadeRead(child, `${collection}_id.status`));
		// Translations of the child cascade through the child to the parent.
		rows.push(cascadeRead(`${child}_translations`, `${collection}_${sub}_id.${collection}_id.status`));
	}
	for (const other of m2mJunctions) {
		const junction = `${collection}_${other}`;
		rows.push(cascadeRead(junction, `${collection}_id.status`));
	}
	return rows;
}

function adapterPortSkeleton(
	collection: string,
	hasTranslations: boolean,
	subCollections: readonly string[],
	m2mJunctions: readonly string[],
): string {
	const Pascal = toPascalCase(collection);
	const Singular = toPascalCase(toSingular(collection));

	// Deep-fields entries for nested children — emit each on its own line so
	// the generated query is readable + reviewable.
	const deepFields: string[] = ["'*'"];
	if (hasTranslations) {
		deepFields.push("\t\t\t\t{ translations: ['*'] }");
	}
	for (const sub of subCollections) {
		deepFields.push(`\t\t\t\t{ ${sub}: ['id', 'sort', { translations: ['*'] }] }`);
	}
	for (const other of m2mJunctions) {
		deepFields.push(
			`\t\t\t\t{ ${other}: ['id', '${toSingular(collection)}_id', '${toSingular(other)}_id'] }`,
		);
	}
	const deepFieldsBlock = deepFields.join(',\n');

	// Sub-collection row type interfaces (one per --sub entry).
	const subInterfaces = subCollections
		.map((sub) => {
			const SubPascal = toPascalCase(`${collection}_${sub}`);
			return `export interface Directus${SubPascal}Translation {
\tlanguages_code: string;
\t// TODO: localized fields for ${collection}_${sub}_translations
}

export interface Directus${SubPascal}Row {
\tid: number;
\tsort: number | null;
\ttranslations?: Directus${SubPascal}Translation[];
}`;
		})
		.join('\n\n');

	// M2M junction row types. Junction FK columns use singular forms by
	// Directus convention (e.g. projects_services has project_id + service_id).
	const junctionInterfaces = m2mJunctions
		.map((other) => {
			const JunctionPascal = toPascalCase(`${collection}_${other}`);
			return `export interface Directus${JunctionPascal}Row {
\tid: number;
\t${toSingular(collection)}_id: string;
\t${toSingular(other)}_id: string;
}`;
		})
		.join('\n\n');

	// Transform field mappings.
	const subTransforms = subCollections
		.map(
			(sub) =>
				`\t// ${sub}: O2M children with per-row translations; map via toLocalizedString.
\t// const ${sub} = (row.${sub} ?? []).slice().sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0)).map((s) => ({ /* TODO */ }));`,
		)
		.join('\n');
	const m2mTransforms = m2mJunctions
		.map(
			(other) =>
				`\t// related${toPascalCase(toSingular(other))}s = (row.${other} ?? []).map((j) => j.${toSingular(other)}_id);`,
		)
		.join('\n');

	return `\
// -- ${Pascal} port scaffold (scaffold-port.ts — 18c Task 54, GH #42 follow-up) --
// Paste into apps/web/src/lib/adapters/directus.ts below the services port.
// Replace the TODOs with real field names + domain type mapping.

export interface Directus${Singular} {
\tid: string;
\tstatus: 'draft' | 'published' | 'archived';
\t// TODO: add fields matching directus/snapshot/fields/${collection}/*.json${hasTranslations ? `\n\ttranslations?: Directus${Singular}Translation[];` : ''}${subCollections.map((s) => `\n\t${s}?: Directus${toPascalCase(`${collection}_${s}`)}Row[];`).join('')}${m2mJunctions.map((o) => `\n\t${o}?: Directus${toPascalCase(`${collection}_${o}`)}Row[];`).join('')}
}
${
	hasTranslations
		? `\nexport interface Directus${Singular}Translation {
\tlanguages_code: string;
\t// TODO: add localized field columns
}\n`
		: ''
}${subInterfaces ? `\n${subInterfaces}\n` : ''}${junctionInterfaces ? `\n${junctionInterfaces}\n` : ''}

export function to${Singular}(row: Directus${Singular}): ${Singular} {
\tconst ${toSingular(collection)}: ${Singular} = {
\t\tid: row.id,
\t\t// TODO: map remaining fields; use toLocalizedString for *_translations
\t};
${subTransforms}${subTransforms && m2mTransforms ? '\n' : ''}${m2mTransforms}
\treturn ${toSingular(collection)};
}

async function fetch${Pascal}(
\tfilter?: Record<string, unknown>,
): Promise<${Singular}[]> {
\tconst rows = await client().request(
\t\treadItems('${collection}', {
\t\t\tfields: [
${deepFieldsBlock},
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

	const extrasLabel = [
		opts.hasTranslations ? 'translations' : null,
		opts.subCollections.length > 0 ? `sub=[${opts.subCollections.join(',')}]` : null,
		opts.m2mJunctions.length > 0 ? `m2m=[${opts.m2mJunctions.join(',')}]` : null,
	]
		.filter(Boolean)
		.join(' ');

	// eslint-disable-next-line no-console
	console.log(
		`\n🏗️  scaffold-port: collection="${opts.collection}"${extrasLabel ? ' ' + extrasLabel : ''} mode=${opts.write ? 'WRITE' : 'DRY-RUN'}\n`,
	);

	// 1. Fixture skeleton
	// eslint-disable-next-line no-console
	console.log(`[1/5] Fixture skeleton`);
	if (opts.write) {
		writeFileIfOk(fixturePath, fixtureSkeleton(), opts);
	} else {
		// eslint-disable-next-line no-console
		console.log(`  would write: ${fixturePath}`);
	}

	// 2. AI-Editor permission rows — full CRUD on parent + translations + subs + junctions
	const aeRows = permissionRows(
		opts.collection,
		opts.hasTranslations,
		opts.subCollections,
		opts.m2mJunctions,
	);
	// eslint-disable-next-line no-console
	console.log(
		`\n[2/5] AI-Editor permission rows (${aeRows.length}) — paste into ${permissionsPath}\n`,
	);
	// eslint-disable-next-line no-console
	console.log(JSON.stringify(aeRows, null, 2));

	// 3. Public-policy cascade FK filters (read-only on children, filtered by parent.status)
	if (opts.hasTranslations || opts.subCollections.length > 0 || opts.m2mJunctions.length > 0) {
		const pubRows = publicCascadePermissionRows(
			opts.collection,
			opts.hasTranslations,
			opts.subCollections,
			opts.m2mJunctions,
		);
		// eslint-disable-next-line no-console
		console.log(
			`\n[3/5] Public-policy cascade rows (${pubRows.length}) — paste into ${permissionsPath}\n` +
				`      These guarantee public REST surface can deep-expand children whose parent is published.\n`,
		);
		// eslint-disable-next-line no-console
		console.log(JSON.stringify(pubRows, null, 2));
	} else {
		// eslint-disable-next-line no-console
		console.log(
			`\n[3/5] Public-policy cascade rows — none needed (no translations / sub / m2m).\n`,
		);
	}

	// 4. Adapter port skeleton
	// eslint-disable-next-line no-console
	console.log(
		`\n[4/5] Adapter port skeleton — paste into apps/web/src/lib/adapters/directus.ts\n`,
	);
	// eslint-disable-next-line no-console
	console.log(
		adapterPortSkeleton(
			opts.collection,
			opts.hasTranslations,
			opts.subCollections,
			opts.m2mJunctions,
		),
	);

	// 5. Contract test skeleton
	// eslint-disable-next-line no-console
	console.log(
		`\n[5/5] Contract test skeleton — paste into apps/web/src/lib/adapters/directus.mocked.test.ts\n`,
	);
	// eslint-disable-next-line no-console
	console.log(contractTestSkeleton(opts.collection));

	// eslint-disable-next-line no-console
	console.log(`\n✨ Done. Next steps:`);
	// eslint-disable-next-line no-console
	console.log(`   1. Design the ${opts.collection} collection in Data Studio (fields, interfaces, translations)`);
	if (opts.subCollections.length > 0) {
		// eslint-disable-next-line no-console
		console.log(
			`      — Also design sub-collections: ${opts.subCollections.map((s) => `${opts.collection}_${s}` + ' (+ _translations)').join(', ')}`,
		);
	}
	if (opts.m2mJunctions.length > 0) {
		// eslint-disable-next-line no-console
		console.log(
			`      — Also design M2M junctions: ${opts.m2mJunctions.map((o) => `${opts.collection}_${o}`).join(', ')}`,
		);
	}
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
