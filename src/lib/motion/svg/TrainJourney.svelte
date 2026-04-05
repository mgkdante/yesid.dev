<!--
  SVG train layer for the home page.
  The train moves vertically along the right-edge rail, driven by scrollProgress.
  Draggable: user can grab the train to scroll the page.
  Click: easter egg bounce animation.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import TrainTop from './TrainTop.svelte';
	import { registerGsapPlugins, gsap } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';

	let {
		scrollProgress = 0,
		reducedMotion = false,
		velocity = 0
	}: {
		scrollProgress?: number;
		reducedMotion?: boolean;
		velocity?: number;
	} = $props();

	let trainWrapper: HTMLDivElement;
	let bouncing = false;
	let dragging = $state(false);

	// Train position: maps scrollProgress (0-1) to vertical % within the rail container.
	// Capped at 82% so the 2-wagon SVG never overflows the container bottom.
	let trainTop = $derived(5 + scrollProgress * 77);

	onMount(() => {
		if (reducedMotion || isPrefersReducedMotion()) return;

		registerGsapPlugins();
	});

	// Drag-to-scroll: grab the train and drag it along the rail
	function onPointerDown(e: PointerEvent) {
		if (reducedMotion) return;
		dragging = true;
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
		e.preventDefault();
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		// Map pointer Y position to scroll progress
		const vh = window.innerHeight;
		const docHeight = document.documentElement.scrollHeight - vh;
		const fraction = Math.max(0, Math.min(1, e.clientY / vh));
		window.scrollTo({ top: fraction * docHeight });
	}

	function onPointerUp() {
		dragging = false;
	}

	// Easter egg bounce on click (not drag)
	function onTrainClick() {
		if (bouncing || !trainWrapper || dragging) return;
		bouncing = true;

		gsap.fromTo(
			trainWrapper,
			{ y: '+=0' },
			{
				y: '-=12',
				duration: 0.15,
				ease: 'power2.out',
				yoyo: true,
				repeat: 1,
				onComplete: () => { bouncing = false; }
			}
		);
	}
</script>

<!-- Train positioned at the viewport right edge, matching the rail -->
<div class="absolute inset-0" data-testid="train-journey">
	<!-- Train element -->
	<div
		bind:this={trainWrapper}
		class="absolute left-1/2 w-[26px] cursor-grab active:cursor-grabbing md:w-[30px]"
		class:cursor-grabbing={dragging}
		style="top: {trainTop}%;
			transform: translateX(-50%) translateY(-50%);
			filter: drop-shadow(0 0 {velocity * 10}px #E07800);"
		role="slider"
		tabindex="0"
		aria-label="Scroll position — drag to navigate"
		aria-valuenow={Math.round(scrollProgress * 100)}
		aria-valuemin={0}
		aria-valuemax={100}
		onclick={onTrainClick}
		onpointerdown={onPointerDown}
		onpointermove={onPointerMove}
		onpointerup={onPointerUp}
		onpointercancel={onPointerUp}
		onkeydown={(e) => {
			if (e.key === 'ArrowDown') window.scrollBy({ top: 200, behavior: 'smooth' });
			if (e.key === 'ArrowUp') window.scrollBy({ top: -200, behavior: 'smooth' });
		}}
	>
		<TrainTop />
	</div>
</div>
