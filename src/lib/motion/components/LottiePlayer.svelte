<script lang="ts">
	// Generic Lottie animation wrapper. Accepts a path to a Lottie JSON file and
	// controls playback based on the trigger prop.
	//
	// SCRUB MODE: When scrub=true, frame position is driven by progress prop (0-1).
	// The scrub $effect reads animation.totalFrames directly each run — no event
	// listener needed. If the animation hasn't loaded yet (totalFrames=0), it skips.
	// Once loaded, the next progress change drives the frame.

	import { isPrefersReducedMotion } from '../stores/reducedMotion.js';

	type Trigger = 'scroll' | 'mount' | 'hover';

	let {
		src,
		trigger = 'mount' as Trigger,
		loop = false,
		speed = 1,
		scrub = false,
		progress = 0,
		reverse = false
	}: {
		src: string;
		trigger?: Trigger;
		loop?: boolean;
		speed?: number;
		/** When true, frame position is driven by the progress prop (0-1). */
		scrub?: boolean;
		/** Scroll progress 0-1. Only used when scrub=true. */
		progress?: number;
		/** When true, Lottie plays in reverse during scrub (frame 0 at progress=1). */
		reverse?: boolean;
	} = $props();

	let container: HTMLDivElement;
	let animation: ReturnType<typeof import('lottie-web')['default']['loadAnimation']> | null = null;
	// $state flag so the scrub $effect re-runs when the animation finishes loading.
	let loaded = $state(false);

	$effect(() => {
		let observer: IntersectionObserver | null = null;

		async function init() {
			const lottie = (await import('lottie-web')).default;
			const reducedMotion = isPrefersReducedMotion();

			animation = lottie.loadAnimation({
				container,
				path: src,
				renderer: 'svg',
				loop: scrub ? false : loop,
				autoplay: !scrub && trigger === 'mount' && !reducedMotion
			});

			animation.setSpeed(speed);

			if (reducedMotion) {
				animation.goToAndStop(0, true);
				return;
			}

			// Signal that the animation data is ready for scrubbing.
			// data_ready fires when JSON is parsed (before DOM rendering).
			animation.addEventListener('data_ready', () => {
				loaded = true;
			});

			if (scrub) return;

			if (trigger === 'hover') {
				container.addEventListener('mouseenter', () => animation?.play());
				container.addEventListener('mouseleave', () => animation?.stop());
			}

			if (trigger === 'scroll') {
				observer = new IntersectionObserver(
					(entries) => {
						entries.forEach((entry) => {
							if (entry.isIntersecting) animation?.play();
							else animation?.stop();
						});
					},
					{ threshold: 0.3 }
				);
				observer.observe(container);
			}
		}

		init();

		return () => {
			animation?.destroy();
			animation = null;
			loaded = false;
			observer?.disconnect();
		};
	});

	// Scrub effect: drive Lottie frame from progress prop (0-1).
	// Reads animation.totalFrames directly — no cached state needed.
	// `loaded` ($state) triggers re-run when animation data arrives.
	// `progress` (prop) triggers re-run on every scroll update.
	// When `reverse` is true, frame 0 maps to progress=1 (Lottie builds up as you scroll).
	$effect(() => {
		if (scrub && loaded && animation) {
			const frames = animation.totalFrames;
			if (frames > 0) {
				const p = reverse ? (1 - progress) : progress;
				const frame = Math.round(p * frames);
				animation.goToAndStop(frame, true);
			}
		}
	});
</script>

<div
	bind:this={container}
	data-testid="lottie-player"
	role="img"
	aria-label="Animated illustration"
	class="lottie-player"
></div>
