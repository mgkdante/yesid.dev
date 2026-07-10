<script lang="ts">
	import { onMount } from 'svelte';
	import { CornerMarks } from '$lib/components/brand';
	import { Button } from '$lib/components/ui/button';
	import { siteLabels } from '$lib/content';
	import { analyticsConsentStore } from '$lib/state/analytics-consent.svelte';
	import { DEFAULT_LOCALE, resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import type { Locale } from '$lib/types';

	let {
		locale = DEFAULT_LOCALE,
		canShow = true,
	}: {
		locale?: Locale;
		canShow?: boolean;
	} = $props();

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

{#if canShow && $analyticsConsentStore.ready && $analyticsConsentStore.available && $analyticsConsentStore.choice === 'unknown'}
	<section
		data-testid="analytics-consent"
		aria-labelledby="analytics-consent-title"
		aria-describedby="analytics-consent-description"
		class="analytics-station fixed inset-x-4 mx-auto max-w-4xl overflow-hidden sm:inset-x-6"
	>
		<div class="station-rule" aria-hidden="true"></div>
		<CornerMarks size="sm" opacity={0.35} />

		<div class="relative grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
			<div class="min-w-0 max-w-3xl">
				<div class="flex items-center gap-3">
					<span class="station-dot" aria-hidden="true"></span>
					<h2 id="analytics-consent-title" class="label-station leading-snug">
						{title}
					</h2>
				</div>
				<p
					id="analytics-consent-description"
					class="mt-3 text-small leading-relaxed text-[var(--secondary-foreground)]"
				>
					{description}
				</p>
				<a
					data-testid="analytics-consent-privacy"
					href={privacyHref}
					class="mt-3 inline-block text-small text-[var(--secondary-foreground)] underline decoration-[var(--primary)] underline-offset-4 transition-colors hover:text-primary"
				>
					{privacyLabel}
				</a>
			</div>

			<div class="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
				<Button
					variant="outline"
					size="cta-sm"
					class="min-h-11 w-full sm:w-auto"
					data-testid="analytics-consent-decline"
					onclick={() => analyticsConsentStore.deny()}
				>
					{declineLabel}
				</Button>
				<Button
					variant="default"
					size="cta-sm"
					class="min-h-11 w-full sm:w-auto"
					data-testid="analytics-consent-accept"
					onclick={() => analyticsConsentStore.grant()}
				>
					{acceptLabel}
				</Button>
			</div>
		</div>
	</section>
{/if}

<style>
	.analytics-station {
		bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		z-index: var(--z-sheet);
		background: var(--surface-2);
		border: 2px solid var(--border-brand);
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
		animation: analytics-station-in var(--duration-fast) var(--ease-out) both;
	}

	.station-rule {
		position: absolute;
		inset: 0 0 auto;
		height: 3px;
		background: var(--primary);
	}

	.station-dot {
		width: 0.625rem;
		height: 0.625rem;
		flex: 0 0 auto;
		border: 2px solid var(--primary);
		border-radius: var(--radius-pill);
		background: var(--reflective);
		box-shadow: var(--shadow-glow-sm);
	}

	@keyframes analytics-station-in {
		from {
			opacity: 0;
			transform: translateY(0.5rem);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.analytics-station {
			animation: none;
		}
	}
</style>
