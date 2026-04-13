<!--
  Control Room diagram: CSS Grid layout with one row per InfraLayer.
  Desktop: horizontal tier rows with label on left, nodes flowing right.
  Mobile: vertical accordion using CollapsibleSection per layer.
  No GSAP yet — entrance animations added in 10c.
-->
<script lang="ts">
	import type { TechStackItem, InfraLayer, DomainCluster } from '$lib/data/types.js';
	import StackNode from './StackNode.svelte';
	import StackConnections from './StackConnections.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';

	let desktopEl = $state<HTMLElement | null>(null);

	let {
		items,
		selectedId = null,
		activeDomains = [],
		recommendedIds = null,
		onselect,
	}: {
		items: readonly TechStackItem[];
		selectedId?: string | null;
		activeDomains?: readonly DomainCluster[];
		recommendedIds?: Set<string> | null;
		onselect?: (item: TechStackItem | null) => void;
	} = $props();

	// --- Interaction state ---
	let hoveredId = $state<string | null>(null);

	// Active node for highlight calculation: selected takes priority over hovered
	const activeId = $derived(selectedId ?? hoveredId);

	// --- Domain filter layer ---
	// When domains are active, only nodes matching at least one domain are "in filter".
	// null = no filter active (everything visible).
	const filteredIds = $derived.by(() => {
		if (activeDomains.length === 0) return null;
		const ids = new Set<string>();
		for (const item of items) {
			if (item.domains.some((d) => activeDomains.includes(d))) {
				ids.add(item.id);
			}
		}
		return ids;
	});

	// Bridge nodes: items that belong to 2+ of the currently active domains
	const bridgeIds = $derived.by(() => {
		if (activeDomains.length < 2) return null;
		const ids = new Set<string>();
		for (const item of items) {
			const matchCount = item.domains.filter((d) => activeDomains.includes(d)).length;
			if (matchCount >= 2) ids.add(item.id);
		}
		return ids.size > 0 ? ids : null;
	});

	// --- Composed highlight: Build mode → filter layer → hover/select layer ---
	// highlightedIds is used for both node dimming and connection dimming.
	// Priority: Build mode recommendedIds > hover/select > filter.
	const highlightedIds = $derived.by(() => {
		// Build mode: recommended IDs are the highlight set
		if (recommendedIds) {
			// Hover/select within build mode: narrow to node + connected within recommended
			if (activeId && recommendedIds.has(activeId)) {
				const item = items.find((i) => i.id === activeId);
				if (!item) return recommendedIds;

				const ids = new Set<string>([activeId]);
				for (const target of item.connectsTo) {
					if (recommendedIds.has(target)) ids.add(target);
				}
				for (const other of items) {
					if (other.connectsTo.includes(activeId) && recommendedIds.has(other.id)) {
						ids.add(other.id);
					}
				}
				return ids;
			}
			return recommendedIds;
		}

		// No filter and no active node: nothing to dim
		if (!filteredIds && !activeId) return null;

		// Hover/select active: highlight the node + its connections,
		// but ONLY those that are also within the filter (if filter is active)
		if (activeId) {
			const item = items.find((i) => i.id === activeId);
			if (!item) return filteredIds;

			const ids = new Set<string>([activeId]);
			for (const target of item.connectsTo) ids.add(target);
			for (const other of items) {
				if (other.connectsTo.includes(activeId)) ids.add(other.id);
			}

			// Intersect with filter if active
			if (filteredIds) {
				for (const id of ids) {
					if (!filteredIds.has(id) && id !== activeId) ids.delete(id);
				}
			}
			return ids;
		}

		// Filter only (no hover/select): filtered nodes are highlighted
		return filteredIds;
	});

	function handleNodeHover(item: TechStackItem) {
		hoveredId = item.id;
	}

	function handleNodeLeave() {
		hoveredId = null;
	}

	function handleNodeClick(item: TechStackItem) {
		const next = selectedId === item.id ? null : item.id;
		onselect?.(next ? item : null);
	}

	function handleBackdropClick(e: MouseEvent) {
		// Close sidebar when clicking empty diagram space (not a node)
		if ((e.target as HTMLElement).closest('.stack-node')) return;
		if (selectedId) {
			onselect?.(null);
		}
	}

	// Display order: presentation at top, foundation at bottom
	const LAYER_ORDER: InfraLayer[] = [
		'devops', 'testing', 'frontend', 'mobile',
		'api', 'backend', 'analytics', 'data', 'systems',
	];

	const LAYER_LABELS: Record<InfraLayer, string> = {
		devops: 'DEVOPS',
		testing: 'TESTING',
		frontend: 'FRONTEND',
		mobile: 'MOBILE',
		api: 'API',
		backend: 'BACKEND',
		analytics: 'ANALYTICS',
		data: 'DATA',
		systems: 'SYSTEMS',
	};

	// Group items by layer. Layers with no items are excluded.
	const itemsByLayer = $derived(
		LAYER_ORDER
			.map((layer) => ({
				layer,
				label: LAYER_LABELS[layer],
				items: items.filter((item) => item.layer === layer),
			}))
			.filter((group) => group.items.length > 0)
	);

	// Mobile: when filter active, only show matching nodes and hide empty layers entirely.
	const mobileItemsByLayer = $derived.by(() => {
		if (activeDomains.length === 0) return itemsByLayer;
		return itemsByLayer
			.map((group) => ({
				...group,
				items: group.items.filter((item) =>
					item.domains.some((d) => activeDomains.includes(d))
				),
			}))
			.filter((group) => group.items.length > 0);
	});
</script>

<div class="stack-diagram" data-testid="stack-diagram">
	<span class="diagram-label label-section font-semibold">Infrastructure Layers</span>
	<!-- Tier rows: visible on md+ (768px), hidden on mobile -->
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
	<div
		class="diagram-desktop hidden md:block"
		data-testid="diagram-desktop"
		bind:this={desktopEl}
		onclick={handleBackdropClick}
	>
		{#each itemsByLayer as group (group.layer)}
			<div class="tier-row" data-testid="tier-{group.layer}">
				<span class="tier-label">{group.label}</span>
				<div class="tier-nodes">
					{#each group.items as item (item.id)}
						<StackNode
							{item}
							selected={selectedId === item.id}
							hidden={filteredIds !== null && !filteredIds.has(item.id)}
							dimmed={!(filteredIds !== null && !filteredIds.has(item.id)) && highlightedIds !== null && !highlightedIds.has(item.id)}
							bridge={bridgeIds !== null && bridgeIds.has(item.id)}
							onclick={handleNodeClick}
							onmouseenter={handleNodeHover}
							onmouseleave={handleNodeLeave}
						/>
					{/each}
				</div>
			</div>
		{/each}

		<StackConnections {items} containerEl={desktopEl} {highlightedIds} {filteredIds} />
	</div>

	<!-- Mobile (<768px): accordion sections.
	     When filter active: only matching nodes shown, empty layers hidden, auto-expanded. -->
	<div class="md:hidden" data-testid="diagram-mobile">
		{#each mobileItemsByLayer as group (group.layer)}
			<div class="mb-2">
				<CollapsibleSection
					title="{group.label} ({group.items.length})"
					open={activeDomains.length > 0}
				>
					<div class="mobile-tier-nodes">
						{#each group.items as item (item.id)}
							<StackNode
								{item}
								selected={selectedId === item.id}
								dimmed={highlightedIds !== null && !highlightedIds.has(item.id)}
								bridge={bridgeIds !== null && bridgeIds.has(item.id)}
								onclick={handleNodeClick}
							/>
						{/each}
					</div>
				</CollapsibleSection>
			</div>
		{/each}
	</div>
</div>

<style>
	.stack-diagram {
		width: 100%;
	}

	.diagram-label {
		display: block;
		margin-bottom: 0.5rem;
	}

	/* Desktop container — relative for SVG overlay positioning */
	.diagram-desktop {
		position: relative;
	}


	/* Desktop tier rows — z-index above SVG connections */
	.tier-row {
		position: relative;
		z-index: calc(var(--z-content) + 1);
		display: grid;
		grid-template-columns: 5rem 1fr;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 0;
		border-bottom: 1px solid color-mix(in srgb, var(--border) 40%, transparent);
	}

	@media (min-width: 1280px) {
		.tier-row {
			grid-template-columns: 7rem 1fr;
			gap: 1rem;
		}
	}

	.tier-row:last-child {
		border-bottom: none;
	}

	.tier-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 600;
		color: var(--muted-foreground);
		letter-spacing: 0.08em;
		text-align: right;
		padding-right: 1rem;
		user-select: none;
	}

	.tier-nodes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* Mobile tier nodes */
	.mobile-tier-nodes {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
</style>
