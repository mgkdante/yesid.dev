<!--
  Full-viewport kinetic scroll layout for /services.
  Each service occupies 100dvh with CSS scroll snap.
  Sticky top: StationTabs. Sticky bottom: RelatedProjects.
  Tab click scrolls to service. Scroll position syncs tabs + proof strip.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Service, Project } from '$lib/data/types.js';
	import StationTabs from '$lib/components/shared/StationTabs.svelte';
	import ServiceCard from './ServiceCard.svelte';
	import RelatedProjects from '$lib/components/home/RelatedProjects.svelte';
	import Footer from '$lib/components/layout/Footer.svelte';

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

		const progress = scrollTop / maxScroll;

		// Determine active service based on which viewport is most visible
		const serviceCount = sorted.length;
		const activeIndex = Math.round(progress * (serviceCount - 1));
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
	<h1 class="sr-only">Services</h1>
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
		<RelatedProjects projects={currentProjects} />
	</div>
</div>

<style>
	.service-listing {
		position: relative;
		height: calc(100dvh - 5rem); /* subtract floating pill nav area (pt-20 = 80px) */
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.tabs-bar {
		flex-shrink: 0;
		z-index: var(--z-rail);
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
		z-index: var(--z-rail);
	}

	/* Footer inside scroll area — does NOT snap, just flows after last service */
	.listing-footer {
		scroll-snap-align: none;
	}

</style>
