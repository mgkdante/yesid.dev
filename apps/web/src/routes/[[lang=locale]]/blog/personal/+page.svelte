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
	const heading = resolveLocale({ en: 'Personal Corner', fr: 'Coin perso' }, locale);
	const subtitle = resolveLocale(
		{
			en: 'Trains, space, and things I think about',
			fr: 'Trains, espace, et ce qui me trotte dans la tête',
		},
		locale,
	);
	const backLabel = resolveLocale(
		{ en: '← Back to Professional', fr: '← Retour aux dépêches' },
		locale,
	);
	const backSubtitle = resolveLocale({ en: 'Brand dispatches', fr: 'Dépêches de marque' }, locale);
</script>

<BlogListingPage
	posts={data.posts}
	allTags={data.tags}
	languages={data.languages}
	svgContents={data.svgContents}
	{heading}
	{subtitle}
	accentColor="var(--accent-text)"
	cornerLink={{
		href: '/blog',
		label: backLabel,
		subtitle: backSubtitle
	}}
/>
