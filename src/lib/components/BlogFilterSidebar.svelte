<!--
  Desktop sidebar: language filter + date range + tag filters + corner link.
  Hidden on mobile — BlogFilterMobile handles that.
-->
<script lang="ts">
	import type { Locale } from '$lib/data/types.js';

	const LANG_LABELS: Record<Locale, string> = { en: 'English', fr: 'Fran\u00e7ais', es: 'Espa\u00f1ol' };

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
</script>

<aside class="hidden w-40 shrink-0 md:block" data-testid="blog-filter-sidebar">
	<!-- Language filter -->
	{#if languages.length > 1}
		<div class="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
			Language
		</div>
		<div class="mt-2 flex flex-col gap-1 mb-5">
			<button
				class="rounded px-2 py-1 text-left text-xs transition-colors"
				class:active={activeLang === null}
				style="--accent: {accentColor};"
				onclick={() => onLangSelect(null)}
			>
				All
			</button>
			{#each languages as lang}
				<button
					class="rounded border border-[#2a2a2a] px-2 py-1 text-left text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
					class:tag-active={activeLang === lang}
					style="--accent: {accentColor};"
					onclick={() => onLangSelect(lang)}
				>
					{LANG_LABELS[lang]}
				</button>
			{/each}
		</div>
	{/if}

	<!-- Date range -->
	<div class="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
		Date Range
	</div>
	<div class="mt-2 flex flex-col gap-1.5">
		<label class="text-[9px] text-[var(--text-muted)]">
			From
			<input
				type="date"
				bind:value={dateFrom}
				class="mt-0.5 w-full rounded border border-[#2a2a2a] bg-[#141414] px-1.5 py-1 font-mono text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
				style="--accent: {accentColor}; color-scheme: dark;"
			/>
		</label>
		<label class="text-[9px] text-[var(--text-muted)]">
			To
			<input
				type="date"
				bind:value={dateTo}
				class="mt-0.5 w-full rounded border border-[#2a2a2a] bg-[#141414] px-1.5 py-1 font-mono text-[10px] text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
				style="--accent: {accentColor}; color-scheme: dark;"
			/>
		</label>
	</div>

	<!-- Tags -->
	<div class="mt-5 border-t border-dashed border-[#333] pt-3">
		<div class="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
			Tags
		</div>
		<div class="mt-2 flex flex-col gap-1">
			<button
				class="rounded px-2 py-1 text-left text-xs transition-colors"
				class:active={activeTag === null}
				style="--accent: {accentColor};"
				onclick={() => onTagSelect(null)}
			>
				All
			</button>
			{#each tags as tag}
				<button
					class="rounded border border-[#2a2a2a] px-2 py-1 text-left text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
					class:tag-active={activeTag === tag}
					style="--accent: {accentColor};"
					onclick={() => onTagSelect(tag)}
				>
					{tag}
				</button>
			{/each}
		</div>
	</div>

	<!-- Corner link -->
	{#if cornerLink}
		<div class="mt-5 border-t border-dashed border-[#333] pt-3">
			<a
				href={cornerLink.href}
				class="flex items-center gap-1.5 rounded border px-2 py-1.5 text-xs font-semibold no-underline transition-colors"
				style="border-color: {cornerLink.href.includes('personal') ? '#FFB627' : '#E07800'}; color: {cornerLink.href.includes('personal') ? '#FFB627' : '#E07800'};"
			>
				{cornerLink.label}
			</a>
			<div class="mt-1 pl-2 text-[9px] italic text-[var(--text-muted)]">
				{cornerLink.subtitle}
			</div>
		</div>
	{/if}
</aside>

<style>
	.active {
		background: var(--accent);
		color: #f5f5f0;
	}
	.tag-active {
		border-color: var(--accent) !important;
		color: var(--accent) !important;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
</style>
