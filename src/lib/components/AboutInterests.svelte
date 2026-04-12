<!--
  Interests — Style A: Diagonal strips with background images.
  B&W by default, turns color on hover (desktop) / tap toggle (mobile).
  Comic/manga panel energy. Skewed strips with thin diagonal orange dividers.
  Stop label always top-left.
-->
<script lang="ts">
	import type { AboutInterest } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';

	let { interests, stop = '07', label = 'INTERESTS' }: { interests: readonly AboutInterest[]; stop?: string; label?: string } = $props();

	// Mobile tap toggle: track which strip is active (-1 = none)
	let activeIndex = $state(-1);

	function handleTap(index: number) {
		activeIndex = activeIndex === index ? -1 : index;
	}
</script>

<div
	class="group bento-card relative h-full overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface)]"
	data-testid="about-interests"
	use:reveal
	use:cursorGlow
>
	<!-- Stop label: top-left, always -->
	<div class="absolute top-3 left-4 z-20">
		<div class="stop-label">STOP {stop} — {label}</div>
	</div>

	<!-- Diagonal strips container -->
	<div class="flex h-full min-h-[140px]">
		{#each interests as interest, i}
			{@const interestLabel = resolveLocale(interest.label, 'en')}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div
				class="interest-strip relative flex flex-1 items-center justify-center overflow-hidden transition-all duration-500 ease-out"
				class:strip-active={activeIndex === i}
				onclick={() => handleTap(i)}
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
						style="background: var(--brand-primary); opacity: 0.4;"
						aria-hidden="true"
					></div>
				{/if}

				<!-- Label -->
				<div class="relative z-10 flex flex-col items-center justify-center">
					<span class="font-mono text-caption font-semibold tracking-[3px] text-white/90 drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
						{interestLabel.toUpperCase()}
					</span>
				</div>
			</div>
		{/each}
	</div>
</div>

<style>
	/* Desktop hover: strip turns color + grows */
	.interest-strip:hover .strip-bg,
	.interest-strip.strip-active .strip-bg {
		filter: grayscale(0) brightness(0.6);
	}
	.interest-strip:hover .strip-overlay,
	.interest-strip.strip-active .strip-overlay {
		opacity: 0.15;
	}
	.interest-strip:hover,
	.interest-strip.strip-active {
		flex: 1.4;
	}

	/* Cursor pointer on all strips */
	.interest-strip {
		cursor: pointer;
	}
</style>
