<!--
  Personal Corner blog listing — /blog/personal
  Shows personal posts with warmer yellow accent.
  "Back to Professional" link navigates to /blog.
-->
<script lang="ts">
	import BlogListingPage from '$lib/components/blog/BlogListingPage.svelte';

	let { data } = $props();
</script>

<BlogListingPage
	posts={data.posts}
	allTags={data.tags}
	languages={data.languages}
	svgContents={data.svgContents}
	heading="Personal Corner"
	subtitle="Trains, space, and things I think about"
	accentColor="var(--accent)"
	cornerLink={{
		href: '/blog',
		label: '\u2190 Back to Professional',
		subtitle: 'Brand dispatches'
	}}
/>
