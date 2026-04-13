<!--
  Desktop sidebar for the /work listing page.
  Shows SERVICES section + TAGS section, sticky.
  Hidden on mobile — WorkFilterMobile handles that viewport.
  Follows the same layout pattern as BlogFilterSidebar.

  WHY: button groups (services + tags) are now delegated to FilterGroup so the
  active/tag-active styles and deselect logic live in one place.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/data/locale.js';
	import FilterGroup from './FilterGroup.svelte';

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
		onStackSelect
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
	} = $props();

	const labels = {
		services: { en: 'Services' },
		tags: { en: 'Tags' },
		stack: { en: 'Tech Stack' }
	};
</script>

<aside class="w-[220px] shrink-0 max-h-[calc(100vh-6rem)] overflow-y-auto" data-testid="work-filter-sidebar">
	<!-- Services section — delegated to FilterGroup with deselect enabled -->
	<div class="mb-5">
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
		<div class="divider-dashed pt-3 mb-5">
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
	<div class="divider-dashed pt-3">
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
