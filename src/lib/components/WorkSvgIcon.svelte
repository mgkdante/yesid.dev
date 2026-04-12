<!--
  Renders and animates a service SVG illustration for work/project cards.
  Simplified version of BlogSvgIcon — always uses draw-fill entrance, always on mount.
  Hover: all paths morph into a random geometric shape, revert on leave.
  Tap-to-toggle morph on mobile (no hover available).
  Respects prefers-reduced-motion.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, DrawSVGPlugin, MorphSVGPlugin } from '$lib/motion/utils/gsap.js';

	let {
		svgContent,
		size = 36,
		hovered = false
	}: {
		svgContent: string;
		size?: number;
		hovered?: boolean;
	} = $props();

	let container: HTMLDivElement;

	// Geometric target shapes (centered in 48x48 viewBox, scaled to ~60%)
	const SHAPES = {
		triangle: 'M24 8 L40 38 L8 38 Z',
		circle: 'M24 8 A16 16 0 1 1 23.99 8 Z',
		square: 'M10 10 L38 10 L38 38 L10 38 Z',
		hexagon: 'M24 7 L39 15.5 L39 32.5 L24 41 L9 32.5 L9 15.5 Z'
	};
	const SHAPE_KEYS = Object.keys(SHAPES) as (keyof typeof SHAPES)[];

	let isHovered = false;
	// WHY: blocks hover/tap interaction until the entrance draw-fill animation
	// finishes — hovering mid-draw can interrupt and break the animation
	let entranceDone = false;
	let originalPaths: string[] = [];
	let svgPaths: SVGPathElement[] = [];
	// Avoid repeating the same shape twice in a row
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

	// Tap toggle: alternates between original paths and a random geometric shape
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

	// Draw-fill entrance animation on mount
	onMount(() => {
		if (isPrefersReducedMotion() || !container) return;
		registerGsapPlugins();

		const svg = container.querySelector('svg');
		if (!svg) return;

		const elements = Array.from(
			svg.querySelectorAll('path, circle, ellipse, rect, line, polyline, polygon')
		) as SVGElement[];
		if (elements.length === 0) return;

		// Convert all elements to paths for MorphSVGPlugin compatibility
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		svgPaths = elements.map((el) => (MorphSVGPlugin.convertToPath as any)(el)[0] as SVGPathElement);
		originalPaths = svgPaths.map((p) => p.getAttribute('d') ?? '');

		// Draw-fill: draw strokes first, then soft fill
		gsap.set(svgPaths, { drawSVG: '0%', fillOpacity: 0 });
		const tl = gsap.timeline({ onComplete: () => { entranceDone = true; } });
		tl.to(svgPaths, {
			drawSVG: '100%',
			duration: 1,
			stagger: 0.12,
			ease: 'power2.inOut'
		});
		tl.to(svgPaths, {
			fillOpacity: 0.15,
			duration: 0.6,
			stagger: 0.08,
			ease: 'power1.out'
		}, '-=0.3');
	});
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	bind:this={container}
	class="work-svg-icon flex items-center justify-center overflow-hidden rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-primary)] transition-border-color duration-300"
	style="width: {size}px; height: {size}px;"
	aria-hidden="true"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onclick={handleTap}
	role="presentation"
>
	{@html svgContent}
</div>
