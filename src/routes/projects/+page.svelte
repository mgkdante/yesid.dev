<script lang="ts">
	import ProjectListingPage from '$lib/components/projects/ProjectListingPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Projects | yesid.</title>
	<meta name="description" content="Projects, pipelines, and systems built by yesid. — freelance SQL development and digital infrastructure." />
</svelte:head>

<ProjectListingPage
	projects={data.projects}
	allTags={data.tags}
	allStack={data.stackItems}
	serviceIds={data.serviceIds}
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
/>
