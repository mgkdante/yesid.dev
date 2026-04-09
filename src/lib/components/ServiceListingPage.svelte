<!--
  Full-viewport kinetic scroll layout for /services.
  Each service occupies 100vh with CSS scroll snap.
  Sticky top: StationTabs. Sticky bottom: ProofStrip.
  Left: metro line with auto-computed station dots (desktop only).
  Tab click scrolls to service. Scroll position syncs tabs + proof strip.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Service, Project } from '$lib/data/types.js';
	import StationTabs from './StationTabs.svelte';
	import ServiceCard from './ServiceCard.svelte';
	import ProofStrip from './ProofStrip.svelte';
	import Footer from './Footer.svelte';

	let {
		services,
		serviceSvgContents,
		serviceProjects
	}: {
		services: readonly Service[];
		serviceSvgContents: Record<string, string>;
		serviceProjects: Record<string, readonly Project[]>;
	} = $props();

	let sorted = $derived(
		[...services].sort((a, b) => a.station - b.station)
	);

	let activeId = $state(sorted[0]?.id ?? '');
	let scrollContainer: HTMLElement | undefined = $state();
	let scrollProgress = $state(0);

	let currentProjects = $derived(
		serviceProjects[activeId] ?? []
	);

	function handleTabSelect(id: string) {
		// Immediately update active state so the tab highlights
		activeId = id;

		if (!browser || !scrollContainer) return;
		const target = scrollContainer.querySelector(`#service-${id}`);
		if (target) {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	function handleScroll() {
		if (!scrollContainer) return;
		const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
		const maxScroll = scrollHeight - clientHeight;
		if (maxScroll <= 0) return;

		scrollProgress = scrollTop / maxScroll;

		// Determine active service based on which viewport is most visible
		const serviceCount = sorted.length;
		const activeIndex = Math.round(scrollProgress * (serviceCount - 1));
		const clamped = Math.max(0, Math.min(activeIndex, serviceCount - 1));
		if (sorted[clamped]) {
			activeId = sorted[clamped].id;
		}
	}

	onMount(() => {
		if (!browser || !scrollContainer) return;
		scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
		return () => {
			scrollContainer?.removeEventListener('scroll', handleScroll);
		};
	});
</script>

<div class="service-listing" data-testid="service-listing-page">
	<!-- Sticky station tabs — flush to top, no margin -->
	<div class="tabs-bar">
		<StationTabs
			services={sorted}
			{activeId}
			mode="scroll"
			onSelect={handleTabSelect}
		/>
	</div>

	<!-- Main scroll area with snap -->
	<div class="scroll-area" bind:this={scrollContainer}>
		<!-- Metro line with auto-computed dots — desktop only -->
		<div class="metro-line" aria-hidden="true">
			<div class="metro-track">
				<div class="metro-fill" style="height: {scrollProgress * 100}%"></div>
			</div>
			{#each sorted as service, i}
				{@const isActive = service.id === activeId}
				{@const activeIdx = sorted.findIndex((s) => s.id === activeId)}
				{@const isVisited = i <= activeIdx}
				{@const pct = sorted.length <= 1 ? 0 : (i / (sorted.length - 1)) * 100}
				<div
					class="metro-dot"
					class:active={isActive}
					class:visited={isVisited && !isActive}
					style="top: {pct}%"
				></div>
			{/each}
		</div>

		<!-- Service viewports -->
		{#each sorted as service, i}
			<ServiceCard
				{service}
				svgContent={serviceSvgContents[service.id] ?? ''}
				index={i}
				total={sorted.length}
			/>
		{/each}

		<!-- Footer at end of scroll — appears when scrolling past last station -->
		<div class="listing-footer">
			<Footer />
		</div>
	</div>

	<!-- Sticky proof strip at bottom -->
	<div class="proof-bar">
		<ProofStrip projects={currentProjects} />
	</div>
</div>

<style>
	.service-listing {
		position: relative;
		height: calc(100vh - 5rem); /* subtract floating pill nav area (pt-20 = 80px) */
		display: flex;
		flex-direction: column;
		background: var(--bg-primary, #141414);
		overflow: hidden;
	}

	.tabs-bar {
		flex-shrink: 0;
		z-index: 20;
	}

	.scroll-area {
		flex: 1;
		overflow-y: auto;
		scroll-snap-type: y mandatory;
		position: relative;
		scrollbar-width: none;
	}
	.scroll-area::-webkit-scrollbar {
		display: none;
	}

	/* Each service viewport snaps */
	.scroll-area :global(.service-viewport) {
		scroll-snap-align: start;
	}

	.proof-bar {
		flex-shrink: 0;
		z-index: 20;
	}

	/* Footer inside scroll area — does NOT snap, just flows after last service */
	.listing-footer {
		scroll-snap-align: none;
	}

	/* Metro line — left edge, desktop only */
	.metro-line {
		display: none;
		position: fixed;
		left: 1.5rem;
		top: calc(4rem + 46px + 1rem); /* nav + tabs + gap */
		bottom: calc(40px + 1rem); /* proof strip + gap */
		width: 2px;
		z-index: 10;
		pointer-events: none;
	}

	@media (min-width: 1024px) {
		.metro-line {
			display: block;
		}
	}

	.metro-track {
		position: absolute;
		inset: 0;
		background: #1a1a1a;
		border-radius: 1px;
	}

	.metro-fill {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		background: #E07800;
		border-radius: 1px;
		transition: height 0.2s ease-out;
	}

	.metro-dot {
		position: absolute;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 10px;
		height: 10px;
		border-radius: 50%;
		border: 2px solid #333;
		background: transparent;
		transition: all 0.3s ease;
		z-index: 1;
	}

	.metro-dot.visited {
		background: #E07800;
		border-color: #E07800;
	}

	.metro-dot.active {
		background: #E07800;
		border-color: #E07800;
		box-shadow: 0 0 12px rgba(224, 120, 0, 0.5);
		width: 12px;
		height: 12px;
	}
</style>
