<!--
  Services listing page — page-level Lenis scroll, no nested scroll container.
  Sticky StationTabs at top, sticky ProjectsStrip at bottom.
  IntersectionObserver tracks which service viewport is in view. D190, D191.
-->
<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { Service, Project } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { servicesListingContent } from '$lib/content/services';
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
		return svc ? resolveLocale(svc.title, locale) : undefined;
	});

	// Lenis-aware scroll to a station viewport — the authoritative motion; activeId
	// follows from the IntersectionObserver once the section lands in view.
	function scrollToStation(id: string) {
		const lenis = getLenis();
		const target = document.querySelector<HTMLElement>(`#service-${id}`);
		if (!target) return;
		// Lenis ignores CSS scroll-margin-top, so the mobile offset that clears the
		// sticky tabs (.service-viewport scroll-margin-top: 8.75rem) was being dropped
		// and the card landed jammed under the tabs. Read the computed value and pass it
		// to Lenis as a negative offset. Desktop sets no scroll-margin-top (0), so its
		// sticky-centered behaviour is unchanged.
		const offset = -(parseFloat(getComputedStyle(target).scrollMarginTop) || 0);
		if (lenis) {
			lenis.scrollTo(target, { offset });
		} else {
			// Native fallback already honours scroll-margin-top.
			target.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}

	// slice-34.5: the active station is a SHAREABLE ?station=<id> URL param, written
	// only on an explicit tab click (NOT from the IntersectionObserver, which would
	// spam replaceState during scroll). Because it's a URL param it rides the
	// language toggle for free (localizeHref carries the query), so on the remounted
	// FR/EN page the onMount deep-link below re-scrolls to the carried station.
	async function handleTabSelect(id: string) {
		activeId = id;
		if (!browser) return;
		const url = new URL($page.url);
		url.searchParams.set('station', id);
		// Await the navigation BEFORE scrolling. replaceState keeps the tab-click out
		// of the history stack (a scroll position, not a destination). On touch devices
		// (no Lenis) the scroll is a native smooth scrollIntoView, and firing it before
		// goto settled cancelled it mid-animation: the tab highlighted but the page
		// never moved. Desktop survived because Lenis owns its own scroll. Awaiting goto
		// fixes the mobile tab-scroll.
		await goto(url.toString(), { replaceState: true, noScroll: true });
		scrollToStation(id);
	}

	onMount(() => {
		if (!browser) return;

		// Deep-link / switch-restore: if ?station=<id> names a real station, scroll
		// to it after the viewports have painted. The scroll is authoritative —
		// activeId follows from the IO when the section crosses the 0.5 threshold.
		const requested = $page.url.searchParams.get('station');
		if (requested && sorted.some((s) => s.id === requested)) {
			void tick().then(() => scrollToStation(requested));
		}

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
	<h1 class="sr-only">{resolveLocale(servicesListingContent.heading, locale)}</h1>

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
		/* transparent so the root layout's single .circuit-grid shows through,
		   matching /projects (the canonical single-grid background). */
		overflow-x: clip;
	}

	.tabs-bar {
		position: sticky;
		top: 5rem;
		z-index: var(--z-rail);
	}

	/* Solid band filling the nav gap above the sticky tabs — same colour as the
	   page background, so service content scrolling up underneath disappears
	   cleanly into it instead of bleeding through (transparent looked broken on
	   scroll). Masks the gap between the floating nav pill and the orange tabs. */
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

	/* Breathing room between stacked service cards on mobile. The cards are
	   ServiceCard roots and direct children of .services-page, so this lives in
	   the parent: a scoped adjacent-sibling rule inside ServiceCard gets pruned
	   (the sibling is a separate component instance). Adjacent-sibling so there's
	   no gap before the first card or before the sticky projects strip. */
	@media (max-width: 767px) {
		.services-page :global(.service-viewport + .service-viewport) {
			margin-top: 2.5rem;
		}
	}
</style>
