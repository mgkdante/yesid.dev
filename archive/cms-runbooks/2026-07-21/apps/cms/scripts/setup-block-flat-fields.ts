#!/usr/bin/env bun
// apps/cms/scripts/setup-block-flat-fields.ts
/**
 * Create the flat columns that replace the 30 fixed-shape JSON translation
 * columns (go2-t1b), plus the 5 seeded hero terminal template columns on
 * block_tech_stack_page_content_translations (operator addendum).
 * DRY-RUN BY DEFAULT — pass --apply to write.
 * Idempotent: an already-existing field answers 409/400 and is logged as
 * `skip`. Mirrors setup-stack-archetypes-schema.ts (slice-29 house pattern).
 *
 * --archive-old (go2-t1b3): instead of creating flat columns, PATCH the 30
 * retired JSON source columns to hidden + ARCHIVED note (archive-not-delete;
 * columns and data stay). Run only after the flat-column fetcher swap is
 * deployed. 404 answers log as `skip`.
 *
 * Orchestrator runs (NEVER implementers — live CMS write):
 *   op run --env-file=.env -- env -u DIRECTUS_BUILD_TOKEN \
 *     PUBLIC_DIRECTUS_URL=https://cms.dev.yesid.dev \
 *     bun --cwd apps/cms run setup:flat-fields -- --apply
 */
import { FLAT_FIELD_PLAN, type FlatField } from './lib/flat-field-plan';
import { assertDevCms, defaultDirectusUrl } from './lib/sdk';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';

export interface FieldStep {
	method: 'POST';
	path: string;
	payload: { field: string; type: string; meta: Record<string, unknown>; schema: Record<string, unknown> };
}

const REPEATER_OPTIONS: Record<string, unknown> = {
	fields: [
		{ field: 'src', name: 'src', type: 'string', meta: { interface: 'input', width: 'half' } },
		{ field: 'alt', name: 'alt', type: 'string', meta: { interface: 'input', width: 'half' } },
		{ field: 'caption', name: 'caption', type: 'string', meta: { interface: 'input', width: 'half' } },
		{ field: 'rotate', name: 'rotate', type: 'float', meta: { interface: 'input', width: 'half' } },
	],
};

const PARENT_LIST_OPTIONS: Record<string, Record<string, unknown>> = {
	cta_lines: {
		fields: [
			{ field: 'text', name: 'text', type: 'string', meta: { interface: 'input', width: 'half' } },
			{
				field: 'color', name: 'color', type: 'string',
				meta: {
					interface: 'select-dropdown', width: 'half',
					options: { choices: [
						{ text: 'Orange', value: 'orange' },
						{ text: 'Muted', value: 'muted' },
						{ text: 'Accent', value: 'accent' },
					] },
				},
			},
		],
	},
	cta_socials: {
		fields: [
			{ field: 'label', name: 'label', type: 'string', meta: { interface: 'input', width: 'half' } },
			{ field: 'href', name: 'href', type: 'string', meta: { interface: 'input', width: 'half' } },
			{ field: 'icon', name: 'icon', type: 'string', meta: { interface: 'input', width: 'half' } },
		],
	},
};

export function buildFieldSteps(): FieldStep[] {
	return FLAT_FIELD_PLAN.map((f: FlatField) => {
		const seed = f.scope === 'translation' ? f.seed : undefined;
		const note =
			seed !== undefined
				? `(go2-t1b flat field) replaces a hardcoded /tech-stack component string; literal {count} is interpolated by the component from data.items.length. Seed: "${seed}"`
				: `(go2-t1b flat field) replaces ${f.sourceField}${f.sourcePath.length ? '.' + f.sourcePath.join('.') : ''}`;
		let meta: Record<string, unknown>;
		const type: string = f.type;
		if (f.type === 'json' && f.scope === 'translation') {
			meta = { interface: 'list', special: ['cast-json'], options: REPEATER_OPTIONS, note, width: 'full' };
		} else if (f.type === 'json') {
			meta = { interface: 'list', special: ['cast-json'], options: PARENT_LIST_OPTIONS[f.field] ?? {}, note, width: 'full' };
		} else if (f.type === 'boolean') {
			meta = { interface: 'boolean', special: ['cast-boolean'], note, width: 'half' };
		} else if (f.type === 'text') {
			meta = { interface: 'input-multiline', note, width: 'full' };
		} else {
			meta = { interface: 'input', note, width: 'half' };
		}
		return {
			method: 'POST' as const,
			path: `/fields/${f.collection}`,
			payload: { field: f.field, type, meta, schema: {} },
		};
	});
}

export interface ArchiveStep {
	method: 'PATCH';
	path: string; // /fields/{collection}/{field}
	payload: { meta: { hidden: true; note: string } };
}

export function buildArchiveSteps(): ArchiveStep[] {
	// One archive PATCH per retired JSON source column. Seeded addendum
	// entries have no JSON source of their own — their collection//sourceField
	// key (…//hero) is already covered by the real hero flatten entries, so
	// the dedupe map keeps the count at 30.
	const retired = [...new Map(
		FLAT_FIELD_PLAN.map((f) => [`${f.scope === 'parent' ? f.translationsCollection : f.collection}//${f.sourceField}`, f]),
	).keys()];
	return retired.map((key) => {
		const [collection, field] = key.split('//');
		return {
			method: 'PATCH' as const,
			path: `/fields/${collection}/${field}`,
			payload: {
				meta: {
					hidden: true as const,
					note: `(ARCHIVED go2-t1b3 — replaced by flat columns; data retained, archive-not-delete. Do not edit: no longer read by the export pipeline.)`,
				},
			},
		};
	});
}

export function parseFlags(argv: readonly string[]): { apply: boolean; archiveOld: boolean } {
	// --dry-run is the default; only an explicit --apply writes.
	return { apply: argv.includes('--apply'), archiveOld: argv.includes('--archive-old') };
}

const log = createLogger('setup-block-flat-fields');

async function runArchivePass(apply: boolean): Promise<void> {
	const steps = buildArchiveSteps();
	log.info(`${steps.length} archive (hide) steps planned (${apply ? 'APPLY' : 'dry-run'})`);
	for (const s of steps) log.info(`  PATCH ${s.path} → hidden:true`);
	if (!apply) {
		log.info('dry-run complete — pass --apply to write.');
		return;
	}
	const url = defaultDirectusUrl();
	const token = await getAdminToken(url);
	let archived = 0;
	let skipped = 0;
	for (const s of steps) {
		const res = await fetch(`${url}${s.path}`, {
			method: s.method,
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify(s.payload),
		});
		if (res.ok) {
			archived++;
			log.info(`  archived ${s.path}`);
		} else if (res.status === 404) {
			skipped++;
			log.info(`  skip ${s.path} (not found)`);
		} else {
			throw new Error(`PATCH ${s.path} → ${res.status} ${await res.text()}`);
		}
	}
	log.info(`done. archived=${archived} skipped=${skipped}`);
}

async function main(): Promise<void> {
	assertDevCms(defaultDirectusUrl());
	const { apply, archiveOld } = parseFlags(process.argv.slice(2));
	if (archiveOld) {
		await runArchivePass(apply);
		return;
	}
	const steps = buildFieldSteps();
	log.info(`${steps.length} field-create steps planned (${apply ? 'APPLY' : 'dry-run'})`);
	for (const s of steps) log.info(`  POST ${s.path} → ${s.payload.field} (${s.payload.type})`);
	if (!apply) {
		log.info('dry-run complete — pass --apply to write.');
		return;
	}
	const url = defaultDirectusUrl();
	const token = await getAdminToken(url);
	let created = 0;
	let skipped = 0;
	for (const s of steps) {
		const res = await fetch(`${url}${s.path}`, {
			method: s.method,
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify(s.payload),
		});
		if (res.ok) {
			created++;
			log.info(`  created ${s.path}/${s.payload.field}`);
		} else if (res.status === 400 || res.status === 409) {
			skipped++;
			log.info(`  skip ${s.path}/${s.payload.field} (already exists)`);
		} else {
			throw new Error(`POST ${s.path} ${s.payload.field} → ${res.status} ${await res.text()}`);
		}
	}
	log.info(`done. created=${created} skipped=${skipped}`);
}

if (import.meta.main) {
	main().catch((err) => {
		log.error('FAILED:', err);
		process.exit(1);
	});
}
