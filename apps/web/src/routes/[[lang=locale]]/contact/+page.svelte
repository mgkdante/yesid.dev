<!-- /contact route: full-bleed contact page with resizable terminals -->

<script lang="ts">
	import ContactPage from '#lib/components/contact/ContactPage.svelte';

	let { data } = $props();
</script>

<ContactPage contactPage={data.contactPage} weather={data.weather} />
