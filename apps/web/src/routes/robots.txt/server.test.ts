import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { GET } from './+server';

function fingerprint(body: string) {
	return {
		bytes: Buffer.byteLength(body),
		sha256: createHash('sha256').update(body).digest('hex'),
	};
}

describe('GET /robots.txt', () => {
	async function fetchBody(hostname = 'yesid.dev') {
		const response = await GET({
			url: new URL(`https://${hostname}/robots.txt`),
		} as Parameters<typeof GET>[0]);
		return {
			status: response.status,
			body: await response.text(),
			contentType: response.headers.get('content-type'),
			cacheControl: response.headers.get('cache-control'),
			robotsTag: response.headers.get('x-robots-tag'),
		};
	}

	it('returns 200 text/plain', async () => {
		const { status, contentType } = await fetchBody();
		expect(status).toBe(200);
		expect(contentType).toMatch(/text\/plain/);
	});

	it('edge-caches a day with a week of SWR (slice-28.1, audit #18)', async () => {
		const { cacheControl } = await fetchBody();
		expect(cacheControl).toBe(
			'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
		);
	});

	it('allows everything by default', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('User-agent: *');
		expect(body).toContain('Allow: /');
	});

	it('has no Disallow rules — /preview never shipped (slice-28.2)', async () => {
		const { body } = await fetchBody();
		expect(body).not.toContain('Disallow:');
	});

	it('references the sitemap with absolute URL', async () => {
		const { body } = await fetchBody();
		expect(body).toContain('Sitemap: https://yesid.dev/sitemap.xml');
	});

	it('locks the exact production bytes across design-package adoption', async () => {
		const { body } = await fetchBody();
		expect(fingerprint(body)).toEqual({
			bytes: 176,
			sha256: 'd355daa2c32d8f7f8cde67567c4aa85a072b740c2561040881f2c7765eb98f7f',
		});
	});

	it('blocks every crawler and omits the production sitemap on non-production hosts', async () => {
		const { body, cacheControl, robotsTag } = await fetchBody('dev.yesid.dev');
		expect(body).toBe('User-agent: *\nDisallow: /\n');
		expect(body).not.toContain('Allow:');
		expect(body).not.toContain('Sitemap:');
		expect(cacheControl).toBe('no-store');
		expect(robotsTag).toBe('noindex, nofollow, noarchive');
	});

	it('locks the exact non-production bytes across design-package adoption', async () => {
		const { body } = await fetchBody('dev.yesid.dev');
		expect(fingerprint(body)).toEqual({
			bytes: 26,
			sha256: '331ea9090db0c9f6f597bd9840fd5b171830f6e0b3ba1cb24dfa91f0c95aedc1',
		});
	});
});
