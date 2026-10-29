<script lang="ts">
	import { durationSec } from '@yesid/motion/tokens';
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { resolveLocale } from '#lib/utils/index.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();

	import type { CloserContent, SiteMeta } from '#lib/types.ts';

	// slice-18i Phase 7C: closerContent now flows as a prop from the server load.
	let {
		closer: closerContent,
		siteMeta,
	}: {
		closer: CloserContent;
		siteMeta: SiteMeta;
	} = $props();
	import { initScrollTriggerConfig, gsap } from '@yesid/motion/utils/gsap';
	import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
	import { pressBounce } from '@yesid/motion/actions';
	import HeroDotAnnotation from './HeroDotAnnotation.svelte';
	import { getLettering, THE_END } from './annotation-lettering';
	import { ConstructionProps } from '@yesid/ui/brand';
	import CloserFloodlight from './CloserFloodlight.svelte';
	import { backgroundBreathing } from '#lib/motion/scrubs/index.ts';
	import CloserTerminalBoard from './CloserTerminalBoard.svelte';

	// Static content
	const ctaLabel = $derived(resolveLocale(closerContent.cta.label, locale));
	const ctaHref = $derived(closerContent.cta.href);
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
	let coreEl: HTMLElement;
	let noteEl: HTMLElement;
	let noteDrop = $state(0);
	let groundAnchor = $state<HTMLElement>();
	let revealProgress = $state(1);
	let note = $state(1);
	let viewportHeight = $state(0);
	const clamp = (value: number) => Math.min(1, Math.max(0, value));
	// With the construction reveal the lamp rises, then its beam comes on.
	const lamp = $derived(clamp(revealProgress / 0.2));
	const beam = $derived(clamp((revealProgress - 0.1) / 0.2));
	// The ending rises over the 100vh of scrolling that ends with the reveal, and writes
	// itself from the moment its rising top enters the viewport.
	const writeFrom = $derived(viewportHeight && 0.7 * viewportHeight / (viewportHeight + noteDrop));
	const ink = $derived(clamp((note - writeFrom) / (1 - writeFrom)));
	const closingLabel = THE_END[locale];
	const words = closingLabel.split(' ').map(getLettering);
	const wordWidth = Math.max(...words.map(word => word.width));
	// Authored SVG origins preserve the former localized wordmarks' painted centers.
	const origin = { en: { x: 6.245, y: 23.587 }, fr: { x: 4.533, y: 20.236 }, es: { x: 9.127, y: 22.279 } }[locale];
	let strokeIndex = 0;
	const lettering = {
		...getLettering(closingLabel), width: wordWidth, tilt: -12,
		letters: words.flatMap((word, row) => word.letters.map(letter => ({
			...letter, x: letter.x + (wordWidth - word.width) / (2 * word.scale), y: row * 26, index: strokeIndex++,
		}))),
	};

	onMount(() => {
		if (!browser || !sectionEl) return;
		const fit = new ResizeObserver(() => { noteDrop = coreEl.offsetHeight - noteEl.offsetTop; });
		fit.observe(coreEl); fit.observe(noteEl);
		// The reveal completes with the ground anchor at 70% of the viewport; the ending starts 100vh earlier.
		const follow = () => {
			viewportHeight = document.documentElement.clientHeight;
			note = clamp(1.7 - groundAnchor!.getBoundingClientRect().top / viewportHeight);
		};
		follow();
		addEventListener('scroll', follow, { passive: true });
		addEventListener('resize', follow);
		initScrollTriggerConfig();
		const context = gsap.context(() => {
			if (isPrefersReducedMotion()) return;
			gsap.timeline({ scrollTrigger: { trigger: sectionEl, start: 'top 80%', once: true } })
				.from('[data-closer-board]', { opacity: 0, scale: 0.98, duration: durationSec('slower') })
				.from('[data-closer-row]', { opacity: 0, x: -10, stagger: 0.05, duration: durationSec('slow') }, '-=0.3');
		}, sectionEl);
		const breathing = backgroundBreathing(sectionEl, { duration: 12 });
		return () => {
			context.revert(); breathing.destroy(); fit.disconnect();
			removeEventListener('scroll', follow);
			removeEventListener('resize', follow);
		};
	});
</script>

<!-- Terminus board and an authored note on the blueprint page. -->

<section
	bind:this={sectionEl}
	data-testid="closer-section"
	class="closer-section relative"
	style="--closer-reveal: {revealProgress}; --closer-lamp: {lamp}; --closer-beam: {beam}; --closer-note: {note}; --closer-note-drop: {noteDrop}px;"
>
	<div class="closer-core" bind:this={coreEl}>
	<div class="closer-note" bind:this={noteEl} role="img" aria-label={closingLabel}>
		<HeroDotAnnotation {lettering} width={wordWidth + 14} height={words.length > 1 ? 48 : 30} x={origin.x} y={origin.y} visible progress={ink} />
	</div>


	<!-- Content -->
	<div class="closer-content relative z-10">
		<!-- Terminal departure board -->
		<CloserTerminalBoard
			rows={rows}
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
	</div>
	<div class="ground-anchor" bind:this={groundAnchor} aria-hidden="true"></div>
	<div class="construction-extension" aria-hidden="true"></div>
	<CloserFloodlight />
	<ConstructionProps lighting layout="around-fixture" revealAt={groundAnchor} bind:progress={revealProgress} />
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
		/* The 100px ground under the board unfolds with the reveal; unfolded, it is the original bottom clearance. */
		--closer-ground-fold: calc((1 - var(--closer-reveal, 1)) * 100px);
		background: transparent; position: relative; overflow-y: clip;
		--construction-end-inset: calc(4% + clamp(160px, 18vw, 260px) + 1rem);
	}
	.closer-core { min-height: calc(100dvh - 100px); display: flex; align-items: center; padding: var(--space-section-y) var(--space-page-x) 0; position: relative; }
	.ground-anchor { height: 0; width: 1px; pointer-events: none; }
	.construction-extension { height: calc(100px - var(--closer-ground-fold)); }
	/* From tablet width the props spread along the ground beside the ending. */
	@media (--tablet-min) {
		.closer-section :global(.around .floor) {
			position: absolute; inset-inline: clamp(16px, 4vw, 64px) var(--construction-end-inset);
			bottom: 0; display: flex; align-items: flex-end; justify-content: space-evenly;
			gap: clamp(6px, 1.6vw, 24px);
		}
		.closer-section :global(.around [data-construction-prop]) {
			position: relative; inset: auto; flex: 0 1 auto; min-width: 0;
		}
		.closer-section :global(.around [data-construction-prop='sign']) { order: 0; }
		.closer-section :global(.around [data-construction-prop='helmet']) { order: 1; }
		.closer-section :global(.around [data-construction-prop='barricade']) { order: 2; }
		.closer-section :global(.around [data-construction-prop='balise']) { order: 3; }
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
			color-mix(in srgb, var(--glow) calc(2% + var(--breathing-phase, 0) * 3%), transparent),
			transparent 75%
		);
	}
	:global([data-theme="light"]) .closer-section::before {
		background: radial-gradient(
			ellipse 80% 55% at 50% 100%,
			color-mix(in srgb, var(--glow) calc(8% + var(--breathing-phase, 0) * 8%), transparent),
			transparent 75%
		);
	}

	/* Content area — wide, leaves room for the authored wordmark on the right */
	.closer-content {
		max-width: 78%;
		width: 100%;
		padding-inline-start: clamp(1rem, 4vw, 3rem);
	}

	/* Keep the former square wordmark slot; only its authored lettering changes. */
	.closer-note {
		/* 20% of the core plus its 100px ground, where the ending sat before the ground moved out of the core. */
		position: absolute; right: 4%; bottom: calc(20% - 80px);
		width: clamp(160px, 18vw, 260px); max-width: 260px; aspect-ratio: 1;
		z-index: calc(var(--z-content) + 1); overflow: visible;
		/* Starts just below the ground and rises linearly over its scroll window. */
		translate: 0 calc((1 - var(--closer-note, 1)) * var(--closer-note-drop, 0px));
	}
	@media (--tablet-max) {
		.closer-note {
			position: relative; inset: auto; transform: none;
			width: clamp(140px, 40vw, 200px); max-width: none;
			order: 2; margin: 24px auto 0;
		}
		/* The ending stacks under the board and fills that space, so the ground stays folded; the props still reveal. */
		.construction-extension { height: 0; }
	}
	@media (prefers-reduced-motion: reduce) {
		.closer-section { --closer-ground-fold: 0px; }
		.closer-note { translate: none; }
		.closer-note :global(svg) { visibility: visible; }
		.closer-note :global(path) { animation: none; stroke-dashoffset: 0; }
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
		font-size: var(--text-control);
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
	@media (--tablet-max) {
		.closer-core {
			min-height: 100dvh;
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
