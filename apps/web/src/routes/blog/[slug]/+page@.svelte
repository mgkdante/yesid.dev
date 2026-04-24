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
	html={data.html}
	svgContent={data.svgContent}
	readingTime={data.readingTime}
	postIndex={data.postIndex}
/>
