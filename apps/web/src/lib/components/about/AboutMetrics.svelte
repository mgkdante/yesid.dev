<!--
  Four left-aligned facts share value and label tracks using row subgrids.
  Narrow cards use two corner pairs; roomy cards meet on two middle rows.
  Typography and accent colour come from the shared metric classes and tokens.
-->
<script lang="ts">
	import type { AboutMetric } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { cursorGlow } from '@yesid/motion/actions';
	import StopLabel from '#lib/components/brand/StopLabel.svelte';
	import { Card } from '@yesid/ui/card';

	let { metrics, stop, label }: { metrics: readonly AboutMetric[]; stop: string; label: string } = $props();
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="h-full p-3" data-testid="about-metrics">
	<div class="metrics-shell relative flex h-full flex-col">
		<StopLabel {stop} {label} as="h2" />

		<div class="metrics-grid">
			{#each metrics as metric}
				{@const metricLabel = resolveLocale(metric.label, locale)}

				<div class="fact">
					<span class="metric-value font-heading font-extrabold text-heading text-accent-text">{metric.value}</span>
					<span class="label-metric">{metricLabel}</span>
				</div>
			{/each}
		</div>
	</div>
</Card>
</div>

<style>
	.metrics-shell {
		container: about-facts / inline-size;
	}

	.metrics-grid {
		display: grid;
		flex: 1;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		grid-template-rows: auto auto minmax(1rem, 1fr) auto auto;
		gap: 0.5rem 1rem;
		margin-top: 1rem;
		text-align: left;
	}

	.fact {
		display: grid;
		grid-row: 1 / span 2;
		grid-template-rows: subgrid;
		min-width: 0;
	}

	.fact:nth-child(even) {
		grid-column: 2;
	}

	.fact:nth-child(n + 3) {
		grid-row: 4 / span 2;
	}

	.metric-value {
		align-self: end;
	}

	.label-metric {
		align-self: start;
		overflow-wrap: normal;
		word-break: normal;
		hyphens: none;
	}

	/* Four 128px columns plus three 16px gutters keep the mono labels readable.
	   The viewport guard keeps phones in corners even if their card is roomy. */
	@media (min-width: 640px) {
		@container about-facts (min-width: 560px) {
			.metrics-grid {
				grid-template-columns: repeat(4, minmax(0, 1fr));
				grid-template-rows: 1fr 1fr;
			}

			.fact:nth-child(n) {
				grid-column: auto;
				grid-row: 1 / span 2;
			}
		}
	}
</style>
