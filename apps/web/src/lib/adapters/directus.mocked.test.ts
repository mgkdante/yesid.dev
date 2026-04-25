// Mocked-fetch contract tests for the Directus adapter (F23 — 18c Task 45).
//
// Scope: assert every port method issues the EXPECTED Directus REST request —
// correct collection, expanded translations, expected filter shape, limit=-1
// when we want "all rows", etc. The live `cms.yesid.dev` is NEVER hit; every
// request is captured via a stubbed fetch injected through the queue module.
//
// This is a TEMPLATE for Slice 18 + future sub-slices:
//   - When a new port lands (projects, blog, meta, techStack, content),
//     add a describe() block here that asserts the readItems call shape.
//   - When a port's query shape changes (fields, filter, sort), update the
//     matching assertion here. Breakage here means the CMS seed/snapshot is
//     out of sync with the adapter reads — catch it in unit tests, not live.
//
// Pattern:
//   1. vi.unmock('$lib/adapters/directus') — subject under test.
//   2. vi.mock('./directus-queue') — replace createQueuedFetch() with a
//      factory returning a shared mock that records all fetch calls.
//   3. vi.stubEnv('PUBLIC_DIRECTUS_URL', 'https://cms.yesid.dev') before
//      importing the adapter — the client is built lazily on first use, so
//      stubbing once at the top of the file is enough.
//   4. Call a port method; read mockFetch.mock.calls for the captured URL
//      + init, assert against expected shape.

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.unmock('$lib/adapters/directus');

// The `createQueuedFetch` factory returns `sharedMockFetch` so every client
// instance built by `buildClient()` uses the same capture surface.
const sharedMockFetch = vi.fn();

vi.mock('./directus-queue', () => ({
	createQueuedFetch: () => sharedMockFetch,
}));

import { directusAdapter } from './directus';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Returns a JSON Response suitable for the Directus SDK's `{ data: ... }` envelope.
 * Keeps each test's setup to one line.
 */
function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify({ data: body }), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

/**
 * Parse the captured fetch URL — the SDK builds `<baseUrl>/items/<collection>?<query>`.
 * Returns pathname + searchParams for structured assertions.
 */
function parseCapturedUrl(): { pathname: string; search: URLSearchParams } {
	expect(sharedMockFetch).toHaveBeenCalled();
	const call = sharedMockFetch.mock.calls[0];
	// SDK calls fetch(url, init) — url may be string | URL | Request.
	const rawUrl = call[0];
	const url = typeof rawUrl === 'string' ? new URL(rawUrl) : (rawUrl as URL);
	return { pathname: url.pathname, search: url.searchParams };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

// Provide a URL so `buildClient()` doesn't throw. `$env/dynamic/public` is
// already stubbed to `{}` in setup.data.ts — override here for this file.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' },
}));

beforeEach(() => {
	sharedMockFetch.mockReset();
});

// ---------------------------------------------------------------------------
// services port
// ---------------------------------------------------------------------------

describe('directusAdapter.services — fetch contract', () => {
	it('services.all hits /items/services with deep translations expansion', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.services.all();

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/services');
		// fields must request * + translations + deliverables + sections
		const fields = search.get('fields');
		expect(fields).toBeTruthy();
		expect(fields!).toContain('*');
		expect(fields!).toContain('translations');
		expect(fields!).toContain('deliverables');
		expect(fields!).toContain('sections');
		// limit=-1 means "no pagination cap" — site has <50 services
		expect(search.get('limit')).toBe('-1');
	});

	it('services.byId filters by id._eq', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.services.byId('sql-development');

		const { pathname, search } = parseCapturedUrl();
		expect(pathname).toBe('/items/services');
		const filter = search.get('filter');
		expect(filter).toBeTruthy();
		// Directus SDK serialises filter as JSON — match on the id + _eq tokens
		expect(filter!).toContain('id');
		expect(filter!).toContain('_eq');
		expect(filter!).toContain('sql-development');
	});

	it('services.visible filters visible._neq=false (not _eq=true — captures nullable column)', async () => {
		sharedMockFetch.mockResolvedValueOnce(jsonResponse([]));

		await directusAdapter.services.visible();

		const { search } = parseCapturedUrl();
		const filter = search.get('filter');
		expect(filter).toBeTruthy();
		expect(filter!).toContain('visible');
		expect(filter!).toContain('_neq');
		expect(filter!).toContain('false');
	});
});

// ---------------------------------------------------------------------------
// content.metroSvg (Slice 18d Phase 8 — Task 28-33)
//
// Asserts the consumer-flip wiring: content.metroSvg() resolves the
// montreal-metro UUID via @repo/shared assetIdFor, hits
// /assets/<uuid> on the configured Directus base URL, and returns
// the SVG markup. Non-2xx responses must throw with status context so
// SSR load() failures surface clearly.
// ---------------------------------------------------------------------------

describe('directusAdapter.content.metroSvg — fetch contract', () => {
	it('hits /assets/<uuid> for the montreal-metro svg id from id-map', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			new Response('<svg xmlns="http://www.w3.org/2000/svg"></svg>', {
				status: 200,
				headers: { 'content-type': 'image/svg+xml' },
			}),
		);

		const out = await directusAdapter.content.metroSvg();

		expect(out).toContain('<svg');
		const { pathname } = parseCapturedUrl();
		// Directus file UUIDs are RFC-4122 v4: 8-4-4-4-12 hex
		expect(pathname).toMatch(/^\/assets\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
	});

	it('throws on non-2xx response with status + statusText in the error', async () => {
		sharedMockFetch.mockResolvedValueOnce(
			new Response('not found', { status: 404, statusText: 'Not Found' }),
		);

		await expect(directusAdapter.content.metroSvg()).rejects.toThrow(/404/);
	});
});
