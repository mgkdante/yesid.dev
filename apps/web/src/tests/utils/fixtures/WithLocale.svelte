<script lang="ts">
	// Test wrapper: renders children inside a locale-context provider so
	// component tests can assert fr-localized output (slice-28.6).
	import { provideLocale } from '$lib/utils/locale-context';
	import type { Locale } from '$lib/types';
	import type { Snippet } from 'svelte';
	let { locale = 'fr' as Locale, children }: { locale?: Locale; children: Snippet } = $props();
	provideLocale(() => locale);
</script>

{@render children()}
