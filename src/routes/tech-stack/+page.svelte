<!-- /tech-stack route: "The Control Room" interactive diagram -->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { TechStackItem, DomainCluster, StackScenario } from '$lib/data/types.js';
	import { getTechItemById, getScenarioForDomains } from '$lib/data/tech-stack.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import StackDiagram from '$lib/components/StackDiagram.svelte';
	import StackPanel from '$lib/components/StackPanel.svelte';
	import StackBottomSheet from '$lib/components/StackBottomSheet.svelte';
	import StackFilters from '$lib/components/StackFilters.svelte';
	import StackConfigurator from '$lib/components/StackConfigurator.svelte';
	import StackScenarioCard from '$lib/components/StackScenarioCard.svelte';
	import TerminalCursor from '$lib/components/TerminalCursor.svelte';
	import InfraFrame from '$lib/components/InfraFrame.svelte';
	import { StatusDot, BrandButton } from '$lib/components/brand';

	let { data } = $props();

	let selectedItem = $state<TechStackItem | null>(null);
	let selectedId = $state<string | null>(null);
	let activeDomains = $state<DomainCluster[]>([]);

	// Build Your Stack — independent from filter domains
	let buildDomains = $state<DomainCluster[]>([]);
	let mobileBuildOpen = $state(false);

	// Scenario matching from build domain selection
	const matchedScenario = $derived<StackScenario | undefined>(
		buildDomains.length > 0
			? getScenarioForDomains(buildDomains)
			: undefined,
	);

	// Recommended IDs for diagram highlighting (decoupled from filter)
	const recommendedIds = $derived<Set<string> | null>(
		matchedScenario
			? new Set(matchedScenario.recommended)
			: null,
	);

	// Dynamic counts
	const itemCount = data.items.length;
	const layerCount = new Set(data.items.map((i) => i.layer)).size;
	const connectionCount = data.items.reduce((sum, item) => sum + item.connectsTo.length, 0);

	// Hero terminal typed sequence
	interface TerminalLine {
		text: string;
		color: 'default' | 'muted' | 'orange' | 'accent' | 'green';
		visible: boolean;
	}

	const terminalLines: TerminalLine[] = [
		{ text: '~ yesid --stack --verbose', color: 'default', visible: true },
		{ text: `→ mapping infrastructure...`, color: 'muted', visible: false },
		{ text: `→ loading ${itemCount} nodes across ${layerCount} layers...`, color: 'muted', visible: false },
		{ text: '✓ successful', color: 'green', visible: false },
		{ text: `→ ${itemCount} technologies | ${layerCount} layers | 7 domains | 10+ projects`, color: 'orange', visible: false },
		{ text: 'click a node to see how it all connects.', color: 'accent', visible: false },
	];

	let heroLines = $state<TerminalLine[]>(terminalLines);
	let heroReady = $state(false);
	let heroCursorVisible = $state(false);

	onMount(() => {
		if (isPrefersReducedMotion()) {
			heroLines = terminalLines.map((l) => ({ ...l, visible: true }));
			heroReady = true;
			heroCursorVisible = true;
			return;
		}

		// Delays between each output line (index 1+) — starts immediately
		const delays = [400, 600, 300, 400, 500];

		async function playSequence() {
			// Line 0 (command) is already visible — first output appears fast
			for (let i = 1; i < heroLines.length; i++) {
				await new Promise((r) => setTimeout(r, delays[i - 1]));
				heroLines[i] = { ...heroLines[i], visible: true };
			}
			// Show cursor + stats/buttons after last line
			await new Promise((r) => setTimeout(r, 300));
			heroCursorVisible = true;
			heroReady = true;
		}

		playSequence();
	});

	function handleSelect(item: TechStackItem | null) {
		selectedItem = item;
		selectedId = item?.id ?? null;
	}

	function handleClose() {
		selectedItem = null;
		selectedId = null;
	}

	function handlePanelNavigate(itemId: string) {
		const item = getTechItemById(itemId) ?? null;
		if (item) handleSelect(item);
	}

	function handleDomainsChange(domains: DomainCluster[]) {
		activeDomains = domains;
	}

	function handleBuildDomainsChange(domains: DomainCluster[]) {
		buildDomains = domains;
	}

	function toggleMobileBuild() {
		mobileBuildOpen = !mobileBuildOpen;
	}

	function scrollToBuild() {
		// On mobile (<768px) the build section is in a FAB overlay — open it
		if (window.innerWidth < 768) {
			mobileBuildOpen = true;
			return;
		}
		// Desktop/tablet: scroll to the visible build section
		const el = document.querySelector('[data-testid="build-section"]')
			?? document.querySelector('[data-testid="build-section-tablet"]');
		el?.scrollIntoView({ behavior: 'smooth' });
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			if (selectedItem) {
				e.preventDefault();
				handleClose();
			} else if (mobileBuildOpen) {
				e.preventDefault();
				mobileBuildOpen = false;
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>Tech Stack — yesid.</title>
	<meta
		name="description"
		content="{itemCount}+ technologies across {layerCount} infrastructure layers — an interactive map of how digital infrastructure gets built."
	/>
</svelte:head>

<main class="tech-stack-page">
	<!-- ═══ HERO ZONE ═══ -->
	<section class="hero" data-testid="tech-stack-hero">
		<div class="hero-overline">
			<span class="hero-overline-text">Infrastructure Map</span>
		</div>

		<h1 class="hero-title">
			The Control<br>
			<span class="hero-title-accent">Room.</span>
		</h1>

		<div class="hero-terminal" aria-label="Infrastructure overview">
			{#each heroLines as line, i}
				<div
					class="hero-terminal-line hero-line-color-{line.color}"
					class:hero-line-visible={line.visible}
					class:hero-line-animate={line.visible && !isPrefersReducedMotion()}
				>
					{line.text}
				</div>
			{/each}
			<div
				class="hero-terminal-line"
				class:hero-line-visible={heroCursorVisible}
			>
				<span class="hero-prompt">~</span>
				<TerminalCursor />
			</div>
		</div>

		<div class="hero-stats" class:hero-reveal={heroReady} class:hero-hidden={!heroReady}>
			<div class="hero-stat">
				<span class="hero-stat-value flex items-center gap-2"><StatusDot color="orange" pulse />{itemCount}</span>
				<span class="hero-stat-label">technologies</span>
			</div>
			<div class="hero-stat">
				<span class="hero-stat-value">{layerCount}</span>
				<span class="hero-stat-label">layers</span>
			</div>
			<div class="hero-stat">
				<span class="hero-stat-value">7</span>
				<span class="hero-stat-label">domains</span>
			</div>
			<div class="hero-stat">
				<span class="hero-stat-value">10+</span>
				<span class="hero-stat-label">projects</span>
			</div>
		</div>

		<div class="hero-actions" class:hero-reveal={heroReady} class:hero-hidden={!heroReady}>
			<BrandButton variant="primary" size="md" onclick={() => document.getElementById('diagram-zone')?.scrollIntoView({ behavior: 'smooth' })}>
				Explore Diagram <span aria-hidden="true">&darr;</span>
			</BrandButton>
			<BrandButton variant="ghost" size="md" onclick={scrollToBuild}>
				Build Your Stack <span aria-hidden="true">&rarr;</span>
			</BrandButton>
		</div>
	</section>

	<!-- ═══ DIVIDER ═══ -->
	<div id="diagram-zone" class="section-divider" aria-hidden="true">
		<div class="divider-line"></div>
		<span class="divider-label">INFRASTRUCTURE OVERVIEW</span>
		<div class="divider-line"></div>
	</div>

	<!-- Desktop (xl: 1280px+): diagram + persistent panel side by side -->
	<div class="desktop-layout">
		<div class="diagram-area">
			<InfraFrame
				tag="LIVE"
				title="infrastructure-diagram — interactive"
				status="{itemCount} nodes active"
				footer={[
					{ label: 'NODES', value: String(itemCount) },
					{ label: 'CONNECTIONS', value: String(connectionCount) },
					{ label: 'FILTER', value: activeDomains.length === 0 ? 'ALL' : activeDomains.length + ' active' },
				]}
				station="STATION 06 — CONTROL ROOM"
			>
				<div class="frame-inner">
					<StackFilters {activeDomains} onchange={handleDomainsChange} />
					<StackDiagram items={data.items} {selectedId} {activeDomains} {recommendedIds} onselect={handleSelect} />

					<!-- Build Your Stack: below diagram, co-located with results -->
					<div class="build-section" data-testid="build-section">
						<div class="build-header">
							<span class="build-label">Build Your Stack</span>
							<span class="build-hint">Select up to 3 domains to get a recommended stack</span>
						</div>
						<div class="build-content">
							<div class="build-configurator">
								<StackConfigurator selectedDomains={buildDomains} onchange={handleBuildDomainsChange} />
							</div>
							{#if matchedScenario}
								<div class="build-result">
									{#key matchedScenario.id}
										<StackScenarioCard scenario={matchedScenario} />
									{/key}
								</div>
							{/if}
						</div>
					</div>
				</div>
			</InfraFrame>
		</div>
		<aside class="panel-area" data-testid="desktop-panel">
			<StackPanel
				item={selectedItem}
				onclose={selectedItem ? handleClose : undefined}
				onnavigate={handlePanelNavigate}
			/>
		</aside>
	</div>

	<!-- Tablet (md: 768–1279px): diagram only + overlay panel on click -->
	<div class="tablet-layout">
		<InfraFrame
			tag="LIVE"
			title="infrastructure-diagram"
			status="{itemCount} nodes"
			footer={[
				{ label: 'NODES', value: String(itemCount) },
				{ label: 'CONNECTIONS', value: String(connectionCount) },
			]}
			station="STATION 06 — CONTROL ROOM"
		>
			<div class="frame-inner">
				<StackFilters {activeDomains} onchange={handleDomainsChange} />
				<StackDiagram items={data.items} {selectedId} {activeDomains} {recommendedIds} onselect={handleSelect} />

				<!-- Build section below diagram -->
				<div class="build-section" data-testid="build-section-tablet">
					<div class="build-header">
						<span class="build-label">Build Your Stack</span>
						<span class="build-hint">Select up to 3 domains to get a recommended stack</span>
					</div>
					<div class="build-content">
						<div class="build-configurator">
							<StackConfigurator selectedDomains={buildDomains} onchange={handleBuildDomainsChange} />
						</div>
						{#if matchedScenario}
							<div class="build-result">
								{#key matchedScenario.id}
									<StackScenarioCard scenario={matchedScenario} />
								{/key}
							</div>
						{/if}
					</div>
				</div>
			</div>
		</InfraFrame>

		{#if selectedItem}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="tablet-overlay-backdrop" onclick={handleClose} data-testid="tablet-backdrop"></div>
			<aside class="tablet-overlay-panel" data-testid="tablet-panel">
				{#key selectedItem.id}
					<StackPanel
						item={selectedItem}
						onclose={handleClose}
						onnavigate={handlePanelNavigate}
					/>
				{/key}
			</aside>
		{/if}
	</div>

	<!-- Mobile (<768px): accordion + bottom sheet + FAB for builder -->
	<div class="mobile-layout">
		<InfraFrame
			tag="LIVE"
			title="infrastructure"
			station="STATION 06"
		>
			<div class="frame-inner">
				<StackFilters {activeDomains} onchange={handleDomainsChange} />
				<StackDiagram items={data.items} {selectedId} {activeDomains} {recommendedIds} onselect={handleSelect} />
			</div>
		</InfraFrame>

		{#if selectedItem}
			<StackBottomSheet
				item={selectedItem}
				items={data.items}
				onclose={handleClose}
				onnavigate={handleSelect}
			/>
		{/if}

		<!-- FAB: Build Your Stack -->
		{#if !selectedItem}
			<button
				class="build-fab"
				data-testid="build-fab"
				onclick={toggleMobileBuild}
				aria-label="Build Your Stack"
			>
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path d="M10 3V17M3 10H17" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
				</svg>
			</button>
		{/if}

		<!-- Build overlay (mobile) -->
		{#if mobileBuildOpen}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="build-overlay-backdrop" onclick={toggleMobileBuild} data-testid="build-overlay-backdrop"></div>
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="build-overlay" onclick={(e) => e.stopPropagation()} data-testid="build-overlay">
				<div class="build-overlay-header">
					<span class="build-label">Build Your Stack</span>
					<button class="build-overlay-close" onclick={toggleMobileBuild} aria-label="Close">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
						</svg>
					</button>
				</div>
				<div class="build-overlay-body">
					<StackConfigurator selectedDomains={buildDomains} onchange={handleBuildDomainsChange} />
					{#if matchedScenario}
						{#key matchedScenario.id}
							<StackScenarioCard scenario={matchedScenario} />
						{/key}
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- ═══ CTA ZONE ═══ -->
	<section class="cta-zone" data-testid="tech-stack-cta">
		<div class="cta-hazard" aria-hidden="true"></div>
		<h2 class="cta-heading">
			Found your stack<span class="cta-accent">?</span><br>
			Let's build it<span class="cta-accent">.</span>
		</h2>
		<p class="cta-sub">
			Whether it's a data pipeline, a web app, or a mobile product — the infrastructure is ready.
		</p>
		<div class="cta-buttons">
			<BrandButton variant="primary" size="md" href="/contact">
				Get In Touch <span aria-hidden="true">&rarr;</span>
			</BrandButton>
			<BrandButton variant="ghost" size="md" href="/services">
				View Services
			</BrandButton>
		</div>
		<span class="cta-avail">Available for Q2 2026</span>
	</section>
</main>

<style>
	.tech-stack-page {
		min-height: 100vh;
		padding-block: 2rem;
	}

	/* --- Desktop: xl (1280px+) --- */
	.desktop-layout {
		display: none;
	}

	@media (min-width: 1280px) {
		.desktop-layout {
			display: flex;
			gap: 1rem;
			align-items: flex-start;
			padding-inline: 1rem;
		}

		.diagram-area {
			flex: 1;
			min-width: 0;
		}

		.panel-area {
			flex: 0 0 320px;
			position: sticky;
			top: 4.5rem;
		}

		.tablet-layout,
		.mobile-layout {
			display: none;
		}
	}

	/* Wider panels on larger screens */
	@media (min-width: 1440px) {
		.desktop-layout {
			padding-inline: 1.5rem;
			gap: 1.5rem;
		}

		.panel-area {
			flex: 0 0 360px;
		}
	}

	/* --- Build Your Stack section (desktop + tablet) --- */

	.build-section {
		margin-top: 2rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border);
	}

	.build-header {
		display: flex;
		align-items: baseline;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.build-label {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-primary);
	}

	.build-hint {
		font-family: var(--font-body);
		font-size: var(--text-small);
		color: var(--text-muted);
	}

	.build-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (min-width: 1280px) {
		.build-content {
			flex-direction: row;
			align-items: flex-start;
			gap: 1.5rem;
		}

		.build-configurator {
			flex: 1;
			min-width: 0;
		}

		.build-result {
			flex: 1;
			min-width: 0;
		}
	}

	/* --- Tablet: md (768–1279px) --- */
	.tablet-layout {
		display: none;
		position: relative;
		padding-inline: 1rem;
	}

	@media (min-width: 768px) and (max-width: 1279px) {
		.tablet-layout {
			display: block;
		}

		.desktop-layout,
		.mobile-layout {
			display: none;
		}

		.tablet-overlay-backdrop {
			position: fixed;
			inset: 0;
			background: rgba(0, 0, 0, 0.5);
			z-index: 40;
		}

		.tablet-overlay-panel {
			position: fixed;
			top: 4rem;
			right: 1rem;
			width: 340px;
			max-height: calc(100vh - 5rem);
			z-index: 41;
		}
	}

	/* --- Mobile: <768px --- */
	.mobile-layout {
		display: block;
		padding-inline: 0.75rem;
	}

	@media (min-width: 768px) {
		.mobile-layout {
			display: none;
		}
	}

	/* --- FAB --- */

	.build-fab {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 30;
		width: 3.25rem;
		height: 3.25rem;
		border-radius: 50%;
		border: 1px solid var(--brand-primary);
		background: var(--bg-surface);
		color: var(--brand-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		box-shadow:
			0 2px 8px rgba(0, 0, 0, 0.3),
			0 0 12px color-mix(in srgb, var(--brand-primary) 20%, transparent);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.build-fab:hover {
		transform: scale(1.08);
		box-shadow:
			0 4px 16px rgba(0, 0, 0, 0.4),
			0 0 16px color-mix(in srgb, var(--brand-primary) 30%, transparent);
	}

	.build-fab:active {
		transform: scale(0.95);
	}

	/* --- Build overlay (mobile) --- */

	.build-overlay-backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: rgba(0, 0, 0, 0.5);
	}

	.build-overlay {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 51;
		max-height: 85vh;
		overflow-y: auto;
		background: var(--bg-surface);
		border-top: 1px solid var(--border);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.build-overlay-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.build-overlay-close {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
	}

	.build-overlay-body {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	@media (prefers-reduced-motion: reduce) {
		.build-fab {
			transition: none;
		}
		.hero-line-animate {
			animation: none;
		}
		.hero-hidden {
			opacity: 1;
		}
		.hero-reveal {
			transition: none;
		}
	}

	/* ═══ SECTION DIVIDER ═══ */

	.section-divider {
		display: flex;
		align-items: center;
		gap: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 1.5rem 2.5rem;
	}

	.divider-line {
		flex: 1;
		height: 1px;
		background: var(--border);
	}

	.divider-label {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 3px;
		color: var(--text-muted);
		white-space: nowrap;
	}

	@media (max-width: 767px) {
		.section-divider {
			padding: 1rem 0.75rem 1.5rem;
		}
	}

	/* ═══ LAYOUT COHESION — max-width wrapper ═══ */

	.desktop-layout,
	.tablet-layout,
	.mobile-layout {
		max-width: 1400px;
		margin-inline: auto;
	}

	/* ═══ INFRA FRAME INNER PADDING ═══ */

	.frame-inner {
		padding: 1rem;
	}

	/* ═══ HERO ZONE ═══ */

	.hero {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem 1.5rem 0;
		display: flex;
		flex-direction: column;
		min-height: 50vh;
		justify-content: center;
	}

	.hero-overline {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 4px;
		text-transform: uppercase;
		color: var(--brand-primary);
		margin-bottom: 1.5rem;
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.hero-overline::before {
		content: '';
		width: 32px;
		height: 1px;
		background: var(--brand-primary);
		flex-shrink: 0;
	}

	.hero-title {
		font-family: var(--font-heading);
		font-size: clamp(2.5rem, 6vw, 5rem);
		font-weight: 800;
		line-height: 1.05;
		letter-spacing: -0.03em;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}

	.hero-title-accent {
		color: var(--brand-primary);
	}

	.hero-terminal {
		font-family: var(--font-mono);
		font-size: clamp(12px, 1.4vw, 14px);
		line-height: 1.8;
		margin-bottom: 2.5rem;
		max-width: 600px;
	}

	.hero-terminal-line {
		color: var(--text-secondary);
		opacity: 0;
	}

	.hero-line-visible {
		opacity: 1;
	}

	/* Line color variants */
	.hero-line-color-default { color: var(--text-secondary); }
	.hero-line-color-muted { color: var(--text-muted); }
	.hero-line-color-orange { color: var(--brand-primary); }
	.hero-line-color-accent { color: var(--brand-accent); }
	.hero-line-color-green { color: var(--status-success); }

	/* Line entrance animation — opacity only, no transform to avoid shift */
	.hero-line-animate {
		animation: hero-line-in 0.3s ease-out both;
	}

	@keyframes hero-line-in {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.hero-prompt {
		color: var(--text-primary);
	}

	/* Stats + actions reveal after sequence — no transform, just fade */
	.hero-hidden {
		opacity: 0;
	}

	.hero-reveal {
		opacity: 1;
		transition: opacity 0.5s ease;
	}

	.hero-stats {
		display: flex;
		gap: 2.5rem;
		padding-top: 2rem;
		border-top: 1px solid var(--border);
		margin-bottom: 2rem;
	}

	.hero-stat {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.hero-stat-value {
		font-family: var(--font-mono);
		font-size: clamp(22px, 3vw, 28px);
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		display: flex;
		align-items: center;
	}

	.hero-stat-label {
		font-family: var(--font-mono);
		font-size: 11px;
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.hero-actions {
		display: flex;
		gap: 1rem;
		flex-wrap: wrap;
		padding-bottom: 2rem;
	}

	/* ═══ CTA ZONE ═══ */

	.cta-zone {
		max-width: 1200px;
		margin: 4rem auto 2rem;
		padding: 0 1.5rem;
		text-align: center;
	}

	.cta-hazard {
		width: 60px;
		height: 3px;
		margin: 0 auto 2rem;
		background: repeating-linear-gradient(
			-45deg,
			var(--brand-accent) 0px, var(--brand-accent) 4px,
			transparent 4px, transparent 8px
		);
	}

	.cta-heading {
		font-family: var(--font-heading);
		font-size: clamp(1.5rem, 3vw, 2.5rem);
		font-weight: 800;
		letter-spacing: -0.02em;
		line-height: 1.2;
		color: var(--text-primary);
		margin-bottom: 0.75rem;
	}

	.cta-accent {
		color: var(--brand-primary);
	}

	.cta-sub {
		font-family: var(--font-mono);
		font-size: 13px;
		color: var(--text-muted);
		margin-bottom: 2rem;
		max-width: 500px;
		margin-inline: auto;
		line-height: 1.6;
	}

	.cta-buttons {
		display: flex;
		justify-content: center;
		gap: 1rem;
		margin-bottom: 1rem;
		flex-wrap: wrap;
	}

	.cta-avail {
		font-family: var(--font-mono);
		font-size: 10px;
		letter-spacing: 1px;
		color: var(--brand-accent);
		text-transform: uppercase;
	}

	/* Mobile hero adjustments */
	@media (max-width: 767px) {
		.hero {
			padding: 1.5rem 0.75rem 0;
			min-height: 40vh;
		}

		.hero-stats {
			gap: 1.5rem;
			flex-wrap: wrap;
		}

		.cta-zone {
			margin-top: 3rem;
			padding: 0 0.75rem;
		}
	}
</style>
