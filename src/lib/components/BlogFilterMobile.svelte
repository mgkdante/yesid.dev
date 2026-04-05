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
		accentColor = '#E07800',
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
			<span class="text-[8px]">{open ? '\u25B2' : '\u25BC'}</span>
		</button>
		<span class="text-[10px] text-[var(--text-muted)]">
			Showing: {activeTag ?? 'All'}{activeLang ? ` · ${activeLang.toUpperCase()}` : ''}
		</span>
	</div>

	{#if open}
		<div class="mb-4 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-3">
			<!-- Language filter -->
			{#if languages.length > 1}
				<div class="font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
					Language
				</div>
				<div class="mt-1.5 flex gap-1.5">
					<button
						class="rounded px-2 py-1 text-[10px] transition-colors"
						class:m-active={activeLang === null}
						style="--accent: {accentColor};"
						onclick={() => onLangSelect(null)}
					>
						All
					</button>
					{#each languages as lang}
						<button
							class="rounded border border-[#2a2a2a] px-2 py-1 text-[10px] text-[var(--text-muted)] transition-colors"
							class:m-tag-active={activeLang === lang}
							style="--accent: {accentColor};"
							onclick={() => onLangSelect(lang)}
						>
							{LANG_LABELS[lang]}
						</button>
					{/each}
				</div>
				<div class="mt-2 border-t border-dashed border-[#333]"></div>
			{/if}

			<!-- Date range -->
			<div class="mt-2 font-mono text-[9px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
				Date Range
			</div>
			<div class="mt-1.5 flex gap-2">
				<label class="flex-1 text-[9px] text-[var(--text-muted)]">
					From
					<input
						type="date"
						bind:value={dateFrom}
						class="mt-0.5 w-full rounded border border-[#2a2a2a] bg-[#141414] px-1.5 py-1 font-mono text-[10px] text-[var(--text-primary)] outline-none"
						style="color-scheme: dark;"
					/>
				</label>
				<label class="flex-1 text-[9px] text-[var(--text-muted)]">
					To
					<input
						type="date"
						bind:value={dateTo}
						class="mt-0.5 w-full rounded border border-[#2a2a2a] bg-[#141414] px-1.5 py-1 font-mono text-[10px] text-[var(--text-primary)] outline-none"
						style="color-scheme: dark;"
					/>
				</label>
			</div>

			<!-- Tags -->
			<div class="mt-3 border-t border-dashed border-[#333] pt-2">
				<div class="flex flex-wrap gap-1.5">
					<button
						class="rounded px-2 py-1 text-[10px] transition-colors"
						class:m-active={activeTag === null}
						style="--accent: {accentColor};"
						onclick={() => onTagSelect(null)}
					>
						All
					</button>
					{#each tags as tag}
						<button
							class="rounded border border-[#2a2a2a] px-2 py-1 text-[10px] text-[var(--text-muted)] transition-colors"
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
				<div class="mt-3 border-t border-dashed border-[#333] pt-2">
					<a
						href={cornerLink.href}
						class="text-xs font-semibold no-underline"
						style="color: {cornerLink.href.includes('personal') ? '#FFB627' : '#E07800'};"
					>
						{cornerLink.label} &rarr;
					</a>
					<div class="mt-0.5 text-[8px] italic text-[var(--text-muted)]">
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
		color: #f5f5f0;
	}
	.m-tag-active {
		border-color: var(--accent) !important;
		color: var(--accent) !important;
	}
</style>
