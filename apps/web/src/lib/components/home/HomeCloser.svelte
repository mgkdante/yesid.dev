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

	import { getLatestPosts } from '$lib/content';
	import { siteMeta } from '$lib/content/site-meta';
	import type { CloserContent } from '$lib/types';

	// slice-18i Phase 7C: closerContent now flows as a prop from the server load.
	let { closer: closerContent }: { closer: CloserContent } = $props();
	import { initScrollTriggerConfig, loadDrawSVG, gsap } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { pressBounce } from '$lib/motion/actions';
	import CloserGraffiti from './CloserGraffiti.svelte';
	import CloserFloodlight from './CloserFloodlight.svelte';
	import CloserProps from './CloserProps.svelte';
	import CloserTerminalBoard from './CloserTerminalBoard.svelte';

	// Static content
	const heading = resolveLocale(closerContent.heading, 'en');
	const headingDot = resolveLocale(closerContent.headingDot, 'en');
	const subheading = resolveLocale(closerContent.subheading, 'en');
	const ctaLabel = resolveLocale(closerContent.cta.label, 'en');
	const ctaHref = closerContent.cta.href;
	const contactLabel = resolveLocale(closerContent.rows.contact.label, 'en');
	const contactDesc = resolveLocale(closerContent.rows.contact.description, 'en');
	const contactAction = resolveLocale(closerContent.rows.contact.action, 'en');
	const connectLabel = resolveLocale(closerContent.rows.connect.label, 'en');
	const connectDesc = resolveLocale(closerContent.rows.connect.description, 'en');
	const connectAction = resolveLocale(closerContent.rows.connect.action, 'en');
	const readLabel = resolveLocale(closerContent.rows.read.label, 'en');
	const readAction = resolveLocale(closerContent.rows.read.action, 'en');
	const aboutLabel = resolveLocale(closerContent.rows.about.label, 'en');
	const aboutDesc = resolveLocale(closerContent.rows.about.description, 'en');
	const aboutAction = resolveLocale(closerContent.rows.about.action, 'en');

	// Terminal chrome copy — added in Task 17b-7a.
	const terminalTitleText = resolveLocale(closerContent.terminal.title, 'en');
	const terminalCityLabel = resolveLocale(closerContent.terminal.city, 'en');
	const terminalEncodingLabel = resolveLocale(closerContent.terminal.encoding, 'en');
	const terminalDestinationsTemplate = resolveLocale(closerContent.terminal.destinationsLabel, 'en');
	const terminalPromptLine = resolveLocale(closerContent.terminal.prompt, 'en');

	// Dynamic blog posts
	const latestPosts = getLatestPosts(2, 'professional');

	// Build row data
	type BoardRow = {
		label: string;
		description: string;
		action: string;
		href: string;
		primary: boolean;
	};
	const rows: BoardRow[] = [
		{
			label: contactLabel,
			description: contactDesc,
			action: contactAction,
			href: '/contact',
			primary: true,
		},
		{
			label: connectLabel,
			description: connectDesc,
			action: connectAction,
			href: siteMeta.links.github,
			primary: true,
		},
		...latestPosts.map((post) => ({
			label: readLabel,
			description: post.title,
			action: readAction,
			href: `/blog/${post.slug}`,
			primary: false,
		})),
		{
			label: aboutLabel,
			description: aboutDesc,
			action: aboutAction,
			href: '/about',
			primary: false,
		},
	];

	let sectionEl: HTMLElement | undefined = $state(undefined);
	let masterTl: gsap.core.Timeline | undefined;
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
	.closer-section {
		min-height: 100dvh;
		display: flex;
		align-items: center;
		padding: var(--space-section-y) var(--space-page-x) 100px;
		position: relative;
	}

	/* Content area — wide, leaves room for graffiti on the right */
	.closer-content {
		max-width: 78%;
		width: 100%;
		padding-inline-start: clamp(1rem, 4vw, 3rem);
	}

	.closer-heading {
		font-family: var(--font-heading);
		font-size: clamp(2.5rem, 6vw, 4rem);
		font-weight: 900;
		color: var(--foreground);
		letter-spacing: -2px;
		margin-block-end: 6px;
	}
	.closer-dot {
		color: var(--primary);
	}

	.closer-subheading {
		margin-block-end: 36px;
	}

	/* ===== CTA ===== */
	.closer-cta {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		font-family: var(--font-mono);
		font-size: 15px;
		font-weight: 600;
		color: var(--accent);
		text-decoration: none;
		padding: 16px 28px;
		min-height: 44px;
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		border-radius: var(--radius-sm);
		margin-block-end: 28px;
		transition: background-color var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default), color var(--duration-normal) var(--ease-default);
		letter-spacing: 0.5px;
	}
	.closer-cta:hover {
		background: color-mix(in srgb, var(--accent) 8%, transparent);
		border-color: color-mix(in srgb, var(--accent) 60%, transparent);
		color: var(--foreground);
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
