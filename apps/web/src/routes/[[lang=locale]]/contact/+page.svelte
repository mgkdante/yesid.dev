<!-- /contact route: full-bleed contact page with resizable terminals -->
<!-- SEO meta + title now emitted by <SeoHead> in +layout.svelte (Slice 15a). -->
<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import ContactPage from '$lib/components/contact/ContactPage.svelte';
	import { blueprintPrefillMessage } from '$lib/utils/blueprint-param';

	let { data } = $props();

	// slice-29: ?bp= carries a Tech Stack Engine blueprint. Decoded reactively
	// from the live URL (not the server load) so CDN-cached HTML can't pin a
	// stale blueprint; garbage decodes to null and the field stays empty.
	// Browser-gated: the page prerenders (url.searchParams is unreadable at
	// build); the prefill applies on hydration, same as the CDN-cached case.
	const initialMessage = $derived(
		browser ? blueprintPrefillMessage($page.url.searchParams.get('bp')) : null,
	);
</script>

<ContactPage contactPage={data.contactPage} weather={data.weather} {initialMessage} />
