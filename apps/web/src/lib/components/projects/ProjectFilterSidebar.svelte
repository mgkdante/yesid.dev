<!--
  Listing filter panel for the /projects page.
  Shows SERVICES section + TECH STACK section.
  Follows the same layout pattern as BlogFilterSidebar.

  WHY: button groups (services + stack) are now delegated to FilterGroup so the
  active/tag-active styles and deselect logic live in one place.
-->
<script lang="ts">
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';

	const locale = getLocale();
	import { FilterGroup, FilterSection } from '@yesid/ui/brand';
	import { siteLabels } from '#lib/content/index.ts';

	let {
		serviceIds,
		serviceMap,
		stack = [],
		activeService = null,
		activeStack = null,
		onServiceSelect,
		onStackSelect
	}: {
		serviceIds: readonly string[];
		serviceMap: Map<string, string>;
		stack?: readonly string[];
		activeService: string | null;
		activeStack?: string | null;
		onServiceSelect: (serviceId: string | null) => void;
		onStackSelect?: (stack: string | null) => void;
	} = $props();

	const filters = siteLabels.projectsChrome.listing.filters;
	const labels = {
		services: filters.services,
		stack: filters.techStack,
	};
	const allLabel = resolveLocale(filters.allLabel, locale);
</script>

<aside data-testid="project-filter-sidebar">
	<!-- Services section — delegated to FilterGroup with deselect enabled -->
	<FilterSection>
		<FilterGroup
			label={resolveLocale(labels.services, locale)}
			items={serviceIds.map((id) => ({ key: id, label: serviceMap.get(id) ?? id }))}
			activeKey={activeService}
			{allLabel}
			allowDeselect={true}
			collapsible={true}
			persistKey="projects-filter-services"
			onSelect={(key) => onServiceSelect(key)}
			testIdPrefix="service-filter"
		/>
	</FilterSection>

	<!-- Tech Stack section -->
	{#if stack.length > 0 && onStackSelect}
		<FilterSection>
			<FilterGroup
				label={resolveLocale(labels.stack, locale)}
				items={stack.map((s) => ({ key: s, label: s }))}
				activeKey={activeStack}
				{allLabel}
				allowDeselect={true}
				collapsible={true}
				startOpen={false}
				persistKey="projects-filter-stack"
				onSelect={(key) => onStackSelect(key)}
				testIdPrefix="stack-filter"
			/>
		</FilterSection>
	{/if}
</aside>
