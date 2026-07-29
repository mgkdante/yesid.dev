import { describe, expect, it, vi } from 'vitest';
import type { Locale } from '$lib/types';
import { match } from '../../params/locale';
import {
	PREFIX_LOCALES,
	pathLocale,
	delocalizePath,
	localizeHref,
	localizeUrl,
	isLocaleSwitch,
	stripLocaleSegment,
	isPrefixLocale,
	localeFromParams,
} from './locale-routing';

describe('yesid.dev locale routing wrapper', () => {
	it('exact-levers', () => {
		expect(PREFIX_LOCALES).toEqual(['fr', 'es']);
		expect(pathLocale('/')).toBe('en');
		expect(pathLocale('/de/about')).toBe('en');
		expect(localizeHref('/about', 'en')).toBe('/about');
		expect(localizeHref('/about', 'fr')).toBe('/fr/about');
		expect(localizeHref('/about', 'es')).toBe('/es/about');
	});

	it('core-corpus-fixtures', () => {
		const pathLocaleFixtures: readonly [string, Locale][] = [
			['', 'en'],
			['/', 'en'],
			['/about', 'en'],
			['/fr', 'fr'],
			['/fr/', 'fr'],
			['/fr/about', 'fr'],
			['/es', 'es'],
			['/es/', 'es'],
			['/es/about', 'es'],
			['/france', 'en'],
			['/de/about', 'en'],
		];
		const delocalizeFixtures: readonly [string, string][] = [
			['', '/'],
			['/', '/'],
			['/about', '/about'],
			['/fr', '/'],
			['/fr/', '/'],
			['/fr//', '//'],
			['/fr/about', '/about'],
			['/fr/blog/some-post', '/blog/some-post'],
			['/es', '/'],
			['/es/', '/'],
			['/es/about', '/about'],
			['/fr/fr/about', '/fr/about'],
			['/es/fr/about', '/fr/about'],
			['/france', '/france'],
		];
		const localizeFixtures: readonly [string, Locale, string][] = [
			['/', 'en', '/'],
			['/', 'fr', '/fr'],
			['/', 'es', '/es'],
			['/about', 'en', '/about'],
			['/about', 'fr', '/fr/about'],
			['/about', 'es', '/es/about'],
			['/services/data-pipeline', 'fr', '/fr/services/data-pipeline'],
			['/fr/about', 'en', '/about'],
			['/fr/about', 'fr', '/fr/about'],
			['/fr/about', 'es', '/es/about'],
			['/es/about', 'en', '/about'],
			['/es/about', 'fr', '/fr/about'],
			['/fr/fr/about', 'es', '/es/fr/about'],
		];
		const urlFixtures: readonly [string, Locale, string][] = [
			[
				'/projects?service=web&tag=svelte',
				'fr',
				'/fr/projects?service=web&tag=svelte',
			],
			['/blog?tag=ml#post-3', 'fr', '/fr/blog?tag=ml#post-3'],
			['/projects?service=web', 'en', '/projects?service=web'],
			['/fr/projects?service=web', 'en', '/projects?service=web'],
			['/fr/projects?tag=a', 'fr', '/fr/projects?tag=a'],
			['/about', 'fr', '/fr/about'],
			['/', 'fr', '/fr'],
			['/about#contact', 'fr', '/fr/about#contact'],
		];
		const switchFixtures: readonly [string, string, boolean][] = [
			['/about', '/fr/about', true],
			['/fr/about', '/about', true],
			['/', '/fr', true],
			['/fr', '/', true],
			['/projects', '/fr/projects', true],
			['/projects', '/es/projects', true],
			['/fr/about', '/es/about', true],
			['/about', '/projects', false],
			['/about', '/fr/projects', false],
			['/fr/about', '/fr/projects', false],
			['/about', '/about', false],
			['/fr/about', '/fr/about', false],
			['/', '/', false],
		];

		for (const [pathname, expected] of pathLocaleFixtures) {
			expect(pathLocale(pathname)).toBe(expected);
		}
		for (const [pathname, expected] of delocalizeFixtures) {
			expect(delocalizePath(pathname)).toBe(expected);
		}
		for (const [href, locale, expected] of localizeFixtures) {
			expect(localizeHref(href, locale)).toBe(expected);
		}
		for (const [href, locale, expected] of urlFixtures) {
			expect(localizeUrl(new URL(href, 'https://yesid.dev'), locale)).toBe(expected);
		}
		for (const [fromPathname, toPathname, expected] of switchFixtures) {
			expect(isLocaleSwitch(fromPathname, toPathname)).toBe(expected);
		}
	});

	it('universal+yesid-exemptions+negative-controls', () => {
		const hrefFixtures: readonly [string, Locale, string][] = [
			['', 'fr', ''],
			['#section', 'fr', '#section'],
			['mailto:admin@yesid.dev', 'fr', 'mailto:admin@yesid.dev'],
			['tel:+1', 'fr', 'tel:+1'],
			['https://x.com/y', 'fr', 'https://x.com/y'],
			['//cdn.example/f.js', 'fr', '//cdn.example/f.js'],
			['about', 'fr', 'about'],
			['./about', 'fr', './about'],
			['../about', 'fr', '../about'],
			['/api', 'fr', '/api'],
			['/api/', 'fr', '/api/'],
			['/api/weather', 'fr', '/api/weather'],
			['/og', 'fr', '/og'],
			['/og/', 'fr', '/og/'],
			['/og/default.en.png', 'fr', '/og/default.en.png'],
			['/sitemap.xml', 'fr', '/sitemap.xml'],
			['/sitemap.xml/', 'fr', '/sitemap.xml/'],
			['/robots.txt', 'fr', '/robots.txt'],
			['/robots.txt/', 'fr', '/robots.txt/'],
			['/work', 'fr', '/work'],
			['/work/', 'fr', '/work/'],
			['/work/resume', 'fr', '/fr/work/resume'],
			['/manifest.webmanifest', 'fr', '/fr/manifest.webmanifest'],
			['/v1/network.json', 'fr', '/fr/v1/network.json'],
			['/A.PNG', 'fr', '/fr/A.PNG'],
			['/a.b', 'fr', '/fr/a.b'],
			['/fr/api/weather', 'es', '/es/api/weather'],
		];
		const urlFixtures: readonly [string, Locale, string][] = [
			['/api/weather?a=1#z', 'fr', '/api/weather?a=1#z'],
			['/work?a=1', 'fr', '/work?a=1'],
			['/sitemap.xml?a=1', 'fr', '/sitemap.xml?a=1'],
			['/og/d.png#z', 'fr', '/og/d.png#z'],
			['/v1/n.json?a=1', 'fr', '/fr/v1/n.json?a=1'],
			[
				'/manifest.webmanifest?x=1',
				'fr',
				'/fr/manifest.webmanifest?x=1',
			],
		];

		for (const [href, locale, expected] of hrefFixtures) {
			expect(localizeHref(href, locale)).toBe(expected);
		}
		for (const [href, locale, expected] of urlFixtures) {
			expect(localizeUrl(new URL(href, 'https://yesid.dev'), locale)).toBe(expected);
		}
	});

	it('build-branch localizeUrl', async () => {
		vi.resetModules();
		vi.doMock('$app/environment', () => ({ building: true }));

		try {
			const { localizeUrl: buildLocalizeUrl } = await import('./locale-routing');

			expect(
				buildLocalizeUrl(
					new URL('/projects?service=web&tag=svelte#results', 'https://yesid.dev'),
					'fr',
				),
			).toBe('/fr/projects');
			expect(
				buildLocalizeUrl(
					new URL('/fr/projects?service=web#results', 'https://yesid.dev'),
					'en',
				),
			).toBe('/projects');
		} finally {
			vi.doUnmock('$app/environment');
			vi.resetModules();
		}
	});

	it('route-id+matcher-wiring', () => {
		const routeIdFixtures: readonly [string, string][] = [
			['/', '/'],
			['/[[lang=locale]]', '/'],
			['/[[lang=locale]]/about', '/about'],
			['/[[lang=locale]]/a/[id]', '/a/[id]'],
			['/[[lang=locale]]/services/[id]', '/services/[id]'],
			['/[[lang=locale]]x', '/[[lang=locale]]x'],
			['/[[lang=locale]]/', '/'],
			['/__error', '/__error'],
			['/og/[type]/[slug].png', '/og/[type]/[slug].png'],
			['/og/[type=ogType]/[slug].png', '/og/[type=ogType]/[slug].png'],
		];
		const matcherFixtures: readonly [string, boolean][] = [
			['fr', true],
			['es', true],
			['en', false],
			['', false],
			['FR', false],
			['france', false],
			['about', false],
			['/fr', false],
			['de', false],
		];

		for (const [routeId, expected] of routeIdFixtures) {
			expect(stripLocaleSegment(routeId)).toBe(expected);
		}
		for (const [segment, expected] of matcherFixtures) {
			expect(isPrefixLocale(segment)).toBe(expected);
			expect(match(segment)).toBe(expected);
		}
	});

	it('prefers a valid params.lang', () => {
		expect(localeFromParams({ lang: 'fr' })).toBe('fr');
	});

	it('falls back to the pathname (error renders have no params)', () => {
		expect(localeFromParams({}, '/fr/missing-page')).toBe('fr');
		expect(localeFromParams({}, '/missing-page')).toBe('en');
	});

	it('defaults to en', () => {
		expect(localeFromParams({})).toBe('en');
		expect(localeFromParams({ lang: 'zz' })).toBe('en');
	});
});
