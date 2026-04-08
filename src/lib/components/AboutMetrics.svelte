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
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';

	let { metrics, stop = '01', label = 'METRICS' }: { metrics: readonly AboutMetric[]; stop?: string; label?: string } = $props();
</script>

<div
	class="group bento-card relative overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] p-3"
	data-testid="about-metrics"
	use:cursorGlow
	use:reveal
>
	<!-- Cursor glow -->
	<div class="pointer-events-none absolute inset-0 rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style="background: radial-gradient(circle at var(--glow-x, 50%) var(--glow-y, 50%), rgba(224,120,0,0.06), transparent 60%);"
	></div>

	<div class="relative flex h-full flex-col">
		<div class="stop-label">STOP {stop} — {label}</div>

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
					class="flex-1 text-center"
					use:reveal={{ delay: stagger(i, 100) }}
				>
					<!-- Number -->
					<div class="font-mono text-2xl font-bold text-[var(--brand-accent)] md:text-3xl">
						{metric.value}
					</div>
					<!-- Orange underline -->
					<div
						class="mx-auto mt-2 h-[2px] w-5"
						style="background: linear-gradient(90deg, var(--brand-primary), transparent);"
						aria-hidden="true"
					></div>
					<!-- Label: short, uppercase -->
					<div class="mt-2 font-mono text-[11px] uppercase tracking-[1px] text-[var(--text-secondary)]">
						{metricLabel}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
