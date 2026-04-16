<!--
  Desktop sidebar for the /work listing page.
  Shows SERVICES section + TAGS section, sticky.
  Hidden on mobile — ProjectFilterMobile handles that viewport.
  Follows the same layout pattern as BlogFilterSidebar.

  WHY: button groups (services + tags) are now delegated to FilterGroup so the
  active/tag-active styles and deselect logic live in one place.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/data/locale.js';
	import FilterGroup from '$lib/components/shared/FilterGroup.svelte';

	let {
		serviceIds,
		serviceMap,
		tags,
		stack = [],
		activeService = null,
		activeTag = null,
		activeStack = null,
		onServiceSelect,
		onTagSelect,
		onStackSelect,
		searchQuery = $bindable('')
	}: {
		serviceIds: readonly string[];
		serviceMap: Map<string, string>;
		tags: readonly string[];
		stack?: readonly string[];
		activeService: string | null;
		activeTag: string | null;
		activeStack?: string | null;
		onServiceSelect: (serviceId: string | null) => void;
		onTagSelect: (tag: string | null) => void;
		onStackSelect?: (stack: string | null) => void;
		searchQuery?: string;
	} = $props();

	const labels = {
		services: { en: 'Services' },
		tags: { en: 'Tags' },
		stack: { en: 'Tech Stack' }
	};
</script>

<aside data-testid="project-filter-sidebar">
	<!-- Search -->
	<div class="pt-3 mb-6 pb-5 divider-dashed">
		<div class="relative">
			<input
				type="text"
				placeholder="Search projects..."
				bind:value={searchQuery}
				class="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] px-3 py-2 pl-9 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--primary)]"
				data-testid="project-search-sidebar"
			/>
			<svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="7" cy="7" r="5"/>
				<line x1="11" y1="11" x2="14" y2="14"/>
			</svg>
		</div>
	</div>

	<!-- Services section — delegated to FilterGroup with deselect enabled -->
	<div class="mt-5 divider-dashed pt-3">
		<FilterGroup
			label={resolveLocale(labels.services, 'en')}
			items={serviceIds.map((id) => ({ key: id, label: serviceMap.get(id) ?? id }))}
			activeKey={activeService}
			allowDeselect={true}
			collapsible={true}
			onSelect={(key) => onServiceSelect(key)}
			testIdPrefix="service-filter"
		/>
	</div>

	<!-- Tech Stack section -->
	{#if stack.length > 0 && onStackSelect}
		<div class="mt-5 divider-dashed pt-3">
			<FilterGroup
				label={resolveLocale(labels.stack, 'en')}
				items={stack.map((s) => ({ key: s, label: s }))}
				activeKey={activeStack}
				allowDeselect={true}
				collapsible={true}
				startOpen={false}
				onSelect={(key) => onStackSelect(key)}
				testIdPrefix="stack-filter"
			/>
		</div>
	{/if}

	<!-- Tags section — delegated to FilterGroup with deselect enabled -->
	<div class="mt-5 divider-dashed pt-3">
		<FilterGroup
			label={resolveLocale(labels.tags, 'en')}
			items={tags.map((tag) => ({ key: tag, label: tag }))}
			activeKey={activeTag}
			allowDeselect={true}
			collapsible={true}
			startOpen={false}
			onSelect={(key) => onTagSelect(key)}
			testIdPrefix="tag-filter"
		/>
	</div>
</aside>
