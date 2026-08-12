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
} from '@yesid/analytics/client';
import { getAnalyticsPolicy, type AnalyticsControlsInput } from '@yesid/analytics/policy';
import type { PlausibleTransport } from '@yesid/analytics/plausible';
import { YESID_ANALYTICS_PRESET, type AnalyticsEventName } from './preset';

export interface SiteAnalyticsClientDependencies {
	isBrowser(): boolean;
	getControls(): AnalyticsControlsInput;
	getConsent(): AnalyticsConsentState;
	getReferrer(): string;
	loadTransport(): Promise<PlausibleTransport>;
}

export function createSiteAnalyticsClient(
	dependencies: SiteAnalyticsClientDependencies,
): AnalyticsClient<AnalyticsEventName> {
	return createAnalyticsClient(YESID_ANALYTICS_PRESET, {
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
	loadTransport: () => import('@yesid/analytics/plausible'),
});

export function trackPageview(url: URL): Promise<boolean> {
	return client.trackPageview(url);
}

export function trackAnalyticsEvent(name: AnalyticsEventName): void {
	if (!browser) return;
	void client.trackEvent(name, new URL(window.location.href));
}
