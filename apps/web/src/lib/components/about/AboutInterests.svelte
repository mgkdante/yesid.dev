<!--
  Interests: Style A, diagonal strips with background images.
  Real photo colors in both themes; one strip expands on interaction.
  Comic/manga panel energy. Skewed strips with thin diagonal orange dividers.
  Stop label always top-left.
-->
<script lang="ts">
	import type { AboutInterest } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { variantImage } from '#lib/utils/variant-image.ts';

	const locale = getLocale();
	import { cursorGlow } from '@yesid/motion/actions';
	import StopLabel from '#lib/components/brand/StopLabel.svelte';
	import { Card } from '@yesid/ui/card';

	let { interests, stop, label }: { interests: readonly AboutInterest[]; stop: string; label: string } = $props();

	// Cover-cropped photo width tracks card height: about 800px on the tall tablet card
	// (snapshots sets a 380px row min-height below 1024px), about 340px on phones.
	// Re-derive these values if the bento layout changes.
	const INTEREST_SIZES = '(min-width: 1024px) calc(20vw + 48px), (min-width: 768px) 800px, 340px';

	// Hover previews a photo; activation keeps that selection after the pointer leaves.
	let selectedIndex = $state(-1);
	let hoveredIndex = $state(-1);
	const expandedIndex = $derived(hoveredIndex >= 0 ? hoveredIndex : selectedIndex);

	function handleTap(index: number) {
		selectedIndex = selectedIndex === index ? -1 : index;
		hoveredIndex = -1;
	}

	function previewInterest(event: PointerEvent, index: number) {
		if (event.pointerType !== 'touch' && window.matchMedia('(hover: hover) and (pointer: fine)').matches) hoveredIndex = index;
	}

	// Existing credits remain the compatibility fallback until the CMS field is populated.
	const LEGACY_ATTRIBUTION: Record<string, string> = {
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
	<div class="absolute top-3 left-4 z-20 bg-[var(--background)] px-1 py-0.5">
		<StopLabel {stop} {label} as="h2" />
	</div>

	<!-- Diagonal strips container -->
	<div class="flex h-full min-h-40">
		{#each interests as interest, i}
			{@const media = variantImage(interest.image)}
			{@const interestLabel = resolveLocale(interest.label, locale)}
			{@const credit = (interest.credit && resolveLocale(interest.credit, locale)) || LEGACY_ATTRIBUTION[interest.id]}
			<button
				type="button"
				class="tap-press interest-strip relative flex h-full items-center justify-center overflow-hidden"
				class:strip-active={expandedIndex === i}
				onclick={() => handleTap(i)}
				onpointerenter={(event) => previewInterest(event, i)}
				onpointerleave={() => hoveredIndex = -1}
				onfocus={() => hoveredIndex = -1}
				aria-label={interestLabel}
				aria-describedby={credit ? `interest-credit-${interest.id}` : undefined}
				aria-expanded={expandedIndex === i}
			>

				<div
					class="strip-bg absolute inset-[-20px]"
					style="transform: skewX(-8deg) scale(1.2);"
				>
					<img
						src={media.src}
						srcset={media.srcset}
						sizes={media.srcset ? INTEREST_SIZES : undefined}
						width={media.width}
						height={media.height}
						alt=""
						loading="lazy"
						decoding="async"
					/>
				</div>

				<!-- Diagonal orange divider (not after last) -->
				{#if i < interests.length - 1}
					<div
						class="absolute right-0 top-0 z-10 h-full w-px"
						style="background: var(--primary); opacity: 0.4;"
						aria-hidden="true"
					></div>
				{/if}

				<!-- Caption backing keeps the name readable without tinting the photograph. -->
				<div class="absolute inset-x-1 top-8 z-10 flex justify-center">
					<span class="strip-label font-mono font-semibold">
						{interestLabel}
					</span>
				</div>

				{#if credit}
					<span
						id={`interest-credit-${interest.id}`}
						class="strip-credit absolute inset-x-0 bottom-0 z-20 px-1 pb-1 pt-1 text-center font-mono text-[12px] leading-none tracking-tight"
						>{credit}</span>
				{/if}
			</button>
		{/each}
	</div>

</Card>
</div>

<style>
	/* The unlayered global media rule outranks @layer utilities. */
	.strip-bg img {
		width: 100%;
		height: 100%;
		max-width: none;
		object-fit: cover;
		object-position: center;
	}

	.interest-strip {
		flex: 1 1 0%;
		min-inline-size: 44px;
		min-block-size: 44px;
		transition: flex-grow 300ms var(--ease-default);
	}
	.interest-strip.strip-active { flex-grow: 2.4; }
	.interest-strip:focus-visible {
		outline: 2px solid var(--foreground);
		outline-offset: -4px;
		box-shadow: inset 0 0 0 6px var(--background);
		z-index: 30;
	}
	.strip-label {
		max-inline-size: 100%;
		padding: 0.25rem;
		font-size: 12px;
		line-height: 1.2;
		letter-spacing: 0.05em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		text-transform: uppercase;
		color: var(--foreground);
		background: var(--background);
	}
	.strip-active .strip-label {
		white-space: normal;
		overflow-wrap: anywhere;
	}

	.strip-credit {
		color: var(--foreground);
		background: var(--background);
		pointer-events: none;
	}

	@media (prefers-reduced-motion: reduce) {
		.interest-strip { transition: none; }
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
