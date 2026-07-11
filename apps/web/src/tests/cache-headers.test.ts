// cache-headers.test.ts — pins the CDN cache headers set by handle() in
// src/hooks.server.ts (slice-28.4, audit #99).
//
// The hook is the single place the site's edge-caching contract lives:
//   - cache-control          (browser+shared, HTML pages only)
//   - cdn-cache-control      (CDN tier, HTML + __data.json)
//   - vercel-cdn-cache-control (Vercel CDN tier, HTML + __data.json)
// gated to GET + 200 responses. These exact values were tuned in slice-27.2
// (s-maxage 86400 / stale-while-revalidate 604800) — a silent regression here
// changes prod CDN behaviour with no other test noticing.
//
// Node-tier test: stubs resolve() with canned Responses; no server, no DOM.

import { describe, it, expect } from 'vitest';
import type { RequestEvent } from '@sveltejs/kit';
import { handle } from '../hooks.server';

const PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=86400, stale-while-revalidate=604800';
const CDN_CACHE_CONTROL = 'max-age=86400, stale-while-revalidate=604800';

function makeEvent(
	opts: { method?: string; pathname?: string; hostname?: string } = {},
): RequestEvent {
	const url = new URL(`https://${opts.hostname ?? 'yesid.dev'}${opts.pathname ?? '/'}`);
	const event = {
		request: new Request(url, { method: opts.method ?? 'GET' }),
		url,
		locals: {} as App.Locals,
	};
	return event as unknown as RequestEvent;
}

function htmlResponse(status = 200): Response {
	return new Response('<!doctype html><html></html>', {
		status,
		headers: { 'content-type': 'text/html; charset=utf-8' },
	});
}

function jsonResponse(status = 200): Response {
	return new Response('{"type":"data"}', {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

async function runHandle(event: RequestEvent, response: Response): Promise<Response> {
	return handle({ event, resolve: async () => response });
}

describe('hooks.server handle() cache headers', () => {
	it('sets all three cache headers on a 200 GET text/html page', async () => {
		const response = await runHandle(makeEvent({ pathname: '/about' }), htmlResponse());
		expect(response.headers.get('cache-control')).toBe(PAGE_CACHE_CONTROL);
		expect(response.headers.get('cdn-cache-control')).toBe(CDN_CACHE_CONTROL);
		expect(response.headers.get('vercel-cdn-cache-control')).toBe(CDN_CACHE_CONTROL);
	});

	it('sets CDN headers but NOT cache-control on a 200 GET __data.json response', async () => {
		const response = await runHandle(
			makeEvent({ pathname: '/about/__data.json' }),
			jsonResponse(),
		);
		expect(response.headers.get('cdn-cache-control')).toBe(CDN_CACHE_CONTROL);
		expect(response.headers.get('vercel-cdn-cache-control')).toBe(CDN_CACHE_CONTROL);
		expect(response.headers.get('cache-control')).toBeNull();
	});

	it('leaves a 200 GET JSON response that is not __data.json uncached', async () => {
		const response = await runHandle(makeEvent({ pathname: '/api/health' }), jsonResponse());
		expect(response.headers.get('cache-control')).toBeNull();
		expect(response.headers.get('cdn-cache-control')).toBeNull();
		expect(response.headers.get('vercel-cdn-cache-control')).toBeNull();
	});

	it('leaves non-200 responses uncached (404 HTML error page)', async () => {
		const response = await runHandle(makeEvent({ pathname: '/missing' }), htmlResponse(404));
		expect(response.status).toBe(404);
		expect(response.headers.get('cache-control')).toBeNull();
		expect(response.headers.get('cdn-cache-control')).toBeNull();
		expect(response.headers.get('vercel-cdn-cache-control')).toBeNull();
	});

	it('leaves non-GET responses uncached (POST returning HTML 200)', async () => {
		const response = await runHandle(
			makeEvent({ method: 'POST', pathname: '/contact' }),
			htmlResponse(),
		);
		expect(response.headers.get('cache-control')).toBeNull();
		expect(response.headers.get('cdn-cache-control')).toBeNull();
		expect(response.headers.get('vercel-cdn-cache-control')).toBeNull();
	});

	it('initializes the per-request pageCache Map on locals', async () => {
		const event = makeEvent();
		await runHandle(event, htmlResponse());
		expect(event.locals.pageCache).toBeInstanceOf(Map);
		expect(event.locals.pageCache.size).toBe(0);
	});

	it.each(['yesid.dev', 'www.yesid.dev'])('keeps production host %s indexable', async (hostname) => {
		const response = await runHandle(makeEvent({ hostname }), htmlResponse());
		expect(response.headers.get('x-robots-tag')).toBeNull();
	});

	it.each(['dev.yesid.dev', 'preview-123.vercel.app', 'localhost'])(
		'blocks indexing on non-production host %s',
		async (hostname) => {
			const response = await runHandle(makeEvent({ hostname }), htmlResponse());
			expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow, noarchive');
		},
	);
});
