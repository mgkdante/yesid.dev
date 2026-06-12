<!-- SEO meta + title now emitted by <SeoHead> in +layout.svelte (Slice 15a). -->
<script lang="ts">
	import ProjectListingPage from '$lib/components/projects/ProjectListingPage.svelte';

	let { data } = $props();
</script>

<ProjectListingPage
	projects={data.projects}
	allTags={data.tags}
	allStack={data.stackItems}
	serviceIds={data.serviceIds}
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
	projectsPage={data.projectsPage}
/>
