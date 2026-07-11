<script lang="ts">
	import type { PageSeo } from '$lib/schemas/seo';
	import type { Locale } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import {
		PUBLISHED_LOCALES,
		SITE_HOST,
		SITE_NAME,
		TWITTER_HANDLE,
		canonicalFor,
		defaultOgImageFor,
		localizeOgCard,
	} from '$lib/utils/seo-defaults';
	import { dev as runtimeDev } from '$app/environment';
	import JsonLd from './JsonLd.svelte';

	// `dev` is a prop (not just the runtime import) so tests can force the path.
	// `themeColor` defaults to the legacy hardcoded value so static-mode + tests
	// keep rendering identical output without needing to pass the new prop. In
	// production it arrives via $page.data.themeColor (sourced from CMS site_meta
	// per Slice 18 18h Q7 lock-in 2026-04-27).
	let {
		seo,
		locale,
		themeColor = '#141414',
		dev = runtimeDev,
	}: { seo: PageSeo; locale: Locale; themeColor?: string; dev?: boolean } = $props();

	const title = $derived(resolveLocale(seo.title, locale));
	const description = $derived(resolveLocale(seo.description, locale));
	const ogImageUrl = $derived(
		seo.ogImage ? localizeOgCard(seo.ogImage.url, locale) : defaultOgImageFor(locale),
	);
	const ogImageAlt = $derived(
		seo.ogImage ? resolveLocale(seo.ogImage.alt, locale) : `${SITE_NAME} · ${title}`,
	);
	const ogImageAbsolute = $derived(
		ogImageUrl.startsWith('http') ? ogImageUrl : `${SITE_HOST}${ogImageUrl}`,
	);
	const canonicalAbsolute = $derived(seo.canonical);
	const ogLocale = $derived(`${locale}_CA`);
	const pathForCanonical = $derived(seo.canonical.replace(SITE_HOST, '') || '/');
	const alternateLocales = $derived(
		seo.localeAlternates
			? PUBLISHED_LOCALES.filter((l) => Boolean(seo.localeAlternates?.[l]))
			: PUBLISHED_LOCALES,
	);
	const otherLocales = $derived(
		alternateLocales.filter((l) => l !== locale).map((l) => `${l}_CA`),
	);
	const xDefaultHref = $derived(
		seo.localeAlternates
			? seo.localeAlternates.en
			: canonicalFor(pathForCanonical, 'en'),
	);

	function alternateHref(locale: Locale): string {
		return seo.localeAlternates?.[locale] ?? canonicalFor(pathForCanonical, locale);
	}

	// Dev-mode warnings. Zod already hard-fails outside 50–200 / 70 chars;
	// these warnings cover the "optimum but not hard-fail" band.
	$effect(() => {
		if (!dev) return;
		if (title.length > 60) {
			console.warn(
				`[SeoHead] title > 60 chars (${title.length}) — may truncate in SERPs. Canonical: ${seo.canonical}`,
			);
		}
		if (description.length < 150 || description.length > 160) {
			console.warn(
				`[SeoHead] description outside 150–160 chars (${description.length}). Canonical: ${seo.canonical}`,
			);
		}
	});
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={canonicalAbsolute} />

	<meta name="theme-color" content={themeColor} />
	<meta name="color-scheme" content="dark light" />

	{#if seo.noIndex}
		<meta name="robots" content="noindex,nofollow" />
	{/if}

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={ogImageAbsolute} />
	<meta property="og:image:alt" content={ogImageAlt} />
	<meta property="og:image:width" content={String(seo.ogImage?.width ?? 1200)} />
	<meta property="og:image:height" content={String(seo.ogImage?.height ?? 630)} />
	<meta property="og:url" content={canonicalAbsolute} />
	<meta property="og:type" content={seo.ogType} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:locale" content={ogLocale} />
	{#each otherLocales as alt}
		<meta property="og:locale:alternate" content={alt} />
	{/each}

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:site" content={TWITTER_HANDLE} />
	<meta name="twitter:creator" content={TWITTER_HANDLE} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={ogImageAbsolute} />
	<meta name="twitter:image:alt" content={ogImageAlt} />

	<!-- Static pages derive same-path alternates. Translated content may supply
	     exact URLs when each locale owns a different slug. -->
	{#if seo.singleLocale !== true}
		{#each alternateLocales as l (l)}
			<link rel="alternate" hreflang={l} href={alternateHref(l)} />
		{/each}
		{#if xDefaultHref}
			<link rel="alternate" hreflang="x-default" href={xDefaultHref} />
		{/if}
	{/if}
</svelte:head>

{#if seo.jsonLd && seo.jsonLd.length > 0}
	<JsonLd nodes={seo.jsonLd} />
{/if}
