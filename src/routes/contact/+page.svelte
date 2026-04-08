<!-- /contact route: dual-terminal contact form -->
<script lang="ts">
	import ContactPage from '$lib/components/ContactPage.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>Contact — yesid.</title>
	<meta name="description" content="Get in touch for freelance data engineering, database development, and digital infrastructure consulting." />
</svelte:head>

<ContactPage {form} />
