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
