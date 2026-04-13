<!--
  Desktop sidebar: language filter + date range + tag filters + corner link.
  Hidden on mobile — BlogFilterMobile handles that.

  WHY: button groups (language + tags) are now delegated to FilterGroup so the
  active/tag-active styles live in one place. Date range and corner link stay inline
  because they are not button group patterns.
-->
<script lang="ts">
	import type { Locale } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import FilterGroup from './FilterGroup.svelte';
	import { ChevronToggle } from '$lib/components/brand';

	const LANG_LABELS: Record<Locale, string> = { en: 'English', fr: 'Français', es: 'Español' };

	// WHY: all user-facing labels go through resolveLocale so the sidebar is ready
	// for future i18n without changing component logic.
	const labels = {
		language: { en: 'Language' },
		dateRange: { en: 'Date Range' },
		from: { en: 'From' },
		to: { en: 'To' },
		tags: { en: 'Tags' }
	};

	// WHY: date range section is not a FilterGroup, so it needs its own collapse state
	let dateOpen = $state(true);

	let {
		tags,
		languages = [],
		activeTag = null,
		activeLang = null,
		accentColor = 'var(--primary)',
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
		accentColor?: string;
		cornerLink?: { href: string; label: string; subtitle: string } | null;
		onTagSelect: (tag: string | null) => void;
		onLangSelect: (lang: Locale | null) => void;
		dateFrom?: string;
		dateTo?: string;
	} = $props();
</script>

<aside class="hidden w-40 shrink-0 md:block max-h-[calc(100dvh-6rem)] overflow-y-auto" data-testid="blog-filter-sidebar">
	<!-- Language filter — only shown when more than one language exists -->
	{#if languages.length > 1}
		<div class="mb-5">
			<FilterGroup
				label={resolveLocale(labels.language, 'en')}
				items={languages.map((lang) => ({ key: lang, label: LANG_LABELS[lang] }))}
				activeKey={activeLang}
				{accentColor}
				allowDeselect={false}
				collapsible={true}
				onSelect={(key) => onLangSelect(key as Locale | null)}
			/>
		</div>
	{/if}

	<!-- Date range — inline, not a FilterGroup, so collapse logic is inline -->
	<button
		class="flex w-full items-center justify-between label-section font-semibold transition-colors hover:text-[var(--foreground)]"
		onclick={() => (dateOpen = !dateOpen)}
	>
		{resolveLocale(labels.dateRange, 'en')}
		<ChevronToggle open={dateOpen} size="sm" direction="down" />
	</button>
	{#if dateOpen}
		<div class="mt-2 flex flex-col gap-1.5">
			<label class="text-caption text-[var(--muted-foreground)]">
				{resolveLocale(labels.from, 'en')}
				<input
					type="date"
					bind:value={dateFrom}
					class="mt-0.5 w-full rounded border border-border-subtle bg-bg-primary px-1.5 py-1 font-mono text-caption text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
					style="--accent: {accentColor}; color-scheme: dark;"
				/>
			</label>
			<label class="text-caption text-[var(--muted-foreground)]">
				{resolveLocale(labels.to, 'en')}
				<input
					type="date"
					bind:value={dateTo}
					class="mt-0.5 w-full rounded border border-border-subtle bg-bg-primary px-1.5 py-1 font-mono text-caption text-[var(--foreground)] outline-none focus:border-[var(--accent)]"
					style="--accent: {accentColor}; color-scheme: dark;"
				/>
			</label>
		</div>
	{/if}

	<!-- Tags filter — delegated to FilterGroup -->
	<div class="mt-5 divider-dashed pt-3">
		<FilterGroup
			label={resolveLocale(labels.tags, 'en')}
			items={tags.map((tag) => ({ key: tag, label: tag }))}
			activeKey={activeTag}
			{accentColor}
			allowDeselect={false}
			collapsible={true}
			onSelect={onTagSelect}
		/>
	</div>

	<!-- Corner link — inline, not a button group -->
	{#if cornerLink}
		<div class="mt-5 divider-dashed pt-3">
			<a
				href={cornerLink.href}
				class="flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs font-semibold no-underline transition-colors"
				style="border-color: {cornerLink.href.includes('personal') ? 'var(--accent)' : 'var(--primary)'}; color: {cornerLink.href.includes('personal') ? 'var(--accent)' : 'var(--primary)'};"
			>
				{cornerLink.label}
			</a>
			<div class="mt-1 pl-2 text-caption italic text-[var(--muted-foreground)]">
				{cornerLink.subtitle}
			</div>
		</div>
	{/if}
</aside>
