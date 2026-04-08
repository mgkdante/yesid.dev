<!--
  Control Room diagram: CSS Grid layout with one row per InfraLayer.
  Desktop: horizontal tier rows with label on left, nodes flowing right.
  Mobile: vertical accordion using CollapsibleSection per layer.
  No GSAP yet — entrance animations added in 10c.
-->
<script lang="ts">
	import type { TechStackItem, InfraLayer } from '$lib/data/types.js';
	import StackNode from './StackNode.svelte';
	import StackConnections from './StackConnections.svelte';
	import CollapsibleSection from './CollapsibleSection.svelte';

	let desktopEl = $state<HTMLElement | null>(null);

	let {
		items,
		selectedId = null,
		onselect,
	}: {
		items: readonly TechStackItem[];
		selectedId?: string | null;
		onselect?: (item: TechStackItem | null) => void;
	} = $props();

	// --- Interaction state ---
	let hoveredId = $state<string | null>(null);

	// Active node for highlight calculation: selected takes priority over hovered
	const activeId = $derived(selectedId ?? hoveredId);

	// Set of node IDs that stay fully visible. null = no dimming.
	const highlightedIds = $derived.by(() => {
		if (!activeId) return null;
		const item = items.find((i) => i.id === activeId);
		if (!item) return null;

		const ids = new Set<string>([activeId]);
		for (const target of item.connectsTo) ids.add(target);
		for (const other of items) {
			if (other.connectsTo.includes(activeId)) ids.add(other.id);
		}
		return ids;
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
</script>

<div class="stack-diagram" data-testid="stack-diagram">
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
							dimmed={highlightedIds !== null && !highlightedIds.has(item.id)}
							onclick={handleNodeClick}
							onmouseenter={handleNodeHover}
							onmouseleave={handleNodeLeave}
						/>
					{/each}
				</div>
			</div>
		{/each}

		<StackConnections {items} containerEl={desktopEl} {highlightedIds} />
	</div>

	<!-- Mobile (<768px): accordion sections -->
	<div class="md:hidden" data-testid="diagram-mobile">
		{#each itemsByLayer as group (group.layer)}
			<div class="mb-2">
				<CollapsibleSection
					title="{group.label} ({group.items.length})"
					open={false}
				>
					<div class="mobile-tier-nodes">
						{#each group.items as item (item.id)}
							<StackNode
								{item}
								selected={selectedId === item.id}
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

	/* Desktop container — relative for SVG overlay positioning */
	.diagram-desktop {
		position: relative;
	}


	/* Desktop tier rows — z-index above SVG connections */
	.tier-row {
		position: relative;
		z-index: 2;
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
		font-size: var(--text-xs);
		font-weight: 600;
		color: var(--text-muted);
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
