import { describe, expect, it } from 'vitest';
import { GET } from './+server';

describe('retired tech-stack redirect', () => {
	it.each([
		[undefined, '/services'],
		['fr', '/fr/services'],
		['es', '/es/services'],
	])('redirects locale %s to %s with edge cache', async (lang, location) => {
		const response = await GET({ params: { lang } } as Parameters<typeof GET>[0]);
		expect(response.status).toBe(301);
		expect(response.headers.get('location')).toBe(location);
		expect(response.headers.get('cache-control')).toBe('public, s-maxage=86400');
	});
});
