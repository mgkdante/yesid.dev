<!--
  Mobile collapsible filter: language, date range, tags, corner link.
-->
<script lang="ts">
	import type { Locale } from '$lib/data/types.js';

	const LANG_LABELS: Record<Locale, string> = { en: 'EN', fr: 'FR', es: 'ES' };

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

	let open = $state(false);
</script>

<div class="md:hidden" data-testid="blog-filter-mobile">
	<div class="mb-3 flex items-center gap-3">
		<button
			class="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs transition-colors"
			style="border-color: {accentColor}; color: {accentColor};"
			onclick={() => (open = !open)}
		>
			Filters
			<span class="text-caption">{open ? '\u25B2' : '\u25BC'}</span>
		</button>
		<span class="text-caption text-[var(--muted-foreground)]">
			Showing: {activeTag ?? 'All'}{activeLang ? ` · ${activeLang.toUpperCase()}` : ''}
		</span>
	</div>

	{#if open}
		<div class="mb-4 max-h-[60dvh] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-3">
			<!-- Language filter -->
			{#if languages.length > 1}
				<div class="label-section font-semibold">
					Language
				</div>
				<div class="mt-1.5 flex gap-1.5">
					<button
						class="rounded px-2 py-1 text-caption transition-colors"
						class:m-active={activeLang === null}
						style="--accent: {accentColor};"
						onclick={() => onLangSelect(null)}
					>
						All
					</button>
					{#each languages as lang}
						<button
							class="rounded border border-[var(--border-subtle)] px-2 py-1 text-caption text-[var(--muted-foreground)] transition-colors"
							class:m-tag-active={activeLang === lang}
							style="--accent: {accentColor};"
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
				Date Range
			</div>
			<div class="mt-1.5 flex gap-2">
				<label class="flex-1 text-caption text-[var(--muted-foreground)]">
					From
					<input
						type="date"
						bind:value={dateFrom}
						class="mt-0.5 w-full rounded border border-[var(--border-subtle)] bg-bg-primary px-1.5 py-1 font-mono text-caption text-[var(--foreground)] outline-none"
						style="color-scheme: dark;"
					/>
				</label>
				<label class="flex-1 text-caption text-[var(--muted-foreground)]">
					To
					<input
						type="date"
						bind:value={dateTo}
						class="mt-0.5 w-full rounded border border-[var(--border-subtle)] bg-bg-primary px-1.5 py-1 font-mono text-caption text-[var(--foreground)] outline-none"
						style="color-scheme: dark;"
					/>
				</label>
			</div>

			<!-- Tags -->
			<div class="mt-3 divider-dashed pt-2">
				<div class="flex flex-wrap gap-1.5">
					<button
						class="rounded px-2 py-1 text-caption transition-colors"
						class:m-active={activeTag === null}
						style="--accent: {accentColor};"
						onclick={() => onTagSelect(null)}
					>
						All
					</button>
					{#each tags as tag}
						<button
							class="rounded border border-[var(--border-subtle)] px-2 py-1 text-caption text-[var(--muted-foreground)] transition-colors"
							class:m-tag-active={activeTag === tag}
							style="--accent: {accentColor};"
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
						href={cornerLink.href}
						class="text-xs font-semibold no-underline"
						style="color: {cornerLink.href.includes('personal') ? 'var(--accent)' : 'var(--primary)'};"
					>
						{cornerLink.label} &rarr;
					</a>
					<div class="mt-0.5 text-caption italic text-[var(--muted-foreground)]">
						{cornerLink.subtitle}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>

<style>
	.m-active {
		background: var(--accent);
		color: var(--foreground);
	}
	.m-tag-active {
		border-color: var(--accent) !important;
		color: var(--accent) !important;
	}
</style>
