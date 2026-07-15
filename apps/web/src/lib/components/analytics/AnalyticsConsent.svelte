<script lang="ts">
	import { onMount } from 'svelte';
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
		class="analytics-consent fixed inset-x-4 mx-auto sm:inset-x-6"
	>
		<div class="consent-layout">
			<div class="consent-copy">
				<h2 id="analytics-consent-title" class="sr-only">{title}</h2>
				<div class="consent-disclosure">
					<p id="analytics-consent-description" class="consent-description">
						{description}
					</p>{' '}
					<a
						data-testid="analytics-consent-privacy"
						href={privacyHref}
						class="consent-privacy"
					>
						{privacyLabel}
					</a>
				</div>
			</div>

			<div class="consent-actions">
				<Button
					variant="ghost"
					size="cta-sm"
					class="min-h-11 min-w-0 w-full px-3 leading-tight whitespace-normal sm:w-auto sm:px-5 sm:whitespace-nowrap"
					data-testid="analytics-consent-decline"
					onclick={() => analyticsConsentStore.deny()}
				>
					{declineLabel}
				</Button>
				<Button
					variant="default"
					size="cta-sm"
					class="min-h-11 min-w-0 w-full px-3 leading-tight whitespace-normal hover:translate-y-0 hover:shadow-none sm:w-auto sm:px-5 sm:whitespace-nowrap"
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
	.analytics-consent {
		bottom: calc(1rem + env(safe-area-inset-bottom, 0px));
		z-index: calc(var(--z-sheet) + 1);
		max-width: var(--container-wide);
		background: color-mix(in srgb, var(--surface-2) 96%, transparent);
		border: 0;
		border-radius: var(--radius-lg);
		box-shadow: 0 10px 30px rgb(0 0 0 / 0.18);
		backdrop-filter: blur(18px) saturate(115%);
		-webkit-backdrop-filter: blur(18px) saturate(115%);
		animation: analytics-consent-in var(--duration-fast) var(--ease-out) both;
	}

	.consent-layout {
		display: grid;
		gap: 0.75rem;
		padding: 0.875rem 1rem;
	}

	.consent-copy {
		min-width: 0;
	}

	.consent-disclosure {
		color: var(--secondary-foreground);
		font-size: var(--text-small);
		line-height: 1.5;
	}

	.consent-description {
		display: inline;
		margin: 0;
	}

	.consent-privacy {
		color: var(--foreground);
		text-decoration: underline;
		text-decoration-color: color-mix(in srgb, var(--primary) 70%, transparent);
		text-underline-offset: 0.2em;
		white-space: nowrap;
		transition: color var(--duration-fast) var(--ease-out);
	}

	.consent-privacy:hover,
	.consent-privacy:focus-visible {
		color: var(--primary);
	}

	.consent-actions {
		display: grid;
		grid-template-columns: max-content minmax(0, 1fr);
		width: 100%;
		min-width: 0;
		justify-content: end;
		align-items: stretch;
		gap: 0.5rem;
	}

	@media (min-width: 48rem) {
		.consent-layout {
			grid-template-columns: minmax(0, 1fr) auto;
			align-items: center;
			column-gap: 1.25rem;
		}

		.consent-actions {
			grid-template-columns: max-content max-content;
			width: auto;
			align-items: center;
		}
	}

	@keyframes analytics-consent-in {
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
		.analytics-consent {
			animation: none;
		}
	}
</style>
