<!--
  MetroNetwork: loads Yesid's montreal_map.svg inline and exposes
  DOM groups for GSAP animation.

  SVG structure (from Yesid's Figma export):
    - Montreal background: the dark city shape (lines 3-6, fill="#1E1E1E")
    - Text labels: zone names in grey (lines 7-46, fill="#808285")
    - Stations: orange circles (lines 48-123, fill="#E07800")
    - Lines: orange stroke paths (lines 124-129, stroke="#E07800")
    - Berri-UQAM: the biggest station circle (~20px radius, line 113)

  GSAP targets (set via onMount DOM queries):
    - .metro-line: stroke paths for DrawSVGPlugin
    - .metro-station: station circles
    - .metro-berri: the Berri-UQAM origin node
    - .metro-bg: the Montreal background shape
    - .metro-label: text labels
-->
<script lang="ts">
	import { onMount } from 'svelte';

	let containerEl = $state<HTMLDivElement | undefined>(undefined);
	let svgEl = $state<SVGSVGElement | undefined>(undefined);

	onMount(async () => {
		if (!containerEl) return;

		// Fetch the SVG and inject inline for DOM access.
		// Guard: fetch fails in jsdom test environment (no server).
		let svgText: string;
		try {
			const resp = await fetch('/images/montreal-metro.svg');
			svgText = await resp.text();
		} catch {
			return; // Tests run without a server — skip SVG injection
		}
		containerEl.innerHTML = svgText;

		const svg = containerEl.querySelector('svg');
		if (!svg) return;
		svgEl = svg;

		svg.setAttribute('class', 'h-full w-full');
		svg.setAttribute('aria-hidden', 'true');
		svg.setAttribute('data-testid', 'metro-network');
		svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
		svg.style.overflow = 'visible';

		// Classify elements by their visual role:
		// Lines are stroke paths (no fill, have stroke attribute)
		// Stations are small filled circles/paths with fill="#E07800"
		// Background is the large dark shape (fill="#1E1E1E")
		// Labels are grey text paths (fill="#808285")
		const allPaths = svg.querySelectorAll('path');
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

	export { containerEl, svgEl };
</script>

<div
	bind:this={containerEl}
	class="flex max-h-[80vh] w-full items-center justify-center"
	data-testid="metro-network-container"
></div>
