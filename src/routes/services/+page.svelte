<!-- /services index page: full-viewport kinetic scroll layout -->
<!-- SEO meta + title now emitted by <SeoHead> in +layout.svelte (Slice 15a). -->
<script lang="ts">
	import ServiceListingPage from '$lib/components/services/ServiceListingPage.svelte';

	let { data } = $props();
</script>

<ServiceListingPage
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
	serviceProjects={data.serviceProjects}
/>
