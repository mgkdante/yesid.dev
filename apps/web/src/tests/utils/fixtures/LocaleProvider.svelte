<script lang="ts">
	import { provideLocale } from '$lib/utils/locale-context';
	import LocaleProbe from './LocaleProbe.svelte';
	import type { Locale } from '$lib/types';
	let { locale = 'en' as Locale }: { locale?: Locale } = $props();
	provideLocale(() => locale);
</script>

<LocaleProbe />
