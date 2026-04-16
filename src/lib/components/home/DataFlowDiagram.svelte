<!--
  Auto-generates a horizontal pipeline SVG from a project's tech stack.
  Each technology becomes a rounded-rect node with the tech name as text inside.
  Nodes are connected by dashed lines with small dot markers traveling along them.
  GSAP DrawSVG entrance: nodes stagger in (scale 0->1, opacity 0->1),
  then connecting lines draw left-to-right, then dots animate along paths.
  Colors alternate between #E07800 and #FFB627.
  Responsive: horizontally scrollable on mobile when stack has >4 items.
  Respects prefers-reduced-motion — static render without animation.
  Props: { stack: string[]; size?: 'sm' | 'lg' }
    sm = card size (~40px height), lg = detail page (~80px height)
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { registerGsapPlugins, gsap, DrawSVGPlugin } from '$lib/motion/utils/gsap.js';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';

	let {
		stack,
		size = 'sm' as 'sm' | 'lg'
	}: {
		stack: string[];
		size?: 'sm' | 'lg';
	} = $props();

	let container: HTMLDivElement;

	const BRAND_COLORS = ['var(--primary)', 'var(--accent)'];

	// Size-dependent layout constants — sm fits inside cards, lg is prominent on detail pages
	let cfg = $derived(size === 'lg'
		? { nodeW: 110, nodeH: 36, gap: 32, padX: 14, padY: 22, fontSize: 11, rx: 8, dotR: 3, strokeW: 2, lineStroke: 1.8 }
		: { nodeW: 70, nodeH: 22, gap: 16, padX: 8, padY: 9, fontSize: 8, rx: 5, dotR: 2, strokeW: 1.5, lineStroke: 1.2 }
	);

	// Dynamic viewBox calculation based on stack length and size config
	let svgWidth = $derived(cfg.padX * 2 + stack.length * cfg.nodeW + Math.max(0, stack.length - 1) * cfg.gap);
	let svgHeight = $derived(cfg.padY * 2 + cfg.nodeH);

	// Pre-compute node center positions for SVG placement and GSAP
	let nodes = $derived(
		stack.map((tech, i) => ({
			x: cfg.padX + i * (cfg.nodeW + cfg.gap),
			y: cfg.padY,
			label: tech,
			color: BRAND_COLORS[i % BRAND_COLORS.length]
		}))
	);

	// Max label length based on node width and font size
	let maxLabelLen = $derived(size === 'lg' ? 14 : 10);

	onMount(() => {
		if (isPrefersReducedMotion() || !container) return;
		registerGsapPlugins();

		const nodeEls = container.querySelectorAll('.df-node');
		const lineEls = container.querySelectorAll('.df-line');
		const dotEls = container.querySelectorAll('.df-dot');

		// 1. Stagger-in nodes: scale from 0 and fade in
		gsap.set(nodeEls, { opacity: 0, scale: 0, transformOrigin: 'center center' });
		gsap.to(nodeEls, {
			opacity: 1,
			scale: 1,
			duration: 0.5,
			stagger: 0.09,
			ease: 'back.out(1.5)'
		});

		// 2. Draw connecting lines left-to-right after nodes land
		if (lineEls.length > 0) {
			gsap.set(lineEls, { drawSVG: '0%' });
			gsap.to(lineEls, {
				drawSVG: '100%',
				duration: 0.5,
				stagger: 0.07,
				ease: 'power2.inOut',
				delay: stack.length * 0.09 + 0.2
			});
		}

		// 3. After lines draw, animate dots along the connection paths
		if (dotEls.length > 0) {
			const dotDelay = stack.length * 0.09 + 0.2 + (stack.length - 1) * 0.07 + 0.3;
			dotEls.forEach((dot, i) => {
				const lineEl = lineEls[i] as SVGLineElement | undefined;
				if (!lineEl) return;

				// Dots travel from x1 to x2 along the line's y-center
				const x1 = parseFloat(lineEl.getAttribute('x1') ?? '0');
				const x2 = parseFloat(lineEl.getAttribute('x2') ?? '0');
				const cy = parseFloat(lineEl.getAttribute('y1') ?? '0');

				gsap.set(dot, { attr: { cx: x1, cy }, opacity: 0 });
				gsap.to(dot, {
					attr: { cx: x2 },
					opacity: 1,
					duration: 0.8,
					ease: 'power1.inOut',
					delay: dotDelay + i * 0.12,
					// After reaching the end, pulse and fade out gently
					onComplete: () => {
						gsap.to(dot, {
							attr: { r: cfg.dotR * 1.6 },
							opacity: 0.3,
							duration: 0.5,
							ease: 'power1.out',
							yoyo: true,
							repeat: -1
						});
					}
				});
			});
		}
	});
</script>

<div
	bind:this={container}
	class="data-flow-diagram"
	class:scrollable={stack.length > 4}
	use:scrollChain
	class:size-lg={size === 'lg'}
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
					x1={nodes[i - 1].x + cfg.nodeW}
					y1={cfg.padY + cfg.nodeH / 2}
					x2={node.x}
					y2={cfg.padY + cfg.nodeH / 2}
					stroke={BRAND_COLORS[(i - 1) % BRAND_COLORS.length]}
					stroke-width={cfg.lineStroke}
					stroke-dasharray="5 3"
					stroke-opacity="0.5"
				/>
			{/if}
		{/each}

		<!-- Traveling dot markers for each connection -->
		{#each nodes as _, i}
			{#if i > 0}
				<circle
					class="df-dot"
					cx={nodes[i - 1].x + cfg.nodeW}
					cy={cfg.padY + cfg.nodeH / 2}
					r={cfg.dotR}
					fill={BRAND_COLORS[(i - 1) % BRAND_COLORS.length]}
					opacity="0.8"
				/>
			{/if}
		{/each}

		<!-- Nodes: rounded rect with centered text label -->
		{#each nodes as node}
			<g class="df-node">
				<rect
					x={node.x}
					y={node.y}
					width={cfg.nodeW}
					height={cfg.nodeH}
					rx={cfg.rx}
					ry={cfg.rx}
					fill="none"
					stroke={node.color}
					stroke-width={cfg.strokeW}
					stroke-opacity="0.75"
				/>
				<text
					x={node.x + cfg.nodeW / 2}
					y={node.y + cfg.nodeH / 2}
					text-anchor="middle"
					dominant-baseline="central"
					fill={node.color}
					font-size={cfg.fontSize}
					font-family="'JetBrains Mono', monospace"
				>
					{node.label.length > maxLabelLen ? node.label.slice(0, maxLabelLen - 1) + '\u2026' : node.label}
				</text>
			</g>
		{/each}
	</svg>
</div>

<style>
	.data-flow-diagram {
		width: 100%;
	}

	/* Both sizes: scale SVG to fit container width, preserving aspect ratio */
	.data-flow-diagram svg {
		width: 100%;
		height: auto;
		max-width: 100%;
	}

	/* Allow horizontal scroll only when SVG would be unreadably small */
	.data-flow-diagram.scrollable {
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
	}

	.data-flow-diagram.scrollable::-webkit-scrollbar {
		height: 4px;
	}

	.data-flow-diagram.scrollable::-webkit-scrollbar-track {
		background: var(--card);
	}

	.data-flow-diagram.scrollable::-webkit-scrollbar-thumb {
		background: var(--popover);
		border-radius: 2px;
	}
</style>
