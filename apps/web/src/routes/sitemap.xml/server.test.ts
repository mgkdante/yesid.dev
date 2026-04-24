import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('GET /sitemap.xml', () => {
	async function fetchBody() {
		const response = await GET({} as Parameters<typeof GET>[0]);
		return {
			status: response.status,
			body: await response.text(),
			contentType: response.headers.get('content-type'),
		};
	}

	it('returns 200 with XML content-type', async () => {
		const { status, contentType } = await fetchBody();
		expect(status).toBe(200);
		expect(contentType).toMatch(/application\/xml/);
	});

	it('includes every static public route', async () => {
		const { body } = await fetchBody();
		for (const path of [
			'/',
			'/about',
			'/contact',
			'/services',
			'/projects',
			'/blog',
			'/blog/personal',
			'/tech-stack',
		]) {
			const canonical = path === '/' ? 'https://yesid.dev' : `https://yesid.dev${path}`;
			expect(body, `missing ${canonical}`).toContain(`<loc>${canonical}</loc>`);
		}
	});

	it('includes dynamic blog routes for every published post', async () => {
		const { adapter } = await import('$lib/adapters');
		const posts = await adapter.blog.all();
		const { body } = await fetchBody();
		for (const post of posts) {
			expect(body, `missing blog post ${post.slug}`).toContain(
				`<loc>https://yesid.dev/blog/${post.slug}</loc>`,
			);
		}
	});

	it('excludes the __error pseudo-route', async () => {
		const { body } = await fetchBody();
		expect(body).not.toContain('__error');
	});

	it('emits xhtml:link hreflang for every published locale', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('xmlns:xhtml="http://www.w3.org/1999/xhtml"');
		expect(body).toContain('<xhtml:link rel="alternate" hreflang="en"');
	});

	it('is well-formed XML', async () => {
		const { body } = await fetchBody();
		expect(body.startsWith('<?xml')).toBe(true);
		expect(body).toContain('</urlset>');
	});
});
