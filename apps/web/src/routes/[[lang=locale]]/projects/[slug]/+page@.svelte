<!--
  Project detail page — /projects/[slug]
  Renders the ProjectDetailPage component with data from the loader.
-->
<script lang="ts">
	import ProjectDetailPage from '$lib/components/projects/ProjectDetailPage.svelte';

	let { data } = $props();
</script>

<ProjectDetailPage
	project={data.project}
	services={data.services}
	serviceSvgContents={data.serviceSvgContents}
	readmeHtml={data.readmeHtml}
	codeHighlights={data.codeHighlights}
/>
