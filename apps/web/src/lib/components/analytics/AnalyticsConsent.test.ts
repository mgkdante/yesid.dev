import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';

const consentMock = vi.hoisted(() => {
	type State = {
		choice: 'unknown' | 'granted' | 'denied';
		ready: boolean;
		available: boolean;
	};
	type Subscriber = (state: State) => void;

	let state: State = { choice: 'unknown', ready: false, available: false };
	const subscribers = new Set<Subscriber>();
	const store = {
		subscribe(run: Subscriber) {
			run(state);
			subscribers.add(run);
			return () => subscribers.delete(run);
		},
		init: vi.fn(() => () => {}),
		grant: vi.fn(),
		deny: vi.fn(),
		openPreferences: vi.fn(),
	};

	return {
		store,
		set(next: State) {
			state = next;
			for (const subscriber of subscribers) subscriber(state);
		},
		reset() {
			state = { choice: 'unknown', ready: false, available: false };
			store.init.mockClear();
			store.grant.mockClear();
			store.deny.mockClear();
			store.openPreferences.mockClear();
		},
	};
});

vi.mock('$lib/state/analytics-consent.svelte', () => ({
	analyticsConsentStore: consentMock.store,
}));

vi.mock('$lib/content', () => ({
	siteLabels: {
		ui: {
			analyticsConsent: {
				title: {
					en: 'Can I count this visit?',
					fr: 'Je peux compter cette visite?',
					es: '¿Puedo contar esta visita?',
				},
				description: {
					en: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies, names, emails, or form content.',
					fr: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun cookie, nom, courriel ni contenu de formulaire.',
					es: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies, nombres, correos ni contenido de formularios.',
				},
				acceptLabel: {
					en: 'Allow analytics',
					fr: 'Autoriser l’analytique',
					es: 'Permitir analítica',
				},
				declineLabel: { en: 'No thanks', fr: 'Non merci', es: 'No, gracias' },
				settingsLabel: {
					en: 'Analytics preferences',
					fr: 'Préférences d’analytique',
					es: 'Preferencias de analítica',
				},
				privacyLabel: {
					en: 'Privacy details',
					fr: 'Détails sur la vie privée',
					es: 'Detalles de privacidad',
				},
			},
		},
	},
}));

import AnalyticsConsent from './AnalyticsConsent.svelte';

const localizedCopy = {
	en: {
		title: 'Can I count this visit?',
		description:
			'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies, names, emails, or form content.',
		accept: 'Allow analytics',
		decline: 'No thanks',
		privacy: 'Privacy details',
		privacyHref: '/legal/privacy',
	},
	fr: {
		title: 'Je peux compter cette visite?',
		description:
			'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun cookie, nom, courriel ni contenu de formulaire.',
		accept: 'Autoriser l’analytique',
		decline: 'Non merci',
		privacy: 'Détails sur la vie privée',
		privacyHref: '/fr/legal/privacy',
	},
	es: {
		title: '¿Puedo contar esta visita?',
		description:
			'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies, nombres, correos ni contenido de formularios.',
		accept: 'Permitir analítica',
		decline: 'No, gracias',
		privacy: 'Detalles de privacidad',
		privacyHref: '/es/legal/privacy',
	},
} as const;

beforeEach(() => consentMock.reset());
afterEach(() => cleanup());

describe('AnalyticsConsent', () => {
	it('obeys the visual gate while still initializing consent state', () => {
		consentMock.set({ choice: 'unknown', ready: true, available: true });

		render(AnalyticsConsent, { props: { canShow: false } });

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
		expect(consentMock.store.init).toHaveBeenCalledOnce();
	});

	it('renders a quiet consent rail with semantic copy relationships and shared actions', () => {
		consentMock.set({ choice: 'unknown', ready: true, available: true });

		const { container } = render(AnalyticsConsent, {
			props: { locale: 'en', canShow: true },
		});

		const rail = screen.getByTestId('analytics-consent');
		const heading = screen.getByRole('heading', { level: 2, name: 'Can I count this visit?' });
		const accept = screen.getByTestId('analytics-consent-accept');
		const decline = screen.getByTestId('analytics-consent-decline');

		expect(rail).toHaveClass('analytics-consent');
		expect(rail).toHaveAttribute('aria-labelledby', 'analytics-consent-title');
		expect(rail).toHaveAttribute('aria-describedby', 'analytics-consent-description');
		expect(heading).toHaveClass('sr-only');
		expect(container.querySelector('.station-rule')).toBeNull();
		expect(container.querySelector('.station-dot')).toBeNull();
		expect(container.querySelector('[data-slot="corner-marks"]')).toBeNull();
		for (const action of [decline, accept]) {
			expect(action.tagName).toBe('BUTTON');
			expect(action).toHaveAttribute('data-slot', 'button');
			expect(action).toHaveClass('min-h-11');
		}
	});

	it('is hidden until consent state is ready', () => {
		consentMock.set({ choice: 'unknown', ready: false, available: true });

		render(AnalyticsConsent);

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
	});

	it.each([
		{ choice: 'unknown', ready: true, available: false },
		{ choice: 'granted', ready: true, available: true },
		{ choice: 'denied', ready: true, available: true },
	] as const)('is hidden for state $choice/$available', (state) => {
		consentMock.set(state);

		render(AnalyticsConsent);

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
	});

	it.each(Object.entries(localizedCopy))(
		'renders exact %s copy and a localized privacy route',
		(locale, copy) => {
			consentMock.set({ choice: 'unknown', ready: true, available: true });

			render(AnalyticsConsent, {
				props: { locale: locale as keyof typeof localizedCopy },
			});

			expect(screen.getByTestId('analytics-consent')).toBeInTheDocument();
			expect(screen.getByText(copy.title)).toBeInTheDocument();
			expect(screen.getByText(copy.description)).toBeInTheDocument();
			expect(screen.getByTestId('analytics-consent-accept')).toHaveTextContent(copy.accept);
			expect(screen.getByTestId('analytics-consent-decline')).toHaveTextContent(copy.decline);
			expect(screen.getByTestId('analytics-consent-privacy')).toHaveTextContent(copy.privacy);
			expect(screen.getByTestId('analytics-consent-privacy')).toHaveAttribute(
				'href',
				copy.privacyHref,
			);
		},
	);

	it('grants consent once from the accept button', async () => {
		consentMock.set({ choice: 'unknown', ready: true, available: true });
		render(AnalyticsConsent);

		await fireEvent.click(screen.getByTestId('analytics-consent-accept'));

		expect(consentMock.store.grant).toHaveBeenCalledOnce();
	});

	it('denies consent once from the decline button', async () => {
		consentMock.set({ choice: 'unknown', ready: true, available: true });
		render(AnalyticsConsent);

		await fireEvent.click(screen.getByTestId('analytics-consent-decline'));

		expect(consentMock.store.deny).toHaveBeenCalledOnce();
	});

	it('initializes the consent store on mount', () => {
		render(AnalyticsConsent);

		expect(consentMock.store.init).toHaveBeenCalledOnce();
	});
});
