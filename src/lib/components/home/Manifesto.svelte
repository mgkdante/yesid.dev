<!--
  Manifesto section — full-viewport transit-themed manifesto.
  Orchestrator: imports 5 sub-components for edges/transit, owns GSAP timeline.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import { manifestoContent } from '$lib/data/content.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import {
		registerGsapPlugins,
		gsap,
		ScrollTrigger,
		SplitText,
	} from '$lib/motion/utils/gsap.js';
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
	let line1El = $state<HTMLElement>(undefined!);
	let hugeEl = $state<HTMLElement>(undefined!);
	let line3El = $state<HTMLElement>(undefined!);

	// ── Lifecycle: GSAP ScrollTrigger entrance ───────────────────────
	onMount(() => {
		let countdownInterval: ReturnType<typeof setInterval> | undefined;
		if (!isPrefersReducedMotion()) {
			countdownInterval = setInterval(() => {
				countdownSeconds = countdownSeconds <= 0 ? 300 : countdownSeconds - 1;
			}, 1000);
		}

		if (!browser || isPrefersReducedMotion()) {
			return () => { if (countdownInterval) clearInterval(countdownInterval); };
		}

		registerGsapPlugins();

		const splitLine1 = new SplitText(line1El, { type: 'chars,words' });
		const splitHuge = new SplitText(hugeEl, { type: 'chars,words' });
		const splitLine3 = new SplitText(line3El, { type: 'chars,words' });

		const tl = gsap.timeline({ paused: true });

		// Background layers entrance
		tl.to('.manifesto__circuit-grid', { opacity: 1, duration: 0.6 }, 0);
		tl.to('[class*="manifesto__stripe"]', { opacity: 1, duration: 0.4, stagger: 0.05 }, 0.1);
		tl.to('.manifesto__beck-line, .manifesto__roundel', { opacity: 1, duration: 0.5, stagger: 0.03 }, 0.2);

		// Edge decorations
		tl.to('.manifesto__edge-left', { opacity: 1, x: 0, duration: 0.4 }, 0.3);
		tl.to('.manifesto__edge-right', { opacity: 1, x: 0, duration: 0.4 }, 0.3);
		tl.to('.manifesto__edge-top', { opacity: 1, y: 0, duration: 0.4 }, 0.3);
		tl.to('.manifesto__edge-bottom', { opacity: 1, y: 0, duration: 0.4 }, 0.3);

		// Transit elements
		tl.to('.manifesto__arrival, .manifesto__chevrons, .manifesto__badge', { opacity: 1, duration: 0.3 }, 0.4);

		// Terminal prompt
		tl.to('.manifesto__prompt', { opacity: 1, duration: 0.4 }, 0.5);

		// Statement lines — SplitText char reveal
		tl.from(splitLine1.chars, { opacity: 0, y: 20, stagger: 0.015, duration: 0.5, ease: 'power2.out' }, 0.8);
		tl.from(splitHuge.chars, { opacity: 0, y: 30, stagger: 0.02, duration: 0.5, ease: 'power2.out' }, 1.2);
		tl.from(splitLine3.chars, { opacity: 0, y: 20, stagger: 0.015, duration: 0.5, ease: 'power2.out' }, 1.8);

		// Capability pills
		tl.to('.manifesto__pill', { opacity: 1, y: 0, stagger: 0.1, duration: 0.4, ease: 'power2.out' }, 2.2);

		// Data flow lines
		tl.to('.manifesto__flow-line, .manifesto__flow-line-v', { opacity: 1, duration: 0.3 }, 2.5);

		ScrollTrigger.create({
			trigger: sectionEl,
			start: 'top 80%',
			onEnter: () => tl.play(),
			onLeaveBack: () => tl.reverse(),
		});

		return () => {
			if (countdownInterval) clearInterval(countdownInterval);
			splitLine1.revert();
			splitHuge.revert();
			splitLine3.revert();
			tl.kill();
			ScrollTrigger.getAll().forEach((st) => {
				if (st.trigger === sectionEl) st.kill();
			});
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

		<!-- Statement — variable size -->
		<div data-testid="manifesto-text" class="manifesto__statement">
			<div bind:this={line1El} class="manifesto__line-small">{statementLine1}</div>
			<div data-testid="manifesto-line-huge" bind:this={hugeEl} class="manifesto__line-huge">{statementLineHuge}</div>
			<div bind:this={line3El} class="manifesto__line-small">
				{statementLine3Part1} <span class="manifesto__highlight">{statementLine3Highlight}</span> {statementLine3Part2}<span class="manifesto__highlight">.</span>
			</div>
		</div>

		<!-- Capability pills -->
		<nav class="manifesto__pills" aria-label="Capabilities">
			{#each pills as pill}
				<a data-testid="manifesto-pill" href={pill.href} class="manifesto__pill">{pill.label}</a>
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
		opacity: 0;
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
		opacity: 0;
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
		opacity: 0;
		transform: translateY(15px);
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
		.manifesto__pill { font-size: 10px; padding: 5px 12px; }
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
