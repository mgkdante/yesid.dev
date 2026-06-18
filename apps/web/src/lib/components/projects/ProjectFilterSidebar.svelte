<!--
  Listing filter panel for the /projects page.
  Shows SERVICES section + TAGS section.
  Follows the same layout pattern as BlogFilterSidebar.

  WHY: button groups (services + tags) are now delegated to FilterGroup so the
  active/tag-active styles and deselect logic live in one place.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import FilterGroup from '$lib/components/shared/FilterGroup.svelte';
	import { siteLabels } from '$lib/content';

	let {
		serviceIds,
		serviceMap,
		tags,
		stack = [],
		activeService = null,
		activeTag = null,
		activeStack = null,
		showSearch = true,
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
		showSearch?: boolean;
		onServiceSelect: (serviceId: string | null) => void;
		onTagSelect: (tag: string | null) => void;
		onStackSelect?: (stack: string | null) => void;
		searchQuery?: string;
	} = $props();

	// Labels pulled from content layer (Task 17b-7d).
	const filters = siteLabels.projectsChrome.listing.filters;
	const labels = {
		services: filters.services,
		tags: filters.tags,
		stack: filters.techStack,
	};
	const searchPlaceholder = resolveLocale(siteLabels.projectsChrome.listing.searchPlaceholder, locale);
</script>

<aside data-testid="project-filter-sidebar">
	<!-- Search -->
	{#if showSearch}
		<div class="pt-3 mb-6 pb-5 divider-dashed">
			<div class="relative">
				<input
					type="text"
					placeholder={searchPlaceholder}
					bind:value={searchQuery}
					class="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-3 min-h-11 pl-9 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--primary)]"
					data-testid="project-search-sidebar"
				/>
				<svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
					<circle cx="7" cy="7" r="5"/>
					<line x1="11" y1="11" x2="14" y2="14"/>
				</svg>
			</div>
		</div>
	{/if}

	<!-- Services section — delegated to FilterGroup with deselect enabled -->
	<div class="mt-5 divider-dashed pt-3">
		<FilterGroup
			label={resolveLocale(labels.services, locale)}
			items={serviceIds.map((id) => ({ key: id, label: serviceMap.get(id) ?? id }))}
			activeKey={activeService}
			allowDeselect={true}
			collapsible={true}
			persistKey="projects-filter-services"
			onSelect={(key) => onServiceSelect(key)}
			testIdPrefix="service-filter"
		/>
	</div>

	<!-- Tech Stack section -->
	{#if stack.length > 0 && onStackSelect}
		<div class="mt-5 divider-dashed pt-3">
			<FilterGroup
				label={resolveLocale(labels.stack, locale)}
				items={stack.map((s) => ({ key: s, label: s }))}
				activeKey={activeStack}
				allowDeselect={true}
				collapsible={true}
				startOpen={false}
				persistKey="projects-filter-stack"
				onSelect={(key) => onStackSelect(key)}
				testIdPrefix="stack-filter"
			/>
		</div>
	{/if}

	<!-- Tags section — delegated to FilterGroup with deselect enabled -->
	<div class="mt-5 divider-dashed pt-3">
		<FilterGroup
			label={resolveLocale(labels.tags, locale)}
			items={tags.map((tag) => ({ key: tag, label: tag }))}
			activeKey={activeTag}
			allowDeselect={true}
			collapsible={true}
			startOpen={false}
			persistKey="projects-filter-tags"
			onSelect={(key) => onTagSelect(key)}
			testIdPrefix="tag-filter"
		/>
	</div>
</aside>
