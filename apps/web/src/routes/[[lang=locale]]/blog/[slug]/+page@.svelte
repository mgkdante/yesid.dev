<!--
  Blog detail page — /blog/[slug]
  Renders the BlogDetailPage component with data from the loader.
  Uses +page@.svelte to bypass the blog listing layout (same as project detail).
-->
<script lang="ts">
	import BlogDetailPage from '$lib/components/blog/BlogDetailPage.svelte';

	let { data } = $props();
</script>

<BlogDetailPage
	post={data.post}
	body={data.body}
	svgContent={data.svgContent}
	readingTime={data.readingTime}
	wordCount={data.wordCount}
	headings={data.headings}
	postIndex={data.postIndex}
	blogPage={data.blogPage}
/>
