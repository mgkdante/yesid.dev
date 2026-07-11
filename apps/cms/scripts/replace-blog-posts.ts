#!/usr/bin/env bun
/**
 * Replace the three legacy blog posts with the six fixture rows.
 *
 * Dry-run is the default, but it reads the selected CMS so the printed plan is
 * an exact diff. Writes require --apply. Production additionally requires the
 * exact confirmation phrase exported below.
 *
 * Safe publish sequence:
 *   1. create/update changed desired rows as drafts;
 *   2. reconcile the shared tags and blog_posts_tags junction rows;
 *   3. re-read and verify every desired scalar, body hash, and tag pair;
 *   4. delete only the three allow-listed legacy IDs;
 *   5. publish the fixture rows whose final status is `published` with one
 *      Directus batch PATCH while explicitly gated rows remain drafts. Directus
 *      may still emit one Flow event per row from that single request;
 *   6. re-read and verify the final state and legacy-row absence.
 *
 * Examples (run from the repository root):
 *   bun apps/cms/scripts/replace-blog-posts.ts --target=dev
 *   bun apps/cms/scripts/replace-blog-posts.ts --target=dev --apply
 *   bun apps/cms/scripts/replace-blog-posts.ts --target=prod
 *   bun apps/cms/scripts/replace-blog-posts.ts --target=prod --apply \
 *     --confirm=REPLACE_PROD_BLOG_POSTS_WITH_SIX_TRUTH_LOCKED_POSTS
 */

import { createHash } from 'node:crypto';
import {
	createItems,
	deleteItems,
	readItems,
	updateItems,
	updateItemsBatch,
} from '@directus/sdk';
import type { BlockEditorDoc } from '@repo/shared';
import { getAdminToken } from './lib/auth';
import { createClient } from './lib/sdk';
import { createLogger } from './lib/logger';
import {
	loadBlogPostsFixture,
	toBlogPostRow,
	type DirectusBlogPostRow,
} from './seed-blog-posts';

export const DEV_CMS_URL = 'https://cms.dev.yesid.dev';
export const PROD_CMS_URL = 'https://cms.yesid.dev';
export const PROD_CONFIRM_PHRASE =
	'REPLACE_PROD_BLOG_POSTS_WITH_SIX_TRUTH_LOCKED_POSTS';

export const LEGACY_BLOG_IDS = [
	'anime-data-viz-challenge',
	'building-a-transit-pipeline',
	'why-i-left-orm-for-raw-sql',
] as const;

export const REPLACEMENT_PHASES = [
	'stage-drafts',
	'upsert-tags',
	'reconcile-junctions',
	'verify-staged',
	'delete-legacy',
	'batch-publish',
	'verify-final',
] as const;

export type Target = 'dev' | 'prod';
export type ExpectedStatus = 'draft' | 'published';
export type DesiredBlogPost = DirectusBlogPostRow;
export type BlogPostCmsRow = Omit<DirectusBlogPostRow, 'tags'>;

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

export interface ReplacementState {
	posts: BlogPostCmsRow[];
	tags: TagCmsRow[];
	junctions: BlogPostTagJunctionRow[];
}

export interface ParsedArgs {
	apply: boolean;
	target: Target;
	directusUrl: typeof DEV_CMS_URL | typeof PROD_CMS_URL;
}

export interface ScalarChange {
	field: ScalarField;
	before: unknown;
	after: unknown;
}

export interface BodyChange {
	beforeBlocks: number;
	beforeHash: string;
	afterBlocks: number;
	afterHash: string;
}

export interface PostPlanEntry {
	id: string;
	action: 'create' | 'update' | 'noop';
	beforeStatus: DirectusBlogPostRow['status'] | null;
	finalStatus: ExpectedStatus;
	stage: BlogPostCmsRow;
	tags: readonly string[];
	scalarChanges: ScalarChange[];
	bodyChange: BodyChange | null;
}

export interface TagUpdatePlan {
	id: string;
	beforeName: string;
	name: string;
}

export interface JunctionCreatePlan {
	blog_posts_id: string;
	tags_id: string;
	sort: number;
}

export interface JunctionUpdatePlan extends JunctionCreatePlan {
	id: number;
	beforeSort: number | null;
}

export interface JunctionDeletePlan extends BlogPostTagJunctionRow {}

export interface ReplacementPlan {
	requiresWrite: boolean;
	posts: PostPlanEntry[];
	tags: {
		create: TagCmsRow[];
		update: TagUpdatePlan[];
	};
	junctions: {
		create: JunctionCreatePlan[];
		update: JunctionUpdatePlan[];
		delete: JunctionDeletePlan[];
	};
	deleteLegacy: string[];
	finalPublish: string[];
}

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

interface DirectusSchema {
	blog_posts: BlogPostCmsRow[];
	tags: TagCmsRow[];
	blog_posts_tags: BlogPostTagJunctionRow[];
}

type DirectusClient = ReturnType<typeof createClient<DirectusSchema>>;

function canonicalJson(value: unknown): string {
	if (value === null || typeof value !== 'object') return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
	const object = value as Record<string, unknown>;
	return `{${Object.keys(object)
		.sort()
		.map((key) => `${JSON.stringify(key)}:${canonicalJson(object[key])}`)
		.join(',')}}`;
}

export function hashBody(body: BlockEditorDoc): string {
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

function scalarChanges(
	actual: BlogPostCmsRow,
	desired: DesiredBlogPost,
): ScalarChange[] {
	return SCALAR_FIELDS.flatMap((field) =>
		Object.is(scalarKey(field, actual[field]), scalarKey(field, desired[field]))
			? []
			: [{ field, before: actual[field], after: desired[field] }],
	);
}

function bodyChange(
	actual: BlogPostCmsRow,
	desired: DesiredBlogPost,
): BodyChange | null {
	const beforeHash = hashBody(actual.body);
	const afterHash = hashBody(desired.body);
	if (beforeHash === afterHash) return null;
	return {
		beforeBlocks: actual.body.blocks.length,
		beforeHash,
		afterBlocks: desired.body.blocks.length,
		afterHash,
	};
}

function withoutTags(post: DesiredBlogPost, status: ExpectedStatus): BlogPostCmsRow {
	const { tags: _tags, ...row } = post;
	return { ...structuredClone(row), status };
}

function desiredTagIds(desired: readonly DesiredBlogPost[]): string[] {
	return [...new Set(desired.flatMap((post) => [...post.tags]))].sort();
}

function assertFixtureContract(desired: readonly DesiredBlogPost[]): void {
	if (desired.length !== 6) {
		throw new Error(
			`[replace-blog-posts] fixture must contain exactly 6 rows; got ${desired.length}`,
		);
	}
	const ids = desired.map((post) => post.id);
	if (new Set(ids).size !== ids.length) {
		throw new Error('[replace-blog-posts] fixture contains duplicate IDs');
	}
	const legacyOverlap = ids.filter((id) =>
		(LEGACY_BLOG_IDS as readonly string[]).includes(id),
	);
	if (legacyOverlap.length > 0) {
		throw new Error(
			`[replace-blog-posts] replacement fixture reuses legacy IDs: ${legacyOverlap.join(', ')}`,
		);
	}
	const invalidStatuses = desired.filter(
		(post) => post.status !== 'draft' && post.status !== 'published',
	);
	if (invalidStatuses.length > 0) {
		throw new Error(
			`[replace-blog-posts] replacement fixture rows must be draft or published: ${invalidStatuses.map((post) => post.id).join(', ')}`,
		);
	}
	const duplicateTagPosts = desired.filter(
		(post) => new Set(post.tags).size !== post.tags.length,
	);
	if (duplicateTagPosts.length > 0) {
		throw new Error(
			`[replace-blog-posts] replacement fixture contains duplicate tags: ${duplicateTagPosts.map((post) => post.id).join(', ')}`,
		);
	}
}

export function loadReplacementFixture(): readonly DesiredBlogPost[] {
	const desired = loadBlogPostsFixture().map(toBlogPostRow);
	assertFixtureContract(desired);
	return desired;
}

export function parseArgs(argv: readonly string[]): ParsedArgs {
	const known = argv.filter(
		(arg) =>
			arg === '--apply' ||
			arg === '--dry-run' ||
			arg.startsWith('--target=') ||
			arg.startsWith('--confirm='),
	);
	if (known.length !== argv.length) {
		const unknown = argv.find((arg) => !known.includes(arg));
		throw new Error(`[replace-blog-posts] Unknown argument: ${unknown}`);
	}
	if (argv.includes('--apply') && argv.includes('--dry-run')) {
		throw new Error('[replace-blog-posts] Choose either --dry-run or --apply, not both');
	}

	const targets = argv
		.filter((arg) => arg.startsWith('--target='))
		.map((arg) => arg.slice('--target='.length));
	if (targets.length === 0) {
		throw new Error('[replace-blog-posts] Missing --target=dev|prod');
	}
	if (targets.length !== 1 || (targets[0] !== 'dev' && targets[0] !== 'prod')) {
		throw new Error(
			`[replace-blog-posts] Invalid target; use exactly one --target=dev|prod`,
		);
	}

	const target = targets[0] as Target;
	const apply = argv.includes('--apply');
	const confirmation = argv
		.find((arg) => arg.startsWith('--confirm='))
		?.slice('--confirm='.length);
	if (apply && target === 'prod' && confirmation !== PROD_CONFIRM_PHRASE) {
		throw new Error(
			`[replace-blog-posts] PROD write refused. Re-run with --confirm=${PROD_CONFIRM_PHRASE}`,
		);
	}

	return {
		apply,
		target,
		directusUrl: target === 'dev' ? DEV_CMS_URL : PROD_CMS_URL,
	};
}

function buildTagPlan(
	desired: readonly DesiredBlogPost[],
	existing: readonly TagCmsRow[],
): ReplacementPlan['tags'] {
	const byId = new Map(existing.map((tag) => [tag.id, tag]));
	const create: TagCmsRow[] = [];
	const update: TagUpdatePlan[] = [];
	for (const id of desiredTagIds(desired)) {
		const current = byId.get(id);
		if (!current) create.push({ id, name: id });
		else if (current.name !== id) {
			update.push({ id, beforeName: current.name, name: id });
		}
	}
	return { create, update };
}

function junctionPair(postId: string, tagId: string): string {
	return `${postId}\u0000${tagId}`;
}

function buildJunctionPlan(
	desired: readonly DesiredBlogPost[],
	existing: readonly BlogPostTagJunctionRow[],
): ReplacementPlan['junctions'] {
	const desiredPostIds = new Set(desired.map((post) => post.id));
	const scoped = existing
		.filter((row) => desiredPostIds.has(row.blog_posts_id))
		.sort((left, right) => left.id - right.id);
	const byPair = new Map<string, BlogPostTagJunctionRow[]>();
	for (const row of scoped) {
		const key = junctionPair(row.blog_posts_id, row.tags_id);
		const rows = byPair.get(key) ?? [];
		rows.push(row);
		byPair.set(key, rows);
	}

	const create: JunctionCreatePlan[] = [];
	const update: JunctionUpdatePlan[] = [];
	const remove = new Map<number, JunctionDeletePlan>();
	const expectedPairs = new Set<string>();

	for (const post of desired) {
		post.tags.forEach((tags_id, sort) => {
			const key = junctionPair(post.id, tags_id);
			expectedPairs.add(key);
			const matches = byPair.get(key) ?? [];
			const keep = matches[0];
			if (!keep) {
				create.push({ blog_posts_id: post.id, tags_id, sort });
				return;
			}
			if (keep.sort !== sort) {
				update.push({
					id: keep.id,
					blog_posts_id: post.id,
					tags_id,
					beforeSort: keep.sort,
					sort,
				});
			}
			for (const duplicate of matches.slice(1)) remove.set(duplicate.id, duplicate);
		});
	}

	for (const row of scoped) {
		if (!expectedPairs.has(junctionPair(row.blog_posts_id, row.tags_id))) {
			remove.set(row.id, row);
		}
	}

	return {
		create,
		update,
		delete: [...remove.values()].sort((left, right) => left.id - right.id),
	};
}

export function buildReplacementPlan(
	desired: readonly DesiredBlogPost[],
	state: ReplacementState,
): ReplacementPlan {
	assertFixtureContract(desired);
	const tags = buildTagPlan(desired, state.tags);
	const junctions = buildJunctionPlan(desired, state.junctions);
	const byId = new Map(state.posts.map((post) => [post.id, post]));

	const diffs = desired.map((post) => {
		const current = byId.get(post.id);
		return {
			post,
			current,
			scalars: current ? scalarChanges(current, post) : [],
			body: current ? bodyChange(current, post) : null,
		};
	});
	const deleteLegacy = LEGACY_BLOG_IDS.filter((id) => byId.has(id));
	const postDrift = diffs.some(
		({ post, current, scalars, body }) =>
			!current ||
			current.status !== post.status ||
			scalars.length > 0 ||
			body !== null,
	);
	const requiresWrite =
		postDrift ||
		tags.create.length > 0 ||
		tags.update.length > 0 ||
		junctions.create.length > 0 ||
		junctions.update.length > 0 ||
		junctions.delete.length > 0 ||
		deleteLegacy.length > 0;

	const posts: PostPlanEntry[] = diffs.map(({ post, current, scalars, body }) => {
		const stage = withoutTags(post, 'draft');
		const needsPostWrite =
			!current ||
			current.status !== post.status ||
			scalars.length > 0 ||
			body !== null;
		if (!needsPostWrite) {
			return {
				id: post.id,
				action: 'noop',
				beforeStatus: current?.status ?? null,
				finalStatus: post.status as ExpectedStatus,
				stage,
				tags: post.tags,
				scalarChanges: scalars,
				bodyChange: body,
			};
		}
		if (!current) {
			return {
				id: post.id,
				action: 'create',
				beforeStatus: null,
				finalStatus: post.status as ExpectedStatus,
				stage,
				tags: post.tags,
				scalarChanges: [],
				bodyChange: null,
			};
		}
		const needsStageUpdate =
			current.status !== 'draft' || scalars.length > 0 || body !== null;
		return {
			id: post.id,
			action: needsStageUpdate ? 'update' : 'noop',
			beforeStatus: current.status,
			finalStatus: post.status as ExpectedStatus,
			stage,
			tags: post.tags,
			scalarChanges: scalars,
			bodyChange: body,
		};
	});
	const finalPublish = posts
		.filter(
			(entry) =>
				entry.finalStatus === 'published' &&
				(entry.action !== 'noop' ||
					byId.get(entry.id)?.status !== 'published'),
		)
		.map((entry) => entry.id);
	const nonPostWrite =
		tags.create.length > 0 ||
		tags.update.length > 0 ||
		junctions.create.length > 0 ||
		junctions.update.length > 0 ||
		junctions.delete.length > 0 ||
		deleteLegacy.length > 0;
	if (requiresWrite && nonPostWrite && finalPublish.length === 0) {
		const deployTouch = posts.find(
			(entry) => entry.finalStatus === 'published',
		);
		if (deployTouch) finalPublish.push(deployTouch.id);
	}

	return {
		requiresWrite,
		posts,
		tags,
		junctions,
		deleteLegacy,
		finalPublish,
	};
}

function displayValue(value: unknown): string {
	return JSON.stringify(value);
}

function appendDesiredSummary(lines: string[], entry: PostPlanEntry): void {
	lines.push(
		`    body = blocks:${entry.stage.body.blocks.length} sha256:${hashBody(entry.stage.body)}`,
	);
	lines.push(`    tags = [${entry.tags.join(', ')}]`);
}

export function formatReplacementPlan(plan: ReplacementPlan): string {
	if (!plan.requiresWrite) {
		return [
			'NO CHANGES',
			'All six fixture rows, body hashes, normalized tags, and final statuses already match.',
		].join('\n');
	}

	const lines: string[] = [];
	lines.push('PHASE 1 — STAGE CHANGED BLOG POSTS AS DRAFT');
	for (const entry of plan.posts) {
		if (entry.action === 'create') {
			lines.push(
				`  CREATE blog_posts[${entry.id}] (staged status=draft; final status=${entry.finalStatus})`,
			);
			lines.push('    status = "draft"');
			for (const field of SCALAR_FIELDS) {
				lines.push(`    ${field} = ${displayValue(entry.stage[field])}`);
			}
			appendDesiredSummary(lines, entry);
			continue;
		}
		if (entry.action === 'update') {
			lines.push(`  UPDATE blog_posts[${entry.id}] (stage draft)`);
			const statusPath = `${entry.beforeStatus} -> draft -> ${entry.finalStatus}`;
			lines.push(`    status: ${statusPath}`);
			for (const change of entry.scalarChanges) {
				lines.push(
					`    ${change.field}: ${displayValue(change.before)} -> ${displayValue(change.after)}`,
				);
			}
			if (entry.bodyChange) {
				const body = entry.bodyChange;
				lines.push(
					`    body: blocks:${body.beforeBlocks} sha256:${body.beforeHash} -> blocks:${body.afterBlocks} sha256:${body.afterHash}`,
				);
			} else {
				lines.push(
					`    body = blocks:${entry.stage.body.blocks.length} sha256:${hashBody(entry.stage.body)} (unchanged)`,
				);
			}
			lines.push(`    tags = [${entry.tags.join(', ')}]`);
			continue;
		}
		lines.push(
			`  NOOP blog_posts[${entry.id}] (current status=${entry.beforeStatus}; final status=${entry.finalStatus})`,
		);
		appendDesiredSummary(lines, entry);
	}

	lines.push('PHASE 2 — UPSERT NORMALIZED TAGS');
	for (const tag of plan.tags.create) {
		lines.push(`  CREATE tags[${tag.id}]`);
		lines.push(`    name = ${displayValue(tag.name)}`);
	}
	for (const tag of plan.tags.update) {
		lines.push(
			`  UPDATE tags[${tag.id}].name: ${displayValue(tag.beforeName)} -> ${displayValue(tag.name)}`,
		);
	}
	if (plan.tags.create.length === 0 && plan.tags.update.length === 0) {
		lines.push('  NOOP tags');
	}

	lines.push('PHASE 3 — RECONCILE blog_posts_tags BY (blog_posts_id, tags_id)');
	for (const row of plan.junctions.create) {
		lines.push(
			`  CREATE blog_posts_tags pair=(${row.blog_posts_id}, ${row.tags_id}) sort=${row.sort}`,
		);
	}
	for (const row of plan.junctions.update) {
		lines.push(
			`  UPDATE blog_posts_tags pair=(${row.blog_posts_id}, ${row.tags_id}) sort:${row.beforeSort} -> ${row.sort}`,
		);
	}
	for (const row of plan.junctions.delete) {
		lines.push(
			`  DELETE blog_posts_tags pair=(${row.blog_posts_id}, ${row.tags_id}) sort=${row.sort}`,
		);
	}
	if (
		plan.junctions.create.length === 0 &&
		plan.junctions.update.length === 0 &&
		plan.junctions.delete.length === 0
	) {
		lines.push('  NOOP blog_posts_tags');
	}

	lines.push('PHASE 4 — VERIFY staged drafts before any legacy delete');
	lines.push('  VERIFY six rows + every scalar + body block count/hash + ordered tag pairs');
	lines.push('PHASE 5 — DELETE ONLY ALLOW-LISTED LEGACY ROWS');
	for (const id of plan.deleteLegacy) lines.push(`  DELETE blog_posts[${id}]`);
	if (plan.deleteLegacy.length === 0) lines.push('  NOOP legacy rows (already absent)');
	lines.push('PHASE 6 — SINGLE FINAL PUBLISH REQUEST');
	lines.push(
		`  BATCH UPDATE blog_posts status=published ids=[${plan.finalPublish.join(', ')}]`,
	);
	for (const id of plan.finalPublish) {
		const entry = plan.posts.find((post) => post.id === id);
		const from = entry?.action === 'noop' ? entry.beforeStatus : 'draft';
		lines.push(`    ${id}: ${from} -> published`);
	}
	const finalDrafts = plan.posts
		.filter((entry) => entry.finalStatus === 'draft')
		.map((entry) => entry.id);
	if (finalDrafts.length > 0) {
		lines.push(`  KEEP DRAFT ids=[${finalDrafts.join(', ')}]`);
	}
	lines.push('PHASE 7 — VERIFY FINAL STATE');
	lines.push('  VERIFY six final statuses + exact bodies/tags + zero allow-listed legacy rows');
	return lines.join('\n');
}

function expectedJunctions(desired: readonly DesiredBlogPost[]): JunctionCreatePlan[] {
	return desired.flatMap((post) =>
		post.tags.map((tags_id, sort) => ({
			blog_posts_id: post.id,
			tags_id,
			sort,
		})),
	);
}

export function assertDesiredState(
	desired: readonly DesiredBlogPost[],
	state: ReplacementState,
	expectedStatus: ExpectedStatus | 'fixture',
	requireLegacyAbsent = false,
): void {
	assertFixtureContract(desired);
	const postsById = new Map(state.posts.map((post) => [post.id, post]));
	for (const post of desired) {
		const actual = postsById.get(post.id);
		if (!actual) {
			throw new Error(`[replace-blog-posts] verify: missing desired row ${post.id}`);
		}
		const wantedStatus =
			expectedStatus === 'fixture'
				? (post.status as ExpectedStatus)
				: expectedStatus;
		if (actual.status !== wantedStatus) {
			throw new Error(
				`[replace-blog-posts] verify: status mismatch ${post.id}: ${actual.status} != ${wantedStatus}`,
			);
		}
		const fields = scalarChanges(actual, post);
		if (fields.length > 0) {
			throw new Error(
				`[replace-blog-posts] verify: scalar mismatch ${post.id}: ${fields.map((change) => change.field).join(', ')}`,
			);
		}
		const body = bodyChange(actual, post);
		if (body) {
			throw new Error(
				`[replace-blog-posts] verify: body mismatch ${post.id}: blocks:${body.beforeBlocks} sha256:${body.beforeHash} != blocks:${body.afterBlocks} sha256:${body.afterHash}`,
			);
		}
	}

	const tagsById = new Map(state.tags.map((tag) => [tag.id, tag]));
	for (const id of desiredTagIds(desired)) {
		const tag = tagsById.get(id);
		if (!tag || tag.name !== id) {
			throw new Error(
				`[replace-blog-posts] verify: normalized tag mismatch ${id}: ${tag?.name ?? '<missing>'}`,
			);
		}
	}

	const desiredPostIds = new Set(desired.map((post) => post.id));
	const actualJunctions = state.junctions
		.filter((row) => desiredPostIds.has(row.blog_posts_id))
		.map(({ blog_posts_id, tags_id, sort }) => ({ blog_posts_id, tags_id, sort }))
		.sort((left, right) =>
			left.blog_posts_id.localeCompare(right.blog_posts_id) ||
			(left.sort ?? -1) - (right.sort ?? -1) ||
			left.tags_id.localeCompare(right.tags_id),
		);
	const wantedJunctions = expectedJunctions(desired).sort((left, right) =>
		left.blog_posts_id.localeCompare(right.blog_posts_id) ||
		left.sort - right.sort ||
		left.tags_id.localeCompare(right.tags_id),
	);
	if (canonicalJson(actualJunctions) !== canonicalJson(wantedJunctions)) {
		throw new Error('[replace-blog-posts] verify: tag junction mismatch');
	}

	if (requireLegacyAbsent) {
		const surviving = LEGACY_BLOG_IDS.filter((id) => postsById.has(id));
		if (surviving.length > 0) {
			throw new Error(
				`[replace-blog-posts] verify: legacy row still exists: ${surviving.join(', ')}`,
			);
		}
	}
}

const BLOG_FIELDS = [
	'id',
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
] as const;

async function readReplacementState(
	client: DirectusClient,
	desired: readonly DesiredBlogPost[],
): Promise<ReplacementState> {
	const postIds = [
		...desired.map((post) => post.id),
		...(LEGACY_BLOG_IDS as readonly string[]),
	];
	const tagIds = desiredTagIds(desired);
	const [posts, tags, junctions] = await Promise.all([
		client.request(
			readItems('blog_posts', {
				filter: { id: { _in: postIds } },
				fields: [...BLOG_FIELDS],
				limit: -1,
			}),
		),
		client.request(
			readItems('tags', {
				filter: { id: { _in: tagIds } },
				fields: ['id', 'name'],
				limit: -1,
			}),
		),
		client.request(
			readItems('blog_posts_tags', {
				filter: { blog_posts_id: { _in: desired.map((post) => post.id) } },
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

async function applyReplacement(
	client: DirectusClient,
	desired: readonly DesiredBlogPost[],
	plan: ReplacementPlan,
): Promise<void> {
	const log = createLogger('replace-blog-posts');

	log.info('apply phase 1/7: stage changed desired blog posts as draft');
	const postCreates = plan.posts
		.filter((entry) => entry.action === 'create')
		.map((entry) => entry.stage);
	const postUpdates = plan.posts
		.filter((entry) => entry.action === 'update')
		.map((entry) => entry.stage);
	if (postCreates.length > 0) {
		await client.request(createItems('blog_posts', postCreates));
	}
	if (postUpdates.length > 0) {
		await client.request(updateItemsBatch('blog_posts', postUpdates));
	}

	log.info('apply phase 2/7: upsert normalized tags');
	if (plan.tags.create.length > 0) {
		await client.request(createItems('tags', plan.tags.create));
	}
	if (plan.tags.update.length > 0) {
		await client.request(
			updateItemsBatch(
				'tags',
				plan.tags.update.map((tag) => ({ id: tag.id, name: tag.name })),
			),
		);
	}

	log.info('apply phase 3/7: reconcile blog_posts_tags');
	if (plan.junctions.delete.length > 0) {
		await client.request(
			deleteItems(
				'blog_posts_tags',
				plan.junctions.delete.map((row) => row.id),
			),
		);
	}
	if (plan.junctions.update.length > 0) {
		await client.request(
			updateItemsBatch(
				'blog_posts_tags',
				plan.junctions.update.map((row) => ({ id: row.id, sort: row.sort })),
			),
		);
	}
	if (plan.junctions.create.length > 0) {
		await client.request(createItems('blog_posts_tags', plan.junctions.create));
	}

	log.info('apply phase 4/7: verify staged drafts');
	const staged = await readReplacementState(client, desired);
	const stagedIds = new Set([
		...plan.posts
			.filter((entry) => entry.action !== 'noop')
			.map((entry) => entry.id),
		...plan.posts
			.filter(
				(entry) =>
					entry.beforeStatus === 'draft' &&
					plan.finalPublish.includes(entry.id),
			)
			.map((entry) => entry.id),
	]);
	const stagedDesired = desired.map((post) =>
		stagedIds.has(post.id)
			? ({ ...post, status: 'draft' } as DesiredBlogPost)
			: post,
	);
	assertDesiredState(stagedDesired, staged, 'fixture');

	log.info('apply phase 5/7: delete exact legacy allow-list');
	if (plan.deleteLegacy.length > 0) {
		const invalid = plan.deleteLegacy.filter(
			(id) => !(LEGACY_BLOG_IDS as readonly string[]).includes(id),
		);
		if (invalid.length > 0) {
			throw new Error(
				`[replace-blog-posts] refusing non-allow-listed delete: ${invalid.join(', ')}`,
			);
		}
		await client.request(deleteItems('blog_posts', plan.deleteLegacy));
	}

	log.info('apply phase 6/7: publish fixture rows with final status=published');
	if (plan.finalPublish.length > 0) {
		await client.request(
			updateItems('blog_posts', plan.finalPublish, { status: 'published' }),
		);
	}

	log.info('apply phase 7/7: verify final fixture state');
	const final = await readReplacementState(client, desired);
	assertDesiredState(desired, final, 'fixture', true);
	log.info('verified: six fixture rows match final statuses; three legacy IDs absent');
}

async function main(): Promise<void> {
	const options = parseArgs(process.argv.slice(2));
	const desired = loadReplacementFixture();
	const log = createLogger('replace-blog-posts');
	log.info(
		`target=${options.target} url=${options.directusUrl} mode=${options.apply ? 'APPLY' : 'DRY-RUN'}`,
	);
	log.info(
		`source=fixtures/collections/blog-posts.json rows=${desired.length} body-hashes=${desired.map((post) => `${post.id}:${hashBody(post.body)}`).join(',')}`,
	);

	const token = await getAdminToken(options.directusUrl, {
		allowBuildToken: false,
	});
	const client = createClient<DirectusSchema>(options.directusUrl, token);
	const state = await readReplacementState(client, desired);
	const plan = buildReplacementPlan(desired, state);
	console.log(formatReplacementPlan(plan));

	if (!options.apply) {
		log.info('dry-run complete: CMS was read, no writes were sent.');
		return;
	}
	if (!plan.requiresWrite) {
		log.info('apply complete: desired state already matched; no writes were sent.');
		return;
	}
	await applyReplacement(client, desired, plan);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('[replace-blog-posts] FAILED:', error);
		process.exit(1);
	});
}
