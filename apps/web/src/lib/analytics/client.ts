import { dev } from '$app/env';
import { PUBLIC_PLAUSIBLE_DOMAIN } from '$app/env/public';
import { createAnalytics, type Analytics } from '@yesid/analytics/client';
import { injectAnalytics } from '@vercel/analytics/sveltekit';
import { injectSpeedInsights } from '@vercel/speed-insights/sveltekit';
import { YESID_ANALYTICS_PRESET, type AnalyticsEventName } from './preset';

let analytics: Analytics<AnalyticsEventName> | undefined;

/**
 * Starts measurement once, from the root layout's mount: Plausible for pageviews and events,
 * Vercel Web Analytics for pageviews and Speed Insights for web vitals. Vercel custom events
 * need a Pro plan, so events go to Plausible only.
 */
export function startAnalytics(): void {
	if (analytics) return;
	analytics = createAnalytics(YESID_ANALYTICS_PRESET, { domain: PUBLIC_PLAUSIBLE_DOMAIN });
	injectAnalytics({ mode: dev ? 'development' : 'production' });
	injectSpeedInsights();
}

export function trackAnalyticsEvent(name: AnalyticsEventName): void {
	analytics?.trackEvent(name);
}
