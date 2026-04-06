<!--
  Blog post detail page — /blog/[slug]
  Renders pre-rendered markdown HTML with title + side SVG icon layout.
  ToC on the left (desktop sticky, mobile toggle). Premium card styling.
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

<article class="mx-auto max-w-5xl pb-16">
	<BlogDetailHeader
		post={data.post}
		svgContent={data.svgContent}
		{accentColor}
	/>

	<!-- Mobile ToC toggle — shown above content on small screens -->
	<div class="mt-6 lg:hidden">
		<TableOfContents bind:this={tocRef} html={data.html} />
	</div>

	<!-- Three-column layout: ToC left | Content center | (empty right for balance) -->
	<div class="mt-6 flex gap-6">
		<!-- Desktop ToC — separate sticky card on the LEFT -->
		<div class="hidden lg:block">
			<div class="sticky top-20 w-[180px] shrink-0 rounded-lg border border-[#2a2a2a] bg-[#141414] p-4">
				<div class="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-[#666]">On this page</div>
				<TableOfContents bind:this={tocRef} html={data.html} class="toc-embedded" />
			</div>
		</div>

		<!-- Main content area — full width within its column -->
		<div class="min-w-0 flex-1">
			<BlogContent {accentColor}>
				{@html processedHtml}
			</BlogContent>
		</div>
	</div>
</article>
