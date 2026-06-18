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

	const subtitle = $derived(resolveLocale(data.blogPage.intro, locale));
	const personalLabel = $derived(resolveLocale(data.blogPage.toPersonalLabel, locale));
	const personalSubtitle = $derived(resolveLocale(data.blogPage.toPersonalSubtitle, locale));
</script>

<BlogListingPage
	posts={data.posts}
	allTags={data.tags}
	languages={data.languages}
	svgContents={data.svgContents}
	subtitle={subtitle}
	accentColor="var(--primary)"
	cornerLink={{
		href: '/blog/personal',
		label: personalLabel,
		subtitle: personalSubtitle
	}}
/>
