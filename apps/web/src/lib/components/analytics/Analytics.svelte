<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { trackPageview } from '$lib/analytics/client';
	import { analyticsConsentStore } from '$lib/state/analytics-consent.svelte';
	import { homeIntroStore } from '$lib/state/home-intro.svelte';
	import { createPathnamePageviewTracker } from '$lib/utils/analytics';
	import AnalyticsConsent from './AnalyticsConsent.svelte';
	import type { Locale } from '$lib/types';

	let { locale, isHome = false }: { locale: Locale; isHome?: boolean } = $props();
	let currentUrl = $state<URL | null>(null);
	const canShowConsent = $derived(!isHome || $homeIntroStore === 'settled');

	const reportPathname = createPathnamePageviewTracker((url) => {
		trackPageview(url);
	});

	afterNavigate(({ to }) => {
		currentUrl = to?.url ?? null;
		if ($analyticsConsentStore.choice === 'granted' && currentUrl) {
			reportPathname(currentUrl);
		}
	});

	$effect(() => {
		if ($analyticsConsentStore.choice === 'granted' && currentUrl) {
			reportPathname(currentUrl);
		}
	});
</script>

<AnalyticsConsent {locale} canShow={canShowConsent} />
