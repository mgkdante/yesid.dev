import { describe, it, expect } from 'vitest';
import { GET as redirect0 } from './one-brain-for-five-ai-tools-t3-code-and-notion/+server';
import { GET as redirect1 } from './un-seul-cerveau-pour-cinq-outils-dia-t3-code-et-notion/+server';
import { GET as redirect2 } from './un-solo-cerebro-para-cinco-herramientas-de-ia-t3-code-y-notion/+server';
// Exercise the fixture through the same catalog consumers used at build time.
import { catalog } from '#lib/catalog/index.ts';
import { blogEntries, ogBlogRows } from '#lib/server/prerender-entries.ts';
import { llmsTxt, llmsFullTxt } from '#lib/server/llms.ts';
import { _buildSitemapEntries } from '../../sitemap.xml/+server';

describe('renamed four AI tools article redirects', () => {
	it.each([redirect0, redirect1, redirect2])('redirects each legacy slug in every locale', async (get) => {
		for (const [lang, location] of [
			[undefined, '/blog/one-brain-for-four-ai-tools-t3-code-and-notion'],
			['fr', '/fr/blog/un-seul-cerveau-pour-quatre-outils-dia-t3-code-et-notion'],
			['es', '/es/blog/un-solo-cerebro-para-cuatro-herramientas-de-ia-t3-code-y-notion'],
		] as const) {
			const response = await get({ params: { lang } } as Parameters<typeof get>[0]);
			expect(response.status).toBe(301);
			expect(response.headers.get('location')).toBe(location);
			expect(response.headers.get('cache-control')).toBe('public, s-maxage=86400');
		}
	});
});

it('publishes the renamed translations, bodies and crawler/OG URLs together', async () => {
	const posts = catalog.blog.all().filter(
		(post) => post.translationKey === 'one-brain-for-five-ai-tools-t3-code-and-notion',
	);
	expect(posts).toHaveLength(3);
	const sitemap = (await _buildSitemapEntries()).join('');
	for (const post of posts) {
		const prefix = post.lang === 'en' ? '' : `/${post.lang}`;
		const url = `https://yesid.dev${prefix}/blog/${post.slug}`;
		expect(post.slug).not.toMatch(/five|cinq|cinco/);
		expect(await catalog.blog.bodyBySlug(post.slug)).toBeTruthy();
		expect(blogEntries()).toContainEqual({ lang: post.lang === 'en' ? '' : post.lang, slug: post.slug });
		expect(ogBlogRows()).toContainEqual({ locale: post.lang, slug: post.slug });
		expect(sitemap).toContain(url);
		expect(llmsTxt()).toContain(url);
		expect(llmsFullTxt()).toContain(url);
	}
	for (const oldSlug of [
		'one-brain-for-five-ai-tools-t3-code-and-notion',
		'un-seul-cerveau-pour-cinq-outils-dia-t3-code-et-notion',
		'un-solo-cerebro-para-cinco-herramientas-de-ia-t3-code-y-notion',
	]) {
		expect(sitemap).not.toContain(`/blog/${oldSlug}`);
		expect(llmsTxt()).not.toContain(`/blog/${oldSlug}`);
		expect(llmsFullTxt()).not.toContain(`/blog/${oldSlug}`);
		expect(ogBlogRows().some((row) => row.slug === oldSlug)).toBe(false);
	}
});
