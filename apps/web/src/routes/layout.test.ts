import { describe, expect, it } from 'vitest';
import { load } from './+layout';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
import {
	navLinks as staticNavLinks,
	menuItems as staticMenuItems,
	footerLinks as staticFooterLinks,
	mobileLinks as staticMobileLinks,
	errorPageContent as staticErrorPageContent,
} from '$lib/content/nav';
import type { ErrorPageContent, NavLink } from '$lib/content/nav';
import type { PageSeo } from '$lib/types';

const fakeSeo: PageSeo = {
	title: { en: 'Custom route | yesid.dev' },
	description: { en: 'A practical page description long enough for the SEO schema to accept.' },
	canonical: 'https://yesid.dev/custom',
	ogType: 'website',
	noIndex: false,
};

const fakeHeaderLinks: readonly NavLink[] = [
	{ label: { en: 'Work' }, href: '/projects', priority: 1 },
];

const fakeErrorPage: ErrorPageContent = {
	label: { en: 'NOT FOUND' },
	heading: { en: 'Page not found' },
	description: { en: 'Try another route' },
	terminalLine: '$ route --status 404',
	suggestions: [],
};

function fakeEvent(data: Record<string, unknown> = {}, pathname = '/') {
	return {
		data,
		url: new URL(`https://yesid.dev${pathname}`),
	} as unknown as Parameters<typeof load>[0];
}

describe('+layout.ts load', () => {
	it('forwards seo, theme color, and slots from +layout.server.ts data', async () => {
		const result = await load(fakeEvent({
			seo: fakeSeo,
			themeColor: '#123456',
			headerLinks: fakeHeaderLinks,
			footerLinks: [],
			mobileLinks: [],
			menuItems: [],
			errorPage: fakeErrorPage,
		}));

		expect(result.seo).toEqual(fakeSeo);
		expect(result.themeColor).toBe('#123456');
		expect(result.headerLinks).toEqual(fakeHeaderLinks);
		expect(result.errorPage).toEqual(fakeErrorPage);
	});

	it('uses static fallbacks without touching the adapter when server slots are missing', async () => {
		const result = await load(fakeEvent({ seo: fakeSeo, themeColor: '#123456' }));

		// slice-27.1 T7: header / footer / mobile / menu are now distinct static
		// fallback sources (footer + mobile placements added to nav.ts so the
		// static adapter is byte-faithful to Directus). Each slot falls back to
		// its own export, not a shared `menuItems`.
		expect(result.headerLinks).toEqual(staticNavLinks);
		expect(result.footerLinks).toEqual(staticFooterLinks);
		expect(result.mobileLinks).toEqual(staticMobileLinks);
		expect(result.menuItems).toEqual(staticMenuItems);
		expect(result.errorPage).toEqual(staticErrorPageContent);
	});

	it('falls back to the static error SEO when server SEO is absent', async () => {
		const result = await load(fakeEvent());

		expect(result.seo.noIndex).toBe(true);
		expect(result.themeColor).toMatch(/^#/);
	});

	it('uses DEFAULT_LOCALE', () => {
		expect(DEFAULT_LOCALE).toBe('en');
	});

	it('forwards the server-derived locale; falls back to the URL locale', async () => {
		const withServer = await load(fakeEvent({ seo: fakeSeo, themeColor: '#123456', locale: 'fr' }));
		expect(withServer.locale).toBe('fr');
		const fromUrl = await load(fakeEvent({}, '/fr/about'));
		expect(fromUrl.locale).toBe('fr');
		const plain = await load(fakeEvent({}, '/about'));
		expect(plain.locale).toBe('en');
	});
});
