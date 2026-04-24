<!-- /contact route: full-bleed contact page with resizable terminals -->
<!-- SEO meta + title now emitted by <SeoHead> in +layout.svelte (Slice 15a). -->
<script lang="ts">
	import ContactPage from '$lib/components/contact/ContactPage.svelte';

	let { data } = $props();
</script>

<ContactPage weather={data.weather} />
