// The design system project moved from /projects/yesid-dev-design when its repository was renamed.
import { describe, it, expect } from 'vitest';
import { GET } from './+server';

type RedirectEvent = Parameters<typeof GET>[0];

const request = (lang?: string): RedirectEvent => ({ params: { lang } }) as RedirectEvent;

describe('renamed design system project redirect', () => {
	it.each([
		[undefined, '/projects/yesid-design'],
		['fr', '/fr/projects/yesid-design'],
		['es', '/es/projects/yesid-design'],
	])('301s the %s path to %s with the edge cache', async (lang, location) => {
		const res = await GET(request(lang));
		expect(res.status).toBe(301);
		expect(res.headers.get('location')).toBe(location);
		expect(res.headers.get('cache-control')).toBe('public, s-maxage=86400');
	});
});
