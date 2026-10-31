<!--
  Professional blog listing — /blog
  Shows professional posts with sidebar tag filters.
  "Personal Corner" link navigates to /blog/personal.
-->
<script lang="ts">
	import BlogListingPage from '#lib/components/blog/BlogListingPage.svelte';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { siteLabels } from '#lib/content/index.ts';

	let { data } = $props();

	const locale = getLocale();

	const listingChrome = siteLabels.blogChrome.listing;

	const heading = $derived(
		resolveLocale(data.blogPage.heading, locale) || resolveLocale(listingChrome.mobileHeading, locale)
	);
	const subtitle = $derived(resolveLocale(data.blogPage.intro, locale));
	const emptyState = $derived(resolveLocale(data.blogPage.emptyState, locale));
	const emptyStateNoPosts = $derived(resolveLocale(data.blogPage.emptyStateNoPosts, locale));
	const personalLabel = resolveLocale(listingChrome.toPersonalLabel, locale);
	const personalSubtitle = resolveLocale(listingChrome.toPersonalSubtitle, locale);
</script>

<BlogListingPage
	posts={data.posts}
	allTags={data.tags}
	languages={data.languages}
	svgContents={data.svgContents}
	{heading}
	{subtitle}
	{emptyState}
	{emptyStateNoPosts}
	accentColor="var(--primary)"
	cornerLink={{
		href: '/blog/personal',
		label: personalLabel,
		subtitle: personalSubtitle
	}}
/>
