import { describe, expect, it, vi } from 'vitest';
import {
	ANALYTICS_EVENTS,
	PLAUSIBLE_CONFIG,
	createAnalyticsClient,
	createPathnamePageviewTracker,
	sanitizeAnalyticsUrl,
	type AnalyticsEventName,
} from './analytics';

type PlausibleModule = typeof import('@plausible-analytics/tracker');

function createTrackerModule(options?: {
	init?: PlausibleModule['init'];
	track?: PlausibleModule['track'];
}): PlausibleModule {
	return {
		DEFAULT_FILE_TYPES: [],
		init: options?.init ?? vi.fn(),
		track: options?.track ?? vi.fn(),
	};
}

function createClient(options?: {
	canTrack?: () => boolean;
	module?: PlausibleModule;
	loadTracker?: () => Promise<PlausibleModule>;
}) {
	const module = options?.module ?? createTrackerModule();
	const loadTracker = vi.fn(options?.loadTracker ?? (async () => module));
	const client = createAnalyticsClient({
		loadTracker,
		canTrack: options?.canTrack ?? (() => true),
	});

	return { client, loadTracker, module };
}

describe('sanitizeAnalyticsUrl', () => {
	it('preserves locale paths and removes the hash', () => {
		const url = new URL('https://yesid.dev/fr/services/data-engineering#contact');

		expect(sanitizeAnalyticsUrl(url)).toBe(
			'https://yesid.dev/fr/services/data-engineering',
		);
	});

	it('keeps only non-empty acquisition values in canonical key order', () => {
		const url = new URL(
			'https://yesid.dev/es/work/transit' +
				'?session_id=secret' +
				'&utm_term=rail' +
				'&utm_source=google' +
				'&utm_source=' +
				'&ref=partner' +
				'&source=newsletter' +
				'&utm_medium=cpc' +
				'&utm_campaign=summer' +
				'&utm_content=hero' +
				'&utm_term=montreal' +
				'&project=private' +
				'#internal-state',
		);

		expect(sanitizeAnalyticsUrl(url)).toBe(
			'https://yesid.dev/es/work/transit' +
				'?utm_source=google' +
				'&utm_medium=cpc' +
				'&utm_campaign=summer' +
				'&utm_content=hero' +
				'&utm_term=rail' +
				'&utm_term=montreal' +
				'&ref=partner' +
				'&source=newsletter',
		);
	});
});

describe('createPathnamePageviewTracker', () => {
	it('deduplicates by pathname while allowing a changed pathname', () => {
		const send = vi.fn();
		const track = createPathnamePageviewTracker(send);

		expect(track(new URL('https://yesid.dev/fr/work?utm_source=one'))).toBe(true);
		expect(track(new URL('https://yesid.dev/fr/work?utm_source=two#details'))).toBe(false);
		expect(track(new URL('https://yesid.dev/fr/contact?utm_source=two'))).toBe(true);

		expect(send).toHaveBeenCalledTimes(2);
		expect(send.mock.calls.map(([url]) => url.pathname)).toEqual(['/fr/work', '/fr/contact']);
	});
});

describe('createAnalyticsClient', () => {
	it('enables only the exact production hostname', async () => {
		const { client, loadTracker, module } = createClient();

		await client.trackEvent('booking_click', new URL('https://yesid.dev/contact'));

		expect(loadTracker).toHaveBeenCalledOnce();
		expect(module.track).toHaveBeenCalledWith('booking_click', {
			url: 'https://yesid.dev/contact',
		});
	});

	it.each([
		'https://www.yesid.dev/contact',
		'https://dev.yesid.dev/contact',
		'https://yesid-dev-git-main.vercel.app/contact',
		'http://localhost:5173/contact',
		'http://127.0.0.1:5173/contact',
		'http://[::1]:5173/contact',
	])('does not load the tracker on disabled hostname %s', async (href) => {
		const { client, loadTracker } = createClient();

		await client.trackEvent('booking_click', new URL(href));

		expect(loadTracker).not.toHaveBeenCalled();
	});

	it('does not load before consent and can track the same pathname after consent', async () => {
		let consent = false;
		const { client, loadTracker, module } = createClient({
			canTrack: () => consent,
		});
		const url = new URL('https://yesid.dev/fr/contact');

		await client.trackPageview(url);
		expect(loadTracker).not.toHaveBeenCalled();

		consent = true;
		await client.trackPageview(url);

		expect(loadTracker).toHaveBeenCalledOnce();
		expect(module.track).toHaveBeenCalledWith('pageview', {
			url: 'https://yesid.dev/fr/contact',
		});
	});

	it('initializes once with the exact manual-only config', async () => {
		const init = vi.fn<PlausibleModule['init']>();
		const module = createTrackerModule({ init });
		const { client, loadTracker } = createClient({ module });

		await Promise.all([
			client.trackEvent('contact_form_success', new URL('https://yesid.dev/contact')),
			client.trackEvent('booking_click', new URL('https://yesid.dev/contact')),
		]);

		expect(loadTracker).toHaveBeenCalledOnce();
		expect(init).toHaveBeenCalledOnce();
		expect(init).toHaveBeenCalledWith({
			domain: 'yesid.dev',
			autoCapturePageviews: false,
			outboundLinks: false,
			fileDownloads: false,
			formSubmissions: false,
			captureOnLocalhost: false,
			logging: false,
			bindToWindow: true,
		});
		expect(PLAUSIBLE_CONFIG).toEqual(init.mock.calls[0]?.[0]);
	});

	it('sends sanitized pageviews and the two typed custom events without properties', async () => {
		const track = vi.fn<PlausibleModule['track']>();
		const module = createTrackerModule({ track });
		const { client } = createClient({ module });
		const eventNames: AnalyticsEventName[] = [...ANALYTICS_EVENTS];

		await client.trackPageview(
			new URL('https://yesid.dev/fr/work/transit?email=private&utm_source=portfolio#details'),
		);
		for (const eventName of eventNames) {
			await client.trackEvent(
				eventName,
				new URL('https://yesid.dev/contact?token=private&ref=calendar#form'),
			);
		}

		expect(track.mock.calls).toEqual([
			[
				'pageview',
				{ url: 'https://yesid.dev/fr/work/transit?utm_source=portfolio' },
			],
			['contact_form_success', { url: 'https://yesid.dev/contact?ref=calendar' }],
			['booking_click', { url: 'https://yesid.dev/contact?ref=calendar' }],
		]);
		for (const [, options] of track.mock.calls) {
			expect(options).toEqual({ url: expect.any(String) });
			expect(options).not.toHaveProperty('props');
		}
	});

	it('rechecks consent after a pending import before sending', async () => {
		let consent = true;
		let resolveTracker!: (module: PlausibleModule) => void;
		const pendingTracker = new Promise<PlausibleModule>((resolve) => {
			resolveTracker = resolve;
		});
		const init = vi.fn<PlausibleModule['init']>();
		const track = vi.fn<PlausibleModule['track']>();
		const module = createTrackerModule({ init, track });
		const { client, loadTracker } = createClient({
			canTrack: () => consent,
			loadTracker: () => pendingTracker,
		});

		const request = client.trackEvent(
			'contact_form_success',
			new URL('https://yesid.dev/contact'),
		);
		expect(loadTracker).toHaveBeenCalledOnce();

		consent = false;
		resolveTracker(module);
		await request;

		expect(init).toHaveBeenCalledOnce();
		expect(track).not.toHaveBeenCalled();
	});

	it('caches an import failure without throwing or retrying', async () => {
		const loadTracker = vi.fn(async (): Promise<PlausibleModule> => {
			throw new Error('import failed');
		});
		const client = createAnalyticsClient({ loadTracker, canTrack: () => true });
		const url = new URL('https://yesid.dev/contact');

		await expect(client.trackEvent('booking_click', url)).resolves.toBeUndefined();
		await expect(client.trackEvent('booking_click', url)).resolves.toBeUndefined();

		expect(loadTracker).toHaveBeenCalledOnce();
	});

	it('caches an init failure without throwing or retrying', async () => {
		const init = vi.fn<PlausibleModule['init']>(() => {
			throw new Error('init failed');
		});
		const track = vi.fn<PlausibleModule['track']>();
		const module = createTrackerModule({ init, track });
		const { client, loadTracker } = createClient({ module });
		const url = new URL('https://yesid.dev/contact');

		await expect(client.trackEvent('booking_click', url)).resolves.toBeUndefined();
		await expect(client.trackEvent('booking_click', url)).resolves.toBeUndefined();

		expect(loadTracker).toHaveBeenCalledOnce();
		expect(init).toHaveBeenCalledOnce();
		expect(track).not.toHaveBeenCalled();
	});

	it('swallows tracker send failures', async () => {
		const track = vi.fn<PlausibleModule['track']>(() => {
			throw new Error('track failed');
		});
		const module = createTrackerModule({ track });
		const { client } = createClient({ module });

		await expect(
			client.trackEvent('booking_click', new URL('https://yesid.dev/contact')),
		).resolves.toBeUndefined();
	});
});
