<!--
  SvgIcon — brand atom for animated SVG illustrations.
  Merges BlogSvgIcon + WorkSvgIcon into one unified component.
  Entrance: 4 animation types via GSAP (draw, morph, draw-fill, stagger).
  Hover: paths morph into a random geometric shape, revert on leave.
  Tap-to-toggle morph on mobile.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { BlogAnimation } from '$lib/data/types.js';
	import { SHAPES, pickRandomShape } from '$lib/data/shapes.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, DrawSVGPlugin, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { convertSvgToMorphPaths } from '$lib/motion/utils/morphHelpers.js';
	import { cn } from '$lib/utils.js';

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

	function handleMouseEnter() {
		if (isPrefersReducedMotion() || svgPaths.length === 0 || isHovered || !entranceDone) return;
		isHovered = true;

		const { key: shape, index: shapeIdx } = pickRandomShape(lastShapeIdx);
		lastShapeIdx = shapeIdx;

		gsap.to(svgPaths, {
			morphSVG: SHAPES[shape],
			duration: 0.4,
			stagger: 0.03,
			ease: 'power2.inOut',
			overwrite: true
		});
	}

	let isMorphed = false;

	function handleTap() {
		if (isPrefersReducedMotion() || svgPaths.length === 0 || !entranceDone) return;

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
			const { key: shape, index: shapeIdx } = pickRandomShape(lastShapeIdx);
			lastShapeIdx = shapeIdx;
			gsap.to(svgPaths, {
				morphSVG: SHAPES[shape],
				duration: 0.4,
				stagger: 0.03,
				ease: 'power2.inOut',
				overwrite: true
			});
			isMorphed = true;
		}
	}

	function handleMouseLeave() {
		if (isPrefersReducedMotion() || svgPaths.length === 0 || !isHovered || !entranceDone) return;
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

	function animateStagger(elements: SVGElement[], scrollTriggerConfig?: ScrollTrigger.Vars, onDone?: () => void) {
		gsap.set(elements, { y: 12, opacity: 0 });
		const tl = gsap.timeline({ scrollTrigger: scrollTriggerConfig, onComplete: onDone });
		tl.to(elements, {
			y: 0,
			opacity: 1,
			duration: 0.5,
			stagger: 0.08,
			ease: 'back.out(1.4)'
		});
	}

	onMount(() => {
		if (isPrefersReducedMotion() || !container) return;
		registerGsapPlugins();

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
			case 'stagger':
				animateStagger(svgPaths, scrollTriggerConfig, onDone);
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
