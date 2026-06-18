<!--
  Personal Corner blog listing — /blog/personal
  Shows personal posts with warmer yellow accent.
  "Back to Professional" link navigates to /blog.
-->
<script lang="ts">
	import BlogListingPage from '$lib/components/blog/BlogListingPage.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	let { data } = $props();

	const locale = getLocale();
	const heading = $derived(resolveLocale(data.blogPage.personalHeading, locale));
	const subtitle = $derived(resolveLocale(data.blogPage.personalIntro, locale));
	const backLabel = $derived(resolveLocale(data.blogPage.toProfessionalLabel, locale));
	const backSubtitle = $derived(resolveLocale(data.blogPage.toProfessionalSubtitle, locale));
</script>

<BlogListingPage
	posts={data.posts}
	allTags={data.tags}
	languages={data.languages}
	svgContents={data.svgContents}
	mobileHeading={heading}
	{subtitle}
	accentColor="var(--accent-text)"
	cornerLink={{
		href: '/blog',
		label: backLabel,
		subtitle: backSubtitle
	}}
/>
