type PlausibleModule = typeof import('@plausible-analytics/tracker');

export const PLAUSIBLE_DOMAIN = 'yesid.dev';
export const ANALYTICS_EVENTS = ['contact_form_success', 'booking_click'] as const;
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export const PLAUSIBLE_CONFIG = {
	domain: PLAUSIBLE_DOMAIN,
	autoCapturePageviews: false,
	outboundLinks: false,
	fileDownloads: false,
	formSubmissions: false,
	captureOnLocalhost: false,
	logging: false,
	bindToWindow: true,
} satisfies Parameters<PlausibleModule['init']>[0];

const ACQUISITION_KEYS = [
	'utm_source',
	'utm_medium',
	'utm_campaign',
	'utm_content',
	'utm_term',
	'ref',
	'source',
] as const;

export interface AnalyticsClientDependencies {
	loadTracker(): Promise<PlausibleModule>;
	canTrack(): boolean;
}

export interface AnalyticsClient {
	trackPageview(url: URL): Promise<void>;
	trackEvent(name: AnalyticsEventName, url: URL): Promise<void>;
}

export function sanitizeAnalyticsUrl(url: URL): string {
	const sanitized = new URL(url.pathname, url.origin);

	for (const key of ACQUISITION_KEYS) {
		for (const value of url.searchParams.getAll(key)) {
			if (value !== '') sanitized.searchParams.append(key, value);
		}
	}

	return sanitized.toString();
}

export function createPathnamePageviewTracker(
	send: (url: URL) => void,
): (url: URL) => boolean {
	let lastPathname: string | undefined;

	return (url) => {
		if (url.pathname === lastPathname) return false;

		lastPathname = url.pathname;
		send(url);
		return true;
	};
}

export function createAnalyticsClient(
	dependencies: AnalyticsClientDependencies,
): AnalyticsClient {
	let trackerPromise: Promise<PlausibleModule | null> | undefined;

	function isEnabled(url: URL): boolean {
		if (url.hostname !== PLAUSIBLE_DOMAIN) return false;
		try {
			return dependencies.canTrack();
		} catch {
			return false;
		}
	}

	function load(): Promise<PlausibleModule | null> {
		trackerPromise ??= (async () => {
			try {
				const tracker = await dependencies.loadTracker();
				tracker.init(PLAUSIBLE_CONFIG);
				return tracker;
			} catch {
				return null;
			}
		})();

		return trackerPromise;
	}

	async function send(
		name: 'pageview' | AnalyticsEventName,
		url: URL,
	): Promise<void> {
		if (!isEnabled(url)) return;

		const tracker = await load();
		if (!tracker || !isEnabled(url)) return;

		try {
			tracker.track(name, { url: sanitizeAnalyticsUrl(url) });
		} catch {}
	}

	let pendingPageview = Promise.resolve();
	const trackPathname = createPathnamePageviewTracker((url) => {
		pendingPageview = send('pageview', url);
	});

	return {
		async trackPageview(url): Promise<void> {
			if (!isEnabled(url) || !trackPathname(url)) return;
			await pendingPageview;
		},
		async trackEvent(name, url): Promise<void> {
			await send(name, url);
		},
	};
}
