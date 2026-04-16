<!--
  SearchInput — Shared search input for listing pages.
  Used in both mobile (inline) and sidebar (sideLeft) contexts.
-->
<script lang="ts">
	export interface SearchInputProps {
		placeholder?: string;
		value?: string;
		testId?: string;
	}

	let {
		placeholder = 'Search...',
		value = $bindable(''),
		testId = 'search-input'
	}: SearchInputProps = $props();
</script>

<div class="relative">
	<input
		type="text"
		{placeholder}
		bind:value
		class="w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] px-4 py-2.5 pl-10 font-mono text-sm text-[var(--foreground)] placeholder-[var(--muted-foreground)] outline-none transition-colors focus:border-[var(--accent)] focus:shadow-[0_0_12px_color-mix(in_srgb,var(--accent)_15%,transparent)]"
		data-testid={testId}
	/>
	<svg class="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)]" width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
		<circle cx="7" cy="7" r="5"/>
		<line x1="11" y1="11" x2="14" y2="14"/>
	</svg>
</div>
