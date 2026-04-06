<!-- /services index page: full-viewport kinetic scroll layout -->
<script lang="ts">
	import ServiceListingPage from '$lib/components/ServiceListingPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Services — yesid.</title>
	<meta name="description" content="Data infrastructure, tools, and systems. SQL development, data pipelines, analytics, database engineering, internal tooling, and web development." />
</svelte:head>

<ServiceListingPage
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
	serviceProjects={data.serviceProjects}
/>
