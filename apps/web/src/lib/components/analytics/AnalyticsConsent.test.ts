import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';

const consentMock = vi.hoisted(() => {
	type State = {
		choice: 'unknown' | 'granted' | 'denied';
		ready: boolean;
		available: boolean;
		preferencesOpen: boolean;
	};
	type Subscriber = (state: State) => void;
	type FocusSubscriber = (request: number) => void;

	let state: State = {
		choice: 'unknown',
		ready: false,
		available: false,
		preferencesOpen: false,
	};
	const subscribers = new Set<Subscriber>();
	const focusSubscribers = new Set<FocusSubscriber>();
	let focusRequest = 0;
	const store = {
		subscribe(run: Subscriber) {
			run(state);
			subscribers.add(run);
			return () => subscribers.delete(run);
		},
		preferencesFocusRequests: {
			subscribe(run: FocusSubscriber) {
				run(focusRequest);
				focusSubscribers.add(run);
				return () => focusSubscribers.delete(run);
			},
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
		requestFocus() {
			focusRequest += 1;
			for (const subscriber of focusSubscribers) subscriber(focusRequest);
		},
		reset() {
			state = {
				choice: 'unknown',
				ready: false,
				available: false,
				preferencesOpen: false,
			};
			focusRequest = 0;
			for (const subscriber of focusSubscribers) subscriber(focusRequest);
			store.init.mockClear();
			store.grant.mockClear();
			store.deny.mockClear();
			store.openPreferences.mockClear();
		},
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

vi.mock('$lib/content', () => ({
	siteLabels: {
		ui: {
			analyticsConsent: {
				get enabled() {
					return controlsMock.enabled;
				},
				get showBanner() {
					return controlsMock.showBanner;
				},
				title: {
					en: 'Can I count this visit?',
					fr: 'Je peux compter cette visite?',
					es: '¿Puedo contar esta visita?',
				},
				description: {
					en: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies or form fields.',
					fr: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun témoin ni champ de formulaire.',
					es: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies ni campos de formulario.',
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
			'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies or form fields.',
		accept: 'Allow analytics',
		decline: 'No thanks',
		privacy: 'Privacy details',
		privacyHref: '/legal/privacy',
	},
	fr: {
		title: 'Je peux compter cette visite?',
		description:
			'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun témoin ni champ de formulaire.',
		accept: 'Autoriser l’analytique',
		decline: 'Non merci',
		privacy: 'Détails sur la vie privée',
		privacyHref: '/fr/legal/privacy',
	},
	es: {
		title: '¿Puedo contar esta visita?',
		description:
			'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies ni campos de formulario.',
		accept: 'Permitir analítica',
		decline: 'No, gracias',
		privacy: 'Detalles de privacidad',
		privacyHref: '/es/legal/privacy',
	},
} as const;

const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
let scrollIntoView: ReturnType<typeof vi.fn>;

beforeEach(() => {
	controlsMock.set();
	consentMock.reset();
	scrollIntoView = vi.fn();
	Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
		configurable: true,
		value: scrollIntoView,
	});
});
afterEach(() => {
	cleanup();
	vi.restoreAllMocks();
	if (originalScrollIntoView) {
		Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', {
			configurable: true,
			value: originalScrollIntoView,
		});
	} else {
		Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
	}
});

describe('AnalyticsConsent', () => {
	it('obeys the visual gate while still initializing consent state', () => {
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		render(AnalyticsConsent, { props: { canShow: false } });

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
		expect(consentMock.store.init).toHaveBeenCalledOnce();
	});

	it('renders a quiet consent rail with semantic copy relationships and shared actions', () => {
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

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
		consentMock.set({
			choice: 'unknown',
			ready: false,
			available: true,
			preferencesOpen: false,
		});

		render(AnalyticsConsent);

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
	});

	it.each([
		{ choice: 'unknown', ready: true, available: false, preferencesOpen: false },
		{ choice: 'granted', ready: true, available: true, preferencesOpen: false },
		{ choice: 'denied', ready: true, available: true, preferencesOpen: false },
	] as const)('is hidden for state $choice/$available', (state) => {
		consentMock.set(state);

		render(AnalyticsConsent);

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
	});

	it.each(Object.entries(localizedCopy))(
		'renders exact %s copy and a localized privacy route',
		(locale, copy) => {
			consentMock.set({
				choice: 'unknown',
				ready: true,
				available: true,
				preferencesOpen: false,
			});

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
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		render(AnalyticsConsent);

		await fireEvent.click(screen.getByTestId('analytics-consent-accept'));

		expect(consentMock.store.grant).toHaveBeenCalledOnce();
	});

	it('denies consent once from the decline button', async () => {
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		render(AnalyticsConsent);

		await fireEvent.click(screen.getByTestId('analytics-consent-decline'));

		expect(consentMock.store.deny).toHaveBeenCalledOnce();
	});

	it('initializes the consent store on mount', () => {
		render(AnalyticsConsent);

		expect(consentMock.store.init).toHaveBeenCalledOnce();
	});

	it('hides a fresh unknown choice in enabled hidden mode', () => {
		controlsMock.set(true, false);
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		render(AnalyticsConsent);

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
		expect(consentMock.store.init).toHaveBeenCalledOnce();
	});

	it('force-opens preferences in enabled hidden mode', () => {
		controlsMock.set(true, false);
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});

		render(AnalyticsConsent);

		expect(screen.getByTestId('analytics-consent')).toBeInTheDocument();
	});

	it('renders explicitly opened preferences while the homepage intro gate is closed', () => {
		consentMock.set({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: true,
		});

		render(AnalyticsConsent, { props: { canShow: false } });

		expect(screen.getByTestId('analytics-consent')).toBeInTheDocument();
	});

	it.each([
		['granted', 'analytics-consent-accept', 'analytics-consent-decline'],
		['denied', 'analytics-consent-decline', 'analytics-consent-accept'],
	] as const)('marks the current %s choice in preferences mode', (choice, activeId, inactiveId) => {
		consentMock.set({
			choice,
			ready: true,
			available: true,
			preferencesOpen: true,
		});

		render(AnalyticsConsent);

		expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Analytics preferences');
		expect(screen.getByTestId(activeId)).toHaveAttribute('aria-pressed', 'true');
		expect(screen.getByTestId(activeId)).toHaveClass('consent-choice-active');
		expect(screen.getByTestId(inactiveId)).toHaveAttribute('aria-pressed', 'false');
		expect(screen.getByTestId(inactiveId)).not.toHaveClass('consent-choice-active');
	});

	it('moves focus and smooth-scrolls to newly opened preferences', async () => {
		vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: true,
		});

		render(AnalyticsConsent);

		const rail = screen.getByTestId('analytics-consent');
		expect(rail).toHaveAttribute('id', 'analytics-consent');
		expect(rail).toHaveAttribute('tabindex', '-1');
		await vi.waitFor(() => expect(rail).toHaveFocus());
		expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'nearest' });
	});

	it('uses instant scrolling for reduced motion and refocuses on every explicit reopen', async () => {
		vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true } as MediaQueryList);
		const openState = {
			choice: 'denied' as const,
			ready: true,
			available: true,
			preferencesOpen: true,
		};
		consentMock.set(openState);
		render(AnalyticsConsent);
		const rail = screen.getByTestId('analytics-consent');
		await vi.waitFor(() => expect(rail).toHaveFocus());

		const elsewhere = document.createElement('button');
		document.body.append(elsewhere);
		elsewhere.focus();
		consentMock.requestFocus();

		await vi.waitFor(() => expect(rail).toHaveFocus());
		expect(scrollIntoView).toHaveBeenCalledTimes(2);
		expect(scrollIntoView).toHaveBeenLastCalledWith({ behavior: 'auto', block: 'nearest' });
		elsewhere.remove();
	});

	it('updates an open choice without stealing focus for an external store publication', async () => {
		vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as MediaQueryList);
		consentMock.set({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		render(AnalyticsConsent);
		const rail = screen.getByTestId('analytics-consent');
		await vi.waitFor(() => expect(rail).toHaveFocus());

		const privacy = screen.getByTestId('analytics-consent-privacy');
		privacy.focus();
		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		await tick();
		await tick();

		expect(privacy).toHaveFocus();
		expect(screen.getByTestId('analytics-consent-accept')).toHaveAttribute(
			'aria-pressed',
			'true',
		);
		expect(scrollIntoView).toHaveBeenCalledOnce();
	});

	it('does not steal focus for the initial undecided prompt', async () => {
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: false,
		});

		render(AnalyticsConsent);
		await Promise.resolve();

		expect(screen.getByTestId('analytics-consent')).not.toHaveFocus();
		expect(scrollIntoView).not.toHaveBeenCalled();
	});

	it('stays hidden when analytics is disabled, even if preferences are open', () => {
		controlsMock.set(false, false);
		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});

		render(AnalyticsConsent);

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
	});
});
