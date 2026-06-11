// Static adapter — blog method shape tests (slice-27.1 Task T3).
//
// Network-free, CI-runnable shape coverage. Born as the companion to the
// RUN_PARITY harness (parity.harness.test.ts — deleted at slice-26 close
// after Directus 12 passed it on both environments); now the canonical
// suite for the three static blog methods fixed in T3 — bodyBySlug, html,
// svgContent / svgContentsForPosts — asserting they keep the shapes the
// retired directus adapter produced, using the committed CMS-derived
// content modules (no network).
//
// Runs in the "data" Vitest project (Node env, $env stubbed to {}). The static
// adapter never touches the network, so importing it directly is safe here.

import { describe, expect, it } from 'vitest';

import { staticAdapter } from '$lib/adapters/static';
import { blogPosts } from '$lib/content/blog';
import { blogBodies } from '$lib/content/blog-bodies';
import { footerLinks, mobileLinks } from '$lib/content/nav';
import {
	BlockEditorDocSchema,
	BlogPageContentSchema,
	ProjectsPageContentSchema,
	serializeBlocksToHtml,
} from '@repo/shared';

// A LocalizedString leaf is "clean" when no locale value is itself a
// JSON-encoded LocalizedString — the slice-27.1 T4 double-encoding bug stored
// the literal text `{"en":"…"}` in the `intro` column. Guard against any
// regression that re-introduces a stringified object where prose belongs.
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

describe('staticAdapter.blog.html — serializeBlocksToHtml(body), not the legacy markdown path', () => {
	it('returns HTML equal to serializeBlocksToHtml of the post body', async () => {
		const html = await staticAdapter.blog.html(slugWithBody);
		const body = await staticAdapter.blog.bodyBySlug(slugWithBody);
		expect(body).not.toBeNull();
		expect(html).toBe(serializeBlocksToHtml(body!));
	});

	it('produces block-HTML serialization (no <h1> title prefix; headings carry id attrs)', async () => {
		const html = await staticAdapter.blog.html(slugWithBody);
		expect(html.length).toBeGreaterThan(0);
		// The legacy markdown bridge prefixed an <h1> title and emitted id-less
		// headings. The block serializer never prefixes an <h1> and ids every
		// header. Assert the divergent legacy markers are gone.
		expect(html.startsWith('<h1>')).toBe(false);
		// If the body has any header block, the serialized output must include an
		// id attribute on a heading tag (directus parity behaviour).
		const hasHeader = blogBodies[slugWithBody]!.blocks.some((b) => b.type === 'header');
		if (hasHeader) {
			expect(html).toMatch(/<h[1-6] id="/);
		}
	});

	it('returns empty string for an unknown slug', async () => {
		expect(await staticAdapter.blog.html('__does-not-exist__')).toBe('');
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
	it('returns all schema-required keys (heading / backToDispatches / backToPersonal / intro)', async () => {
		const page = await staticAdapter.content.blogPage();
		// Full schema parse — the prior inline stub was missing heading +
		// backToDispatches + backToPersonal and would S-ERR here.
		expect(() => BlogPageContentSchema.parse(page)).not.toThrow();
		expect(page.intro).toBeDefined();
		expect(page.heading).toBeDefined();
		expect(page.backToDispatches).toBeDefined();
		expect(page.backToPersonal).toBeDefined();
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

describe('staticAdapter.nav.byPlacement — footer + mobile match generated module (slice-27.1 T7)', () => {
	// Network-free: staticAdapter reads from the generated nav.ts content module.
	// These confirm that footer/mobile no longer silently return [] and that the
	// generated arrays are the exact source of truth the adapter passes through.

	it('footer returns a non-empty array matching the generated footerLinks', async () => {
		const result = await staticAdapter.nav.byPlacement('footer');
		expect(result.length).toBeGreaterThan(0);
		expect(result).toEqual(footerLinks);
	});

	it('mobile returns a non-empty array matching the generated mobileLinks', async () => {
		const result = await staticAdapter.nav.byPlacement('mobile');
		expect(result.length).toBeGreaterThan(0);
		expect(result).toEqual(mobileLinks);
	});

	it('header still returns navLinks (no regression)', async () => {
		const { navLinks } = await import('$lib/content/nav');
		const result = await staticAdapter.nav.byPlacement('header');
		expect(result).toEqual(navLinks);
	});

	it('menu still returns menuItems (no regression)', async () => {
		const { menuItems } = await import('$lib/content/nav');
		const result = await staticAdapter.nav.byPlacement('menu');
		expect(result).toEqual(menuItems);
	});
});
