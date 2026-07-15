import { describe, expect, it, vi } from 'vitest';
import type { AnalyticsControlsInput } from './policy';
import type { PlausibleTransport } from './transport';
import type { AnalyticsConsentState } from '$lib/state/analytics-consent.svelte';
import { createSiteAnalyticsClient } from './client';

function createTransport(): PlausibleTransport {
	return {
		sendPlausibleEvent: vi.fn(async () => true),
	};
}

const OPERATIONAL_STATE: AnalyticsConsentState = {
	choice: 'unknown',
	ready: true,
	available: true,
	preferencesOpen: false,
};

function createHarness(options?: {
	controls?: AnalyticsControlsInput;
	consent?: AnalyticsConsentState;
	isBrowser?: boolean;
	referrer?: string;
	loadTransport?: () => Promise<PlausibleTransport>;
}) {
	const controls = options?.controls ?? {};
	let consent = options?.consent ?? OPERATIONAL_STATE;
	const isBrowser = options?.isBrowser ?? true;
	const transport = createTransport();
	const loadTransport = vi.fn(options?.loadTransport ?? (async () => transport));
	const client = createSiteAnalyticsClient({
		isBrowser: () => isBrowser,
		getControls: () => controls,
		getConsent: () => consent,
		getReferrer: () => options?.referrer ?? '',
		loadTransport,
	});

	return {
		client,
		loadTransport,
		transport,
		setConsent(next: AnalyticsConsentState) {
			consent = next;
		},
	};
}

describe('createSiteAnalyticsClient', () => {
	it('provides an injectable boundary for an explicit saved grant', async () => {
		expect(createSiteAnalyticsClient).toBeTypeOf('function');

		const transport = createTransport();
		const loadTransport = vi.fn(async () => transport);
		const client = createSiteAnalyticsClient({
			isBrowser: () => true,
			getControls: () => ({ enabled: true, showBanner: true }),
			getConsent: () => ({
				choice: 'granted',
				ready: true,
				available: true,
				preferencesOpen: false,
			}),
			getReferrer: () => '',
			loadTransport,
		});

		await client.trackEvent('booking_click', new URL('https://yesid.dev/contact'));

		expect(loadTransport).toHaveBeenCalledOnce();
		expect(transport.sendPlausibleEvent).toHaveBeenCalledWith({
			name: 'booking_click',
			url: 'https://yesid.dev/contact',
			domain: 'yesid.dev',
		});
	});

	it.each([
		{
			mode: 'explicit unknown',
			controls: { enabled: true, showBanner: true },
			consent: OPERATIONAL_STATE,
			allowed: false,
		},
		{
			mode: 'explicit grant',
			controls: { enabled: true, showBanner: true },
			consent: { ...OPERATIONAL_STATE, choice: 'granted' },
			allowed: true,
		},
		{
			mode: 'explicit denial',
			controls: { enabled: true, showBanner: true },
			consent: { ...OPERATIONAL_STATE, choice: 'denied' },
			allowed: false,
		},
		{
			mode: 'hidden unknown',
			controls: { enabled: true, showBanner: false },
			consent: OPERATIONAL_STATE,
			allowed: true,
		},
		{
			mode: 'hidden grant',
			controls: { enabled: true, showBanner: false },
			consent: { ...OPERATIONAL_STATE, choice: 'granted' },
			allowed: true,
		},
		{
			mode: 'hidden saved denial',
			controls: { enabled: true, showBanner: false },
			consent: { ...OPERATIONAL_STATE, choice: 'denied' },
			allowed: false,
		},
		{
			mode: 'disabled saved grant',
			controls: { enabled: false, showBanner: false },
			consent: { ...OPERATIONAL_STATE, choice: 'granted' },
			allowed: false,
		},
		{
			mode: 'hidden preferences open',
			controls: { enabled: true, showBanner: false },
			consent: { ...OPERATIONAL_STATE, choice: 'unknown', preferencesOpen: true },
			allowed: false,
		},
		{
			mode: 'hidden unavailable',
			controls: { enabled: true, showBanner: false },
			consent: { ...OPERATIONAL_STATE, available: false },
			allowed: false,
		},
		{
			mode: 'hidden not ready',
			controls: { enabled: true, showBanner: false },
			consent: { ...OPERATIONAL_STATE, ready: false },
			allowed: false,
		},
		{
			mode: 'legacy unknown',
			controls: {},
			consent: OPERATIONAL_STATE,
			allowed: false,
		},
		{
			mode: 'legacy grant',
			controls: {},
			consent: { ...OPERATIONAL_STATE, choice: 'granted' },
			allowed: true,
		},
	] as const)('gates pageviews and events in $mode mode', async ({ controls, consent, allowed }) => {
		const { client, loadTransport, transport } = createHarness({ controls, consent });
		const url = new URL('https://yesid.dev/projects?utm_source=portfolio');

		await client.trackPageview(url);
		await client.trackEvent('project_proof_click', url);

		if (allowed) {
			expect(loadTransport).toHaveBeenCalledOnce();
			expect(transport.sendPlausibleEvent).toHaveBeenCalledTimes(2);
			expect(transport.sendPlausibleEvent).toHaveBeenNthCalledWith(1, {
				name: 'pageview',
				url: 'https://yesid.dev/projects?utm_source=portfolio',
				domain: 'yesid.dev',
			});
			expect(transport.sendPlausibleEvent).toHaveBeenNthCalledWith(2, {
				name: 'project_proof_click',
				url: 'https://yesid.dev/projects?utm_source=portfolio',
				domain: 'yesid.dev',
			});
		} else {
			expect(loadTransport).not.toHaveBeenCalled();
			expect(transport.sendPlausibleEvent).not.toHaveBeenCalled();
		}
	});

	it('stays inert outside the browser without importing Plausible', async () => {
		const { client, loadTransport, transport } = createHarness({
			controls: { enabled: true, showBanner: false },
			consent: OPERATIONAL_STATE,
			isBrowser: false,
		});
		const url = new URL('https://yesid.dev/contact');

		await client.trackPageview(url);
		await client.trackEvent('booking_click', url);

		expect(loadTransport).not.toHaveBeenCalled();
		expect(transport.sendPlausibleEvent).not.toHaveBeenCalled();
	});

	it('does not consume a blocked pathname before a later grant', async () => {
		const { client, loadTransport, transport, setConsent } = createHarness({
			controls: { enabled: true, showBanner: true },
			consent: OPERATIONAL_STATE,
		});
		const url = new URL('https://yesid.dev/fr/contact?ref=portfolio');

		await client.trackPageview(url);
		expect(loadTransport).not.toHaveBeenCalled();

		setConsent({ ...OPERATIONAL_STATE, choice: 'granted' });
		await client.trackPageview(url);

		expect(loadTransport).toHaveBeenCalledOnce();
		expect(transport.sendPlausibleEvent).toHaveBeenCalledWith({
			name: 'pageview',
			url: 'https://yesid.dev/fr/contact?ref=portfolio',
			domain: 'yesid.dev',
		});
	});

	it('rechecks policy after a pending import and pauses before sending', async () => {
		let resolveTransport!: (transport: PlausibleTransport) => void;
		const pendingTransport = new Promise<PlausibleTransport>((resolve) => {
			resolveTransport = resolve;
		});
		const transport = createTransport();
		const { client, loadTransport, setConsent } = createHarness({
			controls: { enabled: true, showBanner: false },
			consent: OPERATIONAL_STATE,
			loadTransport: () => pendingTransport,
		});

		const request = client.trackEvent(
			'contact_form_success',
			new URL('https://yesid.dev/contact'),
		);
		expect(loadTransport).toHaveBeenCalledOnce();

		setConsent({ ...OPERATIONAL_STATE, preferencesOpen: true });
		resolveTransport(transport);
		await request;

		expect(transport.sendPlausibleEvent).not.toHaveBeenCalled();
	});

	it('retries the same pageview after preferences cancel a pending import', async () => {
		let resolveTransport!: (transport: PlausibleTransport) => void;
		const pendingTransport = new Promise<PlausibleTransport>((resolve) => {
			resolveTransport = resolve;
		});
		const transport = createTransport();
		const { client, loadTransport, setConsent } = createHarness({
			controls: { enabled: true, showBanner: false },
			consent: OPERATIONAL_STATE,
			loadTransport: () => pendingTransport,
		});
		const firstUrl = new URL('https://yesid.dev/projects?utm_source=portfolio');

		const firstRequest = client.trackPageview(firstUrl);
		expect(loadTransport).toHaveBeenCalledOnce();

		setConsent({ ...OPERATIONAL_STATE, preferencesOpen: true });
		resolveTransport(transport);
		await expect(firstRequest).resolves.toBe(false);
		expect(transport.sendPlausibleEvent).not.toHaveBeenCalled();

		setConsent({ ...OPERATIONAL_STATE, choice: 'granted' });
		await expect(
			client.trackPageview(new URL('https://yesid.dev/projects?ref=preferences')),
		).resolves.toBe(true);
		expect(loadTransport).toHaveBeenCalledOnce();
		expect(transport.sendPlausibleEvent).toHaveBeenCalledOnce();
		expect(transport.sendPlausibleEvent).toHaveBeenCalledWith({
			name: 'pageview',
			url: 'https://yesid.dev/projects?ref=preferences',
			domain: 'yesid.dev',
		});
	});
});
