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
	let noteEl: HTMLElement;
	let writing = $state(false);
	const closingLabel = THE_END[locale];
	const lettering = { ...getLettering(closingLabel), tilt: -12 };

	onMount(() => {
		if (!browser || !sectionEl) return;
		const observer = new IntersectionObserver(entries => {
			if (entries.some(entry => entry.isIntersecting)) {
				writing = true;
				observer.disconnect();
			}
		});
		observer.observe(noteEl);
		if (isPrefersReducedMotion()) writing = true;
		initScrollTriggerConfig();
		const context = gsap.context(() => {
			if (isPrefersReducedMotion()) return;
			gsap.timeline({ scrollTrigger: { trigger: sectionEl, start: 'top 80%', once: true } })
				.from('[data-closer-board]', { opacity: 0, scale: 0.98, duration: durationSec('slower') })
				.from('[data-closer-row]', { opacity: 0, x: -10, stagger: 0.05, duration: durationSec('slow') }, '-=0.3');
		}, sectionEl);
		return () => { observer.disconnect(); context.revert(); };
	});
</script>

<!-- Terminus board and an authored note on the blueprint page. -->

<section
	bind:this={sectionEl}
	data-testid="closer-section"
	class="closer-section relative"
>
	<div class="closer-note" bind:this={noteEl} role="img" aria-label={closingLabel}>
		<HeroDotAnnotation {lettering} width={lettering.width + 24} height={52} x={10} y={34} visible={true} ready={writing} initiallyDrawn />
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
</section>

<style>

	.closer-section {
		background: transparent;
		min-height: 100dvh;
		display: flex;
		align-items: center;
		padding: var(--space-section-y) var(--space-page-x);
		position: relative;
	}

	.closer-note {
		position: absolute;
		right: var(--space-page-x);
		top: 25%;
		width: clamp(160px, 23vw, 360px);
		aspect-ratio: 2.3;
		pointer-events: none;
	}
	@media (prefers-reduced-motion: reduce) {
		.closer-note :global(svg) { visibility: visible; }
		.closer-note :global(path) { animation: none; stroke-dashoffset: 0; }
	}

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
		.closer-section {
			flex-direction: column;
			align-items: stretch;
			justify-content: center;
			padding: var(--space-section-y) var(--space-page-x);
		}

		.closer-note {
			position: relative;
			right: auto;
			top: auto;
			align-self: flex-end;
			margin-bottom: 1rem;
		}

		.closer-content {
			max-width: 100%;
			padding-inline-start: 0;
			order: 1;
		}
	}

</style>
