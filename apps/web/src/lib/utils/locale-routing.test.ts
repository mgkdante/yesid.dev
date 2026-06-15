import { describe, it, expect } from 'vitest';
import {
	PREFIX_LOCALES,
	pathLocale,
	delocalizePath,
	localizeHref,
	localizeUrl,
	isLocaleSwitch,
	stripLocaleSegment,
	localeFromParams,
} from './locale-routing';

describe('PREFIX_LOCALES', () => {
	it('opens fr only (es joins when Spanish routing ships)', () => {
		expect(PREFIX_LOCALES).toEqual(['fr']);
	});
});

describe('pathLocale', () => {
	it('reads the first segment when it is a known prefix', () => {
		expect(pathLocale('/fr')).toBe('fr');
		expect(pathLocale('/fr/')).toBe('fr');
		expect(pathLocale('/fr/about')).toBe('fr');
	});
	it('defaults to en otherwise', () => {
		expect(pathLocale('/')).toBe('en');
		expect(pathLocale('/about')).toBe('en');
		expect(pathLocale('/france')).toBe('en'); // segment, not prefix-string match
		expect(pathLocale('/es/about')).toBe('en'); // es not opened yet
	});
});

describe('delocalizePath', () => {
	it('strips a locale prefix', () => {
		expect(delocalizePath('/fr')).toBe('/');
		expect(delocalizePath('/fr/')).toBe('/');
		expect(delocalizePath('/fr/about')).toBe('/about');
		expect(delocalizePath('/fr/blog/some-post')).toBe('/blog/some-post');
	});
	it('passes locale-less paths through', () => {
		expect(delocalizePath('/')).toBe('/');
		expect(delocalizePath('/about')).toBe('/about');
		expect(delocalizePath('/france')).toBe('/france');
		expect(delocalizePath('')).toBe('/');
	});
});

describe('localizeHref', () => {
	it('prefixes internal page hrefs for fr', () => {
		expect(localizeHref('/', 'fr')).toBe('/fr');
		expect(localizeHref('/about', 'fr')).toBe('/fr/about');
		expect(localizeHref('/services/data-pipeline', 'fr')).toBe('/fr/services/data-pipeline');
	});
	it('is identity for en', () => {
		expect(localizeHref('/about', 'en')).toBe('/about');
		expect(localizeHref('/', 'en')).toBe('/');
	});
	it('is idempotent (tolerates already-localized input)', () => {
		expect(localizeHref('/fr/about', 'fr')).toBe('/fr/about');
		expect(localizeHref('/fr/about', 'en')).toBe('/about');
	});
	it('never touches external/special/endpoint hrefs', () => {
		expect(localizeHref('https://x.com/y', 'fr')).toBe('https://x.com/y');
		expect(localizeHref('mailto:admin@yesid.dev', 'fr')).toBe('mailto:admin@yesid.dev');
		expect(localizeHref('#section', 'fr')).toBe('#section');
		expect(localizeHref('/og/default.en.png', 'fr')).toBe('/og/default.en.png');
		expect(localizeHref('/sitemap.xml', 'fr')).toBe('/sitemap.xml');
		expect(localizeHref('/robots.txt', 'fr')).toBe('/robots.txt');
		expect(localizeHref('/work', 'fr')).toBe('/work');
		expect(localizeHref('/api/weather', 'fr')).toBe('/api/weather');
	});
	it('unsupported prefix locale falls back to en form', () => {
		expect(localizeHref('/about', 'es')).toBe('/about');
	});
});

describe('localizeUrl (preserves query + hash across a locale switch)', () => {
	const u = (s: string) => new URL(s, 'https://yesid.dev');
	it('carries the query string and hash when prefixing to fr', () => {
		expect(localizeUrl(u('/projects?service=web&tag=svelte'), 'fr')).toBe(
			'/fr/projects?service=web&tag=svelte',
		);
		expect(localizeUrl(u('/blog?tag=ml#post-3'), 'fr')).toBe('/fr/blog?tag=ml#post-3');
	});
	it('carries query + hash for the en (identity) direction', () => {
		expect(localizeUrl(u('/projects?service=web'), 'en')).toBe('/projects?service=web');
		expect(localizeUrl(u('/fr/projects?service=web'), 'en')).toBe('/projects?service=web');
	});
	it('is idempotent on already-localized paths', () => {
		expect(localizeUrl(u('/fr/projects?tag=a'), 'fr')).toBe('/fr/projects?tag=a');
	});
	it('works with no query or hash', () => {
		expect(localizeUrl(u('/about'), 'fr')).toBe('/fr/about');
		expect(localizeUrl(u('/'), 'fr')).toBe('/fr');
	});
	it('preserves a hash-only URL', () => {
		expect(localizeUrl(u('/about#contact'), 'fr')).toBe('/fr/about#contact');
	});
});

describe('isLocaleSwitch (snapshot/restore gate)', () => {
	it('is true for the same canonical page in a different locale', () => {
		expect(isLocaleSwitch('/about', '/fr/about')).toBe(true);
		expect(isLocaleSwitch('/fr/about', '/about')).toBe(true);
		expect(isLocaleSwitch('/', '/fr')).toBe(true);
		expect(isLocaleSwitch('/fr', '/')).toBe(true);
		expect(isLocaleSwitch('/projects', '/fr/projects')).toBe(true);
	});
	it('is false for a different page (a real navigation, not a switch)', () => {
		expect(isLocaleSwitch('/about', '/projects')).toBe(false);
		expect(isLocaleSwitch('/about', '/fr/projects')).toBe(false);
		expect(isLocaleSwitch('/fr/about', '/fr/projects')).toBe(false);
	});
	it('is false when the locale is unchanged', () => {
		expect(isLocaleSwitch('/about', '/about')).toBe(false);
		expect(isLocaleSwitch('/fr/about', '/fr/about')).toBe(false);
		expect(isLocaleSwitch('/', '/')).toBe(false);
	});
});

describe('stripLocaleSegment', () => {
	it('strips the optional-param segment from route ids', () => {
		expect(stripLocaleSegment('/[[lang=locale]]')).toBe('/');
		expect(stripLocaleSegment('/[[lang=locale]]/about')).toBe('/about');
		expect(stripLocaleSegment('/[[lang=locale]]/services/[id]')).toBe('/services/[id]');
	});
	it('passes non-localized ids through', () => {
		expect(stripLocaleSegment('/')).toBe('/');
		expect(stripLocaleSegment('/og/[type=ogType]/[slug].png')).toBe('/og/[type=ogType]/[slug].png');
		expect(stripLocaleSegment('/__error')).toBe('/__error');
	});
});

describe('localeFromParams', () => {
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
