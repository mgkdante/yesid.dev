import { PUBLIC_PLAUSIBLE_DOMAIN } from '$app/env/public';
import { createAnalytics, sanitizeAnalyticsUrl, type Analytics } from '@yesid/analytics/client';
// The /sveltekit entries import $app/stores, which SvelteKit 3 removed; the generic ones track pushState navigations.
import { inject as injectAnalytics } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';
import { YESID_ANALYTICS_PRESET, type AnalyticsEventName } from './preset';

let analytics: Analytics<AnalyticsEventName> | undefined;

/** Applies the Plausible URL rule to Vercel too: path and bounded campaign tags only. */
export function reduceVercelEvent<Event extends { url: string }>(event: Event): Event | null {
	try {
		return { ...event, url: sanitizeAnalyticsUrl(new URL(event.url, location.origin)) };
	} catch {
		return null;
	}
}

/**
 * Starts measurement once, from the root layout's mount: Plausible for pageviews and events,
 * Vercel Web Analytics for pageviews and Speed Insights for web vitals. Like Plausible, Vercel's
 * scripts start only on the production host: they exist only on Vercel deployments, and previews
 * would spend the Hobby event quota. Vercel custom events need Pro, so events go to Plausible only.
 */
export function startAnalytics(): void {
	if (analytics) return;
	analytics = createAnalytics(YESID_ANALYTICS_PRESET, { domain: PUBLIC_PLAUSIBLE_DOMAIN });
	if (!PUBLIC_PLAUSIBLE_DOMAIN || location.hostname !== PUBLIC_PLAUSIBLE_DOMAIN) return;
	injectAnalytics({ framework: 'sveltekit', mode: 'production', beforeSend: reduceVercelEvent });
	injectSpeedInsights({ framework: 'sveltekit', beforeSend: reduceVercelEvent });
}

export function trackAnalyticsEvent(name: AnalyticsEventName): void {
	analytics?.trackEvent(name);
}
