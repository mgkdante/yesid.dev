<!--
  Client trust strip — Style B: Counter + Logo Row.
  Big counter left ("10+"), gradient divider, logos right.
  Grayscale → color on hover. Stop label top-left.
-->
<script lang="ts">
	import type { AboutClientLogo } from '$lib/data/types.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel, MetricDisplay } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let {
		logos,
		count = 10,
		stop = '05',
		label = 'CLIENTS',
	}: {
		logos: readonly AboutClientLogo[];
		count?: number;
		stop?: string;
		label?: string;
	} = $props();
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="h-full p-3" data-testid="about-logos">
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<div class="flex flex-1 flex-col items-center justify-center gap-2">
			<!-- Counter -->
			<MetricDisplay value="{count}+" label="clients served" size="lg" labelBelow />

			<!-- Logo grid -->
			<div class="mt-1 grid grid-cols-2 gap-2">
				{#each logos as logo}
					{@const Wrapper = logo.url ? 'a' : 'div'}
					<svelte:element
						this={Wrapper}
						href={logo.url ?? undefined}
						target={logo.url ? '_blank' : undefined}
						rel={logo.url ? 'noopener noreferrer' : undefined}
						class="flex items-center justify-center grayscale opacity-50 transition-all duration-300 hover:grayscale-0 hover:opacity-100"
						title={logo.name}
					>
						<img
							src={logo.src}
							alt={logo.name}
							class="h-6 w-auto object-contain"
							loading="lazy"
						/>
					</svelte:element>
				{/each}
			</div>
		</div>
	</div>
</Card>
</div>
