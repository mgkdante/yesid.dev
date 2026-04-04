<!--
  HeroVideoCard: scroll-linked video with optional GSAP code overlays.

  Drop-in replacement for WagonScene in the hero card. Receives the same
  scrollProgress prop (0-1) and maps it to <video>.currentTime.

  WHY a separate component (not inline in HeroBanner):
    - Swappable: reverting to WagonScene is a one-line import change
    - Testable: isolated unit tests for video behavior
    - Experimental: may be replaced or heavily iterated
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { gsap } from '$lib/motion/utils/gsap.js';

	let {
		scrollProgress = 0,
		showOverlays = true,
		reducedMotion = false
	}: {
		scrollProgress?: number;
		showOverlays?: boolean;
		reducedMotion?: boolean;
	} = $props();

	let videoEl: HTMLVideoElement | undefined = $state(undefined);
	let overlayContainer: HTMLDivElement | undefined = $state(undefined);
	// WHY videoPrimed: Browsers won't render seek frames on a video that has
	// never been played. A brief play() → pause() cycle "primes" the decoder
	// so that setting currentTime actually updates the visible frame.
	let videoPrimed = $state(false);

	// Prime the video once metadata is available so currentTime seeking works.
	onMount(() => {
		if (reducedMotion || !videoEl) return;

		const prime = () => {
			if (!videoEl) return;
			const playPromise = videoEl.play();
			if (playPromise) {
				playPromise.then(() => {
					videoEl!.pause();
					videoEl!.currentTime = 0;
					videoPrimed = true;
				}).catch(() => {
					// Autoplay blocked (e.g., low-power mode) — still allow seeking,
					// some browsers render seek frames even without priming.
					videoPrimed = true;
				});
			}
		};

		if (videoEl.readyState >= 2) {
			prime();
		} else {
			videoEl.addEventListener('loadeddata', prime, { once: true });
			return () => videoEl?.removeEventListener('loadeddata', prime);
		}
	});

	// Map scroll progress to video currentTime.
	// requestVideoFrameCallback would be ideal but has poor Safari support —
	// direct currentTime assignment is the proven pattern (Apple.com uses it).
	$effect(() => {
		if (reducedMotion) return;
		if (!videoEl || !videoPrimed || !videoEl.duration || isNaN(videoEl.duration)) return;
		videoEl.currentTime = scrollProgress * videoEl.duration;
	});

	// GSAP overlay animations — fade SQL fragments in/out at scroll thresholds.
	onMount(() => {
		if (reducedMotion || !showOverlays || !overlayContainer) return;

		const overlays = overlayContainer.querySelectorAll<HTMLElement>('[data-overlay]');
		overlays.forEach((el) => {
			gsap.set(el, { opacity: 0, y: 10 });
		});

		return () => {
			overlays.forEach((el) => gsap.killTweensOf(el));
		};
	});

	// Animate overlays based on scrollProgress thresholds
	$effect(() => {
		if (reducedMotion || !showOverlays || !overlayContainer) return;

		const overlays = overlayContainer.querySelectorAll<HTMLElement>('[data-overlay]');
		overlays.forEach((el) => {
			const start = parseFloat(el.dataset.start ?? '0');
			const end = parseFloat(el.dataset.end ?? '1');
			const inRange = scrollProgress >= start && scrollProgress <= end;
			const range = Math.min(end, start + 0.1) - start;
			const progress = inRange && range > 0
				? Math.min(1, (scrollProgress - start) / range)
				: inRange ? 1 : 0;

			gsap.to(el, {
				opacity: progress,
				y: inRange ? 0 : 10,
				duration: 0.3,
				overwrite: 'auto'
			});
		});
	});
</script>

<div class="absolute inset-0" data-testid="hero-video-card">
	<!-- Layer 1: Scroll-linked video -->
	<video
		bind:this={videoEl}
		muted
		playsinline
		preload="auto"
		poster="/video/hero-train-poster.webp"
		class="absolute inset-0 h-full w-full rounded-2xl object-cover"
	>
		<source src="/video/hero-train.webm" type="video/webm" />
		<source src="/video/hero-train.mp4" type="video/mp4" />
	</video>

	<!-- Layer 2: Code overlays (optional) -->
	{#if showOverlays}
		<div
			bind:this={overlayContainer}
			class="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl"
			data-testid="hero-overlays"
		>
			<span
				data-overlay
				data-start="0.05"
				data-end="0.35"
				class="absolute left-4 top-4 font-mono text-xs text-[#E07800]/70 drop-shadow-[0_0_8px_rgba(224,120,0,0.4)] md:text-sm"
			>
				SELECT * FROM expertise
			</span>

			<span
				data-overlay
				data-start="0.25"
				data-end="0.6"
				class="absolute bottom-6 right-4 font-mono text-xs text-[#FFB627]/60 drop-shadow-[0_0_8px_rgba(255,182,39,0.3)] md:text-sm"
			>
				JOIN solutions ON need = skill
			</span>

			<span
				data-overlay
				data-start="0.45"
				data-end="0.8"
				class="absolute left-6 bottom-1/3 font-mono text-xs text-[#E07800]/50 drop-shadow-[0_0_6px_rgba(224,120,0,0.3)] md:text-sm"
			>
				WHERE quality = 'production'
			</span>
		</div>
	{/if}
</div>
