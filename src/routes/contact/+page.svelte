<!-- /contact route: full-bleed contact page with resizable terminals -->
<script lang="ts">
	import ContactPage from '$lib/components/contact/ContactPage.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Contact — yesid.</title>
	<meta name="description" content="Get in touch for freelance data engineering, database development, and digital infrastructure consulting." />
</svelte:head>

<ContactPage weather={data.weather} />
