import { describe, expect, it, vi } from 'vitest';

vi.mock('$app/env', () => ({ dev: false, building: false, browser: true }));
vi.mock('$app/env/public', () => ({ PUBLIC_PLAUSIBLE_DOMAIN: 'yesid.dev' }));
const createAnalytics = vi.hoisted(() => vi.fn(() => ({ trackEvent: vi.fn() })));
vi.mock('@yesid/analytics/client', async (original) => ({
	...(await original<typeof import('@yesid/analytics/client')>()),
	createAnalytics,
}));

const { reduceVercelEvent, startAnalytics } = await import('./client');

describe('startAnalytics', () => {
	it('starts one tracker for yesid.dev, sending through the relay, however often it is called', () => {
		startAnalytics();
		startAnalytics();

		expect(createAnalytics).toHaveBeenCalledOnce();
		expect(createAnalytics).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({ domain: 'yesid.dev', endpoint: '/relay/e' }),
		);
	});
});

describe('reduceVercelEvent', () => {
	it('keeps the path and campaign tags, dropping filters and the hash', () => {
		expect(reduceVercelEvent({ type: 'pageview', url: 'https://yesid.dev/fr/projects?stack=sql&utm_source=news#top' }))
			.toEqual({ type: 'pageview', url: 'https://yesid.dev/fr/projects?utm_source=news' });
	});

	it('resolves a relative URL against the page origin', () => {
		expect(reduceVercelEvent({ type: 'vital', url: '/contact?email=a@b.c', route: '/contact' }))
			.toEqual({ type: 'vital', url: `${location.origin}/contact`, route: '/contact' });
	});
});
