#!/usr/bin/env bun
/**
 * Stage and publish the twelve French/Spanish counterparts for the six live
 * English blog sources.
 *
 * Safety properties:
 * - every invocation reads one explicitly selected CMS; dry-run is the default;
 * - stage verifies all six English sources before sending any write;
 * - English writes are limited to translation_key backfills;
 * - translated rows are created/updated as drafts, then verified;
 * - publish is a separate invocation and updates only the twelve translations;
 * - no post, tag, or junction delete operation exists in this command;
 * - production stage and publish require different exact confirmation phrases.
 *
 * Examples:
 *   bun apps/cms/scripts/promote-blog-translations.ts --target=dev --phase=stage
 *   bun apps/cms/scripts/promote-blog-translations.ts --target=dev --phase=stage --apply
 *   bun apps/cms/scripts/promote-blog-translations.ts --target=dev --phase=publish
 *   bun apps/cms/scripts/promote-blog-translations.ts --target=dev --phase=publish --apply
 */

import { createHash } from 'node:crypto';
import {
	createItems,
	readItems,
	updateItems,
	updateItemsBatch,
} from '@directus/sdk';
import type { BlockEditorDoc } from '@repo/shared';
import { getAdminToken } from './lib/auth';
import { createLogger } from './lib/logger';
import { createClient } from './lib/sdk';
import {
	loadBlogPostsFixture,
	toBlogPostRow,
	type DirectusBlogPostRow,
} from './seed-blog-posts';

export const DEV_CMS_URL = 'https://cms.dev.yesid.dev';
export const PROD_CMS_URL = 'https://cms.yesid.dev';
export const PROD_STAGE_CONFIRM_PHRASE =
	'STAGE_PROD_BLOG_TRANSLATIONS_EN_FR_ES';
export const PROD_PUBLISH_CONFIRM_PHRASE =
	'PUBLISH_PROD_BLOG_TRANSLATIONS_EN_FR_ES';

export type Target = 'dev' | 'prod';
export type PromotionPhase = 'stage' | 'publish';
export type BlogStatus = DirectusBlogPostRow['status'];
export type DesiredBlogPost = DirectusBlogPostRow;
export type BlogPostCmsRow = Omit<DirectusBlogPostRow, 'tags' | 'translation_key'> & {
	translation_key: string | null;
};

export interface TagCmsRow {
	id: string;
	name: string;
}

export interface BlogPostTagJunctionRow {
	id: number;
	blog_posts_id: string;
	tags_id: string;
	sort: number | null;
}

export interface TranslationState {
	posts: BlogPostCmsRow[];
	tags: TagCmsRow[];
	junctions: BlogPostTagJunctionRow[];
}

export interface EnglishTranslationKeyPatch {
	id: string;
	translation_key: string;
}

export interface JunctionCreate {
	blog_posts_id: string;
	tags_id: string;
	sort: number;
}

export interface JunctionUpdate extends JunctionCreate {
	id: number;
}

export interface StagePlan {
	requiresWrite: boolean;
	englishTranslationKeyPatches: EnglishTranslationKeyPatch[];
	translationCreates: BlogPostCmsRow[];
	translationUpdates: BlogPostCmsRow[];
	tagCreates: TagCmsRow[];
	junctionCreates: JunctionCreate[];
	junctionUpdates: JunctionUpdate[];
	postDeletes: never[];
	junctionDeletes: never[];
}

export interface PublishPlan {
	requiresWrite: boolean;
	translationIds: string[];
}

export interface ParsedArgs {
	apply: boolean;
	target: Target;
	phase: PromotionPhase;
	directusUrl: typeof DEV_CMS_URL | typeof PROD_CMS_URL;
}

interface DirectusSchema {
	blog_posts: BlogPostCmsRow[];
	tags: TagCmsRow[];
	blog_posts_tags: BlogPostTagJunctionRow[];
}

type DirectusClient = ReturnType<typeof createClient<DirectusSchema>>;

const SCALAR_FIELDS = [
	'date_published',
	'date_modified',
	'sort',
	'lang',
	'category',
	'external',
	'url',
	'cover_image',
	'svg_illustration',
	'animation',
	'title',
	'excerpt',
	'seo_title',
	'seo_description',
] as const;

type ScalarField = (typeof SCALAR_FIELDS)[number];

function canonicalJson(value: unknown): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
	const object = value as Record<string, unknown>;
	return `{${Object.keys(object)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
		.join(',')}}`;
}

function hashBody(body: BlockEditorDoc): string {
	return createHash('sha256').update(canonicalJson(body)).digest('hex');
}

function timestampKey(value: string | null): string | null {
	if (value === null) return null;
	const expanded = /^\d{4}-\d{2}-\d{2}$/.test(value)
		? `${value}T00:00:00.000Z`
		: value;
	const milliseconds = Date.parse(expanded);
	return Number.isNaN(milliseconds) ? value : new Date(milliseconds).toISOString();
}

function relationId(value: unknown): unknown {
	if (value && typeof value === 'object' && 'id' in value) {
		return (value as { id: unknown }).id;
	}
	return value;
}

function scalarKey(field: ScalarField, value: unknown): unknown {
	if (field === 'date_published' || field === 'date_modified') {
		return timestampKey(value as string | null);
	}
	if (field === 'cover_image' || field === 'svg_illustration') {
		return relationId(value);
	}
	return value;
}

function scalarDrift(
	actual: BlogPostCmsRow,
	desired: DesiredBlogPost,
): ScalarField[] {
	return SCALAR_FIELDS.filter(
		(field) =>
			!Object.is(scalarKey(field, actual[field]), scalarKey(field, desired[field])),
	);
}

function contentDrift(
	actual: BlogPostCmsRow,
	desired: DesiredBlogPost,
): string[] {
	const drift = scalarDrift(actual, desired);
	const fields = [...drift];
	if (actual.translation_key !== desired.translation_key) {
		fields.push('translation_key' as ScalarField);
	}
	if (hashBody(actual.body) !== hashBody(desired.body)) {
		fields.push('body' as ScalarField);
	}
	return fields;
}

function withoutTags(
	post: DesiredBlogPost,
	status: BlogStatus,
): BlogPostCmsRow {
	const { tags: _tags, ...row } = post;
	return { ...structuredClone(row), status };
}

function pair(postId: string, tagId: string): string {
	return `${postId}\u0000${tagId}`;
}

function groupBy<T>(
	values: readonly T[],
	keyFor: (value: T) => string,
): Map<string, T[]> {
	const groups = new Map<string, T[]>();
	for (const value of values) {
		const key = keyFor(value);
		const group = groups.get(key) ?? [];
		group.push(value);
		groups.set(key, group);
	}
	return groups;
}

function postTags(
	state: TranslationState,
	postId: string,
): Array<{ id: string; sort: number | null }> {
	return state.junctions
		.filter((row) => row.blog_posts_id === postId)
		.sort((left, right) => (left.sort ?? Number.MAX_SAFE_INTEGER) - (right.sort ?? Number.MAX_SAFE_INTEGER))
		.map((row) => ({ id: row.tags_id, sort: row.sort }));
}

function expectedTags(post: DesiredBlogPost): Array<{ id: string; sort: number }> {
	return post.tags.map((id, sort) => ({ id, sort }));
}

function assertFixtureContract(desired: readonly DesiredBlogPost[]): void {
	if (desired.length !== 18) {
		throw new Error(
			`[promote-blog-translations] expected exactly 18 fixture rows; got ${desired.length}`,
		);
	}
	const ids = desired.map((post) => post.id);
	if (new Set(ids).size !== ids.length) {
		throw new Error('[promote-blog-translations] duplicate fixture IDs');
	}

	const groups = groupBy(desired, (post) => post.translation_key);
	if (groups.size !== 6) {
		throw new Error(
			`[promote-blog-translations] expected six translation groups; got ${groups.size}`,
		);
	}
	for (const [translationKey, posts] of groups) {
		const languages = posts.map((post) => post.lang).sort();
		if (posts.length !== 3 || languages.join(',') !== 'en,es,fr') {
			throw new Error(
				`[promote-blog-translations] incomplete locale group ${translationKey}: ${languages.join(',')}`,
			);
		}
		const english = posts.find((post) => post.lang === 'en');
		if (!english || english.id !== translationKey) {
			throw new Error(
				`[promote-blog-translations] English source must own translation_key ${translationKey}`,
			);
		}
		if (posts.some((post) => post.status !== 'published')) {
			throw new Error(
				`[promote-blog-translations] fixture rows must have final status=published: ${translationKey}`,
			);
		}
		if (posts.some((post) => new Set(post.tags).size !== post.tags.length)) {
			throw new Error(
				`[promote-blog-translations] duplicate fixture tag in group ${translationKey}`,
			);
		}
	}
}

export function loadTranslationFixture(): readonly DesiredBlogPost[] {
	const desired = loadBlogPostsFixture().map(toBlogPostRow);
	assertFixtureContract(desired);
	return desired;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
	const isKnown = (arg: string) =>
		arg === '--apply' ||
		arg === '--dry-run' ||
		arg.startsWith('--target=') ||
		arg.startsWith('--phase=') ||
		arg.startsWith('--confirm=');
	const unknown = argv.find((arg) => !isKnown(arg));
	if (unknown) {
		throw new Error(`[promote-blog-translations] Unknown argument: ${unknown}`);
	}
	if (argv.includes('--apply') && argv.includes('--dry-run')) {
		throw new Error(
			'[promote-blog-translations] Choose either --dry-run or --apply, not both',
		);
	}

	const targets = argv
		.filter((arg) => arg.startsWith('--target='))
		.map((arg) => arg.slice('--target='.length));
	if (targets.length === 0) {
		throw new Error('[promote-blog-translations] Missing --target=dev|prod');
	}
	if (targets.length !== 1 || (targets[0] !== 'dev' && targets[0] !== 'prod')) {
		throw new Error(
			'[promote-blog-translations] Invalid target; use exactly one --target=dev|prod',
		);
	}

	const phases = argv
		.filter((arg) => arg.startsWith('--phase='))
		.map((arg) => arg.slice('--phase='.length));
	if (phases.length === 0) {
		throw new Error('[promote-blog-translations] Missing --phase=stage|publish');
	}
	if (phases.length !== 1 || (phases[0] !== 'stage' && phases[0] !== 'publish')) {
		throw new Error(
			'[promote-blog-translations] Invalid phase; use exactly one --phase=stage|publish',
		);
	}

	const target = targets[0] as Target;
	const phase = phases[0] as PromotionPhase;
	const apply = argv.includes('--apply');
	const confirmation = argv
		.find((arg) => arg.startsWith('--confirm='))
		?.slice('--confirm='.length);
	if (apply && target === 'prod') {
		const required =
			phase === 'stage'
				? PROD_STAGE_CONFIRM_PHRASE
				: PROD_PUBLISH_CONFIRM_PHRASE;
		if (confirmation !== required) {
			throw new Error(
				`[promote-blog-translations] PROD ${phase} refused. Re-run with --confirm=${required}`,
			);
		}
	}

	return {
		apply,
		target,
		phase,
		directusUrl: target === 'dev' ? DEV_CMS_URL : PROD_CMS_URL,
	};
}

function assertNoUnexpectedGroupRows(
	desired: readonly DesiredBlogPost[],
	state: TranslationState,
): void {
	const desiredIds = new Set(desired.map((post) => post.id));
	const keys = new Set(desired.map((post) => post.translation_key));
	const unexpected = state.posts.filter(
		(post) =>
			!desiredIds.has(post.id) &&
			post.translation_key !== null &&
			keys.has(post.translation_key),
	);
	if (unexpected.length > 0) {
		throw new Error(
			`[promote-blog-translations] unexpected rows occupy desired translation groups: ${unexpected.map((post) => post.id).join(', ')}`,
		);
	}
}

function assertEnglishSources(
	desired: readonly DesiredBlogPost[],
	state: TranslationState,
	requireTranslationKey: boolean,
): void {
	const byId = new Map(state.posts.map((post) => [post.id, post]));
	for (const source of desired.filter((post) => post.lang === 'en')) {
		const actual = byId.get(source.id);
		if (!actual) {
			throw new Error(
				`[promote-blog-translations] English source drift: missing live row ${source.id}`,
			);
		}
		if (actual.status !== 'published') {
			throw new Error(
				`[promote-blog-translations] English source drift ${source.id}: status=${actual.status}`,
			);
		}
		const drift = scalarDrift(actual, source);
		if (hashBody(actual.body) !== hashBody(source.body)) drift.push('body' as ScalarField);
		const actualTags = postTags(state, source.id);
		const wantedTags = expectedTags(source);
		if (canonicalJson(actualTags) !== canonicalJson(wantedTags)) {
			drift.push('tags' as ScalarField);
		}
		if (drift.length > 0) {
			throw new Error(
				`[promote-blog-translations] English source drift ${source.id}: ${drift.join(', ')}`,
			);
		}
		if (
			actual.translation_key !== null &&
			actual.translation_key !== source.translation_key
		) {
			throw new Error(
				`[promote-blog-translations] unexpected English translation_key ${source.id}: ${actual.translation_key}`,
			);
		}
		if (requireTranslationKey && actual.translation_key !== source.translation_key) {
			throw new Error(
				`[promote-blog-translations] missing English translation_key ${source.id}`,
			);
		}
	}
}

function assertTranslationOwnership(
	actual: BlogPostCmsRow,
	desired: DesiredBlogPost,
): void {
	if (
		actual.lang !== desired.lang ||
		actual.translation_key !== desired.translation_key
	) {
		throw new Error(
			`[promote-blog-translations] translation ownership mismatch for ${desired.id}: expected lang=${desired.lang} translation_key=${desired.translation_key}; got lang=${actual.lang} translation_key=${String(actual.translation_key)}`,
		);
	}
}

function buildTagCreates(
	desired: readonly DesiredBlogPost[],
	state: TranslationState,
): TagCmsRow[] {
	const byId = new Map(state.tags.map((tag) => [tag.id, tag]));
	const desiredIds = [...new Set(desired.flatMap((post) => [...post.tags]))].sort();
	const creates: TagCmsRow[] = [];
	for (const id of desiredIds) {
		const existing = byId.get(id);
		if (!existing) creates.push({ id, name: id });
		else if (existing.name !== id) {
			throw new Error(
				`[promote-blog-translations] existing tag ${id} has unexpected name ${existing.name}; refusing global update`,
			);
		}
	}
	return creates;
}

function buildTranslationJunctionPlan(
	translations: readonly DesiredBlogPost[],
	state: TranslationState,
): { creates: JunctionCreate[]; updates: JunctionUpdate[] } {
	const translationIds = new Set(translations.map((post) => post.id));
	const scoped = state.junctions.filter((row) => translationIds.has(row.blog_posts_id));
	const expected = new Map<string, JunctionCreate>();
	for (const post of translations) {
		post.tags.forEach((tags_id, sort) => {
			expected.set(pair(post.id, tags_id), {
				blog_posts_id: post.id,
				tags_id,
				sort,
			});
		});
	}

	const byPair = groupBy(scoped, (row) => pair(row.blog_posts_id, row.tags_id));
	const destructive = scoped.filter((row) => !expected.has(pair(row.blog_posts_id, row.tags_id)));
	for (const rows of byPair.values()) {
		if (rows.length > 1) destructive.push(...rows.slice(1));
	}
	if (destructive.length > 0) {
		throw new Error(
			`[promote-blog-translations] relation repair would require a junction delete; refusing IDs ${[...new Set(destructive.map((row) => row.id))].sort((a, b) => a - b).join(', ')}`,
		);
	}

	const creates: JunctionCreate[] = [];
	const updates: JunctionUpdate[] = [];
	for (const [key, wanted] of expected) {
		const current = byPair.get(key)?.[0];
		if (!current) creates.push(wanted);
		else if (current.sort !== wanted.sort) {
			updates.push({ id: current.id, ...wanted });
		}
	}
	return { creates, updates };
}

export function buildStagePlan(
	desired: readonly DesiredBlogPost[],
	state: TranslationState,
): StagePlan {
	assertFixtureContract(desired);
	assertNoUnexpectedGroupRows(desired, state);
	assertEnglishSources(desired, state, false);
	const byId = new Map(state.posts.map((post) => [post.id, post]));
	const englishTranslationKeyPatches = desired
		.filter((post) => post.lang === 'en')
		.filter((post) => byId.get(post.id)?.translation_key === null)
		.map((post) => ({ id: post.id, translation_key: post.translation_key }));
	const translations = desired.filter((post) => post.lang !== 'en');
	const translationCreates: BlogPostCmsRow[] = [];
	const translationUpdates: BlogPostCmsRow[] = [];
	for (const post of translations) {
		const actual = byId.get(post.id);
		if (!actual) {
			translationCreates.push(withoutTags(post, 'draft'));
			continue;
		}
		assertTranslationOwnership(actual, post);
		const drift = contentDrift(actual, post);
		if (drift.length > 0 || actual.status === 'archived') {
			translationUpdates.push(withoutTags(post, 'draft'));
		}
	}

	const tagCreates = buildTagCreates(desired, state);
	const junctions = buildTranslationJunctionPlan(translations, state);
	const requiresWrite =
		englishTranslationKeyPatches.length > 0 ||
		translationCreates.length > 0 ||
		translationUpdates.length > 0 ||
		tagCreates.length > 0 ||
		junctions.creates.length > 0 ||
		junctions.updates.length > 0;

	return {
		requiresWrite,
		englishTranslationKeyPatches,
		translationCreates,
		translationUpdates,
		tagCreates,
		junctionCreates: junctions.creates,
		junctionUpdates: junctions.updates,
		postDeletes: [],
		junctionDeletes: [],
	};
}

export function formatStagePlan(plan: StagePlan): string {
	if (!plan.requiresWrite) {
		return 'NO CHANGES\nAll six English sources and twelve staged translations already match.';
	}
	return [
		'STAGE EN/FR/ES BLOG TRANSLATIONS',
		`  PATCH English translation_key only: ${plan.englishTranslationKeyPatches.length}`,
		`  CREATE translated drafts: ${plan.translationCreates.length}`,
		`  UPDATE translated drafts: ${plan.translationUpdates.length}`,
		`  CREATE normalized tags: ${plan.tagCreates.length}`,
		`  CREATE tag junctions: ${plan.junctionCreates.length}`,
		`  UPDATE tag junction sort: ${plan.junctionUpdates.length}`,
		'  NO DELETE operations',
		...plan.translationCreates.map(
			(post) =>
				`    CREATE ${post.id} lang=${post.lang} status=draft body=${hashBody(post.body)}`,
		),
		...plan.translationUpdates.map(
			(post) =>
				`    UPDATE ${post.id} lang=${post.lang} status=draft body=${hashBody(post.body)}`,
		),
	].join('\n');
}

function assertExactRelations(
	desired: readonly DesiredBlogPost[],
	state: TranslationState,
): void {
	const expectedTagIds = new Set(desired.flatMap((post) => [...post.tags]));
	const tags = new Map(state.tags.map((tag) => [tag.id, tag]));
	for (const id of expectedTagIds) {
		if (tags.get(id)?.name !== id) {
			throw new Error(
				`[promote-blog-translations] tag drift: ${id}`,
			);
		}
	}
	for (const post of desired) {
		const actual = postTags(state, post.id);
		const wanted = expectedTags(post);
		if (canonicalJson(actual) !== canonicalJson(wanted)) {
			throw new Error(
				`[promote-blog-translations] tag junction drift: ${post.id}`,
			);
		}
	}
}

export function assertPublishReady(
	desired: readonly DesiredBlogPost[],
	state: TranslationState,
): void {
	assertFixtureContract(desired);
	assertNoUnexpectedGroupRows(desired, state);
	assertEnglishSources(desired, state, true);
	const byId = new Map(state.posts.map((post) => [post.id, post]));
	for (const post of desired.filter((row) => row.lang !== 'en')) {
		const actual = byId.get(post.id);
		if (!actual) {
			throw new Error(
				`[promote-blog-translations] missing desired row ${post.id}`,
			);
		}
		const scalar = scalarDrift(actual, post);
		if (actual.translation_key !== post.translation_key) scalar.push('translation_key' as ScalarField);
		if (scalar.length > 0) {
			throw new Error(
				`[promote-blog-translations] translated row drift ${post.id}: ${scalar.join(', ')}`,
			);
		}
		if (hashBody(actual.body) !== hashBody(post.body)) {
			throw new Error(`[promote-blog-translations] body drift ${post.id}`);
		}
		if (actual.status !== 'draft' && actual.status !== 'published') {
			throw new Error(
				`[promote-blog-translations] translated row ${post.id} must be draft or published`,
			);
		}
	}
	assertExactRelations(desired, state);
}

export function buildPublishPlan(
	desired: readonly DesiredBlogPost[],
	state: TranslationState,
): PublishPlan {
	assertPublishReady(desired, state);
	const byId = new Map(state.posts.map((post) => [post.id, post]));
	const translationIds = desired
		.filter((post) => post.lang !== 'en' && byId.get(post.id)?.status !== 'published')
		.map((post) => post.id);
	return { requiresWrite: translationIds.length > 0, translationIds };
}

export function formatPublishPlan(plan: PublishPlan): string {
	if (!plan.requiresWrite) {
		return 'NO CHANGES\nAll twelve translated rows are already published.';
	}
	return [
		'PUBLISH EN/FR/ES BLOG TRANSLATIONS',
		`  publish ${plan.translationIds.length} of exactly 12 translated rows`,
		'  English rows updated: 0',
		'  NO DELETE operations',
		...plan.translationIds.map((id) => `    PUBLISH ${id}`),
	].join('\n');
}

async function readTranslationState(
	client: DirectusClient,
	desired: readonly DesiredBlogPost[],
): Promise<TranslationState> {
	const desiredTagIds = [...new Set(desired.flatMap((post) => [...post.tags]))];
	const desiredPostIds = desired.map((post) => post.id);
	const [posts, tags, junctions] = await Promise.all([
		client.request(
			readItems('blog_posts', {
				fields: [
					'id',
					'translation_key',
					'status',
					'date_published',
					'date_modified',
					'sort',
					'lang',
					'category',
					'external',
					'url',
					'cover_image',
					'svg_illustration',
					'animation',
					'title',
					'excerpt',
					'seo_title',
					'seo_description',
					'body',
				],
				limit: -1,
			}),
		),
		client.request(
			readItems('tags', {
				filter: { id: { _in: desiredTagIds } },
				fields: ['id', 'name'],
				limit: -1,
			}),
		),
		client.request(
			readItems('blog_posts_tags', {
				filter: { blog_posts_id: { _in: desiredPostIds } },
				fields: ['id', 'blog_posts_id', 'tags_id', 'sort'],
				limit: -1,
			}),
		),
	]);
	return {
		posts: posts as BlogPostCmsRow[],
		tags: tags as TagCmsRow[],
		junctions: junctions as BlogPostTagJunctionRow[],
	};
}

async function applyStage(
	client: DirectusClient,
	desired: readonly DesiredBlogPost[],
	plan: StagePlan,
): Promise<void> {
	const log = createLogger('promote-blog-translations');
	if (plan.englishTranslationKeyPatches.length > 0) {
		log.info('stage 1/6: patch English translation_key fields only');
		await client.request(
			updateItemsBatch('blog_posts', plan.englishTranslationKeyPatches),
		);
	}
	if (plan.translationCreates.length > 0) {
		log.info('stage 2/6: create translated rows as drafts');
		await client.request(createItems('blog_posts', plan.translationCreates));
	}
	if (plan.translationUpdates.length > 0) {
		log.info('stage 3/6: update changed translated rows as drafts');
		await client.request(updateItemsBatch('blog_posts', plan.translationUpdates));
	}
	if (plan.tagCreates.length > 0) {
		log.info('stage 4/6: create missing normalized tags');
		await client.request(createItems('tags', plan.tagCreates));
	}
	if (plan.junctionUpdates.length > 0) {
		log.info('stage 5/6: update translated junction sort values');
		await client.request(updateItemsBatch('blog_posts_tags', plan.junctionUpdates));
	}
	if (plan.junctionCreates.length > 0) {
		log.info('stage 5/6: create translated tag junctions');
		await client.request(createItems('blog_posts_tags', plan.junctionCreates));
	}
	log.info('stage 6/6: re-read and verify exact staged state');
	const after = await readTranslationState(client, desired);
	const afterPlan = buildStagePlan(desired, after);
	if (afterPlan.requiresWrite) {
		throw new Error(
			'[promote-blog-translations] staged verification failed: desired state still requires writes',
		);
	}
	assertPublishReady(desired, after);
	log.info('verified: six English sources unchanged; twelve translations ready');
}

async function applyPublish(
	client: DirectusClient,
	desired: readonly DesiredBlogPost[],
	plan: PublishPlan,
): Promise<void> {
	const log = createLogger('promote-blog-translations');
	if (plan.translationIds.length > 0) {
		await client.request(
			updateItems('blog_posts', plan.translationIds, { status: 'published' }),
		);
	}
	const after = await readTranslationState(client, desired);
	assertPublishReady(desired, after);
	const remaining = buildPublishPlan(desired, after);
	if (remaining.requiresWrite) {
		throw new Error(
			`[promote-blog-translations] publish verification failed; still draft: ${remaining.translationIds.join(', ')}`,
		);
	}
	log.info('verified: exactly twelve translations are published; English sources unchanged');
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const desired = loadTranslationFixture();
	const log = createLogger('promote-blog-translations');
	log.info(
		`target=${options.target} url=${options.directusUrl} phase=${options.phase} mode=${options.apply ? 'APPLY' : 'DRY-RUN'}`,
	);
	log.info('source=18 fixture rows (6 English + 6 French + 6 Spanish)');

	const token = await getAdminToken(options.directusUrl, { allowBuildToken: false });
	const client = createClient<DirectusSchema>(options.directusUrl, token);
	const state = await readTranslationState(client, desired);
	if (options.phase === 'stage') {
		const plan = buildStagePlan(desired, state);
		console.log(formatStagePlan(plan));
		if (!options.apply) {
			log.info('dry-run complete: CMS was read; no writes were sent.');
			return;
		}
		if (!plan.requiresWrite) {
			log.info('stage already converged; no writes were sent.');
			return;
		}
		await applyStage(client, desired, plan);
		return;
	}

	const plan = buildPublishPlan(desired, state);
	console.log(formatPublishPlan(plan));
	if (!options.apply) {
		log.info('dry-run complete: CMS was read; no writes were sent.');
		return;
	}
	if (!plan.requiresWrite) {
		log.info('publish already converged; no writes were sent.');
		return;
	}
	await applyPublish(client, desired, plan);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[promote-blog-translations] FAILED:', error);
		process.exit(1);
	});
}
