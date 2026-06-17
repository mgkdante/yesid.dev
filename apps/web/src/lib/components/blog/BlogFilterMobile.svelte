<!--
  Mobile collapsible filter: language, date range, tags, corner link.
  Uses bits-ui Collapsible for a11y (aria-controls, aria-expanded, focus management).
-->
<script lang="ts">
	import type { Locale } from '$lib/types';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { persisted } from '$lib/state/persisted.svelte';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';

	const LANG_LABELS: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };

	const filters = siteLabels.blogChrome.listing.filters;
	const filtersLabel = resolveLocale(filters.filtersLabel, locale);
	const allLabel = resolveLocale(filters.allLabel, locale);
	const languageLabel = resolveLocale(filters.language, locale);
	const dateRangeLabel = resolveLocale(filters.dateRange, locale);
	const fromLabel = resolveLocale(filters.from, locale);
	const toLabel = resolveLocale(filters.to, locale);
	const showingPrefix = resolveLocale(filters.showingPrefix, locale);

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

	// slice-34.6 — the open/closed sheet survives a locale switch (locale-free bool).
	const sheet = persisted('blog-filter-sheet', false);
</script>

<div class="lg:hidden" data-testid="blog-filter-mobile">
	<Collapsible bind:open={sheet.value}>
		<div class="mb-3 flex items-center gap-3">
			<CollapsibleTrigger>
				{#snippet child({ props })}
					<button
						{...props}
						class="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs transition-colors"
						style="border-color: {accentColor}; color: {accentColor};"
					>
						{filtersLabel}
						<span class="text-caption">{sheet.value ? '\u25B2' : '\u25BC'}</span>
					</button>
				{/snippet}
			</CollapsibleTrigger>
			<span class="text-caption text-[var(--muted-foreground)]">
				{showingPrefix}: {activeTag ?? allLabel}{activeLang ? ` · ${activeLang.toUpperCase()}` : ''}
			</span>
		</div>

		<CollapsibleContent forceMount class="blog-filter-body">
			<div class="min-h-0 overflow-hidden">
				<div class="mb-4 max-h-[60dvh] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-3" use:scrollChain>
					<!-- Language filter — surfaces the languages present in the active posts,
					     like Tags (shown whenever ≥1 language exists, even EN-only). -->
					{#if languages.length >= 1}
						<div class="label-section font-semibold">
							{languageLabel}
						</div>
						<div class="mt-1.5 flex gap-1.5">
							<button
								class="rounded px-2 py-1 text-caption transition-colors"
								class:m-active={activeLang === null}
																onclick={() => onLangSelect(null)}
							>
								{allLabel}
							</button>
							{#each languages as lang}
								<button
									class="rounded border border-[var(--border)] px-2 py-1 text-caption text-[var(--muted-foreground)] transition-colors"
									class:m-tag-active={activeLang === lang}
																		onclick={() => onLangSelect(lang)}
								>
									{LANG_LABELS[lang]}
								</button>
							{/each}
						</div>
						<div class="mt-2 divider-dashed"></div>
					{/if}

					<!-- Date range -->
					<div class="mt-2 label-section font-semibold">
						{dateRangeLabel}
					</div>
					<div class="mt-1.5 flex gap-2">
						<label class="flex-1 text-caption text-[var(--muted-foreground)]">
							{fromLabel}
							<input
								type="date"
								bind:value={dateFrom}
								class="mt-0.5 w-full rounded border border-[var(--input)] bg-[var(--background)] px-1.5 py-1 font-mono text-caption text-[var(--foreground)] outline-none"
							/>
						</label>
						<label class="flex-1 text-caption text-[var(--muted-foreground)]">
							{toLabel}
							<input
								type="date"
								bind:value={dateTo}
								class="mt-0.5 w-full rounded border border-[var(--input)] bg-[var(--background)] px-1.5 py-1 font-mono text-caption text-[var(--foreground)] outline-none"
							/>
						</label>
					</div>

					<!-- Tags -->
					<div class="mt-3 divider-dashed pt-2">
						<div class="flex flex-wrap gap-1.5">
							<button
								class="rounded px-2 py-1 text-caption transition-colors"
								class:m-active={activeTag === null}
																onclick={() => onTagSelect(null)}
							>
								{allLabel}
							</button>
							{#each tags as tag}
								<button
									class="rounded border border-[var(--border)] px-2 py-1 text-caption text-[var(--muted-foreground)] transition-colors"
									class:m-tag-active={activeTag === tag}
																		onclick={() => onTagSelect(tag)}
								>
									{tag}
								</button>
							{/each}
						</div>
					</div>

					<!-- Corner link (last) -->
					{#if cornerLink}
						<div class="mt-3 divider-dashed pt-2">
							<a
								href={localizeHref(cornerLink.href, locale)}
								class="text-xs font-semibold no-underline"
								style="color: {cornerLink.href.includes('personal') ? 'var(--accent-text)' : 'var(--primary)'};"
							>
								{cornerLink.label} &rarr;
							</a>
							<div class="mt-0.5 text-caption italic text-[var(--muted-foreground)]">
								{cornerLink.subtitle}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</CollapsibleContent>
	</Collapsible>
</div>

<style>
	.m-active {
		background: var(--accent);
		color: var(--foreground);
	}
	.m-tag-active {
		border-color: var(--accent-text) !important;
		color: var(--accent-text) !important;
	}
	/* CSS grid animation for smooth expand/collapse — matches CollapsibleSection pattern */
	:global([data-slot="collapsible-content"].blog-filter-body) {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-slow) var(--ease-default);
	}
	:global([data-slot="collapsible-content"].blog-filter-body[data-state="open"]) {
		grid-template-rows: 1fr;
	}
</style>
