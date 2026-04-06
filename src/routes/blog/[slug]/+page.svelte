<!--
  Blog post detail page — /blog/[slug]
  Renders pre-rendered markdown HTML with title + side SVG icon layout.
  ToC absolutely positioned in the left page margin (2xl+), content stays centered.
-->
<script lang="ts">
	import BlogDetailHeader from '$lib/components/BlogDetailHeader.svelte';
	import BlogContent from '$lib/components/BlogContent.svelte';
	import TableOfContents from '$lib/components/TableOfContents.svelte';
	import { resolveLocale } from '$lib/data/locale.js';

	let { data } = $props();

	let accentColor = $derived(
		data.post.category === 'personal' ? '#FFB627' : '#E07800'
	);

	let tocRef: TableOfContents | undefined = $state();
	let processedHtml = $derived(
		tocRef ? tocRef.getProcessedHtml() : data.html
	);
</script>

<article class="pb-16">
	<div class="mx-auto max-w-5xl">
		<BlogDetailHeader
			post={data.post}
			svgContent={data.svgContent}
			{accentColor}
		/>
	</div>

	<!-- Mobile ToC toggle — shown below 2xl -->
	<div class="mx-auto mt-6 max-w-5xl 2xl:hidden">
		<TableOfContents html={data.html} />
	</div>

	<!-- Content: centered at max-w-5xl, ToC in left margin via absolute positioning -->
	<div class="relative mx-auto mt-6 max-w-5xl">
		<!-- ToC: absolutely positioned in left page margin -->
		<aside class="absolute inset-y-0 right-full mr-3 hidden 2xl:block">
			<div class="sticky top-20 w-[180px] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-lg border border-[#2a2a2a] bg-[#141414] p-4">
				<TableOfContents bind:this={tocRef} html={data.html} embedded />
			</div>
		</aside>

		<!-- Main content — full width, not affected by ToC -->
		<div class="min-w-0">
			<BlogContent accentColor={accentColor} contentTitle={resolveLocale(data.post.title, 'en')}>
				{@html processedHtml}
			</BlogContent>
		</div>
	</div>
</article>
