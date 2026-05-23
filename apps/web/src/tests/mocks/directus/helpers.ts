// L2 Adapter Mock Helpers — Directus fetch capture + assertion library.
//
// Slice-17f Phase 2. Replaces the duplicated request-capture + response-build
// logic across 3 adapter test files (directus.mocked.test.ts,
// directus.contract.test.ts, pages.test.ts).
//
// =============================================================================
// PIVOT NOTE (from Phase 0 validation):
// =============================================================================
// The original L2 design was a runtime `createDirectusMock()` client. That
// doesn't work because `vi.mock()` calls are HOISTED to the top of test
// files by Vitest's transformer, and cannot be wrapped in a runtime function.
//
// So the actual shared layer is THIS library of helpers. Each test file
// keeps its own `vi.mock` boilerplate at the top:
//
//   vi.unmock('$lib/adapters/directus');
//   const sharedMockFetch = vi.fn();
//   vi.mock('./directus-queue', () => ({ createQueuedFetch: () => sharedMockFetch }));
//   vi.mock('$env/dynamic/public', () => ({ env: { PUBLIC_DIRECTUS_URL: '...' } }));
//   beforeEach(() => sharedMockFetch.mockReset());
//
// Then imports `jsonResponse`, `parseCapturedUrl`, `assertFetchUrl`,
// `seedFetchResponses` from here to compose tests.
//
// =============================================================================
// AUDIT FINDINGS — what these helpers replace
// =============================================================================
// Catalog of duplicated patterns across the 3 monsters (Phase 0 audit):
//
// 1. `jsonResponse(body)` — 3 monsters all build:
//      new Response(JSON.stringify({ data: body }), {
//        status, headers: { 'content-type': 'application/json' }
//      })
//    Repeated ~30-50 times per monster.
//
// 2. `parseCapturedUrl()` — 3 monsters all extract:
//      const call = sharedMockFetch.mock.calls[0];
//      const rawUrl = call[0];
//      const url = typeof rawUrl === 'string' ? new URL(rawUrl) : (rawUrl as URL);
//      return { pathname: url.pathname, search: url.searchParams };
//    Repeated ~20-30 times per monster.
//
// 3. `assertFetchUrl(...)` — 3 monsters all do:
//      expect(pathname).toBe('/items/X');
//      expect(search.get('limit')).toBe('-1');
//      expect(search.get('filter')).toContain('_eq');
//      // ... etc, 5-10 lines per assertion block
//    Repeated ~20-30 times per monster — biggest LOC source.

import { expect, type Mock } from 'vitest';

/**
 * Wraps body in Directus's `{ data: ... }` envelope. Default status 200.
 *
 * @example
 *   sharedMockFetch.mockResolvedValueOnce(jsonResponse([project1, project2]));
 */
export function jsonResponse(body: unknown, status = 200): Response {
	return new Response(JSON.stringify({ data: body }), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

/**
 * Extract pathname + searchParams from the first captured fetch call.
 * Throws if no call was captured (via expect().toHaveBeenCalled()).
 *
 * @example
 *   const { pathname, search } = parseCapturedUrl(sharedMockFetch);
 *   expect(pathname).toBe('/items/projects');
 */
export function parseCapturedUrl(mockFetch: Mock): {
	pathname: string;
	search: URLSearchParams;
} {
	expect(mockFetch).toHaveBeenCalled();
	const call = mockFetch.mock.calls[0];
	const rawUrl = call[0];
	const url = typeof rawUrl === 'string' ? new URL(rawUrl) : (rawUrl as URL);
	return { pathname: url.pathname, search: url.searchParams };
}

/**
 * Assert that a captured fetch call hit `expectedPathname` with the expected
 * query params. Throws with a helpful diff on mismatch. Use this instead of
 * 5-10 lines of pathname + per-param assertions.
 *
 * @example
 *   assertFetchUrl(sharedMockFetch, '/items/projects', {
 *     limit: '-1',
 *     'filter[status][_eq]': 'public',
 *   });
 */
export function assertFetchUrl(
	mockFetch: Mock,
	expectedPathname: string,
	expectedParams: Record<string, string>,
): void {
	const { pathname, search } = parseCapturedUrl(mockFetch);
	if (pathname !== expectedPathname) {
		throw new Error(`expected pathname ${expectedPathname}, got ${pathname}`);
	}
	for (const [k, v] of Object.entries(expectedParams)) {
		const actual = search.get(k);
		if (actual !== v) {
			throw new Error(`expected param ${k}=${v}, got ${actual ?? '<missing>'}`);
		}
	}
}

/**
 * Convenience: seed a mock fetch with N responses returned in order. Non-Response
 * values are wrapped in `jsonResponse()` automatically.
 *
 * @example
 *   seedFetchResponses(sharedMockFetch, [
 *     [project1, project2],     // wrapped in jsonResponse
 *     jsonResponse(null, 404),  // explicit Response — passed through
 *   ]);
 */
export function seedFetchResponses(mockFetch: Mock, responses: Array<Response | unknown>): void {
	for (const r of responses) {
		if (r instanceof Response) {
			mockFetch.mockResolvedValueOnce(r);
		} else {
			mockFetch.mockResolvedValueOnce(jsonResponse(r));
		}
	}
}

/**
 * Assert the captured fetch hit `expected` pathname. Accepts string (exact)
 * or RegExp. Lighter-weight than assertFetchUrl when only the path matters.
 *
 * @example
 *   assertFetchPath(sharedMockFetch, '/items/projects');
 *   assertFetchPath(sharedMockFetch, /^\/assets\/[0-9a-f-]+$/);
 */
export function assertFetchPath(mockFetch: Mock, expected: string | RegExp): void {
	const { pathname } = parseCapturedUrl(mockFetch);
	if (typeof expected === 'string') {
		if (pathname !== expected) {
			throw new Error(`expected pathname ${expected}, got ${pathname}`);
		}
	} else if (!expected.test(pathname)) {
		throw new Error(`expected pathname to match ${expected}, got ${pathname}`);
	}
}

/**
 * Assert that the captured fetch's `filter` param contains all `tokens` as
 * substrings (after URL decoding). Use this for the Directus pattern where
 * the SDK JSON-encodes the filter object, e.g. `filter={"id":{"_eq":"foo"}}`
 * — token order isn't guaranteed, so substring checks are the right primitive.
 *
 * @example
 *   // Replaces:
 *   //   const filter = search.get('filter');
 *   //   expect(filter).toBeTruthy();
 *   //   expect(filter!).toContain('id');
 *   //   expect(filter!).toContain('_eq');
 *   //   expect(filter!).toContain('sql-development');
 *   assertFilterContains(sharedMockFetch, 'id', '_eq', 'sql-development');
 */
export function assertFilterContains(mockFetch: Mock, ...tokens: string[]): void {
	const { search } = parseCapturedUrl(mockFetch);
	const filter = decodeURIComponent(search.get('filter') ?? '');
	if (!filter) {
		throw new Error('expected filter param to be set, got empty/missing');
	}
	for (const token of tokens) {
		if (!filter.includes(token)) {
			throw new Error(`filter missing token "${token}"\nactual: ${filter}`);
		}
	}
}
