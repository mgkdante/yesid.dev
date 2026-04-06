<!--
  Blog post detail page — /blog/[slug]
  Renders pre-rendered markdown HTML with title + side SVG icon layout.
  Includes ToC sidebar on desktop and collapsible toggle on mobile.
  Premium styling: orange accent left border card wrapping the content.
-->
<script lang="ts">
	import BlogDetailHeader from '$lib/components/BlogDetailHeader.svelte';
	import BlogContent from '$lib/components/BlogContent.svelte';
	import TableOfContents from '$lib/components/TableOfContents.svelte';

	let { data } = $props();

	let accentColor = $derived(
		data.post.category === 'personal' ? '#FFB627' : '#E07800'
	);

	// ToC ref — used to get HTML with injected heading ids for scroll-to links
	let tocRef: TableOfContents | undefined = $state();
	let processedHtml = $derived(
		tocRef ? tocRef.getProcessedHtml() : data.html
	);
</script>

<article class="mx-auto max-w-4xl pb-16">
	<BlogDetailHeader
		post={data.post}
		svgContent={data.svgContent}
		{accentColor}
	/>

	<!-- Mobile ToC toggle — shown above content on small screens -->
	<div class="mt-6">
		<TableOfContents bind:this={tocRef} html={data.html} />
	</div>

	<!-- Content + desktop ToC sidebar layout -->
	<div class="flex gap-8">
		<!-- Main content area — wrapped in premium card styling -->
		<div class="min-w-0 flex-1">
			<BlogContent {accentColor}>
				{@html processedHtml}
			</BlogContent>
		</div>

		<!-- Desktop ToC sidebar — positioned to the right of content -->
		<TableOfContents html={data.html} class="mt-8 hidden lg:block" />
	</div>
</article>
