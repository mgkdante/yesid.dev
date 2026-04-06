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
		activeService = null,
		activeTag = null,
		onServiceSelect,
		onTagSelect
	}: {
		serviceIds: readonly string[];
		serviceMap: Map<string, string>;
		tags: readonly string[];
		activeService: string | null;
		activeTag: string | null;
		onServiceSelect: (serviceId: string | null) => void;
		onTagSelect: (tag: string | null) => void;
	} = $props();

	// WHY: all user-facing labels go through resolveLocale so the sidebar is ready
	// for future i18n without changing component logic.
	const labels = {
		services: { en: 'Services' },
		tags: { en: 'Tags' }
	};
</script>

<aside class="w-[220px] shrink-0" data-testid="work-filter-sidebar">
	<!-- Services section — delegated to FilterGroup with deselect enabled -->
	<div class="mb-5">
		<FilterGroup
			label={resolveLocale(labels.services, 'en')}
			items={serviceIds.map((id) => ({ key: id, label: serviceMap.get(id) ?? id }))}
			activeKey={activeService}
			allowDeselect={true}
			onSelect={(key) => onServiceSelect(key)}
			testIdPrefix="service-filter"
		/>
	</div>

	<!-- Tags section — delegated to FilterGroup with deselect enabled -->
	<div class="border-t border-dashed border-[#333] pt-3">
		<FilterGroup
			label={resolveLocale(labels.tags, 'en')}
			items={tags.map((tag) => ({ key: tag, label: tag }))}
			activeKey={activeTag}
			allowDeselect={true}
			onSelect={(key) => onTagSelect(key)}
			testIdPrefix="tag-filter"
		/>
	</div>
</aside>
