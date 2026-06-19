<!--
  HomeCloser — Section 5: Transit terminus departure board + graffiti "THE END".
  Merges Blog Teaser + About Strip + Dual CTA into one conversion-focused closer.
  Desktop: board left, graffiti right. Mobile: graffiti behind, board full-width.
  Orchestrates GSAP master timeline across sub-components.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { browser } from '$app/environment';
	import { resolveLocale } from '$lib/utils';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();

	import type { CloserContent, SiteMeta } from '$lib/types';

	// slice-18i Phase 7C: closerContent now flows as a prop from the server load.
	let {
		closer: closerContent,
		siteMeta,
	}: {
		closer: CloserContent;
		siteMeta: SiteMeta;
	} = $props();
	import { initScrollTriggerConfig, loadDrawSVG, gsap } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { pressBounce } from '$lib/motion/actions';
	import { backgroundBreathing, type BreathingControls } from '$lib/motion/scrubs/index.js';
	import CloserGraffiti from './CloserGraffiti.svelte';
	import CloserFloodlight from './CloserFloodlight.svelte';
	import CloserProps from './CloserProps.svelte';
	import CloserTerminalBoard from './CloserTerminalBoard.svelte';

	// Static content
	const ctaLabel = $derived(resolveLocale(closerContent.cta.label, locale));
	const ctaHref = $derived(closerContent.cta.href);
	const stackLabel = $derived(resolveLocale(closerContent.rows.stack.label, locale));
	const stackDesc = $derived(resolveLocale(closerContent.rows.stack.description, locale));
	const stackAction = $derived(resolveLocale(closerContent.rows.stack.action, locale));
	const contactLabel = $derived(resolveLocale(closerContent.rows.contact.label, locale));
	const contactDesc = $derived(resolveLocale(closerContent.rows.contact.description, locale));
	const contactAction = $derived(resolveLocale(closerContent.rows.contact.action, locale));
	const connectLabel = $derived(resolveLocale(closerContent.rows.connect.label, locale));
	const connectDesc = $derived(resolveLocale(closerContent.rows.connect.description, locale));
	const connectAction = $derived(resolveLocale(closerContent.rows.connect.action, locale));
	const readLabel = $derived(resolveLocale(closerContent.rows.read.label, locale));
	const readDesc = $derived(resolveLocale(closerContent.rows.read.description, locale));
	const readAction = $derived(resolveLocale(closerContent.rows.read.action, locale));
	const aboutLabel = $derived(resolveLocale(closerContent.rows.about.label, locale));
	const aboutDesc = $derived(resolveLocale(closerContent.rows.about.description, locale));
	const aboutAction = $derived(resolveLocale(closerContent.rows.about.action, locale));

	// Terminal chrome copy — added in Task 17b-7a.
	const terminalTitleText = $derived(resolveLocale(closerContent.terminal.title, locale));
	const terminalCityLabel = $derived(resolveLocale(closerContent.terminal.city, locale));
	const terminalEncodingLabel = $derived(resolveLocale(closerContent.terminal.encoding, locale));
	const terminalDestinationsTemplate = $derived(resolveLocale(closerContent.terminal.destinationsLabel, locale));
	const terminalPromptLine = $derived(resolveLocale(closerContent.terminal.prompt, locale));

	// Build row data
	type BoardRow = {
		label: string;
		description: string;
		action: string;
		href: string;
		primary: boolean;
	};
	const rows = $derived([
		{
			label: stackLabel,
			description: stackDesc,
			action: stackAction,
			href: '/tech-stack',
			primary: false,
		},
		{
			label: contactLabel,
			description: contactDesc,
			action: contactAction,
			href: '/contact',
			primary: true,
		},
		{
			label: aboutLabel,
			description: aboutDesc,
			action: aboutAction,
			href: '/about',
			primary: false,
		},
		{
			label: readLabel,
			description: readDesc,
			action: readAction,
			href: '/blog',
			primary: false,
		},
		{
			label: connectLabel,
			description: connectDesc,
			action: connectAction,
			href: siteMeta.links.github,
			primary: true,
		},
	] satisfies BoardRow[]);

	let sectionEl: HTMLElement | undefined = $state(undefined);
	let masterTl: gsap.core.Timeline | undefined;
	let breathing: BreathingControls | null = null;
	let timelineBuilt = false;

	function buildMasterTimeline(graffitiAnimateFn?: () => gsap.core.Timeline) {
		if (timelineBuilt || !sectionEl) return;
		timelineBuilt = true;

		const boardEl = sectionEl.querySelector('[data-closer-board]');
		const rowEls = sectionEl.querySelectorAll('[data-closer-row]');

		masterTl = gsap.timeline({
			scrollTrigger: {
				trigger: sectionEl,
				start: 'top 80%',
				once: true,
			},
		});

		masterTl
			.to(boardEl, { opacity: 1, scale: 1, duration: 0.5 })
			.to(rowEls, { opacity: 1, x: 0, stagger: 0.05, duration: 0.3 }, '-=0.3');

		if (graffitiAnimateFn) {
			masterTl.add(graffitiAnimateFn(), '-=0.4');
		}
	}

	function handleGraffitiReady(animateFn: () => gsap.core.Timeline) {
		buildMasterTimeline(animateFn);
	}

	onMount(async () => {
		if (!browser || !sectionEl) return;

		const reduced = isPrefersReducedMotion();
		// CloserGraffiti uses DrawSVG (strokes the "THE END" letters). Preload
		// before CloserGraffiti's async onReady fires so the timeline can use
		// `drawSVG: '100%'` tweens immediately.
		await loadDrawSVG();
		if (!sectionEl) return; // unmount-during-await guard
		initScrollTriggerConfig();

		if (!reduced) {
			const boardEl = sectionEl.querySelector('[data-closer-board]');
			const rowEls = sectionEl.querySelectorAll('[data-closer-row]');

			gsap.set(boardEl, { opacity: 0, scale: 0.98 });
			gsap.set(rowEls, { opacity: 0, x: -10 });
		}
	});

	// GO-w2t5: slice-23 orphan wired — ambient breathing behind the depot
	// board. MOTION-GATED tier: backgroundBreathing self-no-ops under reduce.
	onMount(() => {
		if (!sectionEl) return;
		breathing = backgroundBreathing(sectionEl, { duration: 12 });
		return () => {
			breathing?.destroy();
			breathing = null;
		};
	});

	onDestroy(() => {
		masterTl?.kill();
	});
</script>

<section
	bind:this={sectionEl}
	data-testid="closer-section"
	class="closer-section relative"
>
	<!-- Graffiti "THE END" — SVG loaded dynamically for DrawSVG animation -->
	<CloserGraffiti onReady={handleGraffitiReady} />

	<!-- Floodlight fixture — ground level, centered on graffiti -->
	<CloserFloodlight />

	<!-- Construction props — individual pieces for positioning freedom -->
	<CloserProps />

	<!-- Content -->
	<div class="closer-content relative z-10">
		<!-- Terminal departure board -->
		<CloserTerminalBoard
			{rows}
			terminalTitle={terminalTitleText}
			cityLabel={terminalCityLabel}
			encodingLabel={terminalEncodingLabel}
			destinationsTemplate={terminalDestinationsTemplate}
			promptLine={terminalPromptLine}
		/>

		<!-- CTA -->
		<a href={ctaHref} data-testid="closer-cta" class="closer-cta tap-press" use:pressBounce>
			{ctaLabel} <span class="closer-cta-arrow">-{'>'}</span>
		</a>

	</div>
</section>

<style>
	/* go2/w4 operator QA: the GO-W2.2 .theme-dark pin is REMOVED — it read as
	   an extra dark layer and kept the closer terminal dark in light mode.
	   GO2-W5 round 6 (operator): the section paints NOTHING of its own —
	   transparent in both themes so the page's circuit-grid schematic shows
	   through the terminus. Solidity lives in the terminal board inside
	   (--terminal === --background, the round-2 contract), never on the
	   section wrapper. */
	.closer-section {
		background: transparent;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		padding: var(--space-section-y) var(--space-page-x) 100px;
		position: relative;
	}

	/* GO-w2t5: breathing consumer — var(--breathing-phase) 0↔1 modulates a
	   faint floor glow under the board ("is it actually moving?" subtle). */
	.closer-section::before {
		content: '';
		position: absolute;
		inset: 0;
		pointer-events: none;
		background: radial-gradient(
			ellipse 80% 55% at 50% 100%,
			color-mix(in srgb, var(--primary) calc(2% + var(--breathing-phase, 0) * 3%), transparent),
			transparent 75%
		);
	}
	:global([data-theme='light']) .closer-section::before {
		background: radial-gradient(
			ellipse 80% 55% at 50% 100%,
			color-mix(in srgb, var(--primary) calc(8% + var(--breathing-phase, 0) * 8%), transparent),
			transparent 75%
		);
	}

	/* Content area — wide, leaves room for graffiti on the right */
	.closer-content {
		max-width: 78%;
		width: 100%;
		padding-inline-start: clamp(1rem, 4vw, 3rem);
	}

	/* ===== CTA ===== */
	/* Round 5c YELLOW-CONVERSION doctrine: "Initialize connection ->" is the
	   terminus conversion action — a SOLID yellow signage button, not a ghost
	   outline. Theme-invariant pair (--accent #FFB627 ground, --signage-bg
	   #1C1814 ink, ≈10:1 both modes); hover per the accent system. */
	.closer-cta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 15px;
		font-weight: 600;
		color: var(--signage-bg);
		background: var(--accent);
		text-decoration: none;
		padding: 16px 28px;
		min-height: 44px;
		border: 1px solid transparent;
		border-radius: var(--radius-sm);
		margin-block-end: 28px;
		transition: background-color var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default), color var(--duration-normal) var(--ease-default);
		letter-spacing: 0.5px;
	}
	/* Color-only hover — pressBounce owns this element's transform. */
	.closer-cta:hover {
		background: var(--accent-hover);
		color: var(--signage-bg);
	}
	.closer-cta-arrow {
		transition: transform var(--duration-normal);
	}
	.closer-cta:hover .closer-cta-arrow {
		transform: translateX(4px);
	}

	/* ===== Mobile (<768px) ===== */
	@media (max-width: 767px) {
		.closer-section {
			flex-direction: column;
			align-items: stretch;
			justify-content: center;
			padding: var(--space-section-y) var(--space-page-x) 100px;
		}

		.closer-content {
			max-width: 100%;
			padding-inline-start: 0;
			order: 1;
		}
	}

	/* Horizontal + top padding now handled by fluid tokens (--space-page-x, --space-section-y).
	   Bottom 100px stays fixed for construction scene clearance. */
</style>
