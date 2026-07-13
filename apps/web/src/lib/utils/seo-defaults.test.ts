import { describe, expect, it } from 'vitest';
import {
	SITE_HOST,
	DEFAULT_OG_IMAGE,
	SITE_NAME,
	SERVICE_AREAS,
	PUBLISHED_LOCALES,
	canonicalFor,
	localizeOgCard,
} from './seo-defaults';

// Every committed OG card the resolver may localize. Resolved at build time so
// a missing .fr/.es sibling fails the suite instead of shipping a 404 og:image.
const ogAssets = import.meta.glob('/static/og/**/*.png');

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

	it('advertises Montréal as the only public service area', () => {
		expect(SERVICE_AREAS).toEqual(['Montréal']);
	});

	it('PUBLISHED_LOCALES is a non-empty subset of SUPPORTED_LOCALES and includes en', () => {
		expect(PUBLISHED_LOCALES.length).toBeGreaterThan(0);
		expect(PUBLISHED_LOCALES).toContain('en');
	});
});

describe('localizeOgCard', () => {
	const CARDS = [
		'/og/routes/about.png',
		'/og/routes/contact.png',
		'/og/routes/projects.png',
		'/og/routes/services.png',
		'/og/services/database-engineering.png',
		'/og/services/data-pipeline.png',
		'/og/services/analytics-reporting.png',
		'/og/services/web-development.png',
	];

	it('swaps route + service cards to the per-locale sibling for fr/es', () => {
		for (const url of CARDS) {
			expect(localizeOgCard(url, 'fr')).toBe(url.replace(/\.png$/, '.fr.png'));
			expect(localizeOgCard(url, 'es')).toBe(url.replace(/\.png$/, '.es.png'));
		}
	});

	it('leaves EN cards on the legacy no-suffix base', () => {
		for (const url of CARDS) expect(localizeOgCard(url, 'en')).toBe(url);
	});

	it('passes through already locale-aware and dynamic URLs untouched', () => {
		const passthrough = [
			'/og/project/my-project.png?locale=fr',
			'/og/blog/my-post.png',
			'https://yesid.dev/images/work/cover.png',
			'/og/default.fr.png',
		];
		for (const url of passthrough) {
			expect(localizeOgCard(url, 'fr')).toBe(url);
			expect(localizeOgCard(url, 'es')).toBe(url);
		}
	});

	it('every localizable card ships committed fr + es siblings (no 404s)', () => {
		const have = new Set(Object.keys(ogAssets));
		for (const url of CARDS) {
			for (const loc of ['fr', 'es'] as const) {
				const sibling = `/static${url.replace(/\.png$/, `.${loc}.png`)}`;
				expect(have.has(sibling), `${sibling} missing`).toBe(true);
			}
		}
	});
});

describe('canonicalFor', () => {
	it('returns absolute SITE_HOST + path for default locale EN', () => {
		expect(canonicalFor('/about', 'en')).toBe(`${SITE_HOST}/about`);
	});

	it('returns absolute SITE_HOST for root route', () => {
		expect(canonicalFor('/', 'en')).toBe(SITE_HOST);
	});

	it('published non-EN locales canonicalize to their own prefixed URL (FR live)', () => {
		// /fr path-prefix scheme: a PUBLISHED non-EN locale canonicalizes to its
		// own /{locale} URL. (An unpublished prefix locale self-canonicalizes to
		// the EN URL for pre-flip crawl safety — see localizeHref.)
		expect(canonicalFor('/about', 'fr')).toBe(`${SITE_HOST}/fr/about`);
	});

	it('strips any trailing slash', () => {
		expect(canonicalFor('/about/', 'en')).toBe(`${SITE_HOST}/about`);
	});

	it('delocalizes before resolving (idempotent on prefixed input)', () => {
		expect(canonicalFor('/fr/about', 'en')).toBe(`${SITE_HOST}/about`);
		expect(canonicalFor('/fr/about', 'fr')).toBe(`${SITE_HOST}/fr/about`); // fr published
	});

	it('published prefix locales canonicalize to their own home URL (FR live)', () => {
		expect(canonicalFor('/', 'fr')).toBe(`${SITE_HOST}/fr`);
	});
});
