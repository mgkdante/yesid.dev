<script lang="ts">
	import type { AboutMethodStep } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { steps, stop, label }: { steps: readonly AboutMethodStep[]; stop: string; label: string } = $props();
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="h-full p-3" data-testid="about-method">
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<div class="mt-3 grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
			{#each steps as step, i}
				{@const stepLabel = resolveLocale(step.label, locale)}
				{@const stepDesc = resolveLocale(step.description, locale)}

				<div class="belief-card">
					<div class="flex items-center gap-2">
						<div class="belief-badge">
							{String(step.station).padStart(2, '0')}
						</div>
						<div class="belief-title">{stepLabel}</div>
					</div>
					<p class="mt-2 text-caption leading-snug text-[var(--secondary-foreground)]">{stepDesc}</p>
				</div>
			{/each}
		</div>
	</div>
</Card>
</div>

<style>
	.belief-card {
		min-width: 0;
		border: 1px solid var(--border);
		border-radius: 2px;
		padding: 0.55rem;
		background: color-mix(in srgb, var(--card) 88%, var(--primary) 12%);
	}

	.belief-badge {
		display: grid;
		width: 1.65rem;
		height: 1.65rem;
		flex: 0 0 auto;
		place-items: center;
		border: 1px solid var(--primary);
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 800;
		color: var(--primary);
	}

	.belief-title {
		overflow-wrap: anywhere;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 800;
		letter-spacing: 0.08em;
		color: var(--primary);
	}
</style>
