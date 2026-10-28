<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import { trackPageview } from '#lib/analytics/client.ts';
	import { getAnalyticsPolicy } from '@yesid/analytics/policy';
	import { createPathnamePageviewTracker } from '@yesid/analytics/client';
	import { AnalyticsConsent } from '@yesid/ui/feedback';
	import { siteLabels } from '#lib/content/index.ts';
	import { analyticsConsentStore } from '#lib/state/analytics-consent.svelte.ts';
	import { homeIntroStore } from '#lib/state/home-intro.svelte.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import type { Locale } from '#lib/types.ts';

	let { locale, isHome = false }: { locale: Locale; isHome?: boolean } = $props();
	let currentUrl = $state<URL | null>(null);
	const canShowConsent = $derived(!isHome || $homeIntroStore === 'settled');
	const analyticsPolicy = $derived(
		getAnalyticsPolicy(siteLabels.ui.analyticsConsent, $analyticsConsentStore),
	);
	const consentCopy = $derived({
		title: resolveLocale(siteLabels.ui.analyticsConsent.title, locale),
		description: resolveLocale(siteLabels.ui.analyticsConsent.description, locale),
		accept: resolveLocale(siteLabels.ui.analyticsConsent.acceptLabel, locale),
		decline: resolveLocale(siteLabels.ui.analyticsConsent.declineLabel, locale),
		settings: resolveLocale(siteLabels.ui.analyticsConsent.settingsLabel, locale),
		privacy: resolveLocale(siteLabels.ui.analyticsConsent.privacyLabel, locale),
	});

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

<AnalyticsConsent
	store={analyticsConsentStore}
	controls={siteLabels.ui.analyticsConsent}
	copy={consentCopy}
	privacyHref={localizeHref('/legal/privacy', locale)}
	canShow={canShowConsent}
	id="analytics-consent"
/>
