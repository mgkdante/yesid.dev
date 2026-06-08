// Static adapter — blog method shape tests (slice-27.1 Task T3).
//
// Network-free, CI-runnable companion to the parity harness (parity.harness.test.ts,
// which is opt-in via RUN_PARITY and hits live Directus). These tests assert that
// the three static blog methods fixed in T3 — bodyBySlug, html, svgContent /
// svgContentsForPosts — return the SAME shapes the directus adapter produces,
// using the committed CMS-derived content modules (no Directus round-trip).
//
// Runs in the "data" Vitest project (Node env, $env stubbed to {}). The static
// adapter never touches the network, so importing it directly is safe here.

import { describe, expect, it } from 'vitest';

import { staticAdapter } from '$lib/adapters/static';
import { blogPosts } from '$lib/content/blog';
import { blogBodies } from '$lib/content/blog-bodies';
import { BlockEditorDocSchema, serializeBlocksToHtml } from '@repo/shared';

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
