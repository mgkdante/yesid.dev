<!--
  Interests: Style A, diagonal strips with background images.
  B&W by default, turns color on hover (desktop) / tap toggle (mobile).
  Comic/manga panel energy. Skewed strips with thin diagonal orange dividers.
  Stop label always top-left.
-->
<script lang="ts">
	import type { AboutInterest } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { cursorGlow } from '@yesid/motion/actions';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { interests, stop, label }: { interests: readonly AboutInterest[]; stop: string; label: string } = $props();

	// Mobile tap toggle: track which strip is active (-1 = none)
	let activeIndex = $state(-1);

	function handleTap(index: number) {
		activeIndex = activeIndex === index ? -1 : index;
	}

	const ATTRIBUTION: Record<string, string> = {
		transit: 'Harrison Keely · CC BY 4.0',
		space: 'NASA',
	};

</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full !gap-0 !py-0" data-testid="about-interests">
	<!-- Stop label: top-left, always -->
	<div class="absolute top-3 left-4 z-20">
		<StopLabel {stop} {label} />
	</div>

	<!-- Diagonal strips container -->
	<div class="flex h-full min-h-36">
		{#each interests as interest, i}
			{@const interestLabel = resolveLocale(interest.label, locale)}
			<button
				type="button"
				class="tap-press interest-strip relative flex h-full flex-1 items-center justify-center overflow-hidden transition-all duration-500 ease-out"
				class:strip-active={activeIndex === i}
				onclick={() => handleTap(i)}
				aria-label={interestLabel}
				aria-pressed={activeIndex === i}
			>
				<!-- Background image: skewed, B&W to color on hover/tap.
				     go2/w4: treatment is theme-aware, dark keeps the darkened
				     look, light whitens instead (filters live in <style>). -->
				<div
					class="strip-bg absolute inset-[-20px] bg-cover bg-center transition-all duration-500 ease-out"
					style="background-image: url('{interest.image}'); transform: skewX(-8deg) scale(1.2);"
				></div>

				<!-- Theme-tinted overlay for text readability (background-mix,
				     not hardcoded black: dark ink in dark mode, paper in light). -->
				<div class="strip-overlay absolute inset-0 transition-opacity duration-500"></div>

				<!-- Diagonal orange divider (not after last) -->
				{#if i < interests.length - 1}
					<div
						class="absolute right-0 top-0 z-10 h-full w-px"
						style="background: var(--primary); opacity: 0.4;"
						aria-hidden="true"
					></div>
				{/if}

				<!-- Label: theme-aware ink + halo (see .strip-label below) -->
				<div class="relative z-10 flex flex-col items-center justify-center">
					<span class="strip-label font-mono text-caption font-semibold tracking-[3px]">
						{interestLabel.toUpperCase()}
					</span>
				</div>

				{#if ATTRIBUTION[interest.id]}
					<span
						class="strip-credit absolute inset-x-0 bottom-0 z-20 px-1 pb-1 pt-5 text-center font-mono text-[8px] leading-none tracking-tight"
					>{ATTRIBUTION[interest.id]}</span>
				{/if}
			</button>
		{/each}
	</div>

</Card>
</div>

<style>
	/* go2/w4 operator QA: theme-aware image treatment. Dark mode keeps the
	   original darkened B&W (brightness 0.3 + ink overlay); light mode
	   WHITENS instead (brightness up + paper overlay) so the strips read as
	   bleached paper, not a dark slab on a light page. Tokens drive the
	   overlay (var(--background) flips per theme), no hardcoded black. */
	.strip-bg {
		filter: grayscale(1) brightness(0.3);
	}
	.strip-overlay {
		background: color-mix(in srgb, var(--background) 40%, transparent);
	}
	.strip-label {
		color: var(--foreground);
		text-shadow: 0 1px 4px color-mix(in srgb, var(--background) 80%, transparent);
	}

	.strip-credit {
		color: color-mix(in srgb, var(--foreground) 72%, transparent);
		background: linear-gradient(
			to top,
			color-mix(in srgb, var(--background) 76%, transparent),
			transparent
		);
		pointer-events: none;
	}

	/* Light theme: whitening equivalent of the dark treatment. */
	:global([data-theme='light']) .strip-bg,
	:global(.theme-light) .strip-bg {
		filter: grayscale(1) brightness(1.45) contrast(0.85);
	}

	/* Desktop hover: strip turns color + grows */
	.interest-strip:hover .strip-bg,
	.interest-strip.strip-active .strip-bg {
		filter: grayscale(0) brightness(0.6);
	}
	:global([data-theme='light']) .interest-strip:hover .strip-bg,
	:global(.theme-light) .interest-strip:hover .strip-bg,
	:global([data-theme='light']) .interest-strip.strip-active .strip-bg,
	:global(.theme-light) .interest-strip.strip-active .strip-bg {
		filter: grayscale(0) brightness(1.1);
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
