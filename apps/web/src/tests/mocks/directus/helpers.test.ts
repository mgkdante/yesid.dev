// L2 mock helpers tests — slice-17f Phase 2.
//
// These verify the helpers used by adapter tests:
//   jsonResponse        — Directus `{ data: ... }` envelope builder
//   parseCapturedUrl    — extracts pathname + searchParams from captured fetch
//   assertFetchUrl      — pathname + query-param assertion with helpful errors
//   seedFetchResponses  — convenience for queuing multiple responses

import { describe, it, expect, vi } from 'vitest';
import {
	jsonResponse,
	parseCapturedUrl,
	assertFetchUrl,
	seedFetchResponses,
	assertFetchPath,
	assertFilterContains,
} from './helpers';

describe('jsonResponse', () => {
	it("wraps body in Directus { data: ... } envelope", async () => {
		const res = jsonResponse({ slug: 'home' });
		expect(res.status).toBe(200);
		const json = await res.json();
		expect(json).toEqual({ data: { slug: 'home' } });
	});

	it('supports custom status', () => {
		expect(jsonResponse(null, 404).status).toBe(404);
	});

	it('sets content-type: application/json', () => {
		const res = jsonResponse({});
		expect(res.headers.get('content-type')).toBe('application/json');
	});
});

describe('parseCapturedUrl', () => {
	it('extracts pathname + searchParams from a captured fetch call', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/items/projects?filter[status][_eq]=public', {
			method: 'GET',
		});
		const { pathname, search } = parseCapturedUrl(mock);
		expect(pathname).toBe('/items/projects');
		expect(search.get('filter[status][_eq]')).toBe('public');
	});

	it('throws if no fetch call was captured', () => {
		const mock = vi.fn();
		expect(() => parseCapturedUrl(mock)).toThrow();
	});

	it('handles URL objects as well as strings', () => {
		const mock = vi.fn();
		const url = new URL('https://cms.yesid.dev/items/projects?limit=-1');
		mock(url);
		const { pathname, search } = parseCapturedUrl(mock);
		expect(pathname).toBe('/items/projects');
		expect(search.get('limit')).toBe('-1');
	});
});

describe('assertFetchUrl', () => {
	it('asserts pathname + expected params match', () => {
		const mock = vi.fn();
		mock(
			'https://cms.yesid.dev/items/projects?filter[status][_eq]=public&limit=-1',
		);
		expect(() =>
			assertFetchUrl(mock, '/items/projects', {
				'filter[status][_eq]': 'public',
				limit: '-1',
			}),
		).not.toThrow();
	});

	it('throws with helpful message when pathname differs', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/items/wrong');
		expect(() => assertFetchUrl(mock, '/items/projects', {})).toThrow(/expected pathname/);
	});

	it('throws with helpful message when expected param missing', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/items/projects');
		expect(() =>
			assertFetchUrl(mock, '/items/projects', { limit: '-1' }),
		).toThrow(/limit/);
	});
});

describe('seedFetchResponses', () => {
	it('queues multiple Response objects in order', async () => {
		const mock = vi.fn();
		seedFetchResponses(mock, [jsonResponse({ a: 1 }), jsonResponse({ a: 2 })]);
		const r1 = await mock();
		const r2 = await mock();
		expect(await r1.json()).toEqual({ data: { a: 1 } });
		expect(await r2.json()).toEqual({ data: { a: 2 } });
	});

	it('wraps non-Response values in jsonResponse automatically', async () => {
		const mock = vi.fn();
		seedFetchResponses(mock, [{ slug: 'home' }]);
		const r = await mock();
		expect(await r.json()).toEqual({ data: { slug: 'home' } });
	});
});

describe('assertFetchPath', () => {
	it('passes on exact string match', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/items/projects?x=1');
		expect(() => assertFetchPath(mock, '/items/projects')).not.toThrow();
	});

	it('passes on regex match', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/assets/abc-123-def');
		expect(() => assertFetchPath(mock, /^\/assets\/[a-z0-9-]+$/)).not.toThrow();
	});

	it('throws with helpful message on mismatch', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/items/wrong');
		expect(() => assertFetchPath(mock, '/items/right')).toThrow(/expected pathname/);
	});
});

describe('assertFilterContains', () => {
	it('passes when filter contains all tokens', () => {
		const mock = vi.fn();
		mock(
			'https://cms.yesid.dev/items/projects?filter=' +
				encodeURIComponent('{"id":{"_eq":"sql-development"}}'),
		);
		expect(() =>
			assertFilterContains(mock, 'id', '_eq', 'sql-development'),
		).not.toThrow();
	});

	it('throws when a token is missing, naming it', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/items/projects?filter=' + encodeURIComponent('{"id":{"_eq":"foo"}}'));
		expect(() => assertFilterContains(mock, 'sql-development')).toThrow(/sql-development/);
	});

	it('throws when filter param is missing entirely', () => {
		const mock = vi.fn();
		mock('https://cms.yesid.dev/items/projects');
		expect(() => assertFilterContains(mock, 'anything')).toThrow(/filter/);
	});
});
