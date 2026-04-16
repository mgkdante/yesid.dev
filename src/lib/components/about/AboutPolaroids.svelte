<!--
  Polaroid mini-carousel — compact 1x1 card.
  Shows one polaroid at a time with left/right arrows.
  Click arrows to cycle. Tilted frame + tape effect on current.
  Stop label always top-left.
-->
<script lang="ts">
	import type { AboutPolaroid } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

	let { polaroids, stop = '08', label = 'SNAPSHOTS' }: { polaroids: readonly AboutPolaroid[]; stop?: string; label?: string } = $props();

	let currentIndex = $state(0);

	function prev() {
		currentIndex = (currentIndex - 1 + polaroids.length) % polaroids.length;
	}
	function next() {
		currentIndex = (currentIndex + 1) % polaroids.length;
	}

	const current = $derived(polaroids[currentIndex]);
	const alt = $derived(resolveLocale(current.alt, 'en'));
	const caption = $derived(resolveLocale(current.caption, 'en'));
</script>

<div
	class="group h-full"
	use:reveal
	use:cursorGlow
>
<Card class="h-full p-3" data-testid="about-polaroids">
	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} />

		<!-- Polaroid display -->
		<div class="flex flex-1 items-center justify-center">
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
						<p class="absolute bottom-1 left-0 w-full text-center text-caption italic text-neutral-500">
							{caption}
						</p>
					</div>
				</div>
			{/key}
		</div>

		<!-- Arrow nav + counter -->
		<div class="flex items-center justify-center gap-3 pb-1">
			<button
				class="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
				onclick={prev}
				aria-label="Previous photo"
			>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6 2L3.5 5L6 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
			<span class="font-mono text-caption text-[var(--muted-foreground)]">{currentIndex + 1}/{polaroids.length}</span>
			<button
				class="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--border)] text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
				onclick={next}
				aria-label="Next photo"
			>
				<svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 2L6.5 5L4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
			</button>
		</div>
	</div>
</Card>
</div>
