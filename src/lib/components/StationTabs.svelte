<!--
  StationTabs — reusable station tab navigation for /services index and detail pages.
  Two modes:
    - 'scroll': tabs are buttons that call onSelect (index page, parent controls scroll)
    - 'navigate': tabs are <a> links to /services/[id] (detail page)
  Tabs sorted by station number. Active tab gets orange bottom border, bold label.
  Inactive tabs fade by distance from active for a depth effect.
-->
<script lang="ts">
	import type { Service } from '$lib/data/types.js';
	import { HazardStripe } from '$lib/components/brand';

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
</script>

<HazardStripe size="sm" />

<nav
	aria-label="Service navigation"
	class="station-tabs flex w-full overflow-x-auto border-b md:justify-center"
	style="background: var(--bg-primary, #141414); border-color: var(--border, #1a1a1a);"
>
	{#each sorted as service, i (service.id)}
		{@const isActive = service.id === activeId}
		{@const opacity = isActive ? 1 : getOpacity(i)}

		{#if mode === 'navigate'}
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
		{:else}
			<button
				type="button"
				class="station-tab flex shrink-0 items-center gap-2 px-4 py-3 text-sm transition-all"
				class:active={isActive}
				style="opacity: {opacity};"
				data-testid="station-tab-{service.id}"
				data-active={isActive ? 'true' : undefined}
				onclick={() => onSelect?.(service.id)}
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
		{/if}
	{/each}
</nav>

<style>
	/* Hide scrollbar but keep scroll functionality on mobile */
	.station-tabs {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.station-tabs::-webkit-scrollbar {
		display: none;
	}

	/* Each tab needs min-width so tabs don't collapse on narrow viewports */
	.station-tab {
		min-width: max-content;
		cursor: pointer;
		border-bottom: 3px solid transparent;
		color: #999;
		background: transparent;
		border-top: none;
		border-left: none;
		border-right: none;
	}

	/* Active tab: orange bottom border, full opacity, brighter text */
	.station-tab.active {
		border-bottom-color: #E07800;
		color: #e5e5e5;
	}

	/* Hover: subtle brightness lift for inactive tabs */
	.station-tab:not(.active):hover {
		color: #ccc;
		border-bottom-color: rgba(224, 120, 0, 0.3);
	}

	/* Brand color for station number when active */
	.text-brand {
		color: #E07800;
	}

	/* JetBrains Mono for station numbers — matches brand mono font */
	.station-num {
		font-family: 'JetBrains Mono', monospace;
	}
</style>
