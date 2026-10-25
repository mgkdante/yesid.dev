<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { trackPageview } from '#lib/analytics/client.ts';
	import { getAnalyticsPolicy } from '@yesid/analytics/policy';
	import { siteLabels } from '#lib/content/index.ts';
	import { analyticsConsentStore } from '#lib/state/analytics-consent.svelte.ts';
	import { homeIntroStore } from '#lib/state/home-intro.svelte.ts';
	import { createPathnamePageviewTracker } from '@yesid/analytics/client';
	import AnalyticsConsent from './AnalyticsConsent.svelte';
	import type { Locale } from '#lib/types.ts';

	let { locale, isHome = false }: { locale: Locale; isHome?: boolean } = $props();
	let currentUrl = $state<URL | null>(null);
	const canShowConsent = $derived(!isHome || $homeIntroStore === 'settled');
	const analyticsPolicy = $derived(
		getAnalyticsPolicy(siteLabels.ui.analyticsConsent, $analyticsConsentStore),
	);

	const reportPathname = createPathnamePageviewTracker((url) => trackPageview(url));

	afterNavigate(({ to, shallow, type }) => {
		if (shallow && type === 'goto') return;

		currentUrl = to?.url ?? null;
		if (analyticsPolicy.canTrack && currentUrl) {
			reportPathname(currentUrl);
		}
	});

	$effect(() => {
		if (analyticsPolicy.canTrack && currentUrl) {
			reportPathname(currentUrl);
		}
	});
</script>

<AnalyticsConsent locale={locale} canShow={canShowConsent} />
