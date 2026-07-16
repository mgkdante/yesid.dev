import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { siteLabels } from '$lib/content';
import {
	analyticsConsentStore,
	type AnalyticsConsentState,
} from '$lib/state/analytics-consent.svelte';
import {
	createAnalyticsClient,
	type AnalyticsClient,
	type AnalyticsEventName,
} from '$lib/utils/analytics';
import { getAnalyticsPolicy, type AnalyticsControlsInput } from './policy';
import type { PlausibleTransport } from './transport';

export interface SiteAnalyticsClientDependencies {
	isBrowser(): boolean;
	getControls(): AnalyticsControlsInput;
	getConsent(): AnalyticsConsentState;
	getReferrer(): string;
	loadTransport(): Promise<PlausibleTransport>;
}

export function createSiteAnalyticsClient(
	dependencies: SiteAnalyticsClientDependencies,
): AnalyticsClient {
	return createAnalyticsClient({
		loadTransport: dependencies.loadTransport,
		getReferrer: dependencies.getReferrer,
		canTrack: () =>
			dependencies.isBrowser() &&
			getAnalyticsPolicy(dependencies.getControls(), dependencies.getConsent()).canTrack,
	});
}

const client = createSiteAnalyticsClient({
	isBrowser: () => browser,
	getControls: () => siteLabels.ui.analyticsConsent,
	getConsent: () => get(analyticsConsentStore),
	getReferrer: () => (browser ? document.referrer : ''),
	loadTransport: () => import('./transport'),
});

export function trackPageview(url: URL): Promise<boolean> {
	return client.trackPageview(url);
}

export function trackAnalyticsEvent(name: AnalyticsEventName): void {
	if (!browser) return;
	void client.trackEvent(name, new URL(window.location.href));
}
