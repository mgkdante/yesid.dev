import { describe, it, expect } from 'bun:test';
import postsFixture from '../fixtures/collections/blog-posts.json' with { type: 'json' };
import illustrationsFixture from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { z } from 'zod';
import { BlockEditorDocSchema } from '@repo/shared';
import { createHash } from 'node:crypto';

// AM2.5: blog_posts is mono-language. Flat `title` + `excerpt` on parent.
// No `blog_posts_translations` collection; no `translations` array.
// AM1: body is Editor.js { time, blocks, version }, validated via BlockEditorDocSchema.
//
// NOTE: BlockEditorDocSchema is typed as z.ZodType<BlockEditorDoc> (opaque wrapper)
// to enable the recursive NestedListItemSchema. Zod v3 cannot embed an opaque
// ZodType as a field inside z.object() — the internal _parse dispatch breaks.
// We use z.unknown() for the body field here, then validate each body separately
// via BlockEditorDocSchema.safeParse() in the dedicated per-body test below.
const BlogPostFixtureSchema = z.array(z.object({
	id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	translation_key: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
	status: z.enum(['draft', 'published', 'archived']),
	date_published: z.string().nullable(),
	date_modified: z.string().nullable().optional(),
	sort: z.number().int().min(0),
	lang: z.enum(['en', 'fr', 'es']),
	category: z.enum(['professional', 'personal']),
	tags: z.array(z.string()),
	external: z.boolean(),
	url: z.string().nullable(),
	cover_image_legacy_path: z.string().nullable(),
	svg_illustration_id: z.string().nullable(),
	animation: z.enum(['draw', 'morph', 'draw-fill']),
	title: z.string().min(1),
	excerpt: z.string().min(1).max(500),
	seo_title: z.string().min(1).max(60).nullable().optional(),
	seo_description: z.string().min(50).max(200).nullable().optional(),
	body: z.unknown(),
}));

type FixturePost = z.infer<typeof BlogPostFixtureSchema>[number] & {
	body: { blocks: Array<{ id: string; type: string; data: { text?: string; level?: number } }> };
};

const ENGLISH_SOURCE_HASHES: Record<string, string> = {
	'the-two-hour-internet-slot': '51cc7bcb93f83a2791666d652a47191f7ec376f267b6081ec0652475e9e4c8bd',
	'how-i-learn-orbiting-a-system-until-it-clicks': '9b932277621f7bedddf0884c98ef42ec4e9af1209ef3155fe7547b756d96a1d2',
	'thinking-in-matrices': 'efdd047f2732157c362b10ce909074dfc4c9c21888999508492faaadec610f59',
	'ai-accelerated-human-owned-my-actual-workflow': '800caba1bc3720020b8b80ef450f4256b61b42510a938937bab8265e7cc70033',
	'50-to-0-an-oracle-always-free-vm': 'a6b38d4716664f736f168491b7cbd817332386d7c0aefd72051a47732293c058',
	'does-your-website-need-instant-publishing': '393e82eb5588dd3575f044fc59608894a194c961b97b4340c07ff336dff2bbff',
};

function sortJson(value: unknown): unknown {
	if (Array.isArray(value)) return value.map(sortJson);
	if (!value || typeof value !== 'object') return value;
	return Object.fromEntries(
		Object.entries(value as Record<string, unknown>)
			.sort(([left], [right]) => left.localeCompare(right))
			.map(([key, nested]) => [key, sortJson(nested)]),
	);
}

function sourceHash(post: FixturePost): string {
	const { translation_key: _translationKey, ...sourceProjection } = post;
	return createHash('sha256')
		.update(`${JSON.stringify(sortJson(sourceProjection))}\n`)
		.digest('hex');
}

function hrefs(post: FixturePost): string[] {
	return post.body.blocks.flatMap((block) =>
		[...(block.data.text ?? '').matchAll(/href="([^"]+)"/g)].map((match) => match[1]!),
	);
}

function translationGroups(posts: readonly FixturePost[]): Map<string, FixturePost[]> {
	const groups = new Map<string, FixturePost[]>();
	for (const post of posts) {
		const group = groups.get(post.translation_key) ?? [];
		group.push(post);
		groups.set(post.translation_key, group);
	}
	return groups;
}

describe('apps/cms/fixtures/collections/blog-posts.json', () => {
	it('parses through BlogPostFixtureSchema', () => {
		const result = BlogPostFixtureSchema.safeParse(postsFixture);
		if (!result.success) console.error(JSON.stringify(result.error.issues, null, 2));
		expect(result.success).toBe(true);
	});

	it('mirrors real posts only (Homework #15): non-empty, no lorem', () => {
		expect(postsFixture.length).toBeGreaterThanOrEqual(1);
		const loremIds = (postsFixture as Array<{ id: string }>)
			.map((p) => p.id)
			.filter((id) => id.startsWith('lorem-'));
		expect(loremIds).toEqual([]);
	});

	it('contains exactly six complete EN/FR/ES translation groups', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture) as FixturePost[];
		expect(posts).toHaveLength(18);
		expect(new Set(posts.map((post) => post.id)).size).toBe(18);
		const groups = translationGroups(posts);
		expect(groups.size).toBe(6);
		for (const [translationKey, group] of groups) {
			expect(group.map((post) => post.lang).sort()).toEqual(['en', 'es', 'fr']);
			expect(new Set(group.map((post) => post.lang)).size).toBe(3);
			expect(group.find((post) => post.lang === 'en')?.id).toBe(translationKey);
		}
	});

	it('keeps every shipped English source projection byte-locked', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture) as FixturePost[];
		const english = posts.filter((post) => post.lang === 'en');
		expect(english).toHaveLength(6);
		for (const post of english) {
			expect(sourceHash(post)).toBe(ENGLISH_SOURCE_HASHES[post.id]);
		}
	});

	it('keeps invariant metadata and body structure aligned within each group', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture) as FixturePost[];
		for (const group of translationGroups(posts).values()) {
			const source = group.find((post) => post.lang === 'en')!;
			for (const translation of group.filter((post) => post.lang !== 'en')) {
				expect({
					status: translation.status,
					date_published: translation.date_published,
					date_modified: translation.date_modified,
					sort: translation.sort,
					category: translation.category,
					tags: translation.tags,
					external: translation.external,
					url: translation.url,
					cover_image_legacy_path: translation.cover_image_legacy_path,
					svg_illustration_id: translation.svg_illustration_id,
					animation: translation.animation,
				}).toEqual({
					status: source.status,
					date_published: source.date_published,
					date_modified: source.date_modified,
					sort: source.sort,
					category: source.category,
					tags: source.tags,
					external: source.external,
					url: source.url,
					cover_image_legacy_path: source.cover_image_legacy_path,
					svg_illustration_id: source.svg_illustration_id,
					animation: source.animation,
				});
				expect(translation.body.blocks.map((block) => block.type)).toEqual(
					source.body.blocks.map((block) => block.type),
				);
				expect(
					translation.body.blocks.map((block) => block.data.level ?? null),
				).toEqual(source.body.blocks.map((block) => block.data.level ?? null));
			}
		}
	});

	it('uses locale-owned block ids and remaps only internal series links', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture) as FixturePost[];
		for (const group of translationGroups(posts).values()) {
			const source = group.find((post) => post.lang === 'en')!;
			const sourceExternalLinks = hrefs(source).filter((href) => /^https?:\/\//.test(href));
			for (const translation of group.filter((post) => post.lang !== 'en')) {
				for (const block of translation.body.blocks) {
					expect(block.id).toMatch(new RegExp(`^ch\\d+-${translation.lang}-`));
				}
				const translatedHrefs = hrefs(translation);
				expect(translatedHrefs.filter((href) => /^https?:\/\//.test(href))).toEqual(sourceExternalLinks);
				for (const href of translatedHrefs.filter((value) => value.startsWith('/'))) {
					expect(href).toMatch(new RegExp(`^/${translation.lang}/blog/`));
				}
			}
		}
	});

	it('every svg_illustration_id (when set) exists in illustrations fixture', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		const ids = new Set(illustrationsFixture.map((i: { id: string }) => i.id));
		for (const p of posts) {
			if (p.svg_illustration_id) {
				expect(ids.has(p.svg_illustration_id)).toBe(true);
			}
		}
	});

	it('external posts have url; non-external posts have null url', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture);
		for (const p of posts) {
			if (p.external) expect(p.url).toBeTruthy();
			else expect(p.url).toBeNull();
		}
	});

	it('non-external posts have non-empty body.blocks', () => {
		for (const p of postsFixture as Array<{ external: boolean; body: { blocks: unknown[] } }>) {
			if (!p.external) expect(p.body.blocks.length).toBeGreaterThan(0);
		}
	});

	it('every body parses through BlockEditorDocSchema', () => {
		for (const p of postsFixture) {
			const result = BlockEditorDocSchema.safeParse(p.body);
			expect(result.success).toBe(true);
		}
	});
});
