<script lang="ts">
	import type { ImpactMetric, Locale } from '#lib/types.ts';
	import { localeCopy } from '#lib/locales/index.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { intl } from '#lib/utils/locale-context.ts';

	let { metric, locale }: { metric: ImpactMetric; locale: Locale } = $props();
	const copy = $derived(localeCopy[locale].metricProof);
	const date = $derived(metric.asOf ? intl.dateTime(locale, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${metric.asOf}T00:00:00Z`)) : '');
</script>

{#if metric.sourceUrl || metric.asOf}
	<div class="metric-proof" data-testid="metric-proof">
		{#if metric.sourceUrl}
			<a href={metric.sourceUrl} aria-label="{copy.source}: {resolveLocale(metric.label, locale)}" rel="noopener noreferrer">{copy.source}</a>
		{/if}
		{#if metric.asOf}
			<time datetime={metric.asOf}>{copy.asOf} {date}</time>
		{/if}
	</div>
{/if}

<style>
	.metric-proof {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.25rem 0.75rem;
		margin-top: 0.5rem;
		font-size: var(--text-small);
		line-height: 1.5;
		color: var(--secondary-foreground);
		overflow-wrap: anywhere;
	}
	a { color: var(--foreground); text-decoration: underline; text-underline-offset: 0.2em; }
	a:focus-visible { outline: 2px solid var(--primary); outline-offset: 3px; border-radius: 2px; }
</style>
