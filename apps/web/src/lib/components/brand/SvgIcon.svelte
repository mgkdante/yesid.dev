<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { BlogAnimation } from '#lib/types.ts';
	// Brief drawing and user-triggered path morphing remain active under reduced motion.
	import { initScrollTriggerConfig, loadDrawSVG, loadMorphSVG } from '@yesid/motion/utils/gsap';
	import { morphHover } from '#lib/motion/actions/morphHover.ts';
	import { convertSvgToMorphPaths } from '#lib/motion/utils/morphHelpers.ts';
	import { playSvgEntrance } from '#lib/motion/utils/svgEntrance.ts';
	import { cn } from '@yesid/ui/cn';

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
	let entranceDone = $state(false);
	let entrance: gsap.core.Timeline | undefined;

	onMount(async () => {
		if (!container) return;
		// Entrance variants use DrawSVG, and shapes convert through MorphSVG.
		await Promise.all([loadDrawSVG(), loadMorphSVG()]);
		// Component may have unmounted while awaiting (tests mount + unmount
		// rapidly). Re-check before touching the DOM.
		if (!container) return;
		initScrollTriggerConfig();

		const svg = container.querySelector('svg');
		if (!svg) return;

		const { paths } = convertSvgToMorphPaths(svg);
		if (paths.length === 0) return;

		entrance = playSvgEntrance(paths, {
			animation,
			scrollTrigger: trigger === 'scroll' ? { trigger: container, start: 'top 80%', once: true } : undefined,
			onComplete: () => {
				entranceDone = true;
			},
		});
	});

	onDestroy(() => entrance?.kill());
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
	role="presentation"
	use:morphHover={{ enabled: entranceDone, hovered }}
	{...rest}
>
	{@html svgContent}
</div>
