<!--
  Blog feed section: shows the 3 latest posts in a metro-styled grid.
  Station header "STOP 07 — DISPATCHES" in muted color.
-->
<script lang="ts">
	import { getLatestPosts } from '$lib/data/blog.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import BlogCard from './BlogCard.svelte';

	const posts = getLatestPosts(3);
</script>

<section
	class="relative mx-auto flex max-w-5xl flex-col px-6 py-24 pr-10 md:pr-[72px]"
	data-testid="section-blog-feed"
	use:reveal
>
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each posts as post, i (post.slug)}
			<div use:reveal={{ delay: stagger(i, 100) }}>
				<BlogCard
					title={resolveLocale(post.title, 'en')}
					excerpt={resolveLocale(post.excerpt, 'en')}
					date={post.date}
					url={post.url}
					external={post.external}
					index={i}
				/>
			</div>
		{/each}
	</div>
</section>
