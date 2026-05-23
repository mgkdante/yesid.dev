<!--
  SvgIcon — brand atom for animated SVG illustrations.
  Merges BlogSvgIcon + WorkSvgIcon into one unified component.
  Entrance: 3 animation types via GSAP (draw, morph, draw-fill). All are
  drawing motion — doctrine-compatible on enter per D266. The pure
  fade-up "stagger" variant was cut in 17e-5 (D267 F reveal violation).
  Hover: paths morph into a random geometric shape, revert on leave.
  Tap-to-toggle morph on mobile.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { BlogAnimation } from '$lib/types';
	import { getMorphShapes, pickRandomShape } from '$lib/utils/shapes';
	import type { MorphShape } from '@repo/shared';
	// Slice-23: reduced-motion guards removed per operator policy. Draw-on-
	// load entrance + hover/tap path morphing are not vestibular triggers
	// (visual transformation, brief, user-initiated for hover/tap).
	import { initScrollTriggerConfig, loadDrawSVG, loadMorphSVG, gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { convertSvgToMorphPaths } from '$lib/motion/utils/morphHelpers.js';
	import { cn } from '$lib/utils';

	let {
		svgContent,
		animation = 'draw-fill' as BlogAnimation,
		size = 48,
		trigger = 'load' as 'load' | 'scroll',
		hovered = false,
		class: className,
		...rest
	}: {
		svgContent: string;
		animation?: BlogAnimation;
		size?: number;
		trigger?: 'load' | 'scroll';
		hovered?: boolean;
		class?: string;
		[key: string]: unknown;
	} = $props();

	let container: HTMLDivElement;

	let isHovered = false;
	let entranceDone = false;
	let originalPaths: string[] = [];
	let svgPaths: SVGPathElement[] = [];
	let lastShapeIdx = -1;
	let morphShapes = $state<readonly MorphShape[] | null>(null);

	function handleMouseEnter() {
		if (svgPaths.length === 0 || isHovered || !entranceDone) return;
		if (!morphShapes || morphShapes.length === 0) return;
		isHovered = true;

		const { shape, index: shapeIdx } = pickRandomShape(morphShapes, lastShapeIdx);
		lastShapeIdx = shapeIdx;

		gsap.to(svgPaths, {
			morphSVG: shape.path,
			duration: 0.4,
			stagger: 0.03,
			ease: 'power2.inOut',
			overwrite: true
		});
	}

	let isMorphed = false;

	function handleTap() {
		if (svgPaths.length === 0 || !entranceDone) return;
		if (!morphShapes || morphShapes.length === 0) return;

		if (isMorphed) {
			svgPaths.forEach((path, i) => {
				gsap.to(path, {
					morphSVG: originalPaths[i],
					duration: 0.4,
					delay: i * 0.03,
					ease: 'power2.inOut',
					overwrite: true
				});
			});
			isMorphed = false;
		} else {
			const { shape, index: shapeIdx } = pickRandomShape(morphShapes, lastShapeIdx);
			lastShapeIdx = shapeIdx;
			gsap.to(svgPaths, {
				morphSVG: shape.path,
				duration: 0.4,
				stagger: 0.03,
				ease: 'power2.inOut',
				overwrite: true
			});
			isMorphed = true;
		}
	}

	function handleMouseLeave() {
		if (svgPaths.length === 0 || !isHovered || !entranceDone) return;
		isHovered = false;

		svgPaths.forEach((path, i) => {
			gsap.to(path, {
				morphSVG: originalPaths[i],
				duration: 0.4,
				delay: i * 0.03,
				ease: 'power2.inOut',
				overwrite: true
			});
		});
	}

	$effect(() => {
		if (hovered) {
			handleMouseEnter();
		} else {
			handleMouseLeave();
		}
	});

	// --- Entrance animations ---

	function animateDraw(paths: SVGElement[], scrollTriggerConfig?: ScrollTrigger.Vars, onDone?: () => void) {
		gsap.set(paths, { drawSVG: '0%' });
		const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig, onComplete: onDone });
		tl.to(paths, {
			drawSVG: '100%',
			duration: 1.2,
			stagger: 0.15,
			ease: 'power2.inOut'
		});
	}

	function animateMorph(paths: SVGElement[], scrollTriggerConfig?: ScrollTrigger.Vars, onDone?: () => void) {
		gsap.set(paths, { opacity: 0, scale: 0.3, transformOrigin: 'center center' });
		const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig, onComplete: onDone });
		tl.to(paths, {
			opacity: 1,
			scale: 1,
			duration: 0.8,
			stagger: 0.1,
			ease: 'back.out(1.7)'
		});
	}

	function animateDrawFill(paths: SVGElement[], scrollTriggerConfig?: ScrollTrigger.Vars, onDone?: () => void) {
		gsap.set(paths, { drawSVG: '0%', fillOpacity: 0 });
		const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig, onComplete: onDone });
		tl.to(paths, {
			drawSVG: '100%',
			duration: 1,
			stagger: 0.12,
			ease: 'power2.inOut'
		});
		tl.to(paths, {
			fillOpacity: 0.15,
			duration: 0.6,
			stagger: 0.08,
			ease: 'power1.out'
		}, '-=0.3');
	}

	onMount(async () => {
		if (!container) return;
		// animateMorph uses MorphSVG; all 3 entrance variants use DrawSVG.
		// Fetch morph shapes from adapter (cached after first call).
		await Promise.all([loadDrawSVG(), loadMorphSVG()]);
		// Component may have unmounted while awaiting (tests mount + unmount
		// rapidly). Re-check before touching the DOM.
		if (!container) return;
		morphShapes = await getMorphShapes();
		// Re-check after second async boundary (getMorphShapes).
		if (!container) return;
		initScrollTriggerConfig();

		const svg = container.querySelector('svg');
		if (!svg) return;

		const result = convertSvgToMorphPaths(svg);
		if (result.paths.length === 0) return;

		svgPaths = result.paths;
		originalPaths = result.originals;

		const scrollTriggerConfig = trigger === 'scroll' ? {
			trigger: container,
			start: 'top 80%',
			once: true
		} : undefined;

		const onDone = () => { entranceDone = true; };

		switch (animation) {
			case 'draw':
				animateDraw(svgPaths, scrollTriggerConfig, onDone);
				break;
			case 'morph':
				animateMorph(svgPaths, scrollTriggerConfig, onDone);
				break;
			case 'draw-fill':
				animateDrawFill(svgPaths, scrollTriggerConfig, onDone);
				break;
		}
	});
</script>

<div
	bind:this={container}
	data-slot="svg-icon"
	class={cn(
		'flex items-center justify-center overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] transition-border-color duration-300',
		className
	)}
	style="--svg-icon-size: {size}px; width: var(--svg-icon-size); height: var(--svg-icon-size);"
	aria-hidden="true"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleTap}
	role="presentation"
	{...rest}
>
	{@html svgContent}
</div>
