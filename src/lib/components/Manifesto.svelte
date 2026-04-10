<!--
  Manifesto section — Section 2 of the home page (Slice 13b).
  Full-viewport transit-themed manifesto with 6 background layers,
  4 edge HUD decorations, transit elements, interactive canvas,
  and centered content (terminal prompt + variable-size statement + capability pills).
  All text from manifestoContent in data layer.
  GSAP ScrollTrigger entrance animation (NOT pinned, normal scroll).
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
	import ManifestoCanvas from '$lib/components/ManifestoCanvas.svelte';

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

	const edgeLeftSectionNumber = resolveLocale(manifestoContent.edgeLeft.sectionNumber, 'en');
	const edgeLeftSectionName = resolveLocale(manifestoContent.edgeLeft.sectionName, 'en');
	const edgeLeftLocation = resolveLocale(manifestoContent.edgeLeft.location, 'en');

	const edgeRightLat = resolveLocale(manifestoContent.edgeRight.lat, 'en');
	const edgeRightLng = resolveLocale(manifestoContent.edgeRight.lng, 'en');
	const edgeRightSrc = resolveLocale(manifestoContent.edgeRight.src, 'en');
	const edgeRightVia = resolveLocale(manifestoContent.edgeRight.via, 'en');
	const edgeRightDst = resolveLocale(manifestoContent.edgeRight.dst, 'en');
	const edgeRightNode = resolveLocale(manifestoContent.edgeRight.node, 'en');
	const edgeRightStatus = resolveLocale(manifestoContent.edgeRight.status, 'en');

	const edgeBottomConnected = resolveLocale(manifestoContent.edgeBottom.connected, 'en');
	const edgeBottomLine = resolveLocale(manifestoContent.edgeBottom.line, 'en');
	const edgeBottomUrl = resolveLocale(manifestoContent.edgeBottom.url, 'en');
	const edgeBottomVersion = resolveLocale(manifestoContent.edgeBottom.version, 'en');
	const edgeBottomScrollHint = resolveLocale(manifestoContent.edgeBottom.scrollHint, 'en');

	const transitArrivalLabel = resolveLocale(manifestoContent.transit.arrivalLabel, 'en');
	const transitPlatformBadge = resolveLocale(manifestoContent.transit.platformBadge, 'en');
	const transitDirectionBadge = resolveLocale(manifestoContent.transit.directionBadge, 'en');

	const ticks = manifestoContent.ticks;

	// ── Countdown timer state ────────────────────────────────────────
	let countdownSeconds = $state(167); // 02:47
	let countdownDisplay = $derived(
		`${String(Math.floor(countdownSeconds / 60)).padStart(2, '0')}:${String(countdownSeconds % 60).padStart(2, '0')}`
	);

	// ── Element bindings ─────────────────────────────────────────────
	let sectionEl = $state<HTMLElement>(undefined!);
	let line1El = $state<HTMLElement>(undefined!);
	let hugeEl = $state<HTMLElement>(undefined!);
	let line3El = $state<HTMLElement>(undefined!);

	// ── Data flow line specs (horizontal) ────────────────────────────
	const hFlows = [
		{ y: 80, w: 200, dur: 10, delay: 0 },
		{ y: 240, w: 140, dur: 12, delay: 3 },
		{ y: 400, w: 180, dur: 9, delay: 6 },
		{ y: 560, w: 160, dur: 11, delay: 1.5 },
		{ y: 160, w: 120, dur: 13, delay: 4.5 },
		{ y: 640, w: 170, dur: 10, delay: 7.5 },
	];

	// ── Data flow line specs (vertical) ──────────────────────────────
	const vFlows = [
		{ x: 80, h: 120, dur: 12, delay: 2 },
		{ x: 320, h: 90, dur: 9, delay: 5 },
		{ x: 560, h: 110, dur: 11, delay: 0 },
	];

	// ── Lifecycle ────────────────────────────────────────────────────
	onMount(() => {
		// Countdown timer
		let countdownInterval: ReturnType<typeof setInterval> | undefined;
		if (!isPrefersReducedMotion()) {
			countdownInterval = setInterval(() => {
				countdownSeconds = countdownSeconds <= 0 ? 300 : countdownSeconds - 1;
			}, 1000);
		}

		// GSAP entrance animations
		if (!browser || isPrefersReducedMotion()) {
			return () => {
				if (countdownInterval) clearInterval(countdownInterval);
			};
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

	<!-- BG Layer 4: Data flow lines — horizontal -->
	{#each hFlows as flow}
		<div
			class="manifesto__flow-line"
			style="top:{flow.y}px;width:{flow.w}px;left:-{flow.w}px;animation-duration:{flow.dur}s;animation-delay:{flow.delay}s;"
		></div>
	{/each}
	<!-- Data flow lines — vertical -->
	{#each vFlows as flow}
		<div
			class="manifesto__flow-line-v"
			style="left:{flow.x}px;height:{flow.h}px;top:-{flow.h}px;animation-duration:{flow.dur}s;animation-delay:{flow.delay}s;"
		></div>
	{/each}

	<!-- BG Layer 5: Construction stripes -->
	<div class="manifesto__stripe manifesto__stripe--tl"></div>
	<div class="manifesto__stripe manifesto__stripe--br"></div>
	<div class="manifesto__stripe manifesto__stripe--tr"></div>
	<div class="manifesto__stripe manifesto__stripe--bl"></div>

	<!-- BG Layer 6: Beck-style route lines -->
	<div class="manifesto__beck-line manifesto__beck-h" style="top:120px;left:0;width:160px;"></div>
	<div class="manifesto__beck-line manifesto__beck-d45" style="top:120px;left:160px;width:80px;"></div>
	<div class="manifesto__beck-line manifesto__beck-h" style="top:64px;left:217px;width:100px;opacity:0.04;"></div>
	<div class="manifesto__beck-line manifesto__beck-v" style="right:120px;top:0;height:200px;"></div>
	<div class="manifesto__beck-line manifesto__beck-d135" style="top:200px;right:120px;width:70px;"></div>
	<div class="manifesto__beck-line manifesto__beck-h" style="bottom:160px;right:0;width:180px;"></div>
	<div class="manifesto__beck-line manifesto__beck-d45" style="bottom:160px;right:180px;width:60px;"></div>
	<div class="manifesto__beck-line manifesto__beck-v" style="left:160px;bottom:0;height:180px;"></div>
	<div class="manifesto__beck-line manifesto__beck-d45" style="bottom:180px;left:160px;width:70px;"></div>

	<!-- Roundels -->
	<div class="manifesto__roundel manifesto__roundel--orange" style="left:155px;top:116px;">1</div>
	<div class="manifesto__roundel manifesto__roundel--green" style="right:115px;top:195px;">2</div>
	<div class="manifesto__roundel manifesto__roundel--blue" style="right:178px;bottom:128px;">4</div>
	<div class="manifesto__roundel manifesto__roundel--orange" style="left:155px;bottom:176px;">1</div>

	<!-- Edge: Left — vertical readouts -->
	<div data-testid="manifesto-edge-left" class="manifesto__edge-left">
		<span class="manifesto__readout">{edgeLeftSectionNumber}</span>
		<span class="manifesto__dot-active"></span>
		<span class="manifesto__readout">{edgeLeftSectionName}</span>
		<span class="manifesto__dot-inactive"></span>
		<span class="manifesto__dot-inactive"></span>
		<span class="manifesto__readout">{edgeLeftLocation}</span>
	</div>

	<!-- Edge: Right — coordinates + easter eggs -->
	<div data-testid="manifesto-edge-right" class="manifesto__edge-right">
		<span class="manifesto__coord">{edgeRightLat}</span>
		<span class="manifesto__coord">{edgeRightLng}</span>
		<span class="manifesto__separator-line"></span>
		<span class="manifesto__coord manifesto__coord--value">{edgeRightSrc}</span>
		<span class="manifesto__coord manifesto__coord--value">{edgeRightVia}</span>
		<span class="manifesto__coord manifesto__coord--value">{edgeRightDst}</span>
		<span class="manifesto__separator-line"></span>
		<span class="manifesto__coord">{edgeRightNode}</span>
		<span class="manifesto__coord">{edgeRightStatus}</span>
	</div>

	<!-- Edge: Top — measurement ticks -->
	<div data-testid="manifesto-edge-top" class="manifesto__edge-top">
		{#each ticks as tick}
			<div class="manifesto__tick">
				<div class="manifesto__tick-line"></div>
				<span class="manifesto__tick-label">{tick}</span>
			</div>
		{/each}
	</div>

	<!-- Edge: Bottom — status bar -->
	<div data-testid="manifesto-edge-bottom" class="manifesto__edge-bottom">
		<span class="manifesto__status-dot"></span>
		<span>{edgeBottomConnected}</span>
		<span class="manifesto__separator"></span>
		<span>{edgeBottomLine}</span>
		<span class="manifesto__separator"></span>
		<span>{edgeBottomUrl}</span>
		<span class="manifesto__separator"></span>
		<span>{edgeBottomVersion}</span>
		<span class="manifesto__separator"></span>
		<span>{edgeBottomScrollHint}</span>
	</div>

	<!-- Transit: Arrival countdown -->
	<div data-testid="manifesto-arrival" class="manifesto__arrival">
		<span class="manifesto__arr-label">{transitArrivalLabel}</span>
		<span class="manifesto__arr-time">{countdownDisplay}</span>
	</div>

	<!-- Transit: Chevrons -->
	<div class="manifesto__chevrons manifesto__chevrons--right">
		<div class="manifesto__chevron"></div>
		<div class="manifesto__chevron"></div>
		<div class="manifesto__chevron"></div>
	</div>
	<div class="manifesto__chevrons manifesto__chevrons--down">
		<div class="manifesto__chevron"></div>
		<div class="manifesto__chevron"></div>
		<div class="manifesto__chevron"></div>
	</div>

	<!-- Transit: Platform badges -->
	<div data-testid="manifesto-platform-badge" class="manifesto__badge manifesto__badge--platform">{transitPlatformBadge}</div>
	<div data-testid="manifesto-direction-badge" class="manifesto__badge manifesto__badge--direction">{transitDirectionBadge}</div>

	<!-- CENTER CONTENT -->
	<div class="manifesto__content">
		<!-- Terminal prompt -->
		<div data-testid="manifesto-prompt" class="manifesto__prompt">
			<span class="manifesto__prompt-cmd">{terminalUser}</span>
			<span class="manifesto__prompt-text">{terminalCommand}</span>
			<div class="manifesto__cursor"></div>
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
		background: var(--bg-manifesto, #0f0d0a);
		cursor: crosshair;
	}

	/* ── BG Layer 1: Circuit Grid ────────────────────────────────── */
	.manifesto__circuit-grid {
		position: absolute;
		inset: 0;
		background-image:
			repeating-linear-gradient(90deg, rgba(224,120,0,0.035) 0px, rgba(224,120,0,0.035) 1px, transparent 1px, transparent 80px),
			repeating-linear-gradient(0deg, rgba(224,120,0,0.035) 0px, rgba(224,120,0,0.035) 1px, transparent 1px, transparent 80px);
		z-index: 0;
		opacity: 0;
	}

	.manifesto__circuit-grid::after {
		content: '';
		position: absolute;
		inset: 0;
		background-image:
			radial-gradient(circle 2.5px at 80px 80px, rgba(224,120,0,0.12) 0%, transparent 4px),
			radial-gradient(circle 2px at 160px 160px, rgba(224,120,0,0.08) 0%, transparent 3px),
			radial-gradient(circle 2.5px at 240px 80px, rgba(224,120,0,0.10) 0%, transparent 4px),
			radial-gradient(circle 2px at 80px 240px, rgba(224,120,0,0.06) 0%, transparent 3px);
		background-size: 320px 320px;
	}

	/* ── BG Layer 4: Data Flow Lines ─────────────────────────────── */
	.manifesto__flow-line {
		position: absolute;
		height: 1px;
		background: linear-gradient(90deg,
			transparent 0%,
			rgba(224,120,0,0.1) 30%,
			rgba(224,120,0,0.15) 50%,
			rgba(224,120,0,0.1) 70%,
			transparent 100%
		);
		animation-name: flowRight;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		z-index: 1;
		opacity: 0;
	}

	.manifesto__flow-line-v {
		position: absolute;
		width: 1px;
		background: linear-gradient(180deg,
			transparent 0%,
			rgba(255,182,39,0.08) 30%,
			rgba(255,182,39,0.12) 50%,
			rgba(255,182,39,0.08) 70%,
			transparent 100%
		);
		animation-name: flowDown;
		animation-timing-function: linear;
		animation-iteration-count: infinite;
		z-index: 1;
		opacity: 0;
	}

	@keyframes flowRight {
		from { transform: translateX(0); }
		to { transform: translateX(calc(100vw + 400px)); }
	}

	@keyframes flowDown {
		from { transform: translateY(0); }
		to { transform: translateY(calc(100dvh + 200px)); }
	}

	/* ── BG Layer 5: Construction Stripes ────────────────────────── */
	.manifesto__stripe {
		position: absolute;
		overflow: hidden;
		z-index: 2;
		opacity: 0;
	}

	.manifesto__stripe::before {
		content: '';
		position: absolute;
	}

	.manifesto__stripe--tl {
		top: 0;
		left: 0;
		width: 240px;
		height: 240px;
	}
	.manifesto__stripe--tl::before {
		width: 480px;
		height: 480px;
		top: -240px;
		left: -240px;
		background: repeating-linear-gradient(-45deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);
		opacity: 0.18;
	}

	.manifesto__stripe--br {
		bottom: 0;
		right: 0;
		width: 240px;
		height: 240px;
	}
	.manifesto__stripe--br::before {
		width: 480px;
		height: 480px;
		bottom: -240px;
		right: -240px;
		background: repeating-linear-gradient(-45deg, #FFB627 0px, #FFB627 12px, #0f0d0a 12px, #0f0d0a 24px);
		opacity: 0.18;
	}

	.manifesto__stripe--tr {
		top: 0;
		right: 0;
		width: 110px;
		height: 110px;
	}
	.manifesto__stripe--tr::before {
		width: 220px;
		height: 220px;
		top: -130px;
		right: -130px;
		background: repeating-linear-gradient(45deg, #FFB627 0px, #FFB627 7px, #0f0d0a 7px, #0f0d0a 14px);
		opacity: 0.09;
	}

	.manifesto__stripe--bl {
		bottom: 0;
		left: 0;
		width: 110px;
		height: 110px;
	}
	.manifesto__stripe--bl::before {
		width: 220px;
		height: 220px;
		bottom: -130px;
		left: -130px;
		background: repeating-linear-gradient(45deg, #FFB627 0px, #FFB627 7px, #0f0d0a 7px, #0f0d0a 14px);
		opacity: 0.09;
	}

	/* ── BG Layer 6: Beck-style Route Lines ──────────────────────── */
	.manifesto__beck-line {
		position: absolute;
		background: rgba(224,120,0,0.06);
		z-index: 1;
		opacity: 0;
	}

	.manifesto__beck-h {
		height: 2px;
	}

	.manifesto__beck-v {
		width: 2px;
	}

	.manifesto__beck-d45 {
		height: 2px;
		transform-origin: left center;
		transform: rotate(-45deg);
	}

	.manifesto__beck-d135 {
		height: 2px;
		transform-origin: left center;
		transform: rotate(45deg);
	}

	/* ── Roundels ────────────────────────────────────────────────── */
	.manifesto__roundel {
		position: absolute;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		border: 1.5px solid;
		display: flex;
		align-items: center;
		justify-content: center;
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
		z-index: 2;
		opacity: 0;
	}

	.manifesto__roundel--orange {
		border-color: rgba(224,120,0,0.25);
		color: rgba(224,120,0,0.35);
	}

	.manifesto__roundel--green {
		border-color: rgba(76,175,80,0.2);
		color: rgba(76,175,80,0.25);
	}

	.manifesto__roundel--blue {
		border-color: rgba(66,133,244,0.2);
		color: rgba(66,133,244,0.25);
	}

	/* ── Edge: Left ──────────────────────────────────────────────── */
	.manifesto__edge-left {
		position: absolute;
		left: 20px;
		top: 50%;
		transform: translateY(-50%);
		writing-mode: vertical-rl;
		display: flex;
		align-items: center;
		gap: 16px;
		z-index: 3;
		opacity: 0;
		translate: -8px 0;
	}

	.manifesto__readout {
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 3px;
		color: rgba(224,120,0,0.2);
		text-transform: uppercase;
	}

	.manifesto__dot-active {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #E07800;
		box-shadow: 0 0 8px rgba(224,120,0,0.4);
		flex-shrink: 0;
	}

	.manifesto__dot-inactive {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		border: 1px solid rgba(224,120,0,0.15);
		flex-shrink: 0;
	}

	/* ── Edge: Right ─────────────────────────────────────────────── */
	.manifesto__edge-right {
		position: absolute;
		right: 20px;
		top: 50%;
		transform: translateY(-50%);
		display: flex;
		flex-direction: column;
		gap: 6px;
		z-index: 3;
		opacity: 0;
		translate: 8px 0;
	}

	.manifesto__coord {
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 1px;
		color: rgba(224,120,0,0.15);
		text-transform: uppercase;
		white-space: nowrap;
	}

	.manifesto__coord--value {
		color: rgba(224,120,0,0.25);
	}

	.manifesto__separator-line {
		width: 24px;
		height: 1px;
		background: rgba(224,120,0,0.1);
		margin-block: 4px;
	}

	/* ── Edge: Top ───────────────────────────────────────────────── */
	.manifesto__edge-top {
		position: absolute;
		top: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		gap: 80px;
		z-index: 3;
		opacity: 0;
		translate: 0 -8px;
	}

	.manifesto__tick {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	.manifesto__tick-line {
		width: 1px;
		height: 12px;
		background: rgba(224,120,0,0.12);
	}

	.manifesto__tick-label {
		font-family: var(--font-mono);
		font-size: 8px;
		letter-spacing: 1px;
		color: rgba(224,120,0,0.15);
	}

	/* ── Edge: Bottom ────────────────────────────────────────────── */
	.manifesto__edge-bottom {
		position: absolute;
		bottom: 16px;
		left: 50%;
		transform: translateX(-50%);
		display: flex;
		align-items: center;
		gap: 20px;
		z-index: 3;
		font-family: var(--font-mono);
		font-size: 9px;
		letter-spacing: 1px;
		color: rgba(224,120,0,0.18);
		white-space: nowrap;
		opacity: 0;
		translate: 0 8px;
	}

	.manifesto__status-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: rgba(224,120,0,0.3);
		flex-shrink: 0;
		animation: pulse 2s ease-in-out infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 0.3; box-shadow: none; }
		50% { opacity: 1; box-shadow: 0 0 6px rgba(224,120,0,0.4); }
	}

	.manifesto__separator {
		width: 1px;
		height: 10px;
		background: rgba(224,120,0,0.1);
		flex-shrink: 0;
	}

	/* ── Transit: Arrival ────────────────────────────────────────── */
	.manifesto__arrival {
		position: absolute;
		left: 60px;
		bottom: 80px;
		z-index: 3;
		font-family: var(--font-mono);
		display: flex;
		flex-direction: column;
		gap: 4px;
		opacity: 0;
	}

	.manifesto__arr-label {
		font-size: 7px;
		letter-spacing: 2px;
		color: rgba(224,120,0,0.15);
		text-transform: uppercase;
	}

	.manifesto__arr-time {
		font-size: 18px;
		font-weight: 600;
		color: rgba(224,120,0,0.2);
		letter-spacing: 2px;
		font-variant-numeric: tabular-nums;
	}

	/* ── Transit: Chevrons ───────────────────────────────────────── */
	.manifesto__chevrons {
		position: absolute;
		display: flex;
		gap: 6px;
		z-index: 3;
		opacity: 0;
	}

	.manifesto__chevrons--right {
		right: 60px;
		top: 110px;
		flex-direction: row;
	}

	.manifesto__chevrons--down {
		left: 80px;
		top: 60px;
		flex-direction: column;
	}

	.manifesto__chevron {
		width: 12px;
		height: 12px;
		border-right: 2px solid #E07800;
		border-bottom: 2px solid #E07800;
		opacity: 0.12;
	}

	.manifesto__chevrons--right .manifesto__chevron {
		transform: rotate(-45deg);
	}

	.manifesto__chevrons--down .manifesto__chevron {
		transform: rotate(45deg);
	}

	/* ── Transit: Platform Badges ────────────────────────────────── */
	.manifesto__badge {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 8px;
		letter-spacing: 2px;
		color: rgba(224,120,0,0.2);
		border: 1px solid rgba(224,120,0,0.1);
		border-radius: 4px;
		padding: 3px 8px;
		text-transform: uppercase;
		z-index: 3;
		opacity: 0;
	}

	.manifesto__badge--platform {
		right: 50px;
		bottom: 60px;
	}

	.manifesto__badge--direction {
		left: 50px;
		top: 55px;
	}

	/* ── Center Content ──────────────────────────────────────────── */
	.manifesto__content {
		position: relative;
		z-index: 10;
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
		border: 1px solid rgba(224,120,0,0.08);
		border-radius: 4px;
		background: rgba(224,120,0,0.02);
		opacity: 0;
	}

	.manifesto__prompt-cmd {
		font-family: var(--font-mono);
		font-size: 13px;
		color: rgba(224,120,0,0.65);
	}

	.manifesto__prompt-text {
		font-family: var(--font-mono);
		font-size: 13px;
		color: rgba(224,120,0,0.4);
	}

	.manifesto__cursor {
		width: 8px;
		height: 14px;
		background: #E07800;
		animation: blink 1s step-end infinite;
	}

	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
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
		color: rgba(255,255,255,0.45);
		letter-spacing: -0.02em;
		line-height: 1.3;
	}

	.manifesto__line-huge {
		font-family: var(--font-heading);
		font-weight: 900;
		font-size: clamp(2.2rem, 11.5vw, 11rem);
		color: #E07800;
		letter-spacing: -0.05em;
		line-height: 0.85;
		text-shadow: 0 0 80px rgba(224,120,0,0.12);
		white-space: nowrap;
		max-width: 100vw;
		overflow: hidden;
	}

	.manifesto__highlight {
		color: #E07800;
	}

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
		color: #666;
		border: 1px solid rgba(255,255,255,0.07);
		border-radius: 9999px;
		padding: 8px 20px;
		text-decoration: none;
		transition: all 200ms ease;
		opacity: 0;
		transform: translateY(15px);
	}

	.manifesto__pill:hover {
		border-color: #E07800;
		color: #E07800;
		background: rgba(224,120,0,0.06);
	}

	/* ── Ripple keyframes (for ManifestoCanvas) ───────────────────── */
	:global(.manifesto__ripple) {
		position: absolute;
		border: 1px solid rgba(224,120,0,0.4);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 4;
		animation: ripple-expand 1.2s ease-out forwards;
	}

	:global(.manifesto__ripple-inner) {
		position: absolute;
		border: 1px solid rgba(255,182,39,0.3);
		border-radius: 50%;
		transform: translate(-50%, -50%);
		pointer-events: none;
		z-index: 4;
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

	/* ── Responsive: Mobile ──────────────────────────────────────── */
	@media (max-width: 640px) {
		.manifesto__edge-left {
			left: 8px;
			font-size: 7px;
			gap: 16px;
		}

		.manifesto__edge-right {
			right: 8px;
			font-size: 7px;
			gap: 10px;
		}

		.manifesto__arrival {
			left: 12px;
			bottom: 50px;
		}

		.manifesto__arrival .manifesto__arr-time {
			font-size: 14px;
		}

		.manifesto__pill {
			font-size: 10px;
			padding: 5px 12px;
		}

		.manifesto__pills {
			gap: 6px;
		}

		.manifesto__stripe--tl,
		.manifesto__stripe--br {
			width: 160px;
			height: 160px;
		}

		.manifesto__stripe--tr,
		.manifesto__stripe--bl {
			width: 80px;
			height: 80px;
		}
	}

	@media (max-width: 768px) {
		.manifesto__beck-line {
			display: none;
		}

		.manifesto__roundel {
			width: 18px;
			height: 18px;
			font-size: 8px;
		}

		.manifesto__chevrons {
			opacity: 0.08;
		}

		.manifesto__badge {
			font-size: 6px;
			padding: 2px 6px;
		}
	}

	/* ── Reduced Motion ──────────────────────────────────────────── */
	@media (prefers-reduced-motion: reduce) {
		.manifesto__flow-line,
		.manifesto__flow-line-v {
			display: none;
		}

		.manifesto__circuit-grid,
		.manifesto__stripe,
		.manifesto__beck-line,
		.manifesto__roundel,
		.manifesto__edge-left,
		.manifesto__edge-right,
		.manifesto__edge-top,
		.manifesto__edge-bottom,
		.manifesto__arrival,
		.manifesto__chevrons,
		.manifesto__badge,
		.manifesto__prompt,
		.manifesto__pill {
			opacity: 1;
			transform: none;
			translate: none;
		}

		.manifesto__cursor {
			animation: none;
			opacity: 1;
		}

		.manifesto__status-dot {
			animation: none;
			opacity: 1;
		}
	}
</style>
