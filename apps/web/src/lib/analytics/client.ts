import { browser } from '$app/environment';
import { get } from 'svelte/store';
import { analyticsConsentStore } from '$lib/state/analytics-consent.svelte';
import { createAnalyticsClient, type AnalyticsEventName } from '$lib/utils/analytics';

const client = createAnalyticsClient({
	loadTracker: () => import('@plausible-analytics/tracker/plausible.js'),
	canTrack: () => browser && get(analyticsConsentStore).choice === 'granted',
});

export function trackPageview(url: URL): void {
	void client.trackPageview(url);
}

export function trackAnalyticsEvent(name: AnalyticsEventName): void {
	if (!browser) return;
	void client.trackEvent(name, new URL(window.location.href));
}
