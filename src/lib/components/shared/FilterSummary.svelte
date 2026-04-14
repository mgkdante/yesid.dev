<!--
  FilterSummary — Shared "N results" count + "clear filters" button.
  Used in both Blog and Projects listing pages.
-->
<script lang="ts">
	export interface FilterSummaryProps {
		count: number;
		noun?: string;
		onClear: () => void;
	}

	let {
		count,
		noun = 'result',
		onClear
	}: FilterSummaryProps = $props();
</script>

<div class="mb-3 flex items-center gap-2">
	<span class="text-xs text-[var(--muted-foreground)]">
		{count} {noun}{count !== 1 ? 's' : ''}
	</span>
	<button
		class="font-mono text-caption text-primary underline transition-colors hover:text-[var(--foreground)]"
		onclick={onClear}
	>
		clear filters
	</button>
</div>
