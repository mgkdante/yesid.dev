import { describe, expect, it } from 'bun:test';
import {
	DEV_CMS_URL,
	LEGACY_BLOG_IDS,
	PROD_CMS_URL,
	PROD_CONFIRM_PHRASE,
	REPLACEMENT_PHASES,
	assertDesiredState,
	buildReplacementPlan,
	formatReplacementPlan,
	hashBody,
	loadReplacementFixture,
	parseArgs,
	type BlogPostCmsRow,
	type BlogPostTagJunctionRow,
	type ReplacementState,
} from '../scripts/replace-blog-posts';

const desired = loadReplacementFixture();

function asCmsRows(): BlogPostCmsRow[] {
	return desired.map(({ tags: _tags, ...row }) => ({
		...structuredClone(row),
		date_published: row.date_published
			? new Date(`${row.date_published}T00:00:00.000Z`).toISOString()
			: null,
		date_modified: row.date_modified
			? new Date(`${row.date_modified}T00:00:00.000Z`).toISOString()
			: null,
	}));
}

function exactTags(): Array<{ id: string; name: string }> {
	return [...new Set(desired.flatMap((post) => [...post.tags]))]
		.sort()
		.map((id) => ({ id, name: id }));
}

function exactJunctions(idBase = 1): BlogPostTagJunctionRow[] {
	let id = idBase;
	return desired.flatMap((post) =>
		post.tags.map((tag, sort) => ({
			id: id++,
			blog_posts_id: post.id,
			tags_id: tag,
			sort,
		})),
	);
}

function exactState(): ReplacementState {
	return {
		posts: asCmsRows(),
		tags: exactTags(),
		junctions: exactJunctions(9000),
	};
}

function legacyRows(): BlogPostCmsRow[] {
	return LEGACY_BLOG_IDS.map((id, index) => ({
		...structuredClone(asCmsRows()[index]!),
		id,
	}));
}

describe('replace-blog-posts CLI safety', () => {
	it('targets exactly the three legacy rows being replaced', () => {
		expect(LEGACY_BLOG_IDS).toEqual([
			'anime-data-viz-challenge',
			'building-a-transit-pipeline',
			'why-i-left-orm-for-raw-sql',
		]);
	});

	it('requires an explicit target and defaults to a read-only dry-run', () => {
		expect(() => parseArgs([])).toThrow('Missing --target=dev|prod');
		expect(parseArgs(['--target=dev'])).toEqual({
			apply: false,
			target: 'dev',
			directusUrl: DEV_CMS_URL,
		});
		expect(parseArgs(['--target=prod'])).toEqual({
			apply: false,
			target: 'prod',
			directusUrl: PROD_CMS_URL,
		});
	});

	it('allows dev writes only with --apply', () => {
		expect(parseArgs(['--target=dev', '--apply']).apply).toBe(true);
		expect(parseArgs(['--target=dev', '--dry-run']).apply).toBe(false);
		expect(() => parseArgs(['--target=dev', '--dry-run', '--apply'])).toThrow(
			'Choose either --dry-run or --apply',
		);
	});

	it('refuses prod writes without the exact hard confirmation phrase', () => {
		expect(() => parseArgs(['--target=prod', '--apply'])).toThrow(PROD_CONFIRM_PHRASE);
		expect(() =>
			parseArgs(['--target=prod', '--apply', '--confirm=close-enough']),
		).toThrow(PROD_CONFIRM_PHRASE);
		expect(
			parseArgs([
				'--target=prod',
				'--apply',
				`--confirm=${PROD_CONFIRM_PHRASE}`,
			]),
		).toEqual({ apply: true, target: 'prod', directusUrl: PROD_CMS_URL });
	});

	it('rejects unknown targets and flags instead of silently changing behavior', () => {
		expect(() => parseArgs(['--target=staging'])).toThrow('Invalid target');
		expect(() => parseArgs(['--target=dev', '--aply'])).toThrow('Unknown argument');
	});
});

describe('replace-blog-posts fixture contract', () => {
	it('loads exactly six truth-locked published rows', () => {
		expect(desired).toHaveLength(6);
		expect(desired.every((post) => post.status === 'published')).toBe(true);
		expect(desired.every((post) => post.lang === 'en')).toBe(true);
		expect(desired.every((post) => post.translation_key === post.id)).toBe(true);
		expect(desired.some((post) => LEGACY_BLOG_IDS.includes(post.id as never))).toBe(false);
		expect(new Set(desired.map((post) => post.id)).size).toBe(6);
	});

	it('refuses multilingual input because this command is the retired six-English replacement', () => {
		const invalid = structuredClone(desired) as typeof desired;
		invalid[0]!.lang = 'fr';

		expect(() => buildReplacementPlan(invalid, exactState())).toThrow(
			'legacy command accepts exactly six English rows',
		);
	});

	it('uses stable SHA-256 body hashes', () => {
		const body = desired[0]!.body;
		expect(hashBody(body)).toMatch(/^[a-f0-9]{64}$/);
		expect(hashBody({ ...body, blocks: [...body.blocks] })).toBe(hashBody(body));
	});

	it('rejects duplicate tags that cannot map to one normalized pair', () => {
		const invalid = structuredClone(desired) as typeof desired;
		const first = invalid[0]!;
		(first.tags as string[]).push(first.tags[0]!);
		expect(() => buildReplacementPlan(invalid, exactState())).toThrow('duplicate tags');
	});
});

describe('replace-blog-posts pure planner', () => {
	it('creates the six drafts first, deletes only the three legacy IDs, then batch-publishes', () => {
		const state: ReplacementState = {
			posts: [...legacyRows(), { ...legacyRows()[0]!, id: 'unrelated-post' }],
			tags: [],
			junctions: [],
		};
		const plan = buildReplacementPlan(desired, state);

		expect(plan.requiresWrite).toBe(true);
		expect(plan.posts.filter((entry) => entry.action === 'create')).toHaveLength(6);
		expect(plan.posts.every((entry) => entry.stage.status === 'draft')).toBe(true);
		expect(plan.deleteLegacy).toEqual([...LEGACY_BLOG_IDS]);
		expect(plan.deleteLegacy).not.toContain('unrelated-post');
		expect(plan.finalPublish).toEqual(
			desired.filter((post) => post.status === 'published').map((post) => post.id),
		);
		expect(REPLACEMENT_PHASES[0]).toBe('stage-drafts');
		expect(REPLACEMENT_PHASES.indexOf('stage-drafts')).toBeLessThan(
			REPLACEMENT_PHASES.indexOf('upsert-tags'),
		);
		expect(REPLACEMENT_PHASES.indexOf('delete-legacy')).toBeLessThan(
			REPLACEMENT_PHASES.indexOf('batch-publish'),
		);
	});

	it('reports every created scalar plus body block count/hash and normalized tags', () => {
		const plan = buildReplacementPlan(desired, {
			posts: legacyRows(),
			tags: [],
			junctions: [],
		});
		const report = formatReplacementPlan(plan);
		const first = desired[0]!;

		expect(report).toContain(`CREATE blog_posts[${first.id}]`);
		expect(report).toContain(`title = ${JSON.stringify(first.title)}`);
		expect(report).toContain(`date_published = ${JSON.stringify(first.date_published)}`);
		expect(report).toContain(
			`body = blocks:${first.body.blocks.length} sha256:${hashBody(first.body)}`,
		);
		expect(report).toContain(`tags = [${first.tags.join(', ')}]`);
		expect(report).toContain('VERIFY staged drafts before any legacy delete');
		expect(report).toContain('BATCH UPDATE blog_posts status=published');
	});

	it('stages only the changed published row and preserves exact rows', () => {
		const state = exactState();
		const first = state.posts[0]!;
		first.title = 'stale title';
		first.excerpt = 'stale excerpt';
		first.body = {
			...first.body,
			blocks: first.body.blocks.slice(0, -1),
		};

		const plan = buildReplacementPlan(desired, state);
		const changed = plan.posts.find((entry) => entry.id === first.id)!;
		const report = formatReplacementPlan(plan);

		expect(plan.posts.filter((entry) => entry.action === 'update')).toHaveLength(1);
		expect(plan.posts.filter((entry) => entry.action === 'noop')).toHaveLength(5);
		expect(changed.scalarChanges.map((change) => change.field)).toEqual([
			'title',
			'excerpt',
		]);
		expect(changed.bodyChange?.beforeHash).toBe(hashBody(first.body));
		expect(changed.bodyChange?.afterHash).toBe(hashBody(desired[0]!.body));
		expect(report).toContain(`title: "stale title" -> ${JSON.stringify(desired[0]!.title)}`);
		expect(report).toContain(
			`body: blocks:${first.body.blocks.length} sha256:${hashBody(first.body)} -> blocks:${desired[0]!.body.blocks.length} sha256:${hashBody(desired[0]!.body)}`,
		);
	});

	it('matches junctions by post/tag pair, never by environment-specific integer ID', () => {
		const state = exactState();
		state.junctions = exactJunctions(50_000);
		const plan = buildReplacementPlan(desired, state);

		expect(plan.requiresWrite).toBe(false);
		expect(plan.junctions).toEqual({ create: [], update: [], delete: [] });
		expect(plan.finalPublish).toEqual([]);
	});

	it('resumes an interrupted staged draft by including it in the final publish', () => {
		const state = exactState();
		const interrupted = desired.find((post) => post.status === 'published')!;
		state.posts.find((post) => post.id === interrupted.id)!.status = 'draft';

		const plan = buildReplacementPlan(desired, state);

		expect(plan.requiresWrite).toBe(true);
		expect(plan.posts.find((entry) => entry.id === interrupted.id)?.action).toBe('noop');
		expect(plan.finalPublish).toEqual([interrupted.id]);
	});

	it('reconciles missing, stale, duplicate, and mis-sorted desired-post junctions only', () => {
		const state = exactState();
		const post = desired[0]!;
		const keep = state.junctions.find(
			(row) => row.blog_posts_id === post.id && row.tags_id === post.tags[0],
		)!;
		keep.sort = 99;
		state.junctions.push({ ...keep, id: 88_888 });
		const missingTag = post.tags[1]!;
		state.junctions = state.junctions.filter(
			(row) => !(row.blog_posts_id === post.id && row.tags_id === missingTag),
		);
		state.junctions.push({
			id: 99_999,
			blog_posts_id: post.id,
			tags_id: 'stale-tag',
			sort: 8,
		});
		state.junctions.push({
			id: 100_000,
			blog_posts_id: 'unrelated-post',
			tags_id: 'leave-me-alone',
			sort: 0,
		});

		const plan = buildReplacementPlan(desired, state);

		expect(plan.junctions.update).toEqual([
			{ id: keep.id, blog_posts_id: post.id, tags_id: post.tags[0]!, beforeSort: 99, sort: 0 },
		]);
		expect(plan.junctions.create).toContainEqual({
			blog_posts_id: post.id,
			tags_id: missingTag,
			sort: 1,
		});
		expect(plan.junctions.delete.map((row) => row.id).sort((a, b) => a - b)).toEqual(
			[88_888, 99_999].sort((a, b) => a - b),
		);
		expect(plan.junctions.delete.some((row) => row.id === 100_000)).toBe(false);
		expect(plan.finalPublish).toEqual([desired[0]!.id]);
	});

	it('adds one published deploy touch when only a legacy row remains', () => {
		const state = exactState();
		state.posts.push(legacyRows()[0]!);

		const plan = buildReplacementPlan(desired, state);
		const report = formatReplacementPlan(plan);

		expect(plan.posts.every((entry) => entry.action === 'noop')).toBe(true);
		expect(plan.deleteLegacy).toEqual([LEGACY_BLOG_IDS[0]]);
		expect(plan.finalPublish).toEqual([desired[0]!.id]);
		expect(report).toContain(`${desired[0]!.id}: published -> published`);
	});

	it('is a complete no-op after the desired six, bodies, tags, and statuses match', () => {
		const plan = buildReplacementPlan(desired, exactState());

		expect(plan.requiresWrite).toBe(false);
		expect(plan.posts.every((entry) => entry.action === 'noop')).toBe(true);
		expect(plan.tags).toEqual({ create: [], update: [] });
		expect(plan.junctions).toEqual({ create: [], update: [], delete: [] });
		expect(plan.deleteLegacy).toEqual([]);
		expect(plan.finalPublish).toEqual([]);
		expect(formatReplacementPlan(plan)).toContain('NO CHANGES');
	});
});

describe('replace-blog-posts verification', () => {
	it('accepts timestamp-normalized exact state and environment-specific junction IDs', () => {
		expect(() => assertDesiredState(desired, exactState(), 'fixture')).not.toThrow();
	});

	it('fails closed on missing rows, body drift, tag drift, and a surviving legacy row', () => {
		const missing = exactState();
		missing.posts = missing.posts.slice(1);
		expect(() => assertDesiredState(desired, missing, 'fixture')).toThrow('missing desired row');

		const bodyDrift = exactState();
		bodyDrift.posts[0]!.body = { ...bodyDrift.posts[0]!.body, blocks: [] };
		expect(() => assertDesiredState(desired, bodyDrift, 'fixture')).toThrow('body mismatch');

		const tagDrift = exactState();
		tagDrift.junctions = tagDrift.junctions.slice(1);
		expect(() => assertDesiredState(desired, tagDrift, 'fixture')).toThrow('tag junction mismatch');

		const staleLegacy = exactState();
		staleLegacy.posts.push(legacyRows()[0]!);
		expect(() => assertDesiredState(desired, staleLegacy, 'fixture', true)).toThrow(
			'legacy row still exists',
		);
	});
});
