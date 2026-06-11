// composePageSeo — composer contract tests (slice-18 18h Phase 4 Task 13, #80b).
//
// Split out of the old __tests__/contract.test.ts at slice-26 close: that file
// mixed directus-adapter contract/mapping tests (deleted with the dormant
// adapter once Directus 12 passed the parity oracle on both environments)
// with these pure-composer tests, which cover LIVE code — the static adapter's
// meta.forRoute() composes through composePageSeo.
//
// composePageSeo is the pure composer used by staticAdapter.meta.forRoute()
// for static routes. The 8 static routes are owned by codeRouteSeoDefaults
// (apps/web/src/lib/adapters/route-seo-defaults.ts). This parity test
// asserts that for every one of those 8 routes, composePageSeo (with no
// CMS routeOverride — the cold-start case) produces a valid PageSeo with
// the expected fallback chain behavior:
//
//   - title respects composedTitleStrategy ('verbatim' for '/', 'append-
//     brand' for everything else)
//   - description falls back to siteSeoDefaults.defaultDescription when no
//     routeOverride is present
//   - ogType + noIndex match codeRouteSeoDefaults exactly
//   - jsonLd output is non-empty (each route's jsonLdFactory returned
//     at least one Schema.org node)
//
// The "parity" in the issue (#80) body refers to the legacy
// `routeSeoEntries` static lookup that was refactored away in slice-18m.
// codeRouteSeoDefaults + composePageSeo is the post-refactor canonical
// equivalent.

import { describe, expect, it, vi } from 'vitest';

// composePageSeo calls asset(uuid) which needs PUBLIC_DIRECTUS_URL.
// setup.data.ts mocks `$env/dynamic/public` to `{}`; override here so the
// asset URL builder doesn't throw.
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_DIRECTUS_URL: 'https://cms.yesid.dev' },
}));

import { composePageSeo } from '../compose-page-seo';
import { codeRouteSeoDefaults } from '../route-seo-defaults';
import { siteMeta } from '$lib/content/site-meta';
import { STATIC_SITE_SEO_DEFAULTS } from '$lib/content/site-seo-defaults';
import type { Locale } from '$lib/types';

describe('composePageSeo — parity across 8 static routes (#80b)', () => {
	const STATIC_ROUTE_IDS = [
		'/',
		'/about',
		'/contact',
		'/services',
		'/projects',
		'/blog',
		'/blog/personal',
		'/tech-stack',
	] as const;

	for (const routeId of STATIC_ROUTE_IDS) {
		describe(`route ${routeId}`, () => {
			const codeDefaults = codeRouteSeoDefaults[routeId];

			it('codeRouteSeoDefaults has an entry for this route', () => {
				expect(codeDefaults).toBeDefined();
			});

			it('composer produces non-empty title (composedTitleStrategy applied)', () => {
				const composed = composePageSeo({
					routeId,
					locale: 'en' as Locale,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
					routeOverride: undefined,
					codeDefaults: codeDefaults!,
				});
				expect(composed.title.en).toBeDefined();
				expect(composed.title.en.length).toBeGreaterThan(0);

				// Per composedTitleStrategy: '/' preserves the verbatim em-dash brand-first
				// format; other routes append ' | ${siteMeta.name}' pipe-suffix.
				if (codeDefaults!.composedTitleStrategy === 'verbatim') {
					expect(composed.title.en).toBe(codeDefaults!.fallbackTitle.en);
				} else {
					expect(composed.title.en).toContain(siteMeta.name);
					expect(composed.title.en).toContain(' | ');
				}
			});

			it('composer falls back to siteSeoDefaults.defaultDescription when no routeOverride', () => {
				const composed = composePageSeo({
					routeId,
					locale: 'en' as Locale,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
					routeOverride: undefined,
					codeDefaults: codeDefaults!,
				});
				expect(composed.description.en).toBe(STATIC_SITE_SEO_DEFAULTS.defaultDescription.en);
			});

			it('composer preserves ogType + noIndex from codeRouteSeoDefaults', () => {
				const composed = composePageSeo({
					routeId,
					locale: 'en' as Locale,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
					routeOverride: undefined,
					codeDefaults: codeDefaults!,
				});
				expect(composed.ogType).toBe(codeDefaults!.ogType);
				expect(composed.noIndex).toBe(codeDefaults!.noIndex);
			});

			it('composer emits non-empty jsonLd from codeRouteSeoDefaults.jsonLdFactory', () => {
				const composed = composePageSeo({
					routeId,
					locale: 'en' as Locale,
					siteMeta,
					siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
					routeOverride: undefined,
					codeDefaults: codeDefaults!,
				});
				expect(composed.jsonLd).toBeDefined();
				expect(Array.isArray(composed.jsonLd)).toBe(true);
				expect(composed.jsonLd!.length).toBeGreaterThan(0);
			});
		});
	}

	it('routeOverride.description takes precedence over siteSeoDefaults fallback', () => {
		const composed = composePageSeo({
			routeId: '/services',
			locale: 'en' as Locale,
			siteMeta,
			siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
			routeOverride: {
				path: '/services',
				ogImage: null,
				title: { en: 'Overridden Title' },
				description: { en: 'Overridden description from route_seo' },
			},
			codeDefaults: codeRouteSeoDefaults['/services']!,
		});
		expect(composed.description.en).toBe('Overridden description from route_seo');
	});

	it('routeOverride.ogImage UUID flows through to composed.ogImage', () => {
		const testUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
		const composed = composePageSeo({
			routeId: '/services',
			locale: 'en' as Locale,
			siteMeta,
			siteSeoDefaults: STATIC_SITE_SEO_DEFAULTS,
			routeOverride: {
				path: '/services',
				ogImage: testUuid,
				title: null,
				description: null,
			},
			codeDefaults: codeRouteSeoDefaults['/services']!,
		});
		// composer wraps the UUID with asset(uuid, 'og-1200') and emits PageSeoSchema-shaped ogImage = { url, alt, width, height }
		expect(composed.ogImage).toBeDefined();
		expect(composed.ogImage!.url).toContain(testUuid);
		expect(composed.ogImage!.width).toBe(1200);
		expect(composed.ogImage!.height).toBe(630);
	});
});
