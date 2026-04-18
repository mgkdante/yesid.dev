<!-- /about route: full-viewport bento dashboard -->
<script lang="ts">
	import AboutPage from '$lib/components/about/AboutPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { aboutPageContent } from '$lib/content/about-page';

	let { data } = $props();

	const metaTitle = resolveLocale(aboutPageContent.meta.title, 'en');
	const metaDescription = resolveLocale(aboutPageContent.meta.description, 'en');
</script>

<svelte:head>
	<title>{metaTitle}</title>
	<meta name="description" content={metaDescription} />
</svelte:head>

<AboutPage weather={data.weather} />
