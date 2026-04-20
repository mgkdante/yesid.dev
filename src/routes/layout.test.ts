import { describe, expect, it } from 'vitest';
import { load } from './+layout';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';

function fakeEvent(routeId: string | null, params: Record<string, string> = {}) {
	return {
		route: { id: routeId },
		params,
		url: new URL(`https://yesid.dev${routeId ?? '/'}`),
	} as unknown as Parameters<typeof load>[0];
}

describe('+layout.ts load', () => {
	it('returns seo for the home route', async () => {
		const result = await load(fakeEvent('/'));
		expect(result.seo.title.en).toMatch(/yesid/);
		expect(result.seo.canonical).toBe('https://yesid.dev');
	});

	it('returns seo for a static nested route', async () => {
		const result = await load(fakeEvent('/about'));
		expect(result.seo.title.en).toMatch(/About/);
	});

	it('passes params through to the adapter for dynamic routes', async () => {
		const { adapter } = await import('$lib/adapters');
		const posts = await adapter.blog.all();
		if (posts.length === 0) return;
		const first = posts[0];
		const result = await load(fakeEvent('/blog/[slug]', { slug: first.slug }));
		expect(result.seo.canonical).toContain(first.slug);
	});

	it('falls back to the error entry when route.id is null', async () => {
		const result = await load(fakeEvent(null));
		expect(result.seo.noIndex).toBe(true);
	});

	it('falls back to the error entry on unknown route ids', async () => {
		const result = await load(fakeEvent('/not-a-real-route'));
		expect(result.seo.noIndex).toBe(true);
	});

	it('uses DEFAULT_LOCALE', () => {
		expect(DEFAULT_LOCALE).toBe('en');
	});
});
