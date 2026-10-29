import { PUBLIC_PLAUSIBLE_DOMAIN } from '$app/env/public';
import { createAnalytics, type Analytics } from '@yesid/analytics/client';
import { YESID_ANALYTICS_PRESET, type AnalyticsEventName } from './preset';

let analytics: Analytics<AnalyticsEventName> | undefined;

/** Starts measurement once, from the root layout's mount. */
export function startAnalytics(): void {
	analytics ??= createAnalytics(YESID_ANALYTICS_PRESET, { domain: PUBLIC_PLAUSIBLE_DOMAIN });
}

export function trackAnalyticsEvent(name: AnalyticsEventName): void {
	analytics?.trackEvent(name);
}
