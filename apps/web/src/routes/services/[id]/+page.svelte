<!-- /services/[id] detail page: consultative deep dive -->
<!-- SEO meta + title now emitted by <SeoHead> in +layout.svelte (Slice 15a). -->
<script lang="ts">
	import ServiceDetailPage from '$lib/components/services/ServiceDetailPage.svelte';

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
