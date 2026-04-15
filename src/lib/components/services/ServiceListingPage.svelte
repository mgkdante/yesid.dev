<!--
  Services listing page — page-level Lenis scroll, no nested scroll container.
  Sticky StationTabs at top, sticky ProjectsStrip at bottom.
  IntersectionObserver tracks which service viewport is in view. D190, D191.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import type { Service, Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { getLenis } from '$lib/motion/utils/lenis.js';
	import StationTabs from '$lib/components/shared/StationTabs.svelte';
	import ServiceCard from './ServiceCard.svelte';
	import ProjectsStrip from './ProjectsStrip.svelte';

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
	let currentProjects = $derived(serviceProjects[activeId] ?? []);
	let currentServiceTitle = $derived(() => {
		const svc = sorted.find((s) => s.id === activeId);
		return svc ? resolveLocale(svc.title, 'en') : undefined;
	});

	function handleTabSelect(id: string) {
		activeId = id;
		if (!browser) return;
		const lenis = getLenis();
		const target = document.querySelector<HTMLElement>(`#service-${id}`);
		if (lenis && target) {
			lenis.scrollTo(target, { offset: 0 });
		} else if (target) {
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	onMount(() => {
		if (!browser) return;

		const viewports = document.querySelectorAll<HTMLElement>('[id^="service-"]');
		if (viewports.length === 0) return;

		const observer = new IntersectionObserver(
			(entries) => {
				for (const entry of entries) {
					if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
						const id = entry.target.id.replace('service-', '');
						activeId = id;
					}
				}
			},
			{ threshold: 0.5 }
		);

		viewports.forEach((el) => observer.observe(el));

		return () => {
			observer.disconnect();
		};
	});
</script>

<div class="services-page" data-testid="service-listing-page">
	<h1 class="sr-only">Services</h1>

	<!-- Sticky station tabs -->
	<div class="tabs-bar">
		<StationTabs
			services={sorted}
			{activeId}
			mode="scroll"
			onSelect={handleTabSelect}
		/>
	</div>

	<!-- Service viewports — page-level scroll, no nested container -->
	{#each sorted as service, i (service.id)}
		<ServiceCard
			{service}
			svgContent={serviceSvgContents[service.id] ?? ''}
			index={i}
			total={sorted.length}
		/>
	{/each}

	<!-- Sticky projects strip -->
	<div class="strip-bar">
		<ProjectsStrip
			projects={currentProjects}
			serviceTitle={currentServiceTitle()}
		/>
	</div>
</div>

<style>
	.services-page {
		position: relative;
		background: var(--background);
		overflow-x: clip;
	}

	.tabs-bar {
		position: sticky;
		top: 5rem;
		z-index: var(--z-rail);
	}

	/* Solid backdrop above tabs — covers the nav gap so content doesn't
	   show through the semi-transparent nav pill on scroll. */
	.tabs-bar::before {
		content: '';
		position: absolute;
		inset-inline: 0;
		bottom: 100%;
		height: calc(5rem + env(safe-area-inset-top, 0px) + 1rem);
		background: var(--background);
		pointer-events: none;
	}

	.strip-bar {
		position: sticky;
		bottom: 0;
		z-index: var(--z-rail);
	}
</style>
