<!--
  Professional blog listing — /blog
  Shows professional posts with sidebar tag filters.
  "Personal Corner" link navigates to /blog/personal.
-->
<script lang="ts">
	import BlogListingPage from '$lib/components/blog/BlogListingPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	let { data } = $props();

	const locale = getLocale();

	const heading = $derived(resolveLocale(data.blogPage.heading, locale) || 'Dispatches');
	const subtitle = $derived(
		resolveLocale(
			{ en: 'Data, SQL, and infrastructure, from the field', fr: 'Données, SQL et infrastructure, du terrain' },
			locale,
		),
	);
</script>

<BlogListingPage
	posts={data.posts}
	allTags={data.tags}
	languages={data.languages}
	svgContents={data.svgContents}
	blogPage={data.blogPage}
	{heading}
	subtitle={subtitle}
	accentColor="var(--primary)"
	cornerLink={{
		href: '/blog/personal',
		label: resolveLocale({ en: 'Personal Corner', fr: 'Coin perso' }, locale),
		subtitle: resolveLocale({ en: 'Off the clock', fr: 'À mes heures' }, locale)
	}}
/>
