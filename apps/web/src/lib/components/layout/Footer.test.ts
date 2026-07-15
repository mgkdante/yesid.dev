import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

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

vi.mock('$lib/content', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/content')>();
	return {
		...actual,
		siteLabels: {
			...actual.siteLabels,
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
	consentMock.reset();
});
afterEach(() => cleanup());

describe('Footer', () => {
	it('renders a footer element', () => {
		render(Footer);
		expect(screen.getByTestId('footer')).toBeInTheDocument();
	});

	it('renders the yesid wordmark', () => {
		render(Footer);
		expect(screen.getByTestId('footer-wordmark')).toBeInTheDocument();
		expect(screen.getByTestId('footer-wordmark').textContent).toContain('yesid');
	});

	it('does not render a copyright line (operator trim below the hazard rule)', () => {
		render(Footer);
		expect(screen.queryByText(/©/)).toBeNull();
	});

	it('renders footer navigation with aria-label', () => {
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		expect(nav).toBeInTheDocument();
	});

	it('renders all 6 site navigation links', () => {
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		const links = nav.querySelectorAll('a');
		expect(links.length).toBe(6);
	});

	it('renders links to Services, Projects, Blog, Stack, About, Contact', () => {
		// slice-18m: nav order is CMS-controlled (editors set `sort` per row in
		// Directus). Assert SET membership, not order.
		render(Footer);
		const nav = screen.getByRole('navigation', { name: /footer navigation/i });
		const navLinks = nav.querySelectorAll('a');
		const hrefs = Array.from(navLinks).map((a) => a.getAttribute('href'));
		expect(new Set(hrefs)).toEqual(
			new Set(['/services', '/projects', '/tech-stack', '/blog', '/about', '/contact']),
		);
	});

	it('renders GitHub social link with target=_blank', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /github/i });
		expect(link).toHaveAttribute('href', 'https://github.com/mgkdante');
		expect(link).toHaveAttribute('target', '_blank');
		expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
	});

	it('renders LinkedIn social link with target=_blank', () => {
		render(Footer);
		const link = screen.getByRole('link', { name: /linkedin/i });
		expect(link).toHaveAttribute('href', 'https://www.linkedin.com/in/otaloray/');
		expect(link).toHaveAttribute('target', '_blank');
	});

	it('renders the status bar with system date', () => {
		render(Footer);
		const now = new Date();
		const expectedDate = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
		expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument();
	});

	it('renders system online status text', () => {
		render(Footer);
		expect(screen.getByText(/system online/)).toBeInTheDocument();
	});

	it('renders location in a single address element — status bar only (operator trim)', () => {
		// The brand block dropped its location line; the status bar keeps it.
		render(Footer);
		const addresses = document.querySelectorAll('footer address');
		expect(addresses.length).toBe(1);
		expect(addresses[0]?.textContent).toContain('Montreal');
		expect(addresses[0]?.closest('.footer-status-border')).not.toBeNull();
	});

	it('renders the digital infrastructure tagline', () => {
		render(Footer);
		expect(screen.getByText(/digital infrastructure/)).toBeInTheDocument();
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
