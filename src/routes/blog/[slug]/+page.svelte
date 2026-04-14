<!--
  Blog post detail page — /blog/[slug]
  Renders pre-rendered markdown HTML with title + side SVG icon layout.
  ToC absolutely positioned in the left page margin (2xl+), content stays centered.
  ReadingProgressBar tracks scroll progress through the blog content.
-->
<script lang="ts">
	import BlogDetailHeader from '$lib/components/blog/BlogDetailHeader.svelte';
	import BlogContent from '$lib/components/blog/BlogContent.svelte';
	import ReadingProgressBar from '$lib/components/layout/ReadingProgressBar.svelte';
	import TableOfContents from '$lib/components/shared/TableOfContents.svelte';
	import { Separator } from '$lib/components/ui/separator';
	import { StickyPanel } from '$lib/components/brand';

	let { data } = $props();

	let accentColor = $derived(
		data.post.category === 'personal' ? 'var(--accent)' : 'var(--primary)'
	);

	let tocRef: TableOfContents | undefined = $state();
	let processedHtml = $derived(
		tocRef ? tocRef.getProcessedHtml() : data.html
	);
</script>

<ReadingProgressBar {accentColor} />

<article class="w-full pb-16">
	<!-- Blog header — full-bleed with internal gutters -->
	<div class="mx-auto px-[var(--space-page-x)]" style="max-width: var(--container-content)">
		<BlogDetailHeader
			post={data.post}
			svgContent={data.svgContent}
			{accentColor}
			readingTime={data.readingTime}
		/>
	</div>

	<Separator variant="gradient" />

	<!-- Mobile ToC toggle — shown below 2xl -->
	<div class="mx-auto mt-6 px-[var(--space-page-x)] 2xl:hidden" style="max-width: var(--container-content)">
		<TableOfContents html={data.html} />
	</div>

	<!-- Content: centered with container-content, ToC + content side by side under divider -->
	<div class="mx-auto mt-6 flex gap-4 px-[var(--space-page-x)]" style="max-width: var(--container-content)">
		<!-- ToC sidebar (left) — visible on 2xl, inside container -->
		<aside class="hidden w-45 shrink-0 2xl:block">
			<StickyPanel top="5rem">
				<TableOfContents bind:this={tocRef} html={data.html} embedded />
			</StickyPanel>
		</aside>

		<!-- Main content — fills remaining width -->
		<div class="min-w-0 flex-1">
			<BlogContent accentColor={accentColor}>
				{@html processedHtml}
			</BlogContent>
		</div>
	</div>
</article>
