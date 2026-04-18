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
	import { servicesDetailContent } from '$lib/content/services';
	import { Separator } from '$lib/components/ui/separator';
	import * as Tabs from '$lib/components/ui/tabs';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { onMount, onDestroy } from 'svelte';

	const serviceNavAria = resolveLocale(servicesDetailContent.serviceNavAria, 'en');

	// Short labels map — first word or simple abbreviation for compact tab display.
	// Keyed by service ID so adding a new service only requires one new entry here.
	const SHORT_LABELS: Record<string, string> = {
		'sql-development': 'SQL Dev',
		'data-pipeline': 'Pipeline',
		'analytics-reporting': 'Analytics',
		'database-engineering': 'DB Eng.',
		'internal-tooling': 'Tooling',
		'web-development': 'Web Dev'
	};

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

	/** Get short label for a service — falls back to first word of the title */
	function getLabel(service: Service): string {
		return SHORT_LABELS[service.id] ?? service.title.en.split(' ')[0];
	}

	/** Inactive tabs fade by distance from active: closer tabs stay brighter */
	function getOpacity(index: number): number {
		if (activeIndex === -1) return 1;
		const distance = Math.abs(index - activeIndex);
		return Math.max(0.35, 1 - distance * 0.15);
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
	let tabsListScrollChain: { destroy(): void } | undefined;

	onMount(() => {
		if (tabsListRef) {
			tabsListScrollChain = scrollChain(tabsListRef);
		}
	});

	onDestroy(() => {
		tabsListScrollChain?.destroy();
	});
</script>

<Separator variant="hazard" hazardSize="sm" />

{#if mode === 'navigate'}
	<!-- Navigate mode: plain nav + links (links can't be Tabs triggers) -->
	<nav
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
				href="/services/{service.id}"
				class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm no-underline transition-all"

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
			class="station-tabs flex w-full overflow-x-auto justify-start xl:justify-center {swipeActive ? 'swipe-lock' : ''}"
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
							class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-all"
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
		padding: 0.875rem 1.25rem;
		font-family: var(--font-mono);
		font-size: var(--text-small);
		transition: opacity var(--duration-fast) var(--ease-default);
	}

	/* Active tab: dark bottom border, bold text */
	.station-tab.active {
		border-bottom-color: var(--background);
		color: var(--background);
		font-weight: 800;
	}

	/* Hover: opacity fade for inactive tabs */
	.station-tab:not(.active):hover {
		opacity: 0.7;
	}

	/* Station number inherits dark text on orange */
	.text-brand {
		color: var(--background);
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
</style>
