<script lang="ts">
	import { onMount } from 'svelte';
	import { siteLabels } from '$lib/content';
	import { analyticsConsentStore } from '$lib/state/analytics-consent.svelte';
	import { DEFAULT_LOCALE, resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import type { Locale } from '$lib/types';

	let { locale = DEFAULT_LOCALE }: { locale?: Locale } = $props();

	const title = $derived(resolveLocale(siteLabels.ui.analyticsConsent.title, locale));
	const description = $derived(
		resolveLocale(siteLabels.ui.analyticsConsent.description, locale),
	);
	const acceptLabel = $derived(resolveLocale(siteLabels.ui.analyticsConsent.acceptLabel, locale));
	const declineLabel = $derived(resolveLocale(siteLabels.ui.analyticsConsent.declineLabel, locale));
	const privacyLabel = $derived(resolveLocale(siteLabels.ui.analyticsConsent.privacyLabel, locale));
	const privacyHref = $derived(localizeHref('/legal/privacy', locale));

	onMount(() => analyticsConsentStore.init());
</script>

{#if $analyticsConsentStore.ready && $analyticsConsentStore.available && $analyticsConsentStore.choice === 'unknown'}
	<section
		data-testid="analytics-consent"
		aria-labelledby="analytics-consent-title"
		aria-describedby="analytics-consent-description"
		class="fixed inset-x-4 bottom-4 z-[100] mx-auto max-w-3xl border border-[var(--border)] bg-[var(--background)] p-5 shadow-2xl sm:inset-x-6 sm:p-6"
	>
		<div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
			<div class="max-w-2xl">
				<h2 id="analytics-consent-title" class="font-heading text-lg font-bold text-[var(--foreground)]">
					{title}
				</h2>
				<p
					id="analytics-consent-description"
					class="mt-2 text-small leading-relaxed text-[var(--secondary-foreground)]"
				>
					{description}
				</p>
				<a
					data-testid="analytics-consent-privacy"
					href={privacyHref}
					class="mt-2 inline-block text-small text-[var(--secondary-foreground)] underline decoration-[var(--primary)] underline-offset-4 hover:text-primary"
				>
					{privacyLabel}
				</a>
			</div>
			<div class="flex shrink-0 flex-wrap gap-3">
				<button
					type="button"
					data-testid="analytics-consent-decline"
					class="border border-[var(--border)] px-4 py-2 text-small font-semibold text-[var(--foreground)] transition-colors hover:border-[var(--primary)] hover:text-primary"
					onclick={() => analyticsConsentStore.deny()}
				>
					{declineLabel}
				</button>
				<button
					type="button"
					data-testid="analytics-consent-accept"
					class="bg-[var(--primary)] px-4 py-2 text-small font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
					onclick={() => analyticsConsentStore.grant()}
				>
					{acceptLabel}
				</button>
			</div>
		</div>
	</section>
{/if}
