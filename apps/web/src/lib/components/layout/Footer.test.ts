import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';

const consentMock = vi.hoisted(() => {
	type State = {
		choice: 'unknown' | 'granted' | 'denied';
		ready: boolean;
		available: boolean;
		preferencesOpen: boolean;
	};
	type Subscriber = (state: State) => void;

	let state: State = {
		choice: 'unknown',
		ready: false,
		available: false,
		preferencesOpen: false,
	};
	const subscribers = new Set<Subscriber>();
	const openPreferences = vi.fn();

	return {
		store: {
			subscribe(run: Subscriber) {
				run(state);
				subscribers.add(run);
				return () => subscribers.delete(run);
			},
			openPreferences,
		},
		set(next: State) {
			state = next;
			for (const subscriber of subscribers) subscriber(state);
		},
		reset() {
			state = {
				choice: 'unknown',
				ready: false,
				available: false,
				preferencesOpen: false,
			};
			openPreferences.mockClear();
		},
		openPreferences,
	};
});

const controlsMock = vi.hoisted(() => {
	let enabled: boolean | undefined;
	let showBanner: boolean | undefined;

	return {
		get enabled() {
			return enabled;
		},
		get showBanner() {
			return showBanner;
		},
		set(nextEnabled?: boolean, nextShowBanner?: boolean) {
			enabled = nextEnabled;
			showBanner = nextShowBanner;
		},
	};
});

vi.mock('$lib/state/analytics-consent.svelte', () => ({
	analyticsConsentStore: consentMock.store,
}));

const fixtureSocial = vi.hoisted(() => ({
	github: 'https://example.com/code',
	linkedin: '',
	upwork: '',
}));

vi.mock('$lib/content', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/content')>();
	return {
		...actual,
		menuItems: [
			{ label: { en: 'Fallback route' }, href: '/fallback', priority: 1 },
			{ label: { en: 'Policy fixture' }, href: '/legal/fixture', priority: 1 },
		],
		siteMeta: { ...actual.siteMeta, links: fixtureSocial },
		siteLabels: {
			...actual.siteLabels,
			navChrome: {
				...actual.siteLabels.navChrome,
				shared: { ...actual.siteLabels.navChrome.shared, footerNavAria: { en: 'Explore fixture' } },
			},
			footerChrome: {
				...actual.siteLabels.footerChrome,
				footer: {
					...actual.siteLabels.footerChrome.footer,
					footerNavAria: { en: 'Explore fixture' },
					exploreLabel: { en: 'Explore fixture' },
					legalLabel: { en: 'Legal fixture' },
					connectLabel: { en: 'Connect fixture' },
				},
			},
			ui: {
				...actual.siteLabels.ui,
				analyticsConsent: {
					get enabled() {
						return controlsMock.enabled;
					},
					get showBanner() {
						return controlsMock.showBanner;
					},
					settingsLabel: {
						en: 'Analytics preferences',
						fr: 'Préférences d’analytique',
						es: 'Preferencias de analítica',
					},
				},
			},
		},
	};
});

import Footer from './Footer.svelte';

beforeEach(() => {
	controlsMock.set();
	fixtureSocial.github = 'https://example.com/code';
	fixtureSocial.linkedin = '';
	fixtureSocial.upwork = '';
	consentMock.reset();
});
afterEach(() => cleanup());

describe('Footer supplied content', () => {
	it('keeps supplied explore and legal groups separate in input order', () => {
		render(Footer, {
			footerLinks: [
				{ label: { en: 'Archive' }, href: '/archive', priority: 1 },
				{ label: { en: 'Policy' }, href: '/legal/policy', priority: 1 },
				{ label: { en: 'Studio' }, href: '/studio', priority: 2 },
			],
		});
		const explore = screen.getByRole('navigation', { name: 'Explore fixture' });
		expect([...explore.querySelectorAll('a')].map((a) => a.getAttribute('href'))).toEqual([
			'/archive',
			'/studio',
		]);
		expect(
			within(screen.getByTestId('footer-legal')).getByRole('link', { name: 'Policy' }),
		).toHaveAttribute('href', '/legal/policy');
		expect(screen.getByTestId('footer-wordmark')).toHaveAttribute('href', '/');
	});

	it('preserves the deliberate empty-input fallback without freezing the editorial inventory', () => {
		render(Footer, { footerLinks: [] });
		expect(screen.getByRole('link', { name: 'Fallback route' })).toHaveAttribute(
			'href',
			'/fallback',
		);
		expect(
			within(screen.getByTestId('footer-legal')).getByRole('link', { name: 'Policy fixture' }),
		).toHaveAttribute('href', '/legal/fixture');
	});

	it.each([
		['github', 'GitHub'],
		['linkedin', 'LinkedIn'],
		['upwork', 'Upwork'],
	] as const)(
		'renders the configured %s destination with external-link protections',
		(key, label) => {
			fixtureSocial.github = '';
			fixtureSocial[key] = 'https://example.com/profile';
			render(Footer);
			const link = screen.getByRole('link', { name: label });
			expect(link).toHaveAttribute('href', 'https://example.com/profile');
			expect(link).toHaveAttribute('target', '_blank');
			expect(link).toHaveAttribute('rel', 'me noopener noreferrer');
			expect(screen.getAllByRole('link', { name: /^(GitHub|LinkedIn|Upwork)$/ })).toHaveLength(1);
		},
	);

	it('supports no configured social links', () => {
		fixtureSocial.github = '';
		render(Footer);
		expect(screen.queryByRole('link', { name: 'GitHub' })).toBeNull();
	});

	it('keeps one address and the current date in the status bar', () => {
		render(Footer);
		expect(document.querySelectorAll('footer address')).toHaveLength(1);
		const now = new Date();
		const date = [
			now.getFullYear(),
			String(now.getMonth() + 1).padStart(2, '0'),
			String(now.getDate()).padStart(2, '0'),
		].join('.');
		expect(screen.getByText(new RegExp(date))).toBeInTheDocument();
	});
});

describe('Footer — locale threading (slice-28.6)', () => {
	it('renders footer nav labels via resolveLocale for fr', () => {
		render(Footer, {
			props: {
				locale: 'fr',
				footerLinks: [{ label: { en: 'Projects', fr: 'Projets' }, href: '/projects', priority: 1 }],
			},
		});
		expect(screen.getByText('Projets')).toBeInTheDocument();
	});

	it('never renders a locale switcher (operator trim — removed below the hazard rule)', () => {
		// Even with two published locales the footer status bar no longer carries
		// the EN|FR toggle (operator decision). Language switches via nav/route.
		render(Footer, { props: { locale: 'fr' } });
		expect(screen.queryByTestId('footer-locale-switch')).toBeNull();
	});

	it('localizes nav link hrefs and the wordmark for fr', () => {
		render(Footer, {
			props: {
				locale: 'fr',
				footerLinks: [{ label: { en: 'Projects', fr: 'Projets' }, href: '/projects', priority: 1 }],
			},
		});
		expect(screen.getByText('Projets').closest('a')).toHaveAttribute('href', '/fr/projects');
		expect(screen.getByTestId('footer-wordmark')).toHaveAttribute('href', '/fr');
	});
});

describe('Footer analytics preferences', () => {
	it.each([
		['en', 'Analytics preferences'],
		['fr', 'Préférences d’analytique'],
		['es', 'Preferencias de analítica'],
	] as const)('renders the %s settings label as a button', (locale, label) => {
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		render(Footer, { props: { locale } });

		const preferences = screen.getByTestId('analytics-preferences');
		expect(preferences).toHaveTextContent(label);
		expect(preferences.tagName).toBe('BUTTON');
		expect(preferences).not.toHaveAttribute('href');
		expect(preferences).toHaveAttribute('type', 'button');
		expect(preferences).toHaveAttribute('data-slot', 'footer-link');
		expect(preferences).toHaveAttribute('aria-controls', 'analytics-consent');
		expect(preferences).toHaveAttribute('aria-expanded', 'false');
	});

	it('reports the preferences rail as expanded when it is already open', () => {
		consentMock.set({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: true,
		});

		render(Footer);

		expect(screen.getByTestId('analytics-preferences')).toHaveAttribute('aria-expanded', 'true');
	});

	it('opens analytics preferences exactly once', async () => {
		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		render(Footer);

		await fireEvent.click(screen.getByTestId('analytics-preferences'));

		expect(consentMock.openPreferences).toHaveBeenCalledOnce();
	});

	it.each([
		{ choice: 'unknown', ready: false, available: true, preferencesOpen: false },
		{ choice: 'unknown', ready: true, available: false, preferencesOpen: false },
	] as const)('hides preferences until production-host state is ready', (state) => {
		consentMock.set(state);

		render(Footer);

		expect(screen.queryByTestId('analytics-preferences')).toBeNull();
	});

	it('keeps preferences available in enabled hidden mode after a saved denial', () => {
		controlsMock.set(true, false);
		consentMock.set({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		render(Footer);

		expect(screen.getByTestId('analytics-preferences')).toBeInTheDocument();
	});

	it('hides preferences when analytics is disabled, even with a saved grant', () => {
		controlsMock.set(false, false);
		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		render(Footer);

		expect(screen.queryByTestId('analytics-preferences')).toBeNull();
	});
});
