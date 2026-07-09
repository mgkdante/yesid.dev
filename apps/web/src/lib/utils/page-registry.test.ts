// page-registry tests — the route-gate resolution rules (slice-26.1).
//
// The helper is pure: every test injects its own registry fixture so the
// cascade behaviour (archived row absent → path unresolved) is exercised
// without touching the committed $lib/content/site-pages.ts module. A final
// block sanity-checks the real committed registry.

import { describe, expect, it } from 'vitest';
import type { SitePage } from '$lib/types';
import {
	isPathPublished,
	isRegistryExempt,
	normalizePathname,
	resolveSitePage,
} from './page-registry';
import { sitePages } from '$lib/content/site-pages';

const FULL_REGISTRY: readonly SitePage[] = [
	{ path: '/', type: 'system', title: { en: 'Home' } },
	{ path: '/services', type: 'listing', title: { en: 'Services' } },
	{ path: '/projects', type: 'listing', title: { en: 'Projects' } },
	{ path: '/blog', type: 'listing', title: { en: 'Blog' } },
	{ path: '/blog/personal', type: 'listing', title: { en: 'Personal Blog' } },
	{ path: '/tech-stack', type: 'freeform', title: { en: 'Tech Stack' } },
	{ path: '/about', type: 'freeform', title: { en: 'About' } },
	{ path: '/contact', type: 'freeform', title: { en: 'Contact' } },
];

/** Registry with a section archived = its row simply absent. */
const without = (...paths: string[]): readonly SitePage[] =>
	FULL_REGISTRY.filter((p) => !paths.includes(p.path));

describe('normalizePathname', () => {
	it('keeps root as root', () => {
		expect(normalizePathname('/')).toBe('/');
		expect(normalizePathname('')).toBe('/');
	});

	it('strips a trailing slash from non-root paths', () => {
		expect(normalizePathname('/about/')).toBe('/about');
		expect(normalizePathname('/blog/personal/')).toBe('/blog/personal');
	});

	it('leaves clean paths untouched', () => {
		expect(normalizePathname('/about')).toBe('/about');
	});
});

describe('resolveSitePage — exact match', () => {
	it('resolves every registry path to its own entry', () => {
		for (const page of FULL_REGISTRY) {
			expect(resolveSitePage(page.path, FULL_REGISTRY)?.path).toBe(page.path);
		}
	});

	it('resolves trailing-slash variants to the same entry', () => {
		expect(resolveSitePage('/about/', FULL_REGISTRY)?.path).toBe('/about');
	});
});

describe('resolveSitePage — longest listing prefix', () => {
	it('resolves service detail paths to /services', () => {
		expect(resolveSitePage('/services/sql-development', FULL_REGISTRY)?.path).toBe('/services');
	});

	it('resolves project detail paths to /projects', () => {
		expect(resolveSitePage('/projects/transit-data-pipeline', FULL_REGISTRY)?.path).toBe(
			'/projects',
		);
	});

	it('resolves blog post paths to /blog', () => {
		expect(resolveSitePage('/blog/some-post', FULL_REGISTRY)?.path).toBe('/blog');
	});

	it('/blog/personal wins over /blog for its own path (longest-prefix / exact)', () => {
		expect(resolveSitePage('/blog/personal', FULL_REGISTRY)?.path).toBe('/blog/personal');
	});

	it('nested paths under /blog/personal resolve to /blog/personal, not /blog', () => {
		expect(resolveSitePage('/blog/personal/some-child', FULL_REGISTRY)?.path).toBe(
			'/blog/personal',
		);
	});

	it('freeform pages never claim child paths', () => {
		expect(resolveSitePage('/about/team', FULL_REGISTRY)).toBeUndefined();
	});

	it('the root row never claims child paths (no / prefix wildcard)', () => {
		const rootAsListing: readonly SitePage[] = [
			{ path: '/', type: 'listing', title: { en: 'Home' } },
		];
		expect(resolveSitePage('/anything', rootAsListing)).toBeUndefined();
	});

	it('prefix match requires a segment boundary (/services-extra is not under /services)', () => {
		expect(resolveSitePage('/services-extra', FULL_REGISTRY)).toBeUndefined();
	});
});

describe('resolveSitePage — archived sections (row absent)', () => {
	it('archived /blog: /blog and /blog/some-post stop resolving', () => {
		const registry = without('/blog');
		expect(resolveSitePage('/blog', registry)).toBeUndefined();
		expect(resolveSitePage('/blog/some-post', registry)).toBeUndefined();
	});

	it('archived /blog does NOT take /blog/personal down (own, more specific row)', () => {
		const registry = without('/blog');
		expect(resolveSitePage('/blog/personal', registry)?.path).toBe('/blog/personal');
	});

	it('archived /blog/personal leaves /blog and post details resolving', () => {
		const registry = without('/blog/personal');
		expect(resolveSitePage('/blog', registry)?.path).toBe('/blog');
		expect(resolveSitePage('/blog/some-post', registry)?.path).toBe('/blog');
		// /blog/personal itself now falls through to the /blog listing prefix —
		// the exact row is gone, but the path still resolves to the section.
		expect(resolveSitePage('/blog/personal', registry)?.path).toBe('/blog');
	});

	it('archived /services kills the section AND its detail pages', () => {
		const registry = without('/services');
		expect(resolveSitePage('/services', registry)).toBeUndefined();
		expect(resolveSitePage('/services/sql-development', registry)).toBeUndefined();
	});

	it('unknown top-level paths never resolve', () => {
		expect(resolveSitePage('/nonexistent', FULL_REGISTRY)).toBeUndefined();
	});
});

describe('isRegistryExempt — non-page surfaces', () => {
	it.each(['/sitemap.xml', '/robots.txt', '/work', '/api/weather', '/og/blog', '/api', '/og'])(
		'%s is exempt',
		(path) => {
			expect(isRegistryExempt(path)).toBe(true);
		},
	);

	it.each(['/', '/about', '/blog/some-post', '/working', '/apis'])('%s is NOT exempt', (path) => {
		expect(isRegistryExempt(path)).toBe(false);
	});
});

describe('isPathPublished — the route-gate predicate', () => {
	it('/ always resolves, even against an empty registry', () => {
		expect(isPathPublished('/', [])).toBe(true);
		expect(isPathPublished('/', FULL_REGISTRY)).toBe(true);
	});

	it('exempt surfaces always pass', () => {
		expect(isPathPublished('/sitemap.xml', [])).toBe(true);
		expect(isPathPublished('/api/weather', [])).toBe(true);
	});

	it('published sections + their details pass', () => {
		expect(isPathPublished('/about', FULL_REGISTRY)).toBe(true);
		expect(isPathPublished('/blog/some-post', FULL_REGISTRY)).toBe(true);
	});

	it('archived sections + their details fail (404 cascade)', () => {
		const registry = without('/tech-stack', '/projects');
		expect(isPathPublished('/tech-stack', registry)).toBe(false);
		expect(isPathPublished('/projects', registry)).toBe(false);
		expect(isPathPublished('/projects/some-project', registry)).toBe(false);
	});

	it('unknown paths fail', () => {
		expect(isPathPublished('/nope', FULL_REGISTRY)).toBe(false);
	});
});

describe('committed registry sanity (regenerated every build)', () => {
	it('contains the 13 seeded paths, root included', () => {
		expect(sitePages.map((p) => p.path)).toEqual([
			'/',
			'/services',
			'/projects',
			'/blog',
			'/blog/personal',
			'/tech-stack',
			'/about',
			'/contact',
			// OPS1 legal framework (launch Phase 1)
			'/legal/privacy',
			'/legal/terms',
			'/legal/cookies',
			'/legal/accessibility',
			'/legal/notice',
		]);
	});

	it('detail sections are listing-typed so detail routes resolve', () => {
		for (const path of ['/services', '/projects', '/blog']) {
			expect(sitePages.find((p) => p.path === path)?.type).toBe('listing');
		}
	});

	it('every committed path is published per the gate predicate', () => {
		for (const page of sitePages) {
			expect(isPathPublished(page.path)).toBe(true);
		}
	});
});
