<!-- /services/[id] detail page: consultative deep dive -->
<script lang="ts">
	import ServiceDetailPage from '$lib/components/services/ServiceDetailPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';

	let { data } = $props();
</script>

<svelte:head>
	<title>{resolveLocale(data.service.title, 'en')} — yesid.</title>
	<meta name="description" content={resolveLocale(data.service.description, 'en')} />
</svelte:head>

<ServiceDetailPage
	service={data.service}
	services={data.services}
	prev={data.prev}
	next={data.next}
	relatedProjects={data.relatedProjects}
	serviceSvgContents={data.serviceSvgContents}
/>
