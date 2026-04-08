<!-- /tech-stack route: "The Control Room" interactive diagram -->
<script lang="ts">
	import type { TechStackItem } from '$lib/data/types.js';
	import { getTechItemById, getAllTechItems } from '$lib/data/tech-stack.js';
	import StackDiagram from '$lib/components/StackDiagram.svelte';
	import StackPanel from '$lib/components/StackPanel.svelte';
	import StackBottomSheet from '$lib/components/StackBottomSheet.svelte';

	let { data } = $props();

	let selectedItem = $state<TechStackItem | null>(null);
	let selectedId = $state<string | null>(null);

	// Dynamic counts for the orientation card
	const itemCount = data.items.length;
	const layerCount = new Set(data.items.map((i) => i.layer)).size;

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

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && selectedItem) {
			e.preventDefault();
			handleClose();
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
	<!-- Desktop (xl: 1280px+): diagram + persistent panel side by side -->
	<div class="desktop-layout">
		<div class="diagram-area">
			<StackDiagram items={data.items} {selectedId} onselect={handleSelect} />
		</div>
		<aside class="panel-area" data-testid="desktop-panel">
			<StackPanel
				item={selectedItem}
				{itemCount}
				{layerCount}
				onclose={selectedItem ? handleClose : undefined}
				onnavigate={handlePanelNavigate}
			/>
		</aside>
	</div>

	<!-- Tablet (md: 768–1279px): diagram only + overlay panel on click -->
	<div class="tablet-layout">
		<StackDiagram items={data.items} {selectedId} onselect={handleSelect} />

		{#if selectedItem}
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<div class="tablet-overlay-backdrop" onclick={handleClose} data-testid="tablet-backdrop"></div>
			<aside class="tablet-overlay-panel" data-testid="tablet-panel">
				{#key selectedItem.id}
					<StackPanel
						item={selectedItem}
						{itemCount}
						{layerCount}
						onclose={handleClose}
						onnavigate={handlePanelNavigate}
					/>
				{/key}
			</aside>
		{/if}
	</div>

	<!-- Mobile (<768px): accordion + bottom sheet -->
	<div class="mobile-layout">
		<StackDiagram items={data.items} {selectedId} onselect={handleSelect} />

		{#if selectedItem}
			<StackBottomSheet
				item={selectedItem}
				items={data.items}
				onclose={handleClose}
				onnavigate={handleSelect}
			/>
		{/if}
	</div>
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
</style>
