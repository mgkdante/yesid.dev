<!--
  Listing filter panel for the /projects page.
  Shows SERVICES section + TAGS section.
  Follows the same layout pattern as BlogFilterSidebar.

  WHY: button groups (services + tags) are now delegated to FilterGroup so the
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

	const filters = siteLabels.projectsChrome.listing.filters;
	const labels = {
		services: filters.services,
		tags: filters.tags,
		stack: filters.techStack,
	};
	const allLabel = resolveLocale({ en: 'All', fr: 'Tous', es: 'Todos' }, locale);
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

	<!-- Tags section — delegated to FilterGroup with deselect enabled -->
	<FilterSection>
		<FilterGroup
			label={resolveLocale(labels.tags, locale)}
			items={tags.map((tag) => ({ key: tag, label: tag }))}
			activeKey={activeTag}
			{allLabel}
			allowDeselect={true}
			collapsible={true}
			startOpen={false}
			persistKey="projects-filter-tags"
			onSelect={(key) => onTagSelect(key)}
			testIdPrefix="tag-filter"
		/>
	</FilterSection>
</aside>
