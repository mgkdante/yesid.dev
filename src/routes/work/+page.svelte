<script lang="ts">
	import WorkListingPage from '$lib/components/WorkListingPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Work | yesid.</title>
	<meta name="description" content="Projects, pipelines, and systems built by yesid. — freelance SQL development and data infrastructure." />
</svelte:head>

<WorkListingPage
	projects={data.projects}
	allTags={data.tags}
	allStack={data.stackItems}
	serviceIds={data.serviceIds}
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
/>
