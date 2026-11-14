<!--
  Interests: Style A, diagonal strips with background images.
  B&W by default, turns color on hover (desktop) / tap toggle (mobile).
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
	import { Popover } from 'bits-ui';
	import { Info } from '@lucide/svelte';
	import { siteLabels } from '#lib/content/index.ts';

	let { interests, stop, label }: { interests: readonly AboutInterest[]; stop: string; label: string } = $props();

	// Cover-cropped photo width tracks card height: about 800px on the tall tablet card
	// (snapshots sets a 380px row min-height below 1024px), about 340px on phones.
	// Re-derive these values if the bento layout changes.
	const INTEREST_SIZES = '(min-width: 1024px) calc(20vw + 48px), (min-width: 768px) 800px, 340px';

	const LEGACY_ATTRIBUTION: Record<string, string> = {
		transit: 'Harrison Keely · CC BY 4.0',
		space: 'NASA',
	};

	let activeId = $state('transit');
	let creditOpen = $state(false);
	let creditTrigger = $state<HTMLButtonElement | null>(null);
	let creditContent = $state<HTMLDivElement | null>(null);
	const selected = $derived(interests.find(interest => interest.id === activeId) ?? interests[0]);
	const selectedCredit = $derived((selected?.credit && resolveLocale(selected.credit, locale)) || LEGACY_ATTRIBUTION[selected?.id ?? ''] || '');
	const creditLabel = $derived(siteLabels.a11y.photoCredit ? resolveLocale(siteLabels.a11y.photoCredit, locale) : selected ? resolveLocale(selected.label, locale) : '');

	function selectInterest(id: string) {
		creditOpen = false;
		activeId = id;
	}

	function dismissCredit(event: MouseEvent) {
		const target = event.target;
		// Immediate touch clicks can precede the primitive's deferred outside-pointer listener.
		if (creditOpen && target instanceof Node && !creditContent?.contains(target) && !creditTrigger?.contains(target)) creditOpen = false;
	}



</script>

<svelte:document onclick={dismissCredit} />

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full !gap-0 !py-0" data-testid="about-interests">
	<!-- Stop label: top-left, always -->
	<div class="absolute top-3 left-4 z-20">
		<StopLabel {stop} {label} as="h2" />
	</div>

	<!-- Diagonal strips container -->
	<div class="flex h-full min-h-36">
		{#each interests as interest, i}
			{@const media = variantImage(interest.image)}
			{@const interestLabel = resolveLocale(interest.label, locale)}
			<div class="interest-strip relative flex h-full flex-1 overflow-hidden" class:strip-active={selected?.id === interest.id}>
			<button
				type="button"
				class="tap-press interest-select relative flex h-full w-full items-center justify-center overflow-hidden"
				onclick={() => selectInterest(interest.id)}
				aria-pressed={selected?.id === interest.id}
			>

				<div
					class="strip-bg absolute inset-[-20px] transition-all duration-500 ease-out"
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
						{interestLabel}
					</span>
				</div>

			</button>
			{#if selected?.id === interest.id && selectedCredit}
				<Popover.Root bind:open={creditOpen}>
					<Popover.Trigger bind:ref={creditTrigger} class="interest-credit-trigger" aria-label={creditLabel} data-testid="interest-credit-trigger">
						<Info size={16} aria-hidden="true" />
					</Popover.Trigger>
					<Popover.Portal>
						<Popover.Content bind:ref={creditContent} role="dialog" aria-label={creditLabel} class="interest-credit-content" data-testid="interest-credit-box"
							side="bottom" align="end" sideOffset={4} strategy="fixed"
							onOpenAutoFocus={(event) => { event.preventDefault(); creditContent?.focus(); }}
							onCloseAutoFocus={(event) => { event.preventDefault(); creditTrigger?.focus(); }}>
							<p>{selectedCredit}</p>
						</Popover.Content>
					</Popover.Portal>
				</Popover.Root>
			{/if}
			</div>
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

	/* Theme-aware filters keep image strips readable on both dark surfaces and light paper. */
	.strip-bg {
		filter: grayscale(1) brightness(0.3);
	}
	.strip-overlay {
		background: color-mix(in srgb, var(--background) 40%, transparent);
	}
	.strip-label {
		text-transform: uppercase;
		color: var(--foreground);
		text-shadow: 0 1px 4px color-mix(in srgb, var(--background) 80%, transparent);
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
	.interest-strip { min-inline-size: 44px; min-block-size: 44px; transition: flex-grow 500ms var(--ease-default); }
	.interest-strip.strip-active { flex-grow: 1.4; }
	.interest-select { min-inline-size: 0; min-block-size: 44px; }
	.interest-select:focus-visible, :global(.interest-credit-trigger:focus-visible) {
		outline: 2px solid var(--foreground); outline-offset: -4px;
		box-shadow: inset 0 0 0 6px var(--background);
	}

	/* Button reset + cursor pointer on all strips */
	button.interest-select {
		appearance: none;
		border: none;
		padding: 0;
		font: inherit;
		color: inherit;
		text-align: inherit;
		background: transparent;
		cursor: pointer;
	}
	:global(.interest-credit-trigger) {
		position: absolute; right: 0; bottom: 0; z-index: 30;
		display: flex; align-items: center; justify-content: center;
		width: 44px; height: 44px; border: 0; padding: 0; cursor: pointer;
		background: transparent; color: var(--foreground);
	}
	:global(.interest-credit-trigger svg) { background: var(--background); border-radius: 50%; }
	:global(.interest-credit-content) {
		z-index: 100; max-inline-size: min(20rem, calc(100vw - 2rem)); padding: 0.75rem;
		border: 1px solid var(--border); border-radius: var(--radius-sm);
		background: var(--card); color: var(--foreground); font-size: 14px; line-height: 1.5;
	}
	@media (prefers-reduced-motion: reduce) {
		.interest-strip, .interest-select, .strip-bg, .strip-overlay { transition: none; }
	}
</style>
