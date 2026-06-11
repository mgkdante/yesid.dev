<!-- /contact route: full-bleed contact page with resizable terminals -->
<!-- SEO meta + title now emitted by <SeoHead> in +layout.svelte (Slice 15a). -->
<script lang="ts">
	import { page } from '$app/stores';
	import ContactPage from '$lib/components/contact/ContactPage.svelte';
	import { blueprintPrefillMessage } from '$lib/utils/blueprint-param';

	let { data } = $props();

	// slice-29: ?bp= carries a Tech Stack Engine blueprint. Decoded reactively
	// from the live URL (not the server load) so CDN-cached HTML can't pin a
	// stale blueprint; garbage decodes to null and the field stays empty.
	const initialMessage = $derived(blueprintPrefillMessage($page.url.searchParams.get('bp')));
</script>

<ContactPage contactPage={data.contactPage} weather={data.weather} {initialMessage} />
