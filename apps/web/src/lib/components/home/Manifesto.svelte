<!--
  Manifesto section — full-viewport transit-themed manifesto.
  Orchestrator: imports 5 sub-components for edges/transit, owns GSAP timeline.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { resolveLocale } from '$lib/utils/locale';
	import type { ManifestoContent } from '$lib/types';

	// slice-18i Phase 7C: manifestoContent now flows as a prop from the server load.
	let { manifesto: manifestoContent }: { manifesto: ManifestoContent } = $props();
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { createCrescendoScrub } from '$lib/motion/scrubs/index.js';
	import ManifestoCanvas from '$lib/components/home/ManifestoCanvas.svelte';
	import TerminalCursor from '$lib/components/shared/TerminalCursor.svelte';
	import ManifestoEdgeLeft from './ManifestoEdgeLeft.svelte';
	import ManifestoEdgeRight from './ManifestoEdgeRight.svelte';
	import ManifestoEdgeTop from './ManifestoEdgeTop.svelte';
	import ManifestoEdgeBottom from './ManifestoEdgeBottom.svelte';
	import ManifestoTransit from './ManifestoTransit.svelte';

	// ── Resolve all text from data layer ──────────────────────────────
	const statementLine1 = resolveLocale(manifestoContent.statement.line1, 'en');
	const statementLineHuge = resolveLocale(manifestoContent.statement.lineHuge, 'en');
	const statementLine3Part1 = resolveLocale(manifestoContent.statement.line3Part1, 'en');
	const statementLine3Highlight = resolveLocale(manifestoContent.statement.line3Highlight, 'en');
	const statementLine3Part2 = resolveLocale(manifestoContent.statement.line3Part2, 'en');

	const terminalUser = resolveLocale(manifestoContent.terminal.user, 'en');
	const terminalCommand = resolveLocale(manifestoContent.terminal.command, 'en');

	const pills = manifestoContent.pills.map((p) => ({
		label: resolveLocale(p.label, 'en'),
		href: `/services/${p.serviceId}`,
	}));

	// Edge + transit data (passed to sub-components)
	const edgeLeft = {
		sectionNumber: resolveLocale(manifestoContent.edgeLeft.sectionNumber, 'en'),
		sectionName: resolveLocale(manifestoContent.edgeLeft.sectionName, 'en'),
		location: resolveLocale(manifestoContent.edgeLeft.location, 'en'),
	};

	const edgeRight = {
		lat: resolveLocale(manifestoContent.edgeRight.lat, 'en'),
		lng: resolveLocale(manifestoContent.edgeRight.lng, 'en'),
		src: resolveLocale(manifestoContent.edgeRight.src, 'en'),
		via: resolveLocale(manifestoContent.edgeRight.via, 'en'),
		dst: resolveLocale(manifestoContent.edgeRight.dst, 'en'),
		node: resolveLocale(manifestoContent.edgeRight.node, 'en'),
		status: resolveLocale(manifestoContent.edgeRight.status, 'en'),
	};

	const edgeBottom = {
		connected: resolveLocale(manifestoContent.edgeBottom.connected, 'en'),
		line: resolveLocale(manifestoContent.edgeBottom.line, 'en'),
		url: resolveLocale(manifestoContent.edgeBottom.url, 'en'),
		version: resolveLocale(manifestoContent.edgeBottom.version, 'en'),
		scrollHint: resolveLocale(manifestoContent.edgeBottom.scrollHint, 'en'),
	};

	const transit = {
		arrivalLabel: resolveLocale(manifestoContent.transit.arrivalLabel, 'en'),
		platformBadge: resolveLocale(manifestoContent.transit.platformBadge, 'en'),
		directionBadge: resolveLocale(manifestoContent.transit.directionBadge, 'en'),
	};

	const ticks = manifestoContent.ticks;

	const hiddenLines = manifestoContent.hiddenTransitLines.map((l) => ({
		name: resolveLocale(l.name, 'en'),
		color: l.color,
	}));

	// Data flow line specs
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

	// ── Countdown timer state ────────────────────────────────────────
	let countdownSeconds = $state(167);
	let countdownDisplay = $derived(
		`${String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:${String(countdownSeconds % 60).padStart(2, '0')}`
	);

	// ── Element bindings ─────────────────────────────────────────────
	let sectionEl = $state<HTMLElement>(undefined!);
	let statementEl = $state<HTMLElement>(undefined!);

	// ── Lifecycle: GSAP ScrollTrigger entrance + IO-gated countdown ──
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

		// IO-gate the countdown — tick only while the Manifesto is in view.
		// rootMargin: 100px so the timer starts slightly before the section
		// enters the viewport, matching the visual rhythm of scrolling in.
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

		// Apply crescendo scrub to the 3-line statement container. Scales gently
		// as the user scrolls through the section — minScale at edges, maxScale
		// mid-scroll. Pure transform, no heading-hierarchy or DOM changes.
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

<section data-testid="manifesto-section" bind:this={sectionEl} class="manifesto">
	<!-- BG Layer 1: Circuit grid -->
	<div class="manifesto__circuit-grid"></div>

	<!-- BG Layer 2+3: Interactive canvas + warm glow -->
	<ManifestoCanvas containerEl={sectionEl} />

	<!-- Sub-components: edges, backgrounds, transit -->
	<ManifestoEdgeBottom {...edgeBottom} {hFlows} {vFlows} />
	<ManifestoEdgeRight {...edgeRight} />
	<ManifestoEdgeLeft {...edgeLeft} {hiddenLines} />
	<ManifestoEdgeTop {ticks} />
	<ManifestoTransit {...transit} {countdownDisplay} />

	<!-- CENTER CONTENT -->
	<div class="manifesto__content">
		<!-- Terminal prompt -->
		<div data-testid="manifesto-prompt" class="manifesto__prompt">
			<span class="manifesto__prompt-cmd">{terminalUser}</span>
			<span class="manifesto__prompt-text">{terminalCommand}</span>
			<TerminalCursor />
		</div>

		<!-- Statement — variable size. Crescendo-scrubbed as a group. -->
		<div data-testid="manifesto-text" bind:this={statementEl} class="manifesto__statement">
			<div class="manifesto__line-small">{statementLine1}</div>
			<div data-testid="manifesto-line-huge" class="manifesto__line-huge">{statementLineHuge}</div>
			<div class="manifesto__line-small">
				{statementLine3Part1} <span class="manifesto__highlight">{statementLine3Highlight}</span> {statementLine3Part2}<span class="manifesto__highlight">.</span>
			</div>
		</div>

		<!-- Capability pills -->
		<nav class="manifesto__pills" aria-label="Capabilities">
			{#each pills as pill}
				<a data-testid="manifesto-pill" href={pill.href} class="manifesto__pill tap-feedback">{pill.label}</a>
			{/each}
		</nav>
	</div>
</section>

<style>
	/* ── Container ───────────────────────────────────────────────── */
	.manifesto {
		position: relative;
		min-height: 100dvh;
		padding-bottom: env(safe-area-inset-bottom, 0px);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		background: var(--manifesto, #0f0d0a);
		cursor: crosshair;
	}

	/* ── BG Layer 1: Circuit Grid ────────────────────────────────── */
	.manifesto__circuit-grid {
		position: absolute;
		inset: 0;
		background-image:
			repeating-linear-gradient(90deg, color-mix(in srgb, var(--primary) 3.5%, transparent) 0px, color-mix(in srgb, var(--primary) 3.5%, transparent) 1px, transparent 1px, transparent 80px),
			repeating-linear-gradient(0deg, color-mix(in srgb, var(--primary) 3.5%, transparent) 0px, color-mix(in srgb, var(--primary) 3.5%, transparent) 1px, transparent 1px, transparent 80px);
		z-index: var(--z-base);
	}

	.manifesto__circuit-grid::after {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(circle 2.5px at 80px 80px, color-mix(in srgb, var(--primary) 12%, transparent) 0%, transparent 4px),
			radial-gradient(circle 2px at 160px 160px, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 3px),
			radial-gradient(circle 2.5px at 240px 80px, color-mix(in srgb, var(--primary) 10%, transparent) 0%, transparent 4px),
			radial-gradient(circle 2px at 80px 240px, color-mix(in srgb, var(--primary) 6%, transparent) 0%, transparent 3px);
		background-size: 320px 320px;
	}

	/* ── Center Content ──────────────────────────────────────────── */
	.manifesto__content {
		position: relative;
		z-index: calc(var(--z-content) + 9);
		display: flex;
		flex-direction: column;
		align-items: center;
		max-width: 960px;
		padding-inline: 1.5rem;
	}

	/* ── Terminal Prompt ──────────────────────────────────────────── */
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
		font-size: 13px;
		color: color-mix(in srgb, var(--primary) 85%, transparent);
	}

	.manifesto__prompt-text {
		font-family: var(--font-mono);
		font-size: 13px;
		color: color-mix(in srgb, var(--primary) 60%, transparent);
	}

	/* ── Statement ───────────────────────────────────────────────── */
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
		text-shadow: 0 0 80px color-mix(in srgb, var(--primary) 12%, transparent);
		white-space: nowrap;
		max-width: 100vw;
		overflow: hidden;
	}

	.manifesto__highlight { color: var(--primary); }

	/* ── Capability Pills ────────────────────────────────────────── */
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
		color: color-mix(in srgb, var(--primary) 60%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary) 15%, transparent);
		border-radius: var(--radius-pill);
		padding: 8px 20px;
		background: color-mix(in srgb, var(--primary) 4%, transparent);
		text-decoration: none;
		transition: border-color var(--duration-normal) var(--ease-default), color var(--duration-normal) var(--ease-default), background var(--duration-normal) var(--ease-default);
	}

	.manifesto__pill:hover {
		border-color: color-mix(in srgb, var(--primary) 40%, transparent);
		color: color-mix(in srgb, var(--primary) 85%, transparent);
		background: color-mix(in srgb, var(--primary) 8%, transparent);
	}

	/* ── Ripple keyframes (for ManifestoCanvas) ───────────────────── */
	:global(.manifesto__ripple) {
		position: absolute;
		border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: calc(var(--z-content) + 3);
		animation: ripple-expand 1.2s ease-out forwards;
	}

	:global(.manifesto__ripple-inner) {
		position: absolute;
		border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: calc(var(--z-content) + 3);
		animation: ripple-inner 0.8s ease-out forwards;
	}

	@keyframes ripple-expand {
		0% { width: 0; height: 0; opacity: 0.6; }
		100% { width: 200px; height: 200px; opacity: 0; }
	}

	@keyframes ripple-inner {
		0% { width: 0; height: 0; opacity: 0.8; }
		100% { width: 100px; height: 100px; opacity: 0; }
	}

	/* ── Responsive ──────────────────────────────────────────────── */
	@media (max-width: 640px) {
		.manifesto__pill { font-size: 10px; padding: 12px 16px; min-height: 44px; }
		.manifesto__pills { gap: 6px; }
	}

	@media (prefers-reduced-motion: reduce) {
		.manifesto__circuit-grid,
		.manifesto__prompt,
		.manifesto__pill {
			opacity: 1;
			transform: none;
			translate: none;
		}
	}
</style>
