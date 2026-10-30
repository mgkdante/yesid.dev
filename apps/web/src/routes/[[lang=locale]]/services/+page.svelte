<!-- /services index page: full-viewport kinetic scroll layout -->

<script lang="ts">
	import ServiceListingPage from '#lib/components/services/ServiceListingPage.svelte';

	let { data } = $props();
</script>

<ServiceListingPage
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
/>
