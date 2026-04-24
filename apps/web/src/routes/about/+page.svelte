<!-- /about route: full-viewport bento dashboard -->
<!-- SEO meta + title now emitted by <SeoHead> in +layout.svelte (Slice 15a). -->
<script lang="ts">
	import AboutPage from '$lib/components/about/AboutPage.svelte';

	let { data } = $props();
</script>

<AboutPage weather={data.weather} />
