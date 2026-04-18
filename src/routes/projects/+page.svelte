<script lang="ts">
	import ProjectListingPage from '$lib/components/projects/ProjectListingPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { projectsPageMeta } from '$lib/content/projects';

	let { data } = $props();

	const metaTitle = resolveLocale(projectsPageMeta.title, 'en');
	const metaDescription = resolveLocale(projectsPageMeta.description, 'en');
</script>

<svelte:head>
	<title>{metaTitle}</title>
	<meta name="description" content={metaDescription} />
</svelte:head>

<ProjectListingPage
	projects={data.projects}
	allTags={data.tags}
	allStack={data.stackItems}
	serviceIds={data.serviceIds}
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
/>
