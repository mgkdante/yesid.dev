<!--
  StationTabs — reusable station tab navigation for /services index and detail pages.
  Two modes:
    - 'scroll': tabs are buttons that call onSelect (index page, parent controls scroll)
      → wired to ui/tabs (bits-ui) for arrow-key nav, ARIA roles, focus management
    - 'navigate': tabs are <a> links to /services/[id] (detail page)
      → kept as plain nav+links (links can't be Tab triggers)
  Tabs sorted by station number. Solid orange bg, dark text.
  Active tab gets dark bottom border, bold label. Inactive tabs fade by distance.
-->
<script lang="ts">
	import type { Service } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { siteLabels } from '$lib/content';
	import HazardSeparator from '$lib/components/shared/HazardSeparator.svelte';
	import * as Tabs from '@yesid/ui/tabs';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { onMount, onDestroy } from 'svelte';

	// StationTabs lives inside remounting pages ({#key pathname} in the root
	// layout) — an init-time context read is always current.
	const locale = getLocale();
	const serviceNavAria = resolveLocale(siteLabels.servicesChrome.detail.serviceNavAria, locale);

	let {
		services,
		activeId,
		mode = 'scroll',
		onSelect
	}: {
		services: readonly Service[];
		activeId: string;
		mode?: 'scroll' | 'navigate';
		onSelect?: (id: string) => void;
	} = $props();

	// Sort services by station number so tab order always matches the journey sequence
	let sorted = $derived([...services].sort((a, b) => a.station - b.station));

	// Index of the active tab in the sorted array, used to calculate distance-based opacity
	let activeIndex = $derived(sorted.findIndex((s) => s.id === activeId));

	/** Pad station number to 2 digits (1 → "01", 12 → "12") */
	function padStation(n: number): string {
		return String(n).padStart(2, '0');
	}

	// Compact tab labels are CMS truth (siteLabels.servicesChrome.listing
	// .stationShortLabels), keyed by service id. EN values ("Databases",
	// "Pipelines", "Dashboards", "Websites") match the old hardcoded EN labels,
	// so EN output is byte-identical; /fr now renders the French CMS value
	// instead of an English literal.
	const stationShortLabels = siteLabels.servicesChrome.listing.stationShortLabels;

	/** Compact tab label from the CMS short-label map, keyed by service id.
	 *  Falls back to the locale-resolved full service title only when a service
	 *  id is missing from the map. */
	function getLabel(service: Service): string {
		const short = stationShortLabels[service.id as keyof typeof stationShortLabels];
		if (short) return resolveLocale(short, locale);
		return resolveLocale(service.title, locale);
	}

	/** Inactive tabs fade by distance from active: closer tabs stay brighter.
	 *  GO-W2.2: floor raised 0.35 → 0.8 — #141414-on-orange at 0.35 computed
	 *  to 1.87:1. At 0.8 the worst tab is ≥4.8:1 in both themes. */
	function getOpacity(index: number): number {
		if (activeIndex === -1) return 1;
		const distance = Math.abs(index - activeIndex);
		return Math.max(0.8, 1 - distance * 0.15);
	}

	// Swipe guard — disables pointer-events on tabs during swipe so no click fires.
	// pointer-events: none is bulletproof regardless of event ordering.
	let swipeActive = $state(false);
	let touchStartX = 0;

	function onTouchStart(e: TouchEvent) {
		touchStartX = e.touches[0].clientX;
		swipeActive = false;
	}

	function onTouchMove(e: TouchEvent) {
		if (!swipeActive && Math.abs(e.touches[0].clientX - touchStartX) > 8) {
			swipeActive = true;
		}
	}

	function onTouchEnd() {
		if (swipeActive) {
			// Delay reset so the post-touch click event is still blocked
			setTimeout(() => { swipeActive = false; }, 300);
		}
	}

	// scrollChain for Tabs.List (bits-ui component — can't use use: directly on components)
	let tabsListRef = $state<HTMLElement | null>(null);
	// Navigate-mode container (plain <nav>) — paired with tabsListRef so the
	// active-tab auto-centering below works in both modes.
	let navRef = $state<HTMLElement | null>(null);
	let tabsListScrollChain: { destroy(): void } | undefined;

	// Keep the active tab centred in the horizontal strip whenever it changes:
	// on the listing page activeId follows the scroll, so the stripe tracks the
	// service you're reading; on the detail page it centres the current service
	// on mount. Scrolls ONLY the tab container (never the window).
	$effect(() => {
		const container = tabsListRef ?? navRef;
		if (!container || !activeId) return;
		const activeEl = container.querySelector<HTMLElement>(
			`[data-testid="station-tab-${activeId}"]`,
		);
		if (!activeEl) return;
		const cRect = container.getBoundingClientRect();
		const aRect = activeEl.getBoundingClientRect();
		const delta = aRect.left - cRect.left - (container.clientWidth - activeEl.clientWidth) / 2;
		if (Math.abs(delta) < 1) return;
		const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		container.scrollTo({ left: container.scrollLeft + delta, behavior: reduce ? 'auto' : 'smooth' });
	});

	onMount(() => {
		if (tabsListRef) {
			tabsListScrollChain = scrollChain(tabsListRef);
		}
	});

	onDestroy(() => {
		tabsListScrollChain?.destroy();
	});
</script>

<HazardSeparator hazardSize="sm" />

{#if mode === 'navigate'}
	<!-- Navigate mode: plain nav + links (links can't be Tabs triggers) -->
	<!-- Wrapper provides position:relative anchor for the scroll-cue gradient overlay -->
	<div class="station-tabs-wrapper">
		<nav
			bind:this={navRef}
			aria-label={serviceNavAria}
			class="station-tabs flex w-full overflow-x-auto justify-start xl:justify-center"
			class:swipe-lock={swipeActive}
			style="background: var(--primary); border: none;"
			use:scrollChain
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
		>
			{#each sorted as service, i (service.id)}
				{@const isActive = service.id === activeId}
				{@const opacity = isActive ? 1 : getOpacity(i)}

				<a
					href={localizeHref(`/services/${service.id}`, locale)}
					class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm no-underline transition-all tap-press"

					class:active={isActive}
					style="opacity: {opacity};"
					data-testid="station-tab-{service.id}"
					data-active={isActive ? 'true' : undefined}
				>
					<span
						class="station-num font-mono text-xs"
						class:text-brand={isActive}
					>
						{padStation(service.station)}
					</span>
					<span
						class="station-label text-sm"
						class:font-bold={isActive}
					>
						{getLabel(service)}
					</span>
				</a>
			{/each}
		</nav>
		<!-- Scroll-cue: gradient fade on the right edge signals more tabs exist.
		     Hidden at xl where all tabs are visible (justify-center). -->
		<div class="scroll-cue" aria-hidden="true"></div>
	</div>
{:else}
	<!-- Scroll mode: bits-ui Tabs for a11y (arrow keys, ARIA roles, focus management) -->
	<Tabs.Root
		value={activeId}
		onValueChange={(v) => onSelect?.(v)}
		class="station-tabs-root"
	>
		<Tabs.List
			bind:ref={tabsListRef}
			variant="line"
				class="station-tabs flex h-8 w-full overflow-x-auto p-[3px] justify-start xl:justify-center {swipeActive ? 'swipe-lock' : ''}"
			style="background: var(--primary); border: none;"
			ontouchstart={onTouchStart}
			ontouchmove={onTouchMove}
			ontouchend={onTouchEnd}
		>
			{#each sorted as service, i (service.id)}
				{@const isActive = service.id === activeId}
				{@const opacity = isActive ? 1 : getOpacity(i)}

				<Tabs.Trigger value={service.id}>
					{#snippet child({ props })}
						<button
							{...props}
							class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-all tap-press"
							class:active={isActive}
							style="opacity: {opacity};"
							data-testid="station-tab-{service.id}"
							data-active={isActive ? 'true' : undefined}
						>
							<span
								class="station-num font-mono text-xs"
								class:text-brand={isActive}
							>
								{padStation(service.station)}
							</span>
							<span
								class="station-label text-sm"
								class:font-bold={isActive}
							>
								{getLabel(service)}
							</span>
						</button>
					{/snippet}
				</Tabs.Trigger>
			{/each}
		</Tabs.List>
	</Tabs.Root>
{/if}

<style>
	/* Tabs.Root adds gap-2 + flex-col by default; flatten for our horizontal layout */
	:global([data-slot="tabs"].station-tabs-root) {
		gap: 0;
	}

	/* Each tab needs min-width so tabs don't collapse on narrow viewports */
	.station-tab {
		min-width: max-content;
		cursor: pointer;
		border-bottom: 3px solid transparent;
		color: var(--background);
		background: transparent;
		border-top: none;
		border-left: none;
		border-right: none;
		padding: 1rem 1.25rem;
		font-family: var(--font-mono);
		font-size: var(--text-small);
		transition: opacity var(--duration-fast) var(--ease-default);
	}

	/* Active tab — GO2-W5: backlit station sign (theme-invariant signage chip,
	   10.06:1 both modes; real signs don't reskin when the lights change). */
	.station-tab.active {
		background: var(--signage-bg);
		border-bottom-color: var(--signage-text);
		color: var(--signage-text);
		font-weight: 800;
	}

	/* Hover: opacity fade for inactive tabs */
	.station-tab:not(.active):hover {
		opacity: 0.7;
	}

	/* Station number inherits dark text on orange; signage amber when active */
	.text-brand {
		color: var(--signage-text);
	}

	/* JetBrains Mono for station numbers — matches brand mono font */
	.station-num {
		font-family: var(--font-mono);
	}

	/* Swipe guard: disable all pointer events on tabs during horizontal swipe.
	   Prevents click/pointerdown from firing on buttons or links mid-swipe. */
	.swipe-lock .station-tab {
		pointer-events: none;
	}

	/* ── Navigate-mode scroll-cue ── */

	/* Wrapper anchors the absolute overlay */
	.station-tabs-wrapper {
		position: relative;
	}

	/* Right-edge gradient fade: transparent → orange (--primary), signals "scroll right".
	   pointer-events: none so it never blocks tab clicks. Hidden at xl (all tabs fit). */
	.scroll-cue {
		position: absolute;
		top: 0;
		right: 0;
		bottom: 0;
		width: 3rem;
		/* End-stop MUST match the .station-tabs nav background (both var(--primary)),
		   so the cue fades tab content into the strip. Update both together if either changes. */
		background: linear-gradient(to right, transparent, var(--primary));
		pointer-events: none;
	}

	@media (min-width: 1280px) {
		.scroll-cue {
			display: none;
		}
	}
</style>
