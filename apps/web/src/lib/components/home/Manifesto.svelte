<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/env';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';

	const locale = getLocale();
	import { siteLabels } from '#lib/content/index.ts';
	import type { ManifestoContent } from '#lib/types.ts';

	let { manifesto: manifestoContent }: { manifesto: ManifestoContent } = $props();
	import { isPrefersReducedMotion } from '@yesid/motion/stores/reducedMotion';
	import { createCrescendoScrub } from '#lib/motion/scrubs/index.ts';
	import { boop } from '@yesid/motion/actions';
	import { ManifestoCanvas, TerminalCursor } from '@yesid/ui/brand';
	import ManifestoEdgeLeft from './ManifestoEdgeLeft.svelte';
	import ManifestoEdgeRight from './ManifestoEdgeRight.svelte';
	import ManifestoEdgeTop from './ManifestoEdgeTop.svelte';
	import ManifestoEdgeBottom from './ManifestoEdgeBottom.svelte';
	import ManifestoTransit from './ManifestoTransit.svelte';

	const statementLine1 = $derived(resolveLocale(manifestoContent.statement.line1, locale));
	const statementLineHuge = $derived(resolveLocale(manifestoContent.statement.lineHuge, locale));
	const statementLine3Part1 = $derived(resolveLocale(manifestoContent.statement.line3Part1, locale));
	const statementLine3Highlight = $derived(
		resolveLocale(manifestoContent.statement.line3Highlight, locale)
	);
	const statementLine3Part2 = $derived(resolveLocale(manifestoContent.statement.line3Part2, locale));

	const terminalUser = $derived(resolveLocale(manifestoContent.terminal.user, locale));
	const terminalCommand = $derived(resolveLocale(manifestoContent.terminal.command, locale));

	const pills = $derived(
		manifestoContent.pills.map((p) => ({
			label: resolveLocale(p.label, locale),
			href: localizeHref(`/services/${p.serviceId}`, locale),
		}))
	);

	const edgeLeft = $derived({
		sectionNumber: resolveLocale(manifestoContent.edgeLeft.sectionNumber, locale),
		sectionName: resolveLocale(manifestoContent.edgeLeft.sectionName, locale),
		location: resolveLocale(manifestoContent.edgeLeft.location, locale),
	});

	const edgeRight = $derived({
		lat: resolveLocale(manifestoContent.edgeRight.lat, locale),
		lng: resolveLocale(manifestoContent.edgeRight.lng, locale),
		src: resolveLocale(manifestoContent.edgeRight.src, locale),
		via: resolveLocale(manifestoContent.edgeRight.via, locale),
		dst: resolveLocale(manifestoContent.edgeRight.dst, locale),
		node: resolveLocale(manifestoContent.edgeRight.node, locale),
		status: resolveLocale(manifestoContent.edgeRight.status, locale),
	});

	const edgeBottom = $derived({
		connected: resolveLocale(manifestoContent.edgeBottom.connected, locale),
		line: resolveLocale(manifestoContent.edgeBottom.line, locale),
		url: resolveLocale(manifestoContent.edgeBottom.url, locale),
		version: resolveLocale(manifestoContent.edgeBottom.version, locale),
		scrollHint: resolveLocale(manifestoContent.edgeBottom.scrollHint, locale),
	});

	const transit = $derived({
		arrivalLabel: resolveLocale(manifestoContent.transit.arrivalLabel, locale),
		platformBadge: resolveLocale(manifestoContent.transit.platformBadge, locale),
		directionBadge: resolveLocale(manifestoContent.transit.directionBadge, locale),
	});

	const ticks = $derived(manifestoContent.ticks);

	const hiddenLines = $derived(
		manifestoContent.hiddenTransitLines.map((l) => ({
			name: resolveLocale(l.name, locale),
			color: l.color,
		}))
	);

	const hFlows = [
		{ y: 80, w: 200, dur: 10, delay: 0 },
		{ y: 240, w: 140, dur: 12, delay: 3 },
		{ y: 400, w: 180, dur: 9, delay: 6 },
		{ y: 560, w: 160, dur: 11, delay: 1.5 },
		{ y: 160, w: 120, dur: 13, delay: 4.5 },
		{ y: 640, w: 170, dur: 10, delay: 7.5 },
	];

	const vFlows = [
		{ x: 80, h: 120, dur: 12, delay: 2 },
		{ x: 320, h: 90, dur: 9, delay: 5 },
		{ x: 560, h: 110, dur: 11, delay: 0 },
	];

	let countdownSeconds = $state(167);
	let countdownDisplay = $derived(
		`${String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:${String(countdownSeconds % 60).padStart(2, '0')}`
	);

	let sectionEl = $state<HTMLElement>(undefined!);
	let statementEl = $state<HTMLElement>(undefined!);

	onMount(() => {
		let countdownInterval: ReturnType<typeof setInterval> | undefined;
		let visibilityObserver: IntersectionObserver | null = null;

		function startCountdown() {
			if (countdownInterval || isPrefersReducedMotion()) return;
			countdownInterval = setInterval(() => {
				countdownSeconds = countdownSeconds <= 0 ? 300 : countdownSeconds - 1;
			}, 1000);
		}

		function stopCountdown() {
			if (countdownInterval) {
				clearInterval(countdownInterval);
				countdownInterval = undefined;
			}
		}

		// Tick the countdown only near the viewport; the margin starts it just before entry.
		if (browser && sectionEl) {
			visibilityObserver = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting) startCountdown();
					else stopCountdown();
				},
				{ rootMargin: '100px' },
			);
			visibilityObserver.observe(sectionEl);
		}

		let destroyCrescendo: (() => void) | undefined;
		if (browser && sectionEl && statementEl) {
			destroyCrescendo = createCrescendoScrub(statementEl, {
				section: sectionEl,
				minScale: 0.85,
				maxScale: 1.0,
			});
		}

		return () => {
			stopCountdown();
			visibilityObserver?.disconnect();
			destroyCrescendo?.();
		};
	});
</script>

<section
	data-testid="manifesto-section"
	bind:this={sectionEl}
	class="manifesto"
>

	<div class="manifesto__circuit-grid"></div>

	<ManifestoCanvas containerEl={sectionEl} />

	<ManifestoEdgeBottom {...edgeBottom} hFlows={hFlows} vFlows={vFlows} />
	<ManifestoEdgeRight {...edgeRight} />
	<ManifestoEdgeLeft {...edgeLeft} hiddenLines={hiddenLines} />
	<ManifestoEdgeTop ticks={ticks} />
	<ManifestoTransit {...transit} countdownDisplay={countdownDisplay} />

	<div class="manifesto__content">

		<div data-testid="manifesto-prompt" class="manifesto__prompt">
			<span class="manifesto__prompt-cmd">{terminalUser}</span>
			<span class="manifesto__prompt-text">{terminalCommand}</span>
			<TerminalCursor />
		</div>

		<div data-testid="manifesto-text" bind:this={statementEl} class="manifesto__statement">
			<div class="manifesto__line-small">{statementLine1}</div>
			<div data-testid="manifesto-line-huge" class="manifesto__line-huge">{statementLineHuge}</div>
			<div class="manifesto__line-small">
				{statementLine3Part1} <span class="manifesto__highlight">{statementLine3Highlight}</span> {statementLine3Part2}<span class="manifesto__highlight">.</span>
			</div>
		</div>

		<nav class="manifesto__pills" aria-label={resolveLocale(siteLabels.a11y.navCapabilities, locale)}>
			{#each pills as pill}
				<a data-testid="manifesto-pill" href={pill.href} class="manifesto__pill tap-feedback" use:boop={{ scale: 1.03, timing: 200 }}>{pill.label}</a>
			{/each}
		</nav>
	</div>
</section>

<style>

	.manifesto {
		position: relative;
		min-height: 100dvh;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		/* Clip the fixed circuit grid so it holds still with the page grid while this section scrolls. */
		clip-path: inset(0);
		background: var(--manifesto);
		cursor: crosshair;
	}

	.manifesto__circuit-grid {
		opacity: var(--manifesto-background-strength);
		position: fixed;
		inset: 0 0 auto;
		height: 100lvh;
		background-image:
			linear-gradient(90deg, color-mix(in srgb, var(--primary) 6%, transparent) 1px, transparent 1px),
			linear-gradient(180deg, color-mix(in srgb, var(--primary) 6%, transparent) 1px, transparent 1px);
		background-size: 80px 80px;
		z-index: var(--z-base);
	}

	.manifesto__circuit-grid::after {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(circle 2.5px at 80px 80px, color-mix(in srgb, var(--primary) 18%, transparent) 0%, transparent 4px),
			radial-gradient(circle 2px at 160px 160px, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 3px),
			radial-gradient(circle 2.5px at 240px 80px, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 4px),
			radial-gradient(circle 2px at 80px 240px, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 3px);
		background-size: 320px 320px;
	}

	.manifesto__content {
		position: relative;
		z-index: calc(var(--z-content) + 9);
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 960px;
		padding-inline: 1.5rem;
	}

	.manifesto__prompt {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 36px;
		padding: 8px 16px;
		border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--primary) 4%, transparent);
	}

	.manifesto__prompt-cmd {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: color-mix(in srgb, var(--primary) 85%, transparent);
	}

	.manifesto__prompt-text {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: color-mix(in srgb, var(--primary) 85%, transparent);
	}

	.manifesto__statement {
		text-align: center;
		text-transform: uppercase;
	}

	.manifesto__line-small {
		font-family: var(--font-heading);
		font-weight: 700;
		font-size: clamp(1.5rem, 5vw, 3.5rem);
		color: var(--secondary-foreground);
		letter-spacing: -0.02em;
		line-height: 1.3;
	}

	.manifesto__line-huge {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: clamp(2.2rem, 11.5vw, 11rem);
		color: var(--primary);
		letter-spacing: -0.05em;
		line-height: 0.85;
		text-shadow: 0 0 80px color-mix(in srgb, var(--glow) 12%, transparent);
		white-space: nowrap;
		max-width: 100vw;
		overflow: hidden;
	}

	.manifesto__highlight { color: var(--primary); }

	.manifesto__pills {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 8px;
		margin-top: 40px;
	}

	.manifesto__pill {
		font-family: var(--font-mono);
		font-size: clamp(0.75rem, 1.2vw, 1rem);
		letter-spacing: 0.04em;
		color: var(--accent-text);
		border: 1px solid color-mix(in srgb, var(--accent) 36%, transparent);
		border-radius: var(--radius-pill);
		padding: 8px 20px;
		background: color-mix(in srgb, var(--accent) 15%, transparent);
		text-decoration: none;
		transition: border-color var(--duration-normal) var(--ease-default), color var(--duration-normal) var(--ease-default), background var(--duration-normal) var(--ease-default);
	}

	.manifesto__pill:hover {
		border-color: color-mix(in srgb, var(--accent) 58%, transparent);
		background: color-mix(in srgb, var(--accent) 22%, transparent);
	}

	@media (max-width: 640px) {
		.manifesto__pill { font-size: 10px; padding: 12px 16px; min-height: 44px; }
		.manifesto__pills { gap: 6px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__prompt,
		.manifesto__pill {
			opacity: 1;
			transform: none;
			translate: none;
		}
	}
</style>
