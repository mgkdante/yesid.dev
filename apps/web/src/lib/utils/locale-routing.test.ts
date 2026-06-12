import { describe, it, expect } from 'vitest';
import {
	PREFIX_LOCALES,
	pathLocale,
	delocalizePath,
	localizeHref,
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
