import { afterEach, describe, expect, it, vi } from 'vitest';

const env = vi.hoisted(() => ({ PUBLIC_PLAUSIBLE_DOMAIN: 'yesid.dev' }));
vi.mock('$app/env/public', () => env);

const { POST } = await import('./+server');

const pageview = { n: 'pageview', d: 'yesid.dev', u: 'https://yesid.dev/projects', r: null };

function call(
	body: unknown,
	url = 'https://yesid.dev/relay/e',
	headers: Record<string, string> = {},
	clientAddress = '203.0.113.7',
) {
	const request = new Request(url, {
		method: 'POST',
		headers: { 'Content-Type': 'text/plain', 'User-Agent': 'Agent/1.0', ...headers },
		body: JSON.stringify(body),
	});
	return POST({ request, getClientAddress: () => clientAddress } as Parameters<typeof POST>[0]);
}

afterEach(() => {
	vi.unstubAllGlobals();
	env.PUBLIC_PLAUSIBLE_DOMAIN = 'yesid.dev';
});

describe('POST /relay/e', () => {
	it('forwards a yesid.dev pageview to Plausible once, with the visitor address', async () => {
		const upstream = vi.fn(async () => new Response('ok', { status: 202 }));
		vi.stubGlobal('fetch', upstream);

		const response = await call(pageview);

		expect(response.status).toBe(202);
		expect(upstream).toHaveBeenCalledOnce();
		const [url, init] = upstream.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('https://plausible.io/api/event');
		expect(init.headers).toMatchObject({ 'X-Forwarded-For': '203.0.113.7', 'User-Agent': 'Agent/1.0' });
	});

	it('forwards the visitor address Cloudflare saw, not the Cloudflare server Vercel saw', async () => {
		const upstream = vi.fn(async () => new Response('ok', { status: 202 }));
		vi.stubGlobal('fetch', upstream);

		// Vercel reports the Cloudflare server that connected, here one of Cloudflare's ranges.
		await call(pageview, undefined, { 'CF-Connecting-IP': '198.51.100.23' }, '162.158.1.1');

		const [, init] = upstream.mock.calls[0] as unknown as [string, RequestInit];
		expect(init.headers).toMatchObject({ 'X-Forwarded-For': '198.51.100.23' });
	});

	it('ignores CF-Connecting-IP on a connection that did not come through Cloudflare', async () => {
		const upstream = vi.fn(async () => new Response('ok', { status: 202 }));
		vi.stubGlobal('fetch', upstream);

		await call(pageview, undefined, { 'CF-Connecting-IP': '198.51.100.23' });

		const [, init] = upstream.mock.calls[0] as unknown as [string, RequestInit];
		expect(init.headers).toMatchObject({ 'X-Forwarded-For': '203.0.113.7' });
	});

	it('answers 502 without a retry when Plausible fails', async () => {
		const upstream = vi.fn(async () => new Response('', { status: 500 }));
		vi.stubGlobal('fetch', upstream);

		expect((await call(pageview)).status).toBe(502);
		expect(upstream).toHaveBeenCalledOnce();
	});

	it.each([
		['another site, such as Transit', { ...pageview, d: 'transit.yesid.dev', u: 'https://transit.yesid.dev/' }],
		['a page on another host', { ...pageview, u: 'https://transit.yesid.dev/' }],
	])('refuses %s', async (_case, body) => {
		const upstream = vi.fn();
		vi.stubGlobal('fetch', upstream);

		expect((await call(body)).status).toBe(400);
		expect(upstream).not.toHaveBeenCalled();
	});

	it('is absent where measurement is off', async () => {
		env.PUBLIC_PLAUSIBLE_DOMAIN = '';
		const upstream = vi.fn();
		vi.stubGlobal('fetch', upstream);

		expect((await call(pageview)).status).toBe(404);
		expect(upstream).not.toHaveBeenCalled();
	});
});
