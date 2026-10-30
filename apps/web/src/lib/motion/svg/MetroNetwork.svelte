<!-- Inline the build-time metro SVG for SSR paint, then expose its groups to GSAP. -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isViewportAtMost } from '@yesid/motion/utils/device';

	interface Props {
		svg: string;
		containerEl?: HTMLDivElement;
		svgEl?: SVGSVGElement;
	}

	let { svg, containerEl = $bindable(), svgEl = $bindable() }: Props = $props();

	onMount(() => {
		if (!containerEl) return;

		const found = containerEl.querySelector('svg');
		if (!found) return;
		svgEl = found;

		found.setAttribute('class', 'h-full w-full');
		found.setAttribute('aria-hidden', 'true');
		found.setAttribute('data-testid', 'metro-network');
		found.setAttribute('preserveAspectRatio', 'xMidYMid meet');
		// Mobile: crop viewBox to a taller region so the SVG renders bigger,
		// keeping Berri-UQAM at the same ~80% horizontal position
		// (replaces `window.innerWidth < 768` — same boundary at integer widths)
		const isMobile = isViewportAtMost(767);
		if (isMobile) {
			found.setAttribute('viewBox', '972 300 600 600');
		}
		found.style.overflow = 'visible';

		// Classify elements by their visual role:
		// Lines are stroke paths (no fill, have stroke attribute)
		// Stations are small filled circles/paths with fill="#E07800"
		// Background is the large dark shape (fill="#1E1E1E")
		// Labels are grey text paths (fill="#808285")
		const allPaths = found.querySelectorAll('path');
		let biggestStation: Element | null = null;
		let biggestSize = 0;

		allPaths.forEach((path) => {
			const fill = path.getAttribute('fill');
			const stroke = path.getAttribute('stroke');

			if (stroke === '#E07800') {
				// Metro line — stroke path for DrawSVGPlugin
				path.classList.add('metro-line');
				path.style.opacity = '0';
			} else if (fill === '#E07800') {
				// Station circle
				path.classList.add('metro-station');
				path.style.opacity = '0';

				// Find the biggest station = Berri-UQAM
				const bbox = path.getBBox();
				const size = bbox.width * bbox.height;
				if (size > biggestSize) {
					biggestSize = size;
					biggestStation = path;
				}
			} else if (fill === '#1E1E1E') {
				// Montreal background shape
				path.classList.add('metro-bg');
				path.style.opacity = '0';
			} else if (fill === '#808285') {
				// Text labels
				path.classList.add('metro-label');
				path.style.opacity = '0';
			} else if (fill === 'white') {
				// Mask path — hide
				path.style.opacity = '0';
			}
		});

		// Mark Berri-UQAM as the origin
		if (biggestStation) {
			(biggestStation as Element).classList.add('metro-berri');
		}
	});
</script>

<div
	bind:this={containerEl}
	class="metro-network-frame relative flex max-h-[80dvh] w-full items-center justify-center"
	data-testid="metro-network-container"
>{@html svg}</div>

<style>
	:global(.metro-network-frame svg [stroke="#E07800"]),
	:global(.metro-network-frame svg [fill="#E07800"]),
	:global(.metro-network-frame svg [fill="#1E1E1E"]),
	:global(.metro-network-frame svg [fill="#808285"]),
	:global(.metro-network-frame svg [fill="white"]) {
		opacity: 0;
	}

	/* CSS owns theme-aware SVG color; the timeline changes only opacity and drawing progress. */
	:global([data-theme="light"] .metro-network-frame svg [fill="#1E1E1E"]),
	:global(.theme-light .metro-network-frame svg [fill="#1E1E1E"]) {
		fill: var(--muted);
	}
	:global([data-theme="light"] .metro-network-frame svg [fill="#808285"]),
	:global(.theme-light .metro-network-frame svg [fill="#808285"]) {
		fill: var(--muted-foreground);
	}
	:global([data-theme="light"] .metro-network-frame svg [fill="#E07800"]),
	:global(.theme-light .metro-network-frame svg [fill="#E07800"]) {
		fill: var(--primary);
	}
	:global([data-theme="light"] .metro-network-frame svg [stroke="#E07800"]),
	:global(.theme-light .metro-network-frame svg [stroke="#E07800"]) {
		stroke: var(--primary);
	}
</style>
