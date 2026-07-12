import { describe, expect, it } from 'bun:test';
import {
	DEV_CMS_URL,
	PROD_CMS_URL,
	PROD_PUBLISH_CONFIRM_PHRASE,
	PROD_STAGE_CONFIRM_PHRASE,
	assertPublishReady,
	buildPublishPlan,
	buildStagePlan,
	formatPublishPlan,
	formatStagePlan,
	loadTranslationFixture,
	parseArgs,
	type BlogPostCmsRow,
	type BlogPostTagJunctionRow,
	type TranslationState,
} from '../scripts/promote-blog-translations';

const desired = loadTranslationFixture();
const english = desired.filter((post) => post.lang === 'en');
const translations = desired.filter((post) => post.lang !== 'en');

function asCmsRows(options: { translationKeys?: boolean; translationStatus?: 'draft' | 'published' } = {}): BlogPostCmsRow[] {
	return desired.map(({ tags: _tags, ...row }) => ({
		...structuredClone(row),
		translation_key:
			row.lang === 'en' && options.translationKeys === false ? null : row.translation_key,
		status:
			row.lang === 'en' ? 'published' : (options.translationStatus ?? 'draft'),
		date_published: row.date_published
			? new Date(`${row.date_published}T00:00:00.000Z`).toISOString()
			: null,
		date_modified: row.date_modified
			? new Date(`${row.date_modified}T00:00:00.000Z`).toISOString()
			: null,
	}));
}

function exactTags() {
	return [...new Set(desired.flatMap((post) => [...post.tags]))]
		.sort()
		.map((id) => ({ id, name: id }));
}

function exactJunctions(posts = desired, idBase = 10_000): BlogPostTagJunctionRow[] {
	let id = idBase;
	return posts.flatMap((post) =>
		post.tags.map((tag, sort) => ({
			id: id++,
			blog_posts_id: post.id,
			tags_id: tag,
			sort,
		})),
	);
}

function exactState(options: { translationKeys?: boolean; translationStatus?: 'draft' | 'published' } = {}): TranslationState {
	return {
		posts: asCmsRows(options),
		tags: exactTags(),
		junctions: exactJunctions(),
	};
}

describe('promote-blog-translations CLI safety', () => {
	it('requires one explicit target and phase and defaults to read-only', () => {
		expect(() => parseArgs([])).toThrow('Missing --target=dev|prod');
		expect(() => parseArgs(['--target=dev'])).toThrow('Missing --phase=stage|publish');
		expect(parseArgs(['--target=dev', '--phase=stage'])).toEqual({
			apply: false,
			target: 'dev',
			phase: 'stage',
			directusUrl: DEV_CMS_URL,
		});
		expect(parseArgs(['--target=prod', '--phase=publish'])).toEqual({
			apply: false,
			target: 'prod',
			phase: 'publish',
			directusUrl: PROD_CMS_URL,
		});
	});

	it('uses separate exact confirmations for production stage and publish', () => {
		expect(() =>
			parseArgs(['--target=prod', '--phase=stage', '--apply']),
		).toThrow(PROD_STAGE_CONFIRM_PHRASE);
		expect(() =>
			parseArgs(['--target=prod', '--phase=publish', '--apply']),
		).toThrow(PROD_PUBLISH_CONFIRM_PHRASE);
		expect(
			parseArgs([
				'--target=prod',
				'--phase=stage',
				'--apply',
				`--confirm=${PROD_STAGE_CONFIRM_PHRASE}`,
			]),
		).toMatchObject({ apply: true, target: 'prod', phase: 'stage' });
		expect(
			parseArgs([
				'--target=prod',
				'--phase=publish',
				'--apply',
				`--confirm=${PROD_PUBLISH_CONFIRM_PHRASE}`,
			]),
		).toMatchObject({ apply: true, target: 'prod', phase: 'publish' });
	});

	it('rejects ambiguous and unknown flags', () => {
		expect(() =>
			parseArgs(['--target=dev', '--phase=stage', '--dry-run', '--apply']),
		).toThrow('Choose either --dry-run or --apply');
		expect(() => parseArgs(['--target=dev', '--phase=ship'])).toThrow(
			'Invalid phase',
		);
		expect(() => parseArgs(['--target=dev', '--phase=stage', '--aply'])).toThrow(
			'Unknown argument',
		);
	});
});

describe('promote-blog-translations fixture contract', () => {
	it('loads six complete en/fr/es groups and exactly twelve translated rows', () => {
		expect(desired).toHaveLength(18);
		expect(english).toHaveLength(6);
		expect(translations).toHaveLength(12);
		expect(new Set(desired.map((post) => post.translation_key)).size).toBe(6);
		for (const key of new Set(desired.map((post) => post.translation_key))) {
			expect(
				desired
					.filter((post) => post.translation_key === key)
					.map((post) => post.lang)
					.sort(),
			).toEqual(['en', 'es', 'fr']);
		}
	});
});

describe('promote-blog-translations stage planner', () => {
	it('refuses any English source drift before planning a write', () => {
		const state = exactState({ translationKeys: false });
		state.posts.find((post) => post.lang === 'en')!.title = 'drifted live title';

		expect(() => buildStagePlan(desired, state)).toThrow('English source drift');
	});

	it('refuses unexpected non-null English translation keys', () => {
		const state = exactState();
		state.posts.find((post) => post.lang === 'en')!.translation_key = 'wrong-group';

		expect(() => buildStagePlan(desired, state)).toThrow('unexpected English translation_key');
	});

	it('patches only translation_key on the six English rows and creates twelve drafts', () => {
		const state: TranslationState = {
			posts: asCmsRows({ translationKeys: false }).filter((post) => post.lang === 'en'),
			tags: exactTags(),
			junctions: exactJunctions(english),
		};
		const plan = buildStagePlan(desired, state);

		expect(plan.englishTranslationKeyPatches).toEqual(
			english.map((post) => ({ id: post.id, translation_key: post.translation_key })),
		);
		expect(plan.translationCreates).toHaveLength(12);
		expect(plan.translationCreates.every((post) => post.status === 'draft')).toBe(true);
		expect(plan.translationUpdates).toEqual([]);
		expect(plan.postDeletes).toEqual([]);
		expect(plan.junctionDeletes).toEqual([]);
		expect(formatStagePlan(plan)).toContain('NO DELETE operations');
	});

	it('updates only drifted translated rows as drafts and never edits English content', () => {
		const state = exactState({ translationStatus: 'published' });
		const changed = state.posts.find((post) => post.lang === 'es')!;
		changed.title = 'stale';
		const plan = buildStagePlan(desired, state);

		expect(plan.englishTranslationKeyPatches).toEqual([]);
		expect(plan.translationCreates).toEqual([]);
		expect(plan.translationUpdates).toHaveLength(1);
		expect(plan.translationUpdates[0]).toMatchObject({ id: changed.id, status: 'draft' });
		expect(plan.translationUpdates.some((post) => post.lang === 'en')).toBe(false);
	});

	it('refuses to overwrite a planned slug owned by another locale or translation group', () => {
		const wrongLocale = exactState();
		const localeCollision = wrongLocale.posts.find(
			(post) => post.id === translations[0]!.id,
		)!;
		localeCollision.lang = 'en';
		expect(() => buildStagePlan(desired, wrongLocale)).toThrow(
			'translation ownership mismatch',
		);

		const wrongGroup = exactState();
		const groupCollision = wrongGroup.posts.find(
			(post) => post.id === translations[0]!.id,
		)!;
		groupCollision.translation_key = english.find(
			(post) => post.translation_key !== groupCollision.translation_key,
		)!.translation_key;
		expect(() => buildStagePlan(desired, wrongGroup)).toThrow(
			'translation ownership mismatch',
		);
	});

	it('is idempotent when all content and relations already match', () => {
		const plan = buildStagePlan(desired, exactState());

		expect(plan.requiresWrite).toBe(false);
		expect(plan.englishTranslationKeyPatches).toEqual([]);
		expect(plan.translationCreates).toEqual([]);
		expect(plan.translationUpdates).toEqual([]);
		expect(plan.junctionCreates).toEqual([]);
		expect(plan.junctionUpdates).toEqual([]);
		expect(formatStagePlan(plan)).toContain('NO CHANGES');
	});

	it('fails closed on stale or duplicate junctions because the promoter never deletes', () => {
		const stale = exactState();
		stale.junctions.push({
			id: 99_999,
			blog_posts_id: translations[0]!.id,
			tags_id: 'stale-tag',
			sort: 8,
		});
		expect(() => buildStagePlan(desired, stale)).toThrow('would require a junction delete');

		const duplicate = exactState();
		const translatedJunction = duplicate.junctions.find(
			(row) => row.blog_posts_id === translations[0]!.id,
		)!;
		duplicate.junctions.push({ ...translatedJunction, id: 88_888 });
		expect(() => buildStagePlan(desired, duplicate)).toThrow(
			'would require a junction delete',
		);
	});
});

describe('promote-blog-translations publish gate', () => {
	it('refuses missing, drifted, or incomplete locale groups', () => {
		const missing = exactState();
		missing.posts = missing.posts.filter((post) => post.id !== translations[0]!.id);
		expect(() => assertPublishReady(desired, missing)).toThrow('missing desired row');

		const drifted = exactState();
		drifted.posts.find((post) => post.lang === 'fr')!.body = {
			...drifted.posts.find((post) => post.lang === 'fr')!.body,
			blocks: [],
		};
		expect(() => assertPublishReady(desired, drifted)).toThrow('body drift');
	});

	it('publishes exactly the twelve translations and never English', () => {
		const state = exactState({ translationStatus: 'draft' });
		const plan = buildPublishPlan(desired, state);

		expect(plan.translationIds).toHaveLength(12);
		expect(plan.translationIds.sort()).toEqual(
			translations.map((post) => post.id).sort(),
		);
		expect(plan.translationIds.some((id) => english.some((post) => post.id === id))).toBe(
			false,
		);
		expect(formatPublishPlan(plan)).toContain('exactly 12 translated rows');
	});

	it('resumes partially published state and becomes a no-op after publication', () => {
		const partial = exactState({ translationStatus: 'draft' });
		partial.posts.find((post) => post.lang === 'fr')!.status = 'published';
		expect(buildPublishPlan(desired, partial).translationIds).toHaveLength(11);

		const final = exactState({ translationStatus: 'published' });
		expect(buildPublishPlan(desired, final)).toEqual({
			requiresWrite: false,
			translationIds: [],
		});
	});
});
