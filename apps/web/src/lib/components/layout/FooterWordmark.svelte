<script lang="ts">
	import { onMount } from 'svelte';
	import { wordmarkHover } from '#lib/motion/actions/index.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';
	import type { Locale } from '#lib/types.ts';

	let { locale }: { locale: Locale } = $props();

	let wordmarkEl: HTMLSpanElement;
	let dotEl: HTMLSpanElement;

	onMount(() => {
		const action = wordmarkHover(wordmarkEl, { dotEl });
		return () => action.destroy();
	});
</script>

<a
	href={localizeHref('/', locale)}
	data-testid="footer-wordmark"
	class="inline-flex items-baseline font-heading text-2xl font-bold text-[var(--foreground)]"
>
	<span bind:this={wordmarkEl}>yesid</span><span bind:this={dotEl} class="text-primary">.</span>
</a>
