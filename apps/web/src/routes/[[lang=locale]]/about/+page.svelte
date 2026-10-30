<!-- /about route: full-viewport bento dashboard -->

<script lang="ts">
	import AboutPage from '#lib/components/about/AboutPage.svelte';

	let { data } = $props();
</script>

<AboutPage aboutPage={data.aboutPage} weather={data.weather} />
