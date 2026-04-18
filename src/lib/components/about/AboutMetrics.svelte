<!--
  Stat counter row — Style B: Dividers + Gradient Accents.
  Vertical gradient dividers between stats. Orange underline per number.
  Short uppercase labels. Stripe-inspired.
  Stop number computed from prop.
-->
<script lang="ts">
	import type { AboutMetric } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { MetricDisplay } from '$lib/components/brand';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { metrics, stop = '01', label = 'METRICS' }: { metrics: readonly AboutMetric[]; stop?: string; label?: string } = $props();
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="h-full p-3" data-testid="about-metrics">
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<div class="flex flex-1 flex-col gap-4 md:flex-row md:items-center md:justify-around md:gap-0">
			{#each metrics as metric, i}
				{@const metricLabel = resolveLocale(metric.label, 'en')}

				<!-- Divider (not before first item) -->
				{#if i > 0}
					<div
						class="hidden h-12 w-px md:block"
						style="background: linear-gradient(180deg, transparent, var(--border), transparent);"
						aria-hidden="true"
					></div>
				{/if}

				<div class="flex flex-1 justify-center text-center">
					<MetricDisplay value={metric.value} label={metricLabel} size="lg" labelBelow />
				</div>
			{/each}
		</div>
	</div>
</Card>
</div>
