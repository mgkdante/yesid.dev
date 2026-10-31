<!--
  Personal Corner blog listing — /blog/personal
  Shows personal posts with warmer yellow accent.
  "Back to Professional" link navigates to /blog.
-->
<script lang="ts">
	import BlogListingPage from '#lib/components/blog/BlogListingPage.svelte';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { siteLabels } from '#lib/content/index.ts';

	let { data } = $props();

	const locale = getLocale();
	const heading = $derived(resolveLocale(data.blogPage.personalHeading, locale));
	const subtitle = $derived(resolveLocale(data.blogPage.personalIntro, locale));
	const emptyState = $derived(resolveLocale(data.blogPage.emptyState, locale));
	const emptyStateNoPosts = $derived(resolveLocale(data.blogPage.emptyStateNoPosts, locale));
	const backLabel = resolveLocale(siteLabels.blogChrome.listing.toProfessionalLabel, locale);
	const backSubtitle = resolveLocale(siteLabels.blogChrome.listing.toProfessionalSubtitle, locale);
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
	accentColor="var(--accent-text)"
	cornerLink={{
		href: '/blog',
		label: backLabel,
		subtitle: backSubtitle
	}}
/>
