<!--
  Stat counter row — Style B: Dividers + Gradient Accents.
  Vertical gradient dividers between stats. Orange underline per number.
  Short uppercase labels. Stripe-inspired.
  Stop number computed from prop.
-->
<script lang="ts">
	import type { AboutMetric } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import { MetricDisplay } from '$lib/components/brand';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';

	let { metrics, stop = '01', label = 'METRICS' }: { metrics: readonly AboutMetric[]; stop?: string; label?: string } = $props();
</script>

<div
	class="group bento-card p-3"
	data-testid="about-metrics"
	use:cursorGlow
	use:reveal
>
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<div class="flex flex-1 items-center justify-around">
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

				<div
					class="flex flex-1 justify-center text-center"
					use:reveal={{ delay: stagger(i, 100) }}
				>
					<MetricDisplay value={metric.value} label={metricLabel} size="lg" labelBelow />
				</div>
			{/each}
		</div>
	</div>
</div>
