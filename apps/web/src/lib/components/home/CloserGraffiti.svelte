<!--
  CloserGraffiti — DrawSVG graffiti "THE END" animation subsystem.
  Fetches SVG, parses letter paths, animates with DrawSVGPlugin.
  Parent coordinates timing via onReady callback.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { gsap, ScrollTrigger } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';

	type LetterData = { main: SVGPathElement; drips: SVGPathElement[] };

	// go2-t1c2: img-role aria from site_labels, previous literal as fallback.
	const graffitiAria = resolveLocale(siteLabels.a11y.closerGraffiti, locale) || 'THE END graffiti';

	let {
		onReady,
	}: {
		onReady?: (animateFn: () => gsap.core.Timeline) => void;
	} = $props();

	// Darker base — the floodlight filter brightens the lit areas
	const GRAFFITI_COLOR = '#8B4500';
	let wrapperEl: HTMLElement | undefined = $state(undefined);
	let graffitiTl: gsap.core.Timeline | undefined;

	async function loadGraffiti(wrapper: Element): Promise<LetterData[]> {
		let res: Response;
		try {
			res = await fetch('/svg/graffiti/the-end.svg');
		} catch {
			return []; // Tests run without a server — skip SVG injection
		}
		const text = await res.text();
		const parser = new DOMParser();
		const doc = parser.parseFromString(text, 'image/svg+xml');
		const svg = doc.querySelector('svg');
		if (!svg) return [];

		// White stroke for DrawSVG hand-drawn trace, fill controlled by GSAP
		svg.setAttribute('fill', 'none');
		svg.setAttribute('stroke', '#ffffff');
		svg.setAttribute('stroke-width', '4');
		svg.setAttribute('stroke-linecap', 'round');
		svg.setAttribute('stroke-linejoin', 'round');
		svg.classList.add('closer-graffiti-svg');

		// Construction floodlight filter — light from bottom up
		const defs = svg.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
		if (!svg.querySelector('defs')) svg.prepend(defs);

		const vb = svg.getAttribute('viewBox')?.split(' ').map(Number) ?? [0, 0, 260, 280];
		const cx = vb[2] / 2;  // center x of viewBox
		const h = vb[3];       // height of viewBox

		defs.innerHTML += `
			<filter id="floodlight" x="-50%" y="-50%" width="200%" height="200%">
				<feDiffuseLighting in="SourceGraphic" result="light" surfaceScale="5" diffuseConstant="1.4" lighting-color="var(--accent)">
					<feSpotLight x="${cx}" y="${h + 200}" z="40" pointsAtX="${cx}" pointsAtY="0" pointsAtZ="0" specularExponent="8" limitingConeAngle="45"/>
				</feDiffuseLighting>
				<feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="1.4" k2="0.2" k3="0" k4="0"/>
			</filter>
		`;

		// Apply spotlight to the entire graffiti content
		const contentGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		contentGroup.setAttribute('filter', 'url(#floodlight)');
		const children = Array.from(svg.children).filter(c => c.tagName !== 'defs');
		children.forEach(c => contentGroup.appendChild(c));
		svg.appendChild(contentGroup);

		wrapper.appendChild(svg);

		// Groups are now inside the filtered container — query from svg root
		const groups = svg.querySelectorAll('g[data-letter]');
		const result: LetterData[] = [];
		groups.forEach((g) => {
			const paths = Array.from(g.querySelectorAll('path'));
			if (paths.length > 0) {
				result.push({ main: paths[0], drips: paths.slice(1) });
			}
		});

		// SVG renders in DOM order. Drips must paint on top of ALL letter
		// shapes (including neighbouring letters). Move each drip into a
		// layer at the end of the filtered content group.
		const dripsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		dripsLayer.setAttribute('data-layer', 'drips');
		contentGroup.appendChild(dripsLayer);

		result.forEach((letter) => {
			const parentTransform = letter.main.closest('g[data-letter]')?.getAttribute('transform') ?? '';
			letter.drips.forEach((drip) => {
				const dripWrapper = document.createElementNS('http://www.w3.org/2000/svg', 'g');
				dripWrapper.setAttribute('transform', parentTransform);
				dripWrapper.appendChild(drip);
				dripsLayer.appendChild(dripWrapper);
			});
		});

		return result;
	}

	function resetGraffiti(letterData: LetterData[]): void {
		const allMains = letterData.map((l) => l.main);
		const allDrips = letterData.flatMap((l) => l.drips);
		// Stroke hidden (DrawSVG 0%), no fill, drips collapsed
		gsap.set(allMains, { drawSVG: '0%', fill: 'none' });
		gsap.set(allDrips, { scaleY: 0, transformOrigin: 'top center', stroke: 'none', fill: GRAFFITI_COLOR });
	}

	function animateGraffiti(letterData: LetterData[]): gsap.core.Timeline {
		// Kill previous cleanly — no crossover
		if (graffitiTl) {
			graffitiTl.kill();
			graffitiTl = undefined;
		}

		resetGraffiti(letterData);

		const tl = gsap.timeline();
		graffitiTl = tl;

		// Per-letter sequence: draw outline → snap fill → next letter
		letterData.forEach((letter, i) => {
			const offset = i * 0.6; // stagger start per letter

			// Draw the letter outline with DrawSVG (hand-drawn feel)
			tl.to(letter.main, {
				drawSVG: '100%',
				duration: 0.7,
				ease: 'power1.inOut',
			}, offset);

			// Snap solid fill in right as stroke finishes
			tl.set(letter.main, {
				fill: GRAFFITI_COLOR,
			}, offset + 0.65);

			// Drips grow down from the filled letter
			if (letter.drips.length > 0) {
				tl.to(letter.drips, {
					scaleY: 1,
					stagger: 0.08,
					duration: 0.5,
					ease: 'power2.in',
				}, offset + 0.7);
			}
		});

		return tl;
	}

	onMount(() => {
		if (!browser || !wrapperEl) return;

		loadGraffiti(wrapperEl).then((letterData) => {
			if (letterData.length === 0) return;

			const reduced = isPrefersReducedMotion();

			// Initial state: letters invisible, drips scaled to 0
			resetGraffiti(letterData);

			if (reduced) {
				// Slice-23 policy: SVG drawing stays active under reduced-motion
				// (brief one-time stroke animation, not a vestibular trigger).
				// We don't go through the parent's master timeline — that
				// would also animate the departure board + rows, which are
				// scroll-driven and gated off under reduced-motion. Use our
				// own ScrollTrigger so the draw fires when the graffiti
				// scrolls into view.
				ScrollTrigger.create({
					trigger: wrapperEl,
					start: 'top 80%',
					once: true,
					onEnter: () => animateGraffiti(letterData),
				});
			} else {
				// Tell parent graffiti is ready — parent integrates into master timeline
				onReady?.(() => animateGraffiti(letterData));
			}

			// Hover/tap replay — works under both motion preferences.
			const replayDraw = () => animateGraffiti(letterData);
			wrapperEl!.addEventListener('mouseenter', replayDraw);
			wrapperEl!.addEventListener('touchstart', replayDraw, { passive: true });
		});

		return () => {
			graffitiTl?.kill();
		};
	});
</script>

<div
	bind:this={wrapperEl}
	class="closer-graffiti-wrap"
	data-testid="closer-graffiti"
	data-closer-graffiti
	role="img"
	aria-label={graffitiAria}
></div>

<style>
	/* Graffiti wrapper — bottom-right on desktop, behind on mobile */
	.closer-graffiti-wrap {
		position: absolute;
		right: 4%;
		bottom: 20%;
		width: clamp(160px, 18vw, 260px);
		max-width: 260px;
		pointer-events: auto;
		cursor: pointer;
		z-index: calc(var(--z-content) + 1);
		overflow: visible;
	}

	/* Injected SVG inherits this via class added in JS */
	:global(.closer-graffiti-svg) {
		width: 100% !important;
		height: auto !important;
		max-width: 100% !important;
		display: block;
		overflow: visible;
	}

	@media (max-width: 767px) {
		/* Graffiti flows after content on mobile */
		.closer-graffiti-wrap {
			position: relative;
			right: auto;
			bottom: auto;
			left: auto;
			top: auto;
			transform: none;
			width: clamp(140px, 40vw, 200px);
			max-width: none;
			opacity: 1;
			pointer-events: auto;
			order: 2;
			margin: 24px auto 0;
			z-index: calc(var(--z-content) + 1);
		}
	}
</style>
