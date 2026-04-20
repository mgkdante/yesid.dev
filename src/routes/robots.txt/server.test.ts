import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('GET /robots.txt', () => {
	async function fetchBody() {
		const response = await GET({} as Parameters<typeof GET>[0]);
		return {
			status: response.status,
			body: await response.text(),
			contentType: response.headers.get('content-type'),
		};
	}

	it('returns 200 text/plain', async () => {
		const { status, contentType } = await fetchBody();
		expect(status).toBe(200);
		expect(contentType).toMatch(/text\/plain/);
	});

	it('allows everything by default', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('User-agent: *');
		expect(body).toContain('Allow: /');
	});

	it('disallows /preview (Slice 18 Payload draft route)', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('Disallow: /preview');
	});

	it('references the sitemap with absolute URL', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('Sitemap: https://yesid.dev/sitemap.xml');
	});
});
