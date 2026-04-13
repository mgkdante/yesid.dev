<!--
  Renders and animates a blog post SVG illustration.
  Entrance: 4 animation types via GSAP (draw, morph, draw-fill, stagger).
  Hover: all paths morph into a geometric shape (triangle, circle, square, hexagon)
  then morph back on mouse leave. Uses MorphSVGPlugin.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { BlogAnimation } from '$lib/data/types.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, DrawSVGPlugin, MorphSVGPlugin, ScrollTrigger } from '$lib/motion/utils/gsap.js';

	let {
		svgContent,
		animation = 'draw' as BlogAnimation,
		size = 48,
		trigger = 'load' as 'load' | 'scroll',
		hovered = false
	}: {
		svgContent: string;
		animation?: BlogAnimation;
		size?: number;
		trigger?: 'load' | 'scroll';
		hovered?: boolean;
	} = $props();

	let container: HTMLDivElement;

	// Geometric target shapes (centered in 48x48 viewBox, sized to ~60% of viewBox)
	const SHAPES = {
		triangle: 'M24 8 L40 38 L8 38 Z',
		circle: 'M24 8 A16 16 0 1 1 23.99 8 Z',
		square: 'M10 10 L38 10 L38 38 L10 38 Z',
		hexagon: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z'
	};
	const SHAPE_KEYS = Object.keys(SHAPES) as (keyof typeof SHAPES)[];


	let isHovered = false;
	// WHY: blocks hover/tap interaction until the entrance animation finishes —
	// hovering mid-draw/morph can interrupt and break the animation
	let entranceDone = false;
	let originalPaths: string[] = [];
	let svgPaths: SVGPathElement[] = [];
	// Random shape on each hover — never the same twice in a row
	let lastShapeIdx = -1;

	function pickRandomShape(): keyof typeof SHAPES {
		let idx: number;
		do {
			idx = Math.floor(Math.random() * SHAPE_KEYS.length);
		} while (idx === lastShapeIdx && SHAPE_KEYS.length > 1);
		lastShapeIdx = idx;
		return SHAPE_KEYS[idx];
	}

	function handleMouseEnter() {
		if (isPrefersReducedMotion() || svgPaths.length === 0 || isHovered || !entranceDone) return;
		isHovered = true;

		const shape = pickRandomShape();

		gsap.to(svgPaths, {
			morphSVG: SHAPES[shape],
			duration: 0.4,
			stagger: 0.03,
			ease: 'power2.inOut',
			overwrite: true
		});
	}

	// Tap toggle: alternates between original illustration and a random geometric shape
	let isMorphed = false;

	function handleTap() {
		if (isPrefersReducedMotion() || svgPaths.length === 0 || !entranceDone) return;

		if (isMorphed) {
			// Revert to original
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
			// Morph to a random shape
			const shape = pickRandomShape();
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

		// Morph back to originals
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

	// React to external hovered prop (from parent card hover)
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

		// Collect all animatable elements
		const elements = Array.from(
			svg.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')
		) as SVGElement[];
		if (elements.length === 0) return;

		// Convert non-path elements to paths for MorphSVGPlugin compatibility
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		svgPaths = elements.map((el) => (MorphSVGPlugin.convertToPath as any)(el)[0] as SVGPathElement);

		// Store original path data for morph-back on mouse leave
		originalPaths = svgPaths.map((p) => p.getAttribute('d') ?? '');

		// Entrance animation
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

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={container}
	class="blog-svg-icon flex items-center justify-center overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--background)] transition-border-color duration-300"
	style="width: {size}px; height: {size}px;"
	aria-hidden="true"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleTap}
	role="presentation"
>
	{@html svgContent}
</div>
