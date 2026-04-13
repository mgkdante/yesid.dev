<!--
  Methodology — Horizontal Pipeline, labels only (compact).
  AUDIT → OPTIMIZE → DOCUMENT → HANDOFF with numbered dots.
  Descriptions removed for space. Stop label top-left.
-->
<script lang="ts">
	import type { AboutMethodStep } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';

	let { steps, stop = '02', label = 'PROCESS' }: { steps: readonly AboutMethodStep[]; stop?: string; label?: string } = $props();
</script>

<div
	class="bento-card group h-full p-3"
	data-testid="about-method"
	use:reveal
	use:cursorGlow
>
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<!-- Horizontal pipeline with descriptions -->
		<div class="mt-auto mb-auto flex items-start justify-around">
			{#each steps as step, i}
				{@const stepLabel = resolveLocale(step.label, 'en')}
				{@const stepDesc = resolveLocale(step.description, 'en')}

				<!-- Connecting line (not before first) -->
				{#if i > 0}
					<div class="mt-3 h-[2px] w-4 flex-shrink-0" style="background: linear-gradient(90deg, var(--brand-primary), color-mix(in srgb, var(--brand-primary) 30%, transparent));"></div>
				{/if}

				<div class="flex flex-col items-center" use:reveal={{ delay: stagger(i, 100) }}>
					<div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--brand-primary)] bg-[var(--bg-primary)]">
						<span class="font-mono text-caption font-bold text-[var(--brand-primary)]">{step.station}</span>
					</div>
					<div class="mt-1 font-mono text-caption font-semibold tracking-[1px] text-[var(--brand-primary)]">
						{stepLabel}
					</div>
					<div class="mt-1 max-w-[100px] text-center text-caption leading-tight text-[var(--text-secondary)] opacity-60">
						{stepDesc}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
