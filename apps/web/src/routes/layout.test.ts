import { describe, expect, it } from 'vitest';
import { load } from './+layout';
import { DEFAULT_LOCALE } from '$lib/utils/seo-defaults';
import {
	navLinks as staticNavLinks,
	menuItems as staticMenuItems,
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

function fakeEvent(data: Record<string, unknown> = {}) {
	return {
		data,
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

		expect(result.headerLinks).toEqual(staticNavLinks);
		expect(result.footerLinks).toEqual(staticMenuItems);
		expect(result.mobileLinks).toEqual([]);
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
});
