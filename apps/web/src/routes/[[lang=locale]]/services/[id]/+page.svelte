<!-- /services/[id] detail page: consultative deep dive -->

<script lang="ts">
	import ServiceDetailPage from '#lib/components/services/ServiceDetailPage.svelte';

	let { data } = $props();
</script>

<ServiceDetailPage
	service={data.service}
	services={data.services}
	prev={data.prev}
	next={data.next}
	relatedProjects={data.relatedProjects}
	serviceSvgContents={data.serviceSvgContents}
/>
