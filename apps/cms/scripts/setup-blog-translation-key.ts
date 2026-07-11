#!/usr/bin/env bun
/**
 * Add the scalar `blog_posts.translation_key` grouping each en/fr/es article
 * family. The staged migration creates it nullable, backfills only unambiguous
 * English source rows from their existing slug, then makes it required.
 *
 * DEV-first and dry-run by default. Both environments require an explicit
 * target. Production apply has its own exact confirmation phrase:
 *
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/setup-blog-translation-key.ts --target=dev
 *   op run --env-file=apps/cms/.env -- bun apps/cms/scripts/setup-blog-translation-key.ts --target=dev --apply
 *   op run --env-file=apps/cms/.env -- env PUBLIC_DIRECTUS_URL=https://cms.yesid.dev \
 *     bun apps/cms/scripts/setup-blog-translation-key.ts --target=prod --apply \
 *     --confirm=MIGRATE_PROD_BLOG_TRANSLATION_KEY_SCHEMA
 */

import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import {
	type SchemaStep,
	isAlreadyExists,
	rest,
} from './lib/schema-apply';

export interface TranslationKeyRow {
	id: string;
	lang: 'en' | 'fr' | 'es';
	translation_key: string | null;
}

export interface TranslationKeyBackfill {
	id: string;
	translation_key: string;
}

export const DEV_CMS_URL = 'https://cms.dev.yesid.dev';
export const PROD_CMS_URL = 'https://cms.yesid.dev';
export const PROD_SCHEMA_CONFIRM_PHRASE =
	'MIGRATE_PROD_BLOG_TRANSLATION_KEY_SCHEMA';
export const MUTATING_ADMIN_TOKEN_OPTIONS = { allowBuildToken: false } as const;

export type Target = 'dev' | 'prod';

export interface ParsedArgs {
	apply: boolean;
	target: Target;
	directusUrl: typeof DEV_CMS_URL | typeof PROD_CMS_URL;
}

export interface ApiResponse {
	status: number;
	json: unknown;
}

export type ApiRequest = (
	method: 'GET' | 'POST' | 'PATCH',
	path: string,
	body?: unknown,
) => Promise<ApiResponse>;

export interface TranslationKeyFieldState {
	exists: boolean;
	type: 'string' | null;
	required: boolean;
	isNullable: boolean;
	isIndexed: boolean;
}

export interface TranslationKeyMigrationPlan {
	field: TranslationKeyFieldState;
	rows: TranslationKeyRow[];
	createField: boolean;
	backfills: TranslationKeyBackfill[];
	requireField: boolean;
	requiresWrite: boolean;
}

const TRANSLATION_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const log = createLogger('setup-blog-translation-key');

export function buildTranslationKeySchemaPlan(): SchemaStep[] {
	return [
		{
			kind: 'field',
			target: 'blog_posts.translation_key',
			method: 'POST',
			path: '/fields/blog_posts',
			payload: {
				field: 'translation_key',
				type: 'string',
				meta: {
					interface: 'input',
					note: 'Stable article-family key shared by exactly one en, fr, and es row.',
					required: false,
					searchable: true,
					sort: 5,
					width: 'full',
				},
				schema: {
					is_indexed: true,
					is_nullable: true,
					is_unique: false,
					max_length: 255,
				},
			},
		},
		{
			kind: 'field',
			target: 'blog_posts.translation_key (required)',
			method: 'PATCH',
			path: '/fields/blog_posts/translation_key',
			payload: {
				meta: { required: true },
				schema: { is_indexed: true, is_nullable: false, is_unique: false },
			},
		},
	];
}

function normalizeCmsUrl(value: string): string {
	return value.replace(/\/+$/, '');
}

export function parseFlags(
	argv: readonly string[],
	publicDirectusUrl = process.env.PUBLIC_DIRECTUS_URL,
): ParsedArgs {
	const isKnown = (arg: string) =>
		arg === '--apply' ||
		arg === '--dry-run' ||
		arg.startsWith('--target=') ||
		arg.startsWith('--confirm=');
	const unknown = argv.find((arg) => !isKnown(arg));
	if (unknown) {
		throw new Error(`[setup-blog-translation-key] Unknown argument: ${unknown}`);
	}
	if (argv.includes('--apply') && argv.includes('--dry-run')) {
		throw new Error('[setup-blog-translation-key] Choose either --dry-run or --apply');
	}

	const targets = argv
		.filter((arg) => arg.startsWith('--target='))
		.map((arg) => arg.slice('--target='.length));
	if (targets.length === 0) {
		throw new Error('[setup-blog-translation-key] Missing --target=dev|prod');
	}
	if (targets.length !== 1 || (targets[0] !== 'dev' && targets[0] !== 'prod')) {
		throw new Error('[setup-blog-translation-key] Use exactly one --target=dev|prod');
	}

	const target = targets[0] as Target;
	const expectedUrl = target === 'dev' ? DEV_CMS_URL : PROD_CMS_URL;
	const configuredUrl = normalizeCmsUrl(publicDirectusUrl ?? expectedUrl);
	if (configuredUrl !== DEV_CMS_URL && configuredUrl !== PROD_CMS_URL) {
		throw new Error(
			`[setup-blog-translation-key] Unsupported PUBLIC_DIRECTUS_URL: ${configuredUrl}`,
		);
	}
	if (configuredUrl !== expectedUrl) {
		throw new Error(
			`[setup-blog-translation-key] PUBLIC_DIRECTUS_URL does not match --target=${target}`,
		);
	}

	const confirmations = argv
		.filter((arg) => arg.startsWith('--confirm='))
		.map((arg) => arg.slice('--confirm='.length));
	if (confirmations.length > 1) {
		throw new Error('[setup-blog-translation-key] Use at most one --confirm=<phrase>');
	}
	const apply = argv.includes('--apply');
	if (
		apply &&
		target === 'prod' &&
		confirmations[0] !== PROD_SCHEMA_CONFIRM_PHRASE
	) {
		throw new Error(
			`[setup-blog-translation-key] PROD write refused. Re-run with --confirm=${PROD_SCHEMA_CONFIRM_PHRASE}`,
		);
	}

	return { apply, target, directusUrl: expectedUrl };
}

export function planTranslationKeyBackfill(
	rows: readonly TranslationKeyRow[],
): TranslationKeyBackfill[] {
	const localizedWithoutKey = rows.filter(
		(row) => row.lang !== 'en' && !row.translation_key,
	);
	if (localizedWithoutKey.length > 0) {
		throw new Error(
			`[setup-blog-translation-key] cannot infer translation_key for non-English rows: ${localizedWithoutKey.map((row) => row.id).join(', ')}`,
		);
	}

	const claimedLocalePairs = new Map<string, string>();
	for (const row of rows) {
		const translationKey = row.translation_key ?? row.id;
		if (!TRANSLATION_KEY_PATTERN.test(translationKey)) {
			throw new Error(
				`[setup-blog-translation-key] invalid translation_key on ${row.id}: ${translationKey}`,
			);
		}
		const localePair = `${translationKey}:${row.lang}`;
		const existingId = claimedLocalePairs.get(localePair);
		if (existingId) {
			throw new Error(
				`[setup-blog-translation-key] duplicate locale mapping for translation_key ${translationKey}: ${row.lang} (${existingId}, ${row.id})`,
			);
		}
		claimedLocalePairs.set(localePair, row.id);
	}

	const englishSourceIds = new Set(
		rows.filter((row) => row.lang === 'en').map((row) => row.id),
	);
	for (const row of rows) {
		if (row.lang === 'en' && row.translation_key && row.translation_key !== row.id) {
			throw new Error(
				`[setup-blog-translation-key] English translation_key must match its source id on ${row.id}: ${row.translation_key}`,
			);
		}
		if (
			row.lang !== 'en' &&
			row.translation_key &&
			!englishSourceIds.has(row.translation_key)
		) {
			throw new Error(
				`[setup-blog-translation-key] translation_key has no English source row on ${row.id}: ${row.translation_key}`,
			);
		}
	}

	return rows
		.filter((row) => row.lang === 'en' && !row.translation_key)
		.map((row) => ({ id: row.id, translation_key: row.id }));
}

export function assertTranslationKeyBackfillApplied(
	patches: readonly TranslationKeyBackfill[],
	rows: readonly TranslationKeyRow[],
): void {
	const rowsById = new Map(rows.map((row) => [row.id, row]));
	for (const patch of patches) {
		if (rowsById.get(patch.id)?.translation_key !== patch.translation_key) {
			throw new Error(
				`[setup-blog-translation-key] backfill verification mismatch for ${patch.id}`,
			);
		}
	}
	const stillMissing = rows.filter((row) => !row.translation_key);
	if (stillMissing.length > 0) {
		throw new Error(
			`[setup-blog-translation-key] refusing required-field migration; missing keys: ${stillMissing.map((row) => row.id).join(', ')}`,
		);
	}
	const unexpectedBackfill = planTranslationKeyBackfill(rows);
	if (unexpectedBackfill.length > 0) {
		throw new Error('[setup-blog-translation-key] backfill verification found unplanned rows');
	}
}

function asRecord(value: unknown, label: string): Record<string, unknown> {
	if (!value || typeof value !== 'object' || Array.isArray(value)) {
		throw new Error(`[setup-blog-translation-key] invalid ${label} response`);
	}
	return value as Record<string, unknown>;
}

function responseData(response: ApiResponse, label: string): unknown {
	if (response.status >= 400) {
		throw new Error(
			`[setup-blog-translation-key] ${label} failed (${response.status}): ${JSON.stringify(response.json)}`,
		);
	}
	return asRecord(response.json, label).data;
}

function parseExistingField(value: unknown): TranslationKeyFieldState {
	const data = asRecord(value, 'translation_key field');
	if (data.field !== 'translation_key' || data.type !== 'string') {
		throw new Error(
			`[setup-blog-translation-key] existing translation_key field has incompatible shape: ${JSON.stringify(data)}`,
		);
	}
	const meta = asRecord(data.meta, 'field meta');
	const schema = asRecord(data.schema, 'field schema');
	if (
		typeof meta.required !== 'boolean' ||
		typeof schema.is_nullable !== 'boolean' ||
		typeof schema.is_indexed !== 'boolean'
	) {
		throw new Error(
			'[setup-blog-translation-key] existing translation_key field is missing required schema metadata',
		);
	}
	return {
		exists: true,
		type: 'string',
		required: meta.required,
		isNullable: schema.is_nullable,
		isIndexed: schema.is_indexed,
	};
}

function parseLiveRows(value: unknown, fieldExists: boolean): TranslationKeyRow[] {
	if (!Array.isArray(value)) {
		throw new Error('[setup-blog-translation-key] invalid blog_posts rows response');
	}
	const rows = value.map((raw, index): TranslationKeyRow => {
		const row = asRecord(raw, `blog_posts row ${index}`);
		if (typeof row.id !== 'string' || !TRANSLATION_KEY_PATTERN.test(row.id)) {
			throw new Error(
				`[setup-blog-translation-key] invalid blog post id: ${String(row.id)}`,
			);
		}
		if (row.lang !== 'en' && row.lang !== 'fr' && row.lang !== 'es') {
			throw new Error(
				`[setup-blog-translation-key] invalid blog post lang on ${row.id}: ${String(row.lang)}`,
			);
		}
		let translationKey: string | null = null;
		if (fieldExists) {
			if (row.translation_key !== null && typeof row.translation_key !== 'string') {
				throw new Error(
					`[setup-blog-translation-key] invalid translation_key on ${row.id}: ${String(row.translation_key)}`,
				);
			}
			translationKey = row.translation_key;
		}
		return { id: row.id, lang: row.lang, translation_key: translationKey };
	});
	rows.sort((left, right) => left.id.localeCompare(right.id));
	if (new Set(rows.map((row) => row.id)).size !== rows.length) {
		throw new Error('[setup-blog-translation-key] duplicate live blog post IDs');
	}
	const english = rows.filter((row) => row.lang === 'en');
	if (english.length !== 6) {
		throw new Error(
			`[setup-blog-translation-key] expected exactly six English source rows; got ${english.length}`,
		);
	}
	if (!fieldExists && rows.length !== 6) {
		throw new Error(
			`[setup-blog-translation-key] missing-field migration requires exactly six English-only rows; got ${rows.length}`,
		);
	}
	return rows;
}

export async function loadTranslationKeyMigrationPlan(
	api: ApiRequest,
): Promise<TranslationKeyMigrationPlan> {
	const fieldsResponse = await api('GET', '/fields/blog_posts');
	const fieldsData = responseData(fieldsResponse, 'GET blog_posts fields');
	if (!Array.isArray(fieldsData)) {
		throw new Error('[setup-blog-translation-key] invalid blog_posts fields response');
	}
	const translationKeyFields = fieldsData.filter((value) => {
		const field = asRecord(value, 'blog_posts field');
		return field.field === 'translation_key';
	});
	if (translationKeyFields.length > 1) {
		throw new Error(
			'[setup-blog-translation-key] duplicate translation_key field definitions',
		);
	}
	const field: TranslationKeyFieldState = translationKeyFields[0]
		? parseExistingField(translationKeyFields[0])
		: {
				exists: false,
				type: null,
				required: false,
				isNullable: true,
				isIndexed: false,
			};
	const fields = field.exists ? 'id,lang,translation_key' : 'id,lang';
	const rowsResponse = await api(
		'GET',
		`/items/blog_posts?fields=${fields}&sort=id&limit=-1`,
	);
	const rows = parseLiveRows(
		responseData(rowsResponse, 'GET blog_posts rows'),
		field.exists,
	);
	const backfills = planTranslationKeyBackfill(rows);
	const createField = !field.exists;
	const requireField =
		!field.exists || !field.required || field.isNullable || !field.isIndexed;
	return {
		field,
		rows,
		createField,
		backfills,
		requireField,
		requiresWrite: createField || backfills.length > 0 || requireField,
	};
}

function planFingerprint(plan: TranslationKeyMigrationPlan): string {
	return JSON.stringify({
		field: plan.field,
		rows: plan.rows,
		createField: plan.createField,
		backfills: plan.backfills,
		requireField: plan.requireField,
	});
}

function assertMigrationPlanUnchanged(
	preview: TranslationKeyMigrationPlan,
	current: TranslationKeyMigrationPlan,
): void {
	if (planFingerprint(preview) !== planFingerprint(current)) {
		throw new Error(
			'[setup-blog-translation-key] live migration plan changed before mutation',
		);
	}
}

export function formatTranslationKeyMigrationPlan(
	plan: TranslationKeyMigrationPlan,
): string {
	const writeCount =
		Number(plan.createField) + plan.backfills.length + Number(plan.requireField);
	return [
		`LIVE blog_posts rows: ${plan.rows.length}`,
		`translation_key field exists: ${plan.field.exists ? 'yes' : 'no'}`,
		`CREATE nullable indexed field: ${plan.createField ? 'yes' : 'no'}`,
		`BACKFILL English rows: ${plan.backfills.length}`,
		...plan.backfills.map(
			(patch) => `  PATCH ${patch.id} translation_key=${patch.translation_key}`,
		),
		`MAKE field required/indexed: ${plan.requireField ? 'yes' : 'no'}`,
		'NO DELETE operations',
		`summary writes=${writeCount}`,
	].join('\n');
}

async function checkedWrite(
	api: ApiRequest,
	method: 'POST' | 'PATCH',
	path: string,
	body: unknown,
	allowAlreadyExists = false,
): Promise<void> {
	const response = await api(method, path, body);
	if (response.status < 400) return;
	if (allowAlreadyExists && isAlreadyExists(response.status, response.json)) return;
	throw new Error(
		`[setup-blog-translation-key] ${method} ${path} failed (${response.status}): ${JSON.stringify(response.json)}`,
	);
}

function assertRemainingPlanAfterCreate(
	before: TranslationKeyMigrationPlan,
	after: TranslationKeyMigrationPlan,
): void {
	if (
		after.createField ||
		JSON.stringify(before.rows) !== JSON.stringify(after.rows) ||
		JSON.stringify(before.backfills) !== JSON.stringify(after.backfills) ||
		before.requireField !== after.requireField
	) {
		throw new Error(
			'[setup-blog-translation-key] live migration plan changed after field creation',
		);
	}
}

export async function applyTranslationKeyMigration(
	api: ApiRequest,
	preview: TranslationKeyMigrationPlan,
): Promise<TranslationKeyMigrationPlan> {
	let current = await loadTranslationKeyMigrationPlan(api);
	assertMigrationPlanUnchanged(preview, current);
	const [createFieldStep, requireFieldStep] = buildTranslationKeySchemaPlan();

	if (current.createField) {
		await checkedWrite(
			api,
			'POST',
			createFieldStep!.path,
			createFieldStep!.payload,
			true,
		);
		const afterCreate = await loadTranslationKeyMigrationPlan(api);
		assertRemainingPlanAfterCreate(current, afterCreate);
		current = afterCreate;
	}

	if (current.backfills.length > 0) {
		const plannedBackfills = current.backfills;
		for (const patch of plannedBackfills) {
			await checkedWrite(
				api,
				'PATCH',
				`/items/blog_posts/${encodeURIComponent(patch.id)}`,
				{ translation_key: patch.translation_key },
			);
		}
		current = await loadTranslationKeyMigrationPlan(api);
		assertTranslationKeyBackfillApplied(plannedBackfills, current.rows);
	}

	if (current.requireField) {
		if (current.backfills.length > 0) {
			throw new Error(
				'[setup-blog-translation-key] refusing required field while backfills remain',
			);
		}
		await checkedWrite(
			api,
			'PATCH',
			requireFieldStep!.path,
			requireFieldStep!.payload,
		);
		current = await loadTranslationKeyMigrationPlan(api);
	}

	if (current.requiresWrite) {
		throw new Error(
			'[setup-blog-translation-key] migration verification failed to converge',
		);
	}
	return current;
}

async function main(): Promise<void> {
	const { apply, target, directusUrl } = parseFlags(process.argv.slice(2));
	log.info(`target=${target} url=${directusUrl} mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
	const token = await getAdminToken(directusUrl, MUTATING_ADMIN_TOKEN_OPTIONS);
	const ctx = { directusUrl, token };
	const api: ApiRequest = (method, path, body) => rest(ctx, method, path, body);
	const preview = await loadTranslationKeyMigrationPlan(api);
	console.log(formatTranslationKeyMigrationPlan(preview));
	if (!apply) {
		log.info('dry-run complete: CMS was read; no writes were sent.');
		return;
	}

	const finalPlan = await applyTranslationKeyMigration(api, preview);
	log.info(
		`verified ${finalPlan.rows.length} rows with translation_key; field is required and indexed`,
	);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[setup-blog-translation-key] FAILED:', error);
		process.exit(1);
	});
}
