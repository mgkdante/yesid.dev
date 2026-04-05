<!--
  Blog post detail page — /blog/[slug]
  Renders pre-rendered markdown HTML with title + side SVG icon layout.
-->
<script lang="ts">
	import BlogDetailHeader from '$lib/components/BlogDetailHeader.svelte';
	import BlogContent from '$lib/components/BlogContent.svelte';

	let { data } = $props();

	let accentColor = $derived(
		data.post.category === 'personal' ? '#FFB627' : '#E07800'
	);
</script>

<article class="mx-auto max-w-2xl pb-16">
	<BlogDetailHeader
		post={data.post}
		svgContent={data.svgContent}
		{accentColor}
	/>

	<BlogContent {accentColor}>
		{@html data.html}
	</BlogContent>
</article>
