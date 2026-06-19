<!--
  Polaroid mini-carousel — compact 1x1 card.
  Shows one polaroid at a time with left/right arrows.
  Click arrows to cycle. Tilted frame + tape effect on current.
  Stop label always top-left.
-->
<script lang="ts">
	import type { AboutPolaroid } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { aboutPageContent } from '$lib/content/about-page';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';
	import { persisted } from '$lib/state/persisted.svelte';

	let { polaroids, stop, label }: { polaroids: readonly AboutPolaroid[]; stop: string; label: string } = $props();

	// slice-34.5: the active polaroid survives a language switch. The stored value
	// is a locale-free integer index — valid in any locale — per the persisted()
	// invariant. The {#key currentIndex} below remounts on restore, so the carried
	// index lands cleanly on the remounted page.
	const polaroid = persisted<number>('about-polaroid', 0);

	function prev() {
		polaroid.value = (polaroid.value - 1 + polaroids.length) % polaroids.length;
	}
	function next() {
		polaroid.value = (polaroid.value + 1) % polaroids.length;
	}

	// Clamp against the resolved set so a stale carried index can never read past
	// the array (defensive — the polaroid count is content-stable, but cheap).
	const currentIndex = $derived(
		polaroids.length > 0 ? ((polaroid.value % polaroids.length) + polaroids.length) % polaroids.length : 0,
	);
	const current = $derived(polaroids[currentIndex]);
	const alt = $derived(resolveLocale(current.alt, locale));
	const caption = $derived(resolveLocale(current.caption, locale));
	const prevPhotoAria = resolveLocale(aboutPageContent.labels.polaroidPrevAria, locale);
	const nextPhotoAria = resolveLocale(aboutPageContent.labels.polaroidNextAria, locale);
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="h-full p-3" data-testid="about-polaroids">
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<!-- Polaroid display. Reserve the tallest polaroid frame on mobile so the
		     {#key currentIndex} remount (which briefly empties this slot) can't
		     collapse + re-expand the card on photo change. Frame = fixed img
		     (h-56 / sm:h-64) + p-1.5 pb-5 + tape. Desktop sizes from the grid row. -->
		<div class="flex flex-1 items-center justify-center min-h-[16rem] sm:min-h-[18rem] lg:[min-height:auto]">
			{#key currentIndex}
				<div
					class="relative transition-all duration-300"
					style="transform: rotate({current.rotate}deg);"
				>
					<!-- Tape -->
					<div
						class="absolute -top-1.5 left-1/2 z-10 h-4 w-8 -translate-x-1/2 bg-[rgba(255,255,255,0.15)] shadow-sm"
						style="transform: translateX(-50%) rotate({-current.rotate * 0.5}deg);"
					></div>

					<!-- Frame -->
					<div class="rounded-sm bg-white p-1.5 pb-5 shadow-lg shadow-black/40">
						<img
							src={current.src}
							{alt}
							class="h-56 w-40 object-cover sm:h-64 sm:w-48 lg:h-[calc(100%-4rem)] lg:w-auto lg:max-h-[280px] lg:min-h-[160px]"
							loading="lazy"
						/>
						<p class="pointer-events-none absolute bottom-1 left-0 w-full text-center text-caption italic text-neutral-500">
							{caption}
						</p>
					</div>
				</div>
			{/key}
		</div>

		<!-- Arrow nav + counter -->
		<div class="flex items-center justify-center gap-3 pb-1">
			<button
				class="tap-press flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] p-2.5 text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] active:border-[var(--primary)] active:text-[var(--primary)]"
				onclick={prev}
				aria-label={prevPhotoAria}
				data-testid="about-polaroid-prev"
			>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6 2L3.5 5L6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
			<span class="font-mono text-caption text-[var(--muted-foreground)]" data-testid="about-polaroid-counter">{currentIndex + 1}/{polaroids.length}</span>
			<button
				class="tap-press flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border)] p-2.5 text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] active:border-[var(--primary)] active:text-[var(--primary)]"
				onclick={next}
				aria-label={nextPhotoAria}
				data-testid="about-polaroid-next"
			>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 2L6.5 5L4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
		</div>
	</div>
</Card>
</div>
