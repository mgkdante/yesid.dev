import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';

type ConsentState = {
	choice: 'unknown' | 'granted' | 'denied';
	ready: boolean;
	available: boolean;
	preferencesOpen: boolean;
};

type HomeIntroPhase = 'pending' | 'running' | 'settled';

type TestConsentStore = {
	subscribe: (run: (state: ConsentState) => void) => () => void;
	preferencesFocusRequests: { subscribe: (run: (request: number) => void) => () => void };
	init: ReturnType<typeof vi.fn<() => () => void>>;
	grant: ReturnType<typeof vi.fn<() => void>>;
	deny: ReturnType<typeof vi.fn<() => void>>;
	openPreferences: ReturnType<typeof vi.fn<() => void>>;
};

type Navigation = { to: { url: URL } | null };
type NavigationCallback = (navigation: Navigation) => void;

const navigationMock = vi.hoisted(() => {
	const activeCallbacks = new Set<NavigationCallback>();

	return {
		activeCallbacks,
		afterNavigate: vi.fn<(callback: NavigationCallback) => void>(),
		visit(url: URL | null) {
			for (const callback of [...activeCallbacks]) {
				callback({ to: url ? { url } : null });
			}
		},
	};
});

const consentMock = vi.hoisted(() => ({
	store: undefined as unknown as TestConsentStore,
	set: undefined as unknown as (state: ConsentState) => void,
}));

const introMock = vi.hoisted(() => ({
	store: undefined as unknown as {
		subscribe: (run: (phase: HomeIntroPhase) => void) => () => void;
		begin: () => void;
		settle: () => void;
		reset: () => void;
	},
	set: undefined as unknown as (phase: HomeIntroPhase) => void,
}));

const analyticsMock = vi.hoisted(() => ({
	trackPageview: vi.fn<(url: URL) => Promise<boolean>>(),
}));

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

vi.mock('$app/navigation', async () => {
	const { onMount } = await import('svelte');

	navigationMock.afterNavigate.mockImplementation((callback) => {
		onMount(() => {
			navigationMock.activeCallbacks.add(callback);
			return () => navigationMock.activeCallbacks.delete(callback);
		});
	});

	return { afterNavigate: navigationMock.afterNavigate };
});

vi.mock('$lib/state/analytics-consent.svelte', async () => {
	const { writable } = await import('svelte/store');
	const state = writable<ConsentState>({
		choice: 'unknown',
		ready: true,
		available: true,
		preferencesOpen: false,
	});
	const preferencesFocusRequests = writable(0);

	consentMock.set = state.set;
	consentMock.store = {
		subscribe: state.subscribe,
		preferencesFocusRequests,
		init: vi.fn(() => () => {}),
		grant: vi.fn(),
		deny: vi.fn(),
		openPreferences: vi.fn(),
	};

	return { analyticsConsentStore: consentMock.store };
});

vi.mock('$lib/state/home-intro.svelte', async () => {
	const { writable } = await import('svelte/store');
	const state = writable<HomeIntroPhase>('pending');

	introMock.set = state.set;
	introMock.store = {
		subscribe: state.subscribe,
		begin: () => state.set('running'),
		settle: () => state.set('settled'),
		reset: () => state.set('pending'),
	};

	return { homeIntroStore: introMock.store };
});

vi.mock('$lib/analytics/client', () => ({
	trackPageview: analyticsMock.trackPageview,
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
					en: 'English analytics description.',
					fr: 'Description française de l’analytique.',
					es: 'Descripción española de analítica.',
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

import Analytics from './Analytics.svelte';

beforeEach(() => {
	controlsMock.set();
	consentMock.set({
		choice: 'unknown',
		ready: true,
		available: true,
		preferencesOpen: false,
	});
	introMock.set('pending');
	consentMock.store.init.mockClear();
	consentMock.store.grant.mockClear();
	consentMock.store.deny.mockClear();
	consentMock.store.openPreferences.mockClear();
	navigationMock.afterNavigate.mockClear();
	analyticsMock.trackPageview.mockReset();
	analyticsMock.trackPageview.mockResolvedValue(true);
});

afterEach(() => cleanup());

describe('Analytics', () => {
	it('defers only the home consent surface until the intro settles', async () => {
		render(Analytics, { props: { locale: 'en', isHome: true } });

		expect(screen.queryByTestId('analytics-consent')).toBeNull();

		introMock.set('settled');
		await tick();
		expect(screen.getByTestId('analytics-consent')).toBeInTheDocument();

		introMock.set('running');
		await tick();
		expect(screen.queryByTestId('analytics-consent')).toBeNull();
	});

	it('shows an unknown consent choice immediately on non-home routes', () => {
		render(Analytics, { props: { locale: 'en', isHome: false } });

		expect(screen.getByTestId('analytics-consent')).toBeInTheDocument();
	});

	it('tracks the consent transition and pathname changes without query or hash duplicates', async () => {
		render(Analytics, { props: { locale: 'fr' } });

		expect(screen.getByText('Je peux compter cette visite?')).toBeInTheDocument();
		expect(navigationMock.afterNavigate).toHaveBeenCalledOnce();
		expect(navigationMock.activeCallbacks).toHaveLength(1);

		const currentUrl = new URL(
			'https://yesid.dev/fr/services/data-engineering?utm_source=portfolio',
		);
		navigationMock.visit(currentUrl);
		await tick();

		expect(analyticsMock.trackPageview).not.toHaveBeenCalled();

		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		await tick();

		expect(analyticsMock.trackPageview).toHaveBeenCalledOnce();
		expect(analyticsMock.trackPageview).toHaveBeenLastCalledWith(currentUrl);

		for (const href of [
			'https://yesid.dev/fr/services/data-engineering?tag=rail',
			'https://yesid.dev/fr/services/data-engineering?stack=svelte',
			'https://yesid.dev/fr/services/data-engineering?bp=tablet',
			'https://yesid.dev/fr/services/data-engineering?utm_source=google',
			'https://yesid.dev/fr/services/data-engineering#contact',
		]) {
			navigationMock.visit(new URL(href));
			await tick();
		}

		expect(analyticsMock.trackPageview).toHaveBeenCalledOnce();

		const projectsUrl = new URL('https://yesid.dev/fr/projects?utm_source=portfolio');
		navigationMock.visit(projectsUrl);
		await tick();

		await vi.waitFor(() => {
			expect(analyticsMock.trackPageview.mock.calls).toEqual([
				[currentUrl],
				[projectsUrl],
			]);
		});

		navigationMock.visit(null);
		await tick();

		expect(analyticsMock.trackPageview).toHaveBeenCalledTimes(2);
	});

	it('retains a denied destination for the first pageview after consent is granted', async () => {
		render(Analytics, { props: { locale: 'en' } });
		consentMock.set({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		await tick();

		const deniedUrl = new URL('https://yesid.dev/contact?ref=portfolio');
		navigationMock.visit(deniedUrl);
		await tick();

		expect(analyticsMock.trackPageview).not.toHaveBeenCalled();

		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		await tick();

		expect(analyticsMock.trackPageview).toHaveBeenCalledOnce();
		expect(analyticsMock.trackPageview).toHaveBeenCalledWith(deniedUrl);
	});

	it('registers one live observer per mount and removes it on unmount', async () => {
		const first = render(Analytics, { props: { locale: 'en' } });

		expect(navigationMock.afterNavigate).toHaveBeenCalledOnce();
		expect(navigationMock.activeCallbacks).toHaveLength(1);

		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		await tick();
		consentMock.set({
			choice: 'denied',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		await tick();

		expect(navigationMock.afterNavigate).toHaveBeenCalledOnce();
		expect(navigationMock.activeCallbacks).toHaveLength(1);

		first.unmount();
		expect(navigationMock.activeCallbacks).toHaveLength(0);

		navigationMock.visit(new URL('https://yesid.dev/unmounted'));
		expect(analyticsMock.trackPageview).not.toHaveBeenCalled();

		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		const second = render(Analytics, { props: { locale: 'es' } });

		expect(navigationMock.afterNavigate).toHaveBeenCalledTimes(2);
		expect(navigationMock.activeCallbacks).toHaveLength(1);

		const remountedUrl = new URL('https://yesid.dev/es/projects');
		navigationMock.visit(remountedUrl);
		await tick();

		expect(analyticsMock.trackPageview).toHaveBeenCalledOnce();
		expect(analyticsMock.trackPageview).toHaveBeenCalledWith(remountedUrl);

		second.unmount();
		expect(navigationMock.activeCallbacks).toHaveLength(0);
	});

	it('tracks the first hidden-mode pageview without rendering the prompt', async () => {
		controlsMock.set(true, false);
		render(Analytics, { props: { locale: 'en' } });

		const currentUrl = new URL('https://yesid.dev/projects?utm_source=portfolio');
		navigationMock.visit(currentUrl);
		await tick();

		expect(screen.queryByTestId('analytics-consent')).toBeNull();
		expect(analyticsMock.trackPageview).toHaveBeenCalledOnce();
		expect(analyticsMock.trackPageview).toHaveBeenCalledWith(currentUrl);
	});

	it('never tracks when analytics is disabled, even with a saved grant', async () => {
		controlsMock.set(false, false);
		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		render(Analytics, { props: { locale: 'en' } });

		navigationMock.visit(new URL('https://yesid.dev/contact'));
		await tick();

		expect(analyticsMock.trackPageview).not.toHaveBeenCalled();
		expect(screen.queryByTestId('analytics-consent')).toBeNull();
	});

	it('pauses while preferences are open and reports an unconsumed destination after grant', async () => {
		controlsMock.set(true, false);
		render(Analytics, { props: { locale: 'en' } });

		const firstUrl = new URL('https://yesid.dev/projects');
		navigationMock.visit(firstUrl);
		await tick();
		expect(analyticsMock.trackPageview).toHaveBeenCalledWith(firstUrl);

		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		const pausedUrl = new URL('https://yesid.dev/contact?ref=projects');
		navigationMock.visit(pausedUrl);
		await tick();

		expect(analyticsMock.trackPageview).toHaveBeenCalledTimes(1);
		expect(screen.getByTestId('analytics-consent')).toBeInTheDocument();

		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		await tick();

		await vi.waitFor(() => {
			expect(analyticsMock.trackPageview.mock.calls).toEqual([[firstUrl], [pausedUrl]]);
		});
		navigationMock.visit(new URL('https://yesid.dev/contact?ref=footer#form'));
		await tick();
		expect(analyticsMock.trackPageview).toHaveBeenCalledTimes(2);
	});

	it('retries the current pathname when preferences cancel a pending pageview', async () => {
		let resolvePageview!: (sent: boolean) => void;
		const pendingPageview = new Promise<boolean>((resolve) => {
			resolvePageview = resolve;
		});
		analyticsMock.trackPageview.mockImplementationOnce(() => pendingPageview);
		controlsMock.set(true, false);
		render(Analytics, { props: { locale: 'en' } });

		const currentUrl = new URL('https://yesid.dev/projects?utm_source=portfolio');
		navigationMock.visit(currentUrl);
		await tick();
		expect(analyticsMock.trackPageview).toHaveBeenCalledOnce();

		consentMock.set({
			choice: 'unknown',
			ready: true,
			available: true,
			preferencesOpen: true,
		});
		resolvePageview(false);
		await pendingPageview;
		await tick();

		consentMock.set({
			choice: 'granted',
			ready: true,
			available: true,
			preferencesOpen: false,
		});
		await tick();

		expect(analyticsMock.trackPageview).toHaveBeenCalledTimes(2);
		expect(analyticsMock.trackPageview).toHaveBeenNthCalledWith(1, currentUrl);
		expect(analyticsMock.trackPageview).toHaveBeenNthCalledWith(2, currentUrl);
	});
});
