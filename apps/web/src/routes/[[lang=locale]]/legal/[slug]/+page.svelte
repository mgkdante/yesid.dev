<script lang="ts">
	// Legal page (OPS1 launch Phase 1): /legal/[slug] — privacy, cookies,
	// terms, notice, accessibility. Plain prose column rendered through the
	// shared BlockRenderer (same pipeline as blog bodies). Body is per-locale
	// (EN fallback via resolveLocale until the L1 Spanish pass lands es).
	import BlockRenderer from '$lib/components/cms/BlockRenderer.svelte';
	import { getLocale } from '$lib/utils/locale-context';
	import { resolveLocale } from '$lib/utils/locale';

	let { data } = $props();

	const locale = getLocale();
	const title = $derived(resolveLocale(data.legalPage.title, locale));
	const body = $derived(resolveLocale(data.legalPage.body, locale));
</script>

<article class="mx-auto w-full max-w-3xl px-6 py-16 md:py-24" data-testid="page-legal">
	<h1 class="mb-10 font-mono text-3xl font-bold text-[var(--foreground)] md:text-4xl">
		{title}
	</h1>
	<div class="legal-body prose-dark" data-testid="legal-body">
		<BlockRenderer doc={body} />
	</div>
</article>
