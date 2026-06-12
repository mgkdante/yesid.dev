import { describe, expect, it } from 'vitest';
import {
	SITE_HOST,
	DEFAULT_OG_IMAGE,
	SITE_NAME,
	PUBLISHED_LOCALES,
	canonicalFor,
} from './seo-defaults';

describe('seo-defaults constants', () => {
	it('SITE_HOST has no trailing slash and is absolute', () => {
		expect(SITE_HOST).toMatch(/^https:\/\/[^/]+$/);
	});

	it('DEFAULT_OG_IMAGE is a root-relative path to an image', () => {
		expect(DEFAULT_OG_IMAGE.startsWith('/og/')).toBe(true);
		expect(DEFAULT_OG_IMAGE).toMatch(/\.(png|jpg|webp)$/);
	});

	it('SITE_NAME equals the brand wordmark', () => {
		expect(SITE_NAME).toBe('yesid.');
	});

	it('PUBLISHED_LOCALES is a non-empty subset of SUPPORTED_LOCALES and includes en', () => {
		expect(PUBLISHED_LOCALES.length).toBeGreaterThan(0);
		expect(PUBLISHED_LOCALES).toContain('en');
	});
});

describe('canonicalFor', () => {
	it('returns absolute SITE_HOST + path for default locale EN', () => {
		expect(canonicalFor('/about', 'en')).toBe(`${SITE_HOST}/about`);
	});

	it('returns absolute SITE_HOST for root route', () => {
		expect(canonicalFor('/', 'en')).toBe(SITE_HOST);
	});

	it('non-EN locales self-canonicalize to the EN URL while unpublished (slice-28.6 /fr scheme)', () => {
		// /fr path-prefix scheme: published non-EN locales get /{locale}; an
		// UNPUBLISHED prefix locale self-canonicalizes to the EN URL so /fr can
		// be QA'd live pre-flip without index pollution.
		expect(canonicalFor('/about', 'fr')).toBe(`${SITE_HOST}/about`);
	});

	it('strips any trailing slash', () => {
		expect(canonicalFor('/about/', 'en')).toBe(`${SITE_HOST}/about`);
	});

	it('delocalizes before resolving (idempotent on prefixed input)', () => {
		expect(canonicalFor('/fr/about', 'en')).toBe(`${SITE_HOST}/about`);
		expect(canonicalFor('/fr/about', 'fr')).toBe(`${SITE_HOST}/about`); // fr unpublished today
	});

	it('unpublished prefix locales self-canonicalize to the EN URL (pre-flip crawl safety)', () => {
		expect(canonicalFor('/', 'fr')).toBe(SITE_HOST);
	});
});
