<script lang="ts">
	import WorkListingPage from '$lib/components/WorkListingPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Work | yesid.</title>
	<meta name="description" content="Projects, pipelines, and systems built by yesid. — freelance SQL development and data infrastructure." />
</svelte:head>

<main class="mx-auto max-w-5xl px-4 md:px-8">
	<WorkListingPage
		projects={data.projects}
		allTags={data.tags}
		serviceIds={data.serviceIds}
		services={data.services}
		serviceSvgContents={data.serviceSvgContents}
	/>
</main>
