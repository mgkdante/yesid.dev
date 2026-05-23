<!--
  Interests — Style A: Diagonal strips with background images.
  B&W by default, turns color on hover (desktop) / tap toggle (mobile).
  Comic/manga panel energy. Skewed strips with thin diagonal orange dividers.
  Stop label always top-left.
-->
<script lang="ts">
	import type { AboutInterest } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { interests, stop, label }: { interests: readonly AboutInterest[]; stop: string; label: string } = $props();

	// Mobile tap toggle: track which strip is active (-1 = none)
	let activeIndex = $state(-1);

	function handleTap(index: number) {
		activeIndex = activeIndex === index ? -1 : index;
	}
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full" data-testid="about-interests">
	<!-- Stop label: top-left, always -->
	<div class="absolute top-3 left-4 z-20">
		<StopLabel {stop} {label} />
	</div>

	<!-- Diagonal strips container -->
	<div class="flex h-full min-h-36">
		{#each interests as interest, i}
			{@const interestLabel = resolveLocale(interest.label, 'en')}
			<button
				type="button"
				class="tap-press interest-strip relative flex flex-1 items-center justify-center overflow-hidden transition-all duration-500 ease-out"
				class:strip-active={activeIndex === i}
				onclick={() => handleTap(i)}
				aria-label={interestLabel}
				aria-pressed={activeIndex === i}
			>
				<!-- Background image: skewed, B&W → color on hover/tap -->
				<div
					class="strip-bg absolute inset-[-20px] bg-cover bg-center grayscale brightness-[0.3] transition-all duration-500 ease-out"
					style="background-image: url('{interest.image}'); transform: skewX(-8deg) scale(1.2);"
				></div>

				<!-- Dark overlay for text readability -->
				<div class="strip-overlay absolute inset-0 bg-black/40 transition-opacity duration-500"></div>

				<!-- Diagonal orange divider (not after last) -->
				{#if i < interests.length - 1}
					<div
						class="absolute right-0 top-0 z-10 h-full w-px"
						style="background: var(--primary); opacity: 0.4;"
						aria-hidden="true"
					></div>
				{/if}

				<!-- Label -->
				<div class="relative z-10 flex flex-col items-center justify-center">
					<span class="font-mono text-caption font-semibold tracking-[3px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
						{interestLabel.toUpperCase()}
					</span>
				</div>
			</button>
		{/each}
	</div>
</Card>
</div>

<style>
	/* Desktop hover: strip turns color + grows */
	.interest-strip:hover .strip-bg,
	.interest-strip.strip-active .strip-bg {
		filter: grayscale(0) brightness(0.6);
	}
	.interest-strip:hover .strip-overlay,
	.interest-strip.strip-active .strip-overlay {
		opacity: var(--opacity-subtle);
	}
	.interest-strip:hover,
	.interest-strip.strip-active {
		flex: 1.4;
	}

	/* Button reset + cursor pointer on all strips */
	button.interest-strip {
		appearance: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: inherit;
		background: transparent;
		cursor: pointer;
	}
</style>
