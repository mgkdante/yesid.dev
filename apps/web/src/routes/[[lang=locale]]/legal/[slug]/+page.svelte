<script lang="ts">
	import '#lib/styles/article-body.css';

	import BlockRenderer from '#lib/components/cms/BlockRenderer.svelte';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';

	let { data } = $props();

	const locale = getLocale();
	const title = $derived(resolveLocale(data.legalPage.title, locale));
	const body = $derived(resolveLocale(data.legalPage.body, locale));
</script>

<article class="reading-detail mx-auto w-full max-w-3xl px-6 py-16 md:py-24" data-testid="page-legal">
	<h1 class="mb-10 font-mono text-3xl font-bold text-[var(--foreground)] md:text-4xl">
		{title}
	</h1>
	<div class="article-body legal-body prose-dark" data-testid="legal-body">
		<BlockRenderer doc={body} />
	</div>
</article>
