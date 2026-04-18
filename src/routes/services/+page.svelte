<!-- /services index page: full-viewport kinetic scroll layout -->
<script lang="ts">
	import ServiceListingPage from '$lib/components/services/ServiceListingPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { servicesPageMeta } from '$lib/content/services';

	let { data } = $props();

	const metaTitle = resolveLocale(servicesPageMeta.title, 'en');
	const metaDescription = resolveLocale(servicesPageMeta.description, 'en');
</script>

<svelte:head>
	<title>{metaTitle}</title>
	<meta name="description" content={metaDescription} />
</svelte:head>

<ServiceListingPage
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
	serviceProjects={data.serviceProjects}
/>
