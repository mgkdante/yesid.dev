<script lang="ts">
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import ListingShell from '#lib/components/shared/ListingShell.svelte';

	let { children } = $props();

	// Remounts per pathname under the root layout's {#key} — init-read is correct.
	const locale = getLocale();

	// go2-t1c2: edge title from site_labels, previous literal as fallback.
	const edgeTitle = resolveLocale(siteLabels.pages.projectsEdgeTitle, locale);
</script>

<ListingShell {edgeTitle} {children} />
