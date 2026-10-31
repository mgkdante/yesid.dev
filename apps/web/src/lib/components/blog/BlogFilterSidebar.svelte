<!--
  Listing filter panel: language filter + date range + tag filters + corner link.

  WHY: button groups (language + tags) are now delegated to FilterGroup so the
  active/tag-active styles live in one place. Date range and corner link stay inline
  because they are not button group patterns.
-->
<script lang="ts">
	import type { Locale } from '#lib/types.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { localizeHref } from '#lib/utils/locale-routing.ts';

	const locale = getLocale();
	import { persisted } from '@yesid/ui/state';
	import { ChevronToggle, FilterGroup, FilterSection } from '@yesid/ui/brand';
	import { siteLabels } from '#lib/content/index.ts';

	const listingChrome = siteLabels.blogChrome.listing;
	const labels = listingChrome.filters;
	const allLabel = resolveLocale(labels.allLabel, locale);
	const languageLabel = (lang: Locale) => resolveLocale(siteLabels.ui.languageNames[lang], locale) || lang;

	// The date range is outside FilterGroup and needs its own persisted collapse state.
	const dateOpen = persisted('blog-filter-date', true);

	let {
		tags,
		languages = [],
		activeTag = null,
		activeLang = null,
		cornerLink = null,
		onTagSelect,
		onLangSelect,
		dateFrom = $bindable(''),
		dateTo = $bindable('')
	}: {
		tags: readonly string[];
		languages?: readonly Locale[];
		activeTag: string | null;
		activeLang: Locale | null;
		cornerLink?: { href: string; label: string; subtitle: string } | null;
		onTagSelect: (tag: string | null) => void;
		onLangSelect: (lang: Locale | null) => void;
		dateFrom?: string;
		dateTo?: string;
	} = $props();
</script>

<aside data-testid="blog-filter-sidebar">
	<!-- Language filter — surfaces the languages present in the active posts, like
	     Tags (shown whenever ≥1 language exists, even when posts are EN-only). -->
	{#if languages.length >= 1}
		<FilterSection>
			<FilterGroup
				label={resolveLocale(labels.language, locale)}
				items={languages.map((lang) => ({ key: lang, label: languageLabel(lang) }))}
				activeKey={activeLang}
				{allLabel}
				allowDeselect={false}
				collapsible={true}
				persistKey="blog-filter-language"
				onSelect={(key) => onLangSelect(key as Locale | null)}
			/>
		</FilterSection>
	{/if}

	<!-- Date range — inline, not a FilterGroup, so collapse logic is inline -->
	<FilterSection>
	<button
		class="flex min-h-11 w-full items-center justify-between label-section text-sm font-semibold transition-colors hover:text-[var(--foreground)]"
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
						class="mt-0.5 min-h-11 w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
					/>
				</label>
				<label class="text-sm text-[var(--muted-foreground)]">
					{resolveLocale(labels.to, locale)}
					<input
						type="date"
						bind:value={dateTo}
						class="mt-0.5 min-h-11 w-full rounded border border-border bg-background px-2 py-1.5 font-mono text-sm text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
					/>
				</label>
			</div>
		</div>
	</div>
	</FilterSection>

	<!-- Tags filter — closed by default -->
	<FilterSection>
		<FilterGroup
			label={resolveLocale(labels.tags, locale)}
			items={tags.map((tag) => ({ key: tag, label: tag }))}
			activeKey={activeTag}
			{allLabel}
			allowDeselect={false}
			collapsible={true}
			startOpen={false}
			persistKey="blog-filter-tags"
			onSelect={onTagSelect}
		/>
	</FilterSection>

	<!-- Corner link — inline, not a button group -->
	{#if cornerLink}
		<FilterSection>
			<a
				href={localizeHref(cornerLink.href, locale)}
				class="flex min-h-11 w-full items-center gap-1.5 rounded border px-2 py-1.5 text-sm font-semibold no-underline transition-colors"
				style="border-color: {cornerLink.href.includes('personal') ? 'var(--accent)' : 'var(--primary)'}; color: {cornerLink.href.includes('personal') ? 'var(--accent)' : 'var(--primary)'};"
			>
				{cornerLink.label}
			</a>
			<div class="mt-1 pl-2 text-sm italic text-[var(--muted-foreground)]">
				{cornerLink.subtitle}
			</div>
		</FilterSection>
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
