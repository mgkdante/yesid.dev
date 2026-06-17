<!--
  Desktop sidebar: language filter + date range + tag filters + corner link.
  Hidden on mobile — BlogFilterMobile handles that.

  WHY: button groups (language + tags) are now delegated to FilterGroup so the
  active/tag-active styles live in one place. Date range and corner link stay inline
  because they are not button group patterns.
-->
<script lang="ts">
	import type { Locale } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';

	const locale = getLocale();
	import FilterGroup from '$lib/components/shared/FilterGroup.svelte';
	import { persisted } from '$lib/state/persisted.svelte';
	import { ChevronToggle } from '$lib/components/brand';
	import { siteLabels } from '$lib/content';

	const LANG_LABELS: Record<Locale, string> = { en: 'English', fr: 'Français', es: 'Español' };

	// Labels pulled from the content layer (Task 17b-7b) — shared with the mobile filter.
	const listingChrome = siteLabels.blogChrome.listing;
	const labels = listingChrome.filters;
	const searchPlaceholder = resolveLocale(listingChrome.searchPlaceholder, locale);

	// WHY: date range section is not a FilterGroup, so it needs its own collapse state.
	// slice-34.6: session-scoped so it survives a locale switch (paints directly via
	// persisted()'s synchronous seed — no expand-then-collapse flash).
	const dateOpen = persisted('blog-filter-date', true);

	let {
		tags,
		languages = [],
		activeTag = null,
		activeLang = null,
		accentColor = 'var(--primary)',
		cornerLink = null,
		onTagSelect,
		onLangSelect,
		searchQuery = $bindable(''),
		dateFrom = $bindable(''),
		dateTo = $bindable('')
	}: {
		tags: readonly string[];
		languages?: readonly Locale[];
		activeTag: string | null;
		activeLang: Locale | null;
		accentColor?: string;
		cornerLink?: { href: string; label: string; subtitle: string } | null;
		onTagSelect: (tag: string | null) => void;
		onLangSelect: (lang: Locale | null) => void;
		searchQuery?: string;
		dateFrom?: string;
		dateTo?: string;
	} = $props();
</script>

<aside data-testid="blog-filter-sidebar">
	<!-- Search -->
	<div class="pt-3 mb-6 pb-5 divider-dashed">
		<div class="relative">
			<input
				type="text"
				placeholder={searchPlaceholder}
				bind:value={searchQuery}
				class="w-full rounded-lg border border-[var(--input)] bg-[var(--card)] px-3 py-2 pl-9 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--accent)]"
				data-testid="blog-search-sidebar"
			/>
			<svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
				<circle cx="7" cy="7" r="5"/>
				<line x1="11" y1="11" x2="14" y2="14"/>
			</svg>
		</div>
	</div>

	<!-- Language filter — surfaces the languages present in the active posts, like
	     Tags (shown whenever ≥1 language exists, even when posts are EN-only). -->
	{#if languages.length >= 1}
		<div class="mt-5 divider-dashed pt-3">
			<FilterGroup
				label={resolveLocale(labels.language, locale)}
				items={languages.map((lang) => ({ key: lang, label: LANG_LABELS[lang] }))}
				activeKey={activeLang}
				{accentColor}
				allowDeselect={false}
				collapsible={true}
				persistKey="blog-filter-language"
				onSelect={(key) => onLangSelect(key as Locale | null)}
			/>
		</div>
	{/if}

	<!-- Date range — inline, not a FilterGroup, so collapse logic is inline -->
	<div class="mt-5 divider-dashed pt-3">
	<button
		class="flex w-full items-center justify-between label-section text-sm font-semibold transition-colors hover:text-[var(--foreground)]"
		onclick={() => (dateOpen.value = !dateOpen.value)}
	>
		{resolveLocale(labels.dateRange, locale)}
		<ChevronToggle open={dateOpen.value} size="sm" direction="down" />
	</button>
	<div class="date-collapse" class:date-open={dateOpen.value}>
		<div class="date-collapse-inner">
			<div class="mt-2 flex flex-col gap-1.5">
				<label class="text-sm text-[var(--muted-foreground)]">
					{resolveLocale(labels.from, locale)}
					<input
						type="date"
						bind:value={dateFrom}
						class="mt-0.5 w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
					/>
				</label>
				<label class="text-sm text-[var(--muted-foreground)]">
					{resolveLocale(labels.to, locale)}
					<input
						type="date"
						bind:value={dateTo}
						class="mt-0.5 w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
					/>
				</label>
			</div>
		</div>
	</div>
	</div>

	<!-- Tags filter — closed by default -->
	<div class="mt-5 divider-dashed pt-3">
		<FilterGroup
			label={resolveLocale(labels.tags, locale)}
			items={tags.map((tag) => ({ key: tag, label: tag }))}
			activeKey={activeTag}
			{accentColor}
			allowDeselect={false}
			collapsible={true}
			startOpen={false}
			persistKey="blog-filter-tags"
			onSelect={onTagSelect}
		/>
	</div>

	<!-- Corner link — inline, not a button group -->
	{#if cornerLink}
		<div class="mt-5 divider-dashed pt-3">
			<a
				href={localizeHref(cornerLink.href, locale)}
				class="flex w-full items-center gap-1.5 rounded border px-2 py-1.5 text-sm font-semibold no-underline transition-colors"
				style="border-color: {cornerLink.href.includes('personal') ? 'var(--accent)' : 'var(--primary)'}; color: {cornerLink.href.includes('personal') ? 'var(--accent)' : 'var(--primary)'};"
			>
				{cornerLink.label}
			</a>
			<div class="mt-1 pl-2 text-sm italic text-[var(--muted-foreground)]">
				{cornerLink.subtitle}
			</div>
		</div>
	{/if}
</aside>

<style>
	/* Smooth collapse/expand for date range section */
	.date-collapse {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-slow) var(--ease-default);
	}
	.date-collapse.date-open {
		grid-template-rows: 1fr;
	}
	.date-collapse-inner {
		overflow: hidden;
		min-height: 0;
	}
</style>
