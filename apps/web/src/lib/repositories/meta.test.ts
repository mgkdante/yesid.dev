import { describe, expect, it } from 'vitest';
import { getPageSeo } from './meta';
import { adapter } from '$lib/adapters';

describe('getPageSeo', () => {
	it('delegates to the adapter and returns a parsed PageSeo for /about', async () => {
		const seo = await getPageSeo('/about', 'en');
		expect(seo.title.en).toMatch(/About/);
		expect(seo.canonical).toBe('https://yesid.dev/about');
	});

	it('forwards params for dynamic routes', async () => {
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const first = posts[0];
		const seo = await getPageSeo('/blog/[slug]', 'en', { slug: first.slug });
		expect(seo.canonical).toContain(first.slug);
	});

	it('propagates unknown-route errors from the adapter', async () => {
		await expect(getPageSeo('/nope', 'en')).rejects.toThrow(/Unknown route id/);
	});
});
