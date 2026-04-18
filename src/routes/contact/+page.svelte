<!-- /contact route: full-bleed contact page with resizable terminals -->
<script lang="ts">
	import ContactPage from '$lib/components/contact/ContactPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { contactContent } from '$lib/content/contact-page';

	let { data } = $props();

	const metaTitle = resolveLocale(contactContent.meta.title, 'en');
	const metaDescription = resolveLocale(contactContent.meta.description, 'en');
</script>

<svelte:head>
	<title>{metaTitle}</title>
	<meta name="description" content={metaDescription} />
</svelte:head>

<ContactPage weather={data.weather} />
