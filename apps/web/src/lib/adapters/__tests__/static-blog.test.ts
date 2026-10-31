import { describe, expect, it } from 'vitest';

import { staticAdapter } from '#lib/adapters/static.ts';
import { blogPosts } from '#lib/content/blog.ts';
import { blogBodies } from '#lib/content/blog-bodies.ts';
import { footerLinks } from '#lib/content/nav.ts';
import {
	BlockEditorDocSchema,
	BlogPageContentSchema,
	ProjectsPageContentSchema,
} from '@repo/shared';

// Localized prose must not contain a JSON-encoded LocalizedString.
function expectCleanLocalizedString(value: unknown): void {
	expect(value && typeof value === 'object').toBe(true);
	for (const v of Object.values(value as Record<string, unknown>)) {
		expect(typeof v).toBe('string');
		const s = v as string;
		expect(s.length).toBeGreaterThan(0);
		// Must not be a JSON-stringified object/array (i.e. not double-encoded).
		const trimmed = s.trimStart();
		if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
			expect(() => {
				const parsed = JSON.parse(s);
				if (parsed && typeof parsed === 'object') {
					throw new Error(`intro leaf is a JSON-encoded object: ${s}`);
				}
			}).not.toThrow();
		}
	}
}

// Derive fixtures from the generated content so these tests self-update when the
// CMS content changes rather than rotting against a hardcoded slug.
const slugWithBody = Object.keys(blogBodies)[0]!;
const postWithFallbackSvg = blogPosts.find((p) => p.svg && p.svg !== '__custom__');

describe('staticAdapter.blog.bodyBySlug — mirrors directus shape', () => {
	it('returns a valid non-null BlockEditorDoc for a real slug', async () => {
		const body = await staticAdapter.blog.bodyBySlug(slugWithBody);
		expect(body).not.toBeNull();
		// Same validation the directus adapter applies (parsePort + BlockEditorDocSchema).
		expect(() => BlockEditorDocSchema.parse(body)).not.toThrow();
		expect(body!.blocks.length).toBeGreaterThan(0);
		expect(typeof body!.time).toBe('number');
		expect(typeof body!.version).toBe('string');
	});

	it('returns null for an unknown slug (directus returns null when no row/body)', async () => {
		expect(await staticAdapter.blog.bodyBySlug('__does-not-exist__')).toBeNull();
	});
});

describe('staticAdapter.blog.svgContent / svgContentsForPosts — non-empty SVG markup', () => {
	it('returns non-empty SVG markup for a post with a fallback illustration', async () => {
		expect(postWithFallbackSvg).toBeDefined();
		const svg = await staticAdapter.blog.svgContent(postWithFallbackSvg!);
		expect(svg.length).toBeGreaterThan(0);
		expect(svg).toContain('<svg');
	});

	it('svgContentsForPosts returns a slug-keyed record of the same SVG markup', async () => {
		const posts = blogPosts.slice(0, 3);
		const map = await staticAdapter.blog.svgContentsForPosts(posts);
		for (const post of posts) {
			expect(map).toHaveProperty(post.slug);
			// Per-post value matches the single-post resolver exactly.
			expect(map[post.slug]).toBe(await staticAdapter.blog.svgContent(post));
		}
	});
});

describe('staticAdapter.content.blogPage — full schema shape, clean intro (slice-27.1 T4)', () => {
	it('returns the full schema shape', async () => {
		const page = await staticAdapter.content.blogPage();
		expect(() => BlogPageContentSchema.parse(page)).not.toThrow();
	});

	it('intro is a clean LocalizedString, not a JSON-encoded string', async () => {
		const page = await staticAdapter.content.blogPage();
		expectCleanLocalizedString(page.intro);
		// Spot-check the actual prose so a future double-encode (`{"en":"…"}`)
		// fails loudly rather than silently passing the structural guard.
		expect(page.intro.en).not.toMatch(/^\{"en"/);
		expect(page.intro.en.length).toBeGreaterThan(0);
	});
});

describe('staticAdapter.content.projectsPage — full schema shape, clean intro (slice-27.1 T4)', () => {
	it('returns the schema shape and a clean (non-JSON-string) intro', async () => {
		const page = await staticAdapter.content.projectsPage();
		expect(() => ProjectsPageContentSchema.parse(page)).not.toThrow();
		expectCleanLocalizedString(page.intro);
		expect(page.intro.en).not.toMatch(/^\{"en"/);
		expect(page.intro.en.length).toBeGreaterThan(0);
	});
});

describe('staticAdapter.nav.byPlacement — footer matches generated module (slice-27.1 T7)', () => {
	// Network-free: staticAdapter reads from the generated nav.ts content module.
	// These confirm that footer no longer silently returns [] and that the
	// generated arrays are the exact source of truth the adapter passes through.

	it('footer returns a non-empty array matching the generated footerLinks', async () => {
		const result = await staticAdapter.nav.byPlacement('footer');
		expect(result.length).toBeGreaterThan(0);
		expect(result).toEqual(footerLinks);
	});

	it('header still returns navLinks (no regression)', async () => {
		const { navLinks } = await import('#lib/content/nav.ts');
		const result = await staticAdapter.nav.byPlacement('header');
		expect(result).toEqual(navLinks);
	});

	it('menu still returns menuItems (no regression)', async () => {
		const { menuItems } = await import('#lib/content/nav.ts');
		const result = await staticAdapter.nav.byPlacement('menu');
		expect(result).toEqual(menuItems);
	});
});
