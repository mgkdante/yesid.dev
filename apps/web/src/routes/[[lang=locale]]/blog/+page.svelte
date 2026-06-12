<!--
  Professional blog listing — /blog
  Shows professional posts with sidebar tag filters.
  "Personal Corner" link navigates to /blog/personal.
-->
<script lang="ts">
	import BlogListingPage from '$lib/components/blog/BlogListingPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';

	let { data } = $props();

	const heading = $derived(resolveLocale(data.blogPage.heading, 'en') || 'Dispatches');
</script>

<BlogListingPage
	posts={data.posts}
	allTags={data.tags}
	languages={data.languages}
	svgContents={data.svgContents}
	blogPage={data.blogPage}
	{heading}
	subtitle="Data, SQL, and infrastructure — from the field"
	accentColor="var(--primary)"
	cornerLink={{
		href: '/blog/personal',
		label: 'Personal Corner',
		subtitle: 'Off the clock'
	}}
/>
