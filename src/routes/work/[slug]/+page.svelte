<!--
  Work project detail page — /work/[slug]
  Renders the WorkDetailPage component with data from the loader.
-->
<script lang="ts">
	import WorkDetailPage from '$lib/components/WorkDetailPage.svelte';

	let { data } = $props();
</script>

<WorkDetailPage
	project={data.project}
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
	readmeHtml={data.readmeHtml}
/>
