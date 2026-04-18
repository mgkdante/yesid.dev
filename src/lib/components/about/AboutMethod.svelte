<!--
  Methodology — Horizontal Pipeline, labels only (compact).
  AUDIT → OPTIMIZE → DOCUMENT → HANDOFF with numbered dots.
  Descriptions removed for space. Stop label top-left.
-->
<script lang="ts">
	import type { AboutMethodStep } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { steps, stop = '02', label = 'PROCESS' }: { steps: readonly AboutMethodStep[]; stop?: string; label?: string } = $props();
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="h-full p-3" data-testid="about-method">
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<!-- Horizontal pipeline with descriptions -->
		<div class="mt-auto mb-auto flex items-start justify-around">
			{#each steps as step, i}
				{@const stepLabel = resolveLocale(step.label, 'en')}
				{@const stepDesc = resolveLocale(step.description, 'en')}

				<!-- Connecting line (not before first) -->
				{#if i > 0}
					<div class="mt-3 h-[2px] w-4 flex-shrink-0" style="background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 30%, transparent));"></div>
				{/if}

				<div class="flex flex-col items-center">
					<div class="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--background)]">
						<span class="font-mono text-caption font-bold text-[var(--primary)]">{step.station}</span>
					</div>
					<div class="mt-1 font-mono text-caption font-semibold tracking-[1px] text-[var(--primary)]">
						{stepLabel}
					</div>
					<div class="mt-1 max-w-[100px] text-center text-caption leading-tight text-[var(--secondary-foreground)] opacity-60">
						{stepDesc}
					</div>
				</div>
			{/each}
		</div>
	</div>
</Card>
</div>
