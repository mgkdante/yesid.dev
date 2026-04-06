<!--
  Auto-generates a horizontal pipeline SVG from a project's tech stack.
  Each technology becomes a rounded-rect node with text label, connected
  by dashed lines. Colors alternate between orange and yellow brand colors.
  GSAP entrance: nodes stagger in, then connecting lines draw via DrawSVG.
  Horizontally scrollable when more than 4 items on small screens.
  Respects prefers-reduced-motion.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, DrawSVGPlugin } from '$lib/motion/utils/gsap.js';

	let {
		stack,
		accentColor = '#E07800'
	}: {
		stack: string[];
		accentColor?: string;
	} = $props();

	let container: HTMLDivElement;

	// Layout constants
	const NODE_WIDTH = 70;
	const NODE_HEIGHT = 28;
	const GAP = 20;
	const PADDING_X = 10;
	const PADDING_Y = 8;
	const BRAND_COLORS = ['#E07800', '#FFB627'];

	// Dynamic viewBox calculation based on stack length
	let svgWidth = $derived(PADDING_X * 2 + stack.length * NODE_WIDTH + (stack.length - 1) * GAP);
	let svgHeight = $derived(PADDING_Y * 2 + NODE_HEIGHT);

	// Pre-compute node positions so both the SVG and GSAP use the same data
	let nodes = $derived(
		stack.map((tech, i) => ({
			x: PADDING_X + i * (NODE_WIDTH + GAP),
			y: PADDING_Y,
			label: tech,
			color: BRAND_COLORS[i % BRAND_COLORS.length]
		}))
	);

	onMount(() => {
		if (isPrefersReducedMotion() || !container) return;
		registerGsapPlugins();

		const nodeEls = container.querySelectorAll('.df-node');
		const lineEls = container.querySelectorAll('.df-line');

		// Stagger-in nodes
		gsap.set(nodeEls, { opacity: 0, y: 10 });
		gsap.to(nodeEls, {
			opacity: 1,
			y: 0,
			duration: 0.4,
			stagger: 0.08,
			ease: 'power2.out'
		});

		// Draw connecting lines after nodes land
		if (lineEls.length > 0) {
			gsap.set(lineEls, { drawSVG: '0%' });
			gsap.to(lineEls, {
				drawSVG: '100%',
				duration: 0.5,
				stagger: 0.06,
				ease: 'power2.inOut',
				delay: 0.3
			});
		}
	});
</script>

<div
	bind:this={container}
	class="data-flow-diagram"
	class:scrollable={stack.length > 4}
>
	<svg
		viewBox="0 0 {svgWidth} {svgHeight}"
		width={svgWidth}
		height={svgHeight}
		xmlns="http://www.w3.org/2000/svg"
		role="img"
		aria-label="Technology stack: {stack.join(', ')}"
	>
		<!-- Connecting dashed lines between nodes -->
		{#each nodes as node, i}
			{#if i > 0}
				<line
					class="df-line"
					x1={nodes[i - 1].x + NODE_WIDTH}
					y1={PADDING_Y + NODE_HEIGHT / 2}
					x2={node.x}
					y2={PADDING_Y + NODE_HEIGHT / 2}
					stroke={accentColor}
					stroke-width="1.5"
					stroke-dasharray="4 3"
					stroke-opacity="0.5"
				/>
			{/if}
		{/each}

		<!-- Nodes -->
		{#each nodes as node}
			<g class="df-node">
				<rect
					x={node.x}
					y={node.y}
					width={NODE_WIDTH}
					height={NODE_HEIGHT}
					rx="6"
					ry="6"
					fill="none"
					stroke={node.color}
					stroke-width="1.5"
					stroke-opacity="0.7"
				/>
				<text
					x={node.x + NODE_WIDTH / 2}
					y={node.y + NODE_HEIGHT / 2}
					text-anchor="middle"
					dominant-baseline="central"
					fill={node.color}
					font-size="8"
					font-family="'JetBrains Mono', monospace"
				>
					{node.label.length > 10 ? node.label.slice(0, 9) + '...' : node.label}
				</text>
			</g>
		{/each}
	</svg>
</div>

<style>
	.data-flow-diagram {
		width: 100%;
	}

	/* Allow horizontal scroll when stack has many items */
	.data-flow-diagram.scrollable {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.data-flow-diagram.scrollable::-webkit-scrollbar {
		height: 4px;
	}

	.data-flow-diagram.scrollable::-webkit-scrollbar-track {
		background: #1a1a1a;
	}

	.data-flow-diagram.scrollable::-webkit-scrollbar-thumb {
		background: #2a2a2a;
		border-radius: 2px;
	}
</style>
