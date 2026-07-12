import { describe, it, expect } from 'bun:test';
import postsFixture from '../fixtures/collections/blog-posts.json' with { type: 'json' };
import illustrationsFixture from '../fixtures/collections/illustrations.json' with { type: 'json' };
import { z } from 'zod';
import { BlockEditorDocSchema } from '@repo/shared';
import { createHash } from 'node:crypto';
import { BLOG_EDITORIAL_FAMILIES } from '../scripts/reconcile-blog-editorial-dates';

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
	'the-two-hour-internet-slot': 'dedcaa2a66fa921a994c61ded5ad322b8da653ae52fcd82195b533db156f9438',
	'how-i-learn-orbiting-a-system-until-it-clicks': '858042d819110946a08a6695c2ee969fdfcebca1e1ea7c827d761b65ded4ed9c',
	'thinking-in-matrices': '2d48da3166b95d2e85dea351bbd09c2ae7114e7ee3ee93dafcccb526660d0ab2',
	'ai-accelerated-human-owned-my-actual-workflow': '8d974a616f9802d30b8e2b83ff4792cec11aa5a92edf0dc49e3f16228081476a',
	'50-to-0-an-oracle-always-free-vm': 'f2fdb8a3fe345755c703069fb93bb8ae0335c61fe65e2a4b2d0e432ff0f718e3',
	'does-your-website-need-instant-publishing': 'ef5ca8e575a59087845c0aa1bdc07e89d6d31b6bd770388604f235eab730413a',
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
	const {
		translation_key: _translationKey,
		date_published: _operatorOwnedEditorialDate,
		...sourceProjection
	} = post;
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

	it('matches the approved editorial date in every EN/FR/ES family', () => {
		const posts = BlogPostFixtureSchema.parse(postsFixture) as FixturePost[];
		const expectedDates = new Map(
			BLOG_EDITORIAL_FAMILIES.map((family) => [family.translationKey, family.date]),
		);
		for (const post of posts) {
			expect(post.date_published).toBe(expectedDates.get(post.translation_key));
		}
	});

	it('keeps every shipped English content projection byte-locked', () => {
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
