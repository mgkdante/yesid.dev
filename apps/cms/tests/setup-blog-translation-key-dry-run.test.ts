import { describe, expect, it } from 'bun:test';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
	applyTranslationKeyMigration,
	assertTranslationKeyBackfillApplied,
	buildTranslationKeySchemaPlan,
	DEV_CMS_URL,
	formatTranslationKeyMigrationPlan,
	loadTranslationKeyMigrationPlan,
	MUTATING_ADMIN_TOKEN_OPTIONS,
	parseFlags,
	planTranslationKeyBackfill,
	PROD_CMS_URL,
	PROD_SCHEMA_CONFIRM_PHRASE,
	type ApiRequest,
	type TranslationKeyRow,
} from '../scripts/setup-blog-translation-key';
import {
	PROD_PUBLISH_CONFIRM_PHRASE,
	PROD_STAGE_CONFIRM_PHRASE,
} from '../scripts/promote-blog-translations';

const FIELD_SNAPSHOT_PATH = join(
	import.meta.dir,
	'../directus/snapshot/fields/blog_posts/translation_key.json',
);
const PERMISSIONS_PATH = join(import.meta.dir, '../directus/collections/permissions.json');

describe('setup-blog-translation-key schema plan', () => {
	const plan = buildTranslationKeySchemaPlan();

	it('creates a nullable indexed field before backfill and tightens it afterward', () => {
		expect(plan).toHaveLength(2);
		expect(plan[0]).toMatchObject({
			kind: 'field',
			target: 'blog_posts.translation_key',
			method: 'POST',
			path: '/fields/blog_posts',
			payload: {
				field: 'translation_key',
				type: 'string',
				meta: { required: false },
				schema: { is_nullable: true, is_indexed: true },
			},
		});
		expect(plan[1]).toMatchObject({
			kind: 'field',
			target: 'blog_posts.translation_key (required)',
			method: 'PATCH',
			path: '/fields/blog_posts/translation_key',
			payload: {
				meta: { required: true },
				schema: { is_nullable: false, is_indexed: true },
			},
		});
	});

	it('is deterministic and defaults to dry-run', () => {
		expect(buildTranslationKeySchemaPlan()).toEqual(plan);
		expect(parseFlags(['--target=dev'], DEV_CMS_URL)).toEqual({
			apply: false,
			target: 'dev',
			directusUrl: DEV_CMS_URL,
		});
		expect(parseFlags(['--target=dev', '--dry-run'], DEV_CMS_URL).apply).toBe(false);
		expect(parseFlags(['--target=dev', '--apply'], DEV_CMS_URL).apply).toBe(true);
	});

	it('rejects ambiguous or unknown write flags', () => {
		expect(() => parseFlags([], DEV_CMS_URL)).toThrow('Missing --target=dev|prod');
		expect(() =>
			parseFlags(['--target=dev', '--dry-run', '--apply'], DEV_CMS_URL),
		).toThrow(
			'Choose either --dry-run or --apply',
		);
		expect(() => parseFlags(['--target=dev', '--prod'], DEV_CMS_URL)).toThrow(
			'Unknown argument',
		);
	});

	it('cross-checks the configured CMS URL against the explicit target', () => {
		expect(() => parseFlags(['--target=dev'], PROD_CMS_URL)).toThrow(
			'PUBLIC_DIRECTUS_URL does not match --target=dev',
		);
		expect(() => parseFlags(['--target=prod'], 'https://example.com')).toThrow(
			'Unsupported PUBLIC_DIRECTUS_URL',
		);
	});

	it('requires a schema-specific exact confirmation for production apply', () => {
		expect(() => parseFlags(['--target=prod', '--apply'], PROD_CMS_URL)).toThrow(
			PROD_SCHEMA_CONFIRM_PHRASE,
		);
		expect(() =>
			parseFlags(
				['--target=prod', '--apply', `--confirm=${PROD_STAGE_CONFIRM_PHRASE}`],
				PROD_CMS_URL,
			),
		).toThrow(PROD_SCHEMA_CONFIRM_PHRASE);
		expect(
			parseFlags(
				['--target=prod', '--apply', `--confirm=${PROD_SCHEMA_CONFIRM_PHRASE}`],
				PROD_CMS_URL,
			),
		).toEqual({ apply: true, target: 'prod', directusUrl: PROD_CMS_URL });
		expect(PROD_SCHEMA_CONFIRM_PHRASE).not.toBe(PROD_STAGE_CONFIRM_PHRASE);
		expect(PROD_SCHEMA_CONFIRM_PHRASE).not.toBe(PROD_PUBLISH_CONFIRM_PHRASE);
	});

	it('disallows Build Bot authentication for every mutating run', () => {
		expect(MUTATING_ADMIN_TOKEN_OPTIONS).toEqual({ allowBuildToken: false });
	});
});

describe('setup-blog-translation-key backfill plan', () => {
	it('backfills only missing English rows with their existing slug', () => {
		expect(
			planTranslationKeyBackfill([
				{ id: 'thinking-in-matrices', lang: 'en', translation_key: null },
				{ id: 'penser-en-matrices', lang: 'fr', translation_key: 'thinking-in-matrices' },
				{ id: 'pensar-en-matrices', lang: 'es', translation_key: 'thinking-in-matrices' },
			]),
		).toEqual([{ id: 'thinking-in-matrices', translation_key: 'thinking-in-matrices' }]);
	});

	it('refuses to guess the source pairing for a localized row', () => {
		expect(() =>
			planTranslationKeyBackfill([
				{ id: 'penser-en-matrices', lang: 'fr', translation_key: null },
			]),
		).toThrow('cannot infer translation_key for non-English rows');
	});

	it('refuses a planned English key that collides with another English row', () => {
		expect(() =>
			planTranslationKeyBackfill([
				{ id: 'family-a', lang: 'en', translation_key: null },
				{ id: 'family-b', lang: 'en', translation_key: 'family-a' },
			]),
		).toThrow('duplicate locale mapping for translation_key family-a: en');
	});

	it('refuses an existing English key that is not its source slug', () => {
		expect(() =>
			planTranslationKeyBackfill([
				{ id: 'family-a', lang: 'en', translation_key: 'wrong-family' },
			]),
		).toThrow('English translation_key must match its source id');
	});

	it('refuses a localized key without one of the English source families', () => {
		expect(() =>
			planTranslationKeyBackfill([
				{ id: 'family-a', lang: 'en', translation_key: 'family-a' },
				{ id: 'famille-orpheline', lang: 'fr', translation_key: 'orphan-family' },
			]),
		).toThrow('translation_key has no English source row');
	});

	it('verifies every planned key exactly before the field becomes required', () => {
		expect(() =>
			assertTranslationKeyBackfillApplied(
				[{ id: 'family-a', translation_key: 'family-a' }],
				[{ id: 'family-a', lang: 'en', translation_key: 'wrong-family' }],
			),
		).toThrow('backfill verification mismatch for family-a');
	});
});

const SIX_ENGLISH_ROWS: TranslationKeyRow[] = [
	'article-a',
	'article-b',
	'article-c',
	'article-d',
	'article-e',
	'article-f',
].map((id) => ({ id, lang: 'en', translation_key: null }));

describe('setup-blog-translation-key live read-only plan', () => {
	it('inspects a missing field and prints the exact six safe English mappings', async () => {
		const calls: Array<{ method: string; path: string; body?: unknown }> = [];
		const api: ApiRequest = async (method, path, body) => {
			calls.push({ method, path, body });
			if (path === '/fields/blog_posts') {
				return { status: 200, json: { data: [{ field: 'id', type: 'string' }] } };
			}
			if (path === '/items/blog_posts?fields=id,lang&sort=id&limit=-1') {
				return {
					status: 200,
					json: {
						data: SIX_ENGLISH_ROWS.map(({ id, lang }) => ({ id, lang })),
					},
				};
			}
			throw new Error(`unexpected ${method} ${path}`);
		};

		const plan = await loadTranslationKeyMigrationPlan(api);

		expect(plan.createField).toBe(true);
		expect(plan.backfills).toEqual(
			SIX_ENGLISH_ROWS.map(({ id }) => ({ id, translation_key: id })),
		);
		expect(plan.requireField).toBe(true);
		expect(plan.requiresWrite).toBe(true);
		expect(calls.every((call) => call.method === 'GET')).toBe(true);
		expect(calls.map((call) => call.path)).toEqual([
			'/fields/blog_posts',
			'/items/blog_posts?fields=id,lang&sort=id&limit=-1',
		]);

		const report = formatTranslationKeyMigrationPlan(plan);
		expect(report).toContain('CREATE nullable indexed field: yes');
		for (const row of SIX_ENGLISH_ROWS) {
			expect(report).toContain(`PATCH ${row.id} translation_key=${row.id}`);
		}
		expect(report).toContain('MAKE field required/indexed: yes');
	});

	it('inspects an existing field and plans only remaining backfills and tightening', async () => {
		const rows = SIX_ENGLISH_ROWS.map((row, index) => ({
			...row,
			translation_key: index === 0 ? null : row.id,
		}));
		const api: ApiRequest = async (_method, path) => {
			if (path === '/fields/blog_posts') {
				return {
					status: 200,
					json: {
						data: [{
							field: 'translation_key',
							type: 'string',
							meta: { required: false },
							schema: { is_nullable: true, is_indexed: false },
						}],
					},
				};
			}
			if (
				path ===
				'/items/blog_posts?fields=id,lang,translation_key&sort=id&limit=-1'
			) {
				return { status: 200, json: { data: rows } };
			}
			throw new Error(`unexpected path ${path}`);
		};

		const plan = await loadTranslationKeyMigrationPlan(api);

		expect(plan.createField).toBe(false);
		expect(plan.backfills).toEqual([
			{ id: 'article-a', translation_key: 'article-a' },
		]);
		expect(plan.requireField).toBe(true);
	});

	it('rechecks the preview and refuses drift before sending a mutation', async () => {
		const previewApi: ApiRequest = async (_method, path) => {
			if (path === '/fields/blog_posts') {
				return { status: 200, json: { data: [] } };
			}
			return {
				status: 200,
				json: { data: SIX_ENGLISH_ROWS.map(({ id, lang }) => ({ id, lang })) },
			};
		};
		const preview = await loadTranslationKeyMigrationPlan(previewApi);
		const calls: Array<{ method: string; path: string }> = [];
		const driftedApi: ApiRequest = async (method, path) => {
			calls.push({ method, path });
			if (path === '/fields/blog_posts') {
				return { status: 200, json: { data: [] } };
			}
			return {
				status: 200,
				json: {
					data: SIX_ENGLISH_ROWS.map(({ id, lang }, index) => ({
						id: index === 0 ? 'changed-source' : id,
						lang,
					})),
				},
			};
		};

		await expect(applyTranslationKeyMigration(driftedApi, preview)).rejects.toThrow(
			'live migration plan changed before mutation',
		);
		expect(calls.every((call) => call.method === 'GET')).toBe(true);
	});

	it('rechecks and converges an existing nullable field without unrelated writes', async () => {
		let required = false;
		let indexed = true;
		const rows = SIX_ENGLISH_ROWS.map((row, index) => ({
			...row,
			translation_key: index === 0 ? null : row.id,
		}));
		const calls: Array<{ method: string; path: string; body?: unknown }> = [];
		const api: ApiRequest = async (method, path, body) => {
			calls.push({ method, path, body });
			if (method === 'GET' && path === '/fields/blog_posts') {
				return {
					status: 200,
					json: {
						data: [{
							field: 'translation_key',
							type: 'string',
							meta: { required },
							schema: { is_nullable: !required, is_indexed: indexed },
						}],
					},
				};
			}
			if (
				method === 'GET' &&
				path ===
					'/items/blog_posts?fields=id,lang,translation_key&sort=id&limit=-1'
			) {
				return { status: 200, json: { data: structuredClone(rows) } };
			}
			if (method === 'PATCH' && path === '/items/blog_posts/article-a') {
				rows[0]!.translation_key = (body as { translation_key: string }).translation_key;
				return { status: 200, json: { data: rows[0] } };
			}
			if (method === 'PATCH' && path === '/fields/blog_posts/translation_key') {
				required = true;
				indexed = true;
				return { status: 200, json: { data: {} } };
			}
			throw new Error(`unexpected ${method} ${path}`);
		};
		const preview = await loadTranslationKeyMigrationPlan(api);
		calls.length = 0;

		const finalPlan = await applyTranslationKeyMigration(api, preview);

		expect(finalPlan.requiresWrite).toBe(false);
		expect(
			calls.filter((call) => call.method !== 'GET').map(({ method, path, body }) => ({
				method,
				path,
				body,
			})),
		).toEqual([
			{
				method: 'PATCH',
				path: '/items/blog_posts/article-a',
				body: { translation_key: 'article-a' },
			},
			{
				method: 'PATCH',
				path: '/fields/blog_posts/translation_key',
				body: {
					meta: { required: true },
					schema: { is_indexed: true, is_nullable: false, is_unique: false },
				},
			},
		]);
	});
});

describe('setup-blog-translation-key versioned Directus artifacts', () => {
	it('ships the final required and indexed field snapshot', () => {
		expect(existsSync(FIELD_SNAPSHOT_PATH)).toBe(true);
		if (!existsSync(FIELD_SNAPSHOT_PATH)) return;
		const field = JSON.parse(readFileSync(FIELD_SNAPSHOT_PATH, 'utf8')) as {
			field: string;
			meta: { required: boolean };
			schema: { is_indexed: boolean; is_nullable: boolean; is_unique: boolean };
		};

		expect(field.field).toBe('translation_key');
		expect(field.meta.required).toBe(true);
		expect(field.schema).toMatchObject({
			is_indexed: true,
			is_nullable: false,
			is_unique: false,
		});
	});

	it('exposes translation_key through the explicit public blog read fields', () => {
		const permissions = JSON.parse(readFileSync(PERMISSIONS_PATH, 'utf8')) as Array<{
			_syncId?: string;
			fields?: string[];
		}>;
		const publicBlogRead = permissions.find(
			(permission) => permission._syncId === '_sync_perm_blog_posts_public_read',
		);

		expect(publicBlogRead?.fields).toContain('translation_key');
	});
});
