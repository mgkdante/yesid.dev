<script lang="ts">
	import { sanitizeTableCell, stripHtml, type TableBlock } from '@repo/shared';

	let { data }: { data: TableBlock['data'] } = $props();
	const rows = $derived(data.content.map((row) => row.map(sanitizeTableCell)));
	// Name the focusable scroll region from authored copy, in the post's language.
	const label = $derived(rows[0]?.map(stripHtml).filter(Boolean).join(' · ') || 'Table');
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex (Keyboard users need to focus this overflow region to scroll it.) -->
<div class="table-scroll" role="region" aria-label={label} tabindex="0">
	<table class="table-content">
		{#if data.withHeadings && rows.length}
			<thead><tr>{#each rows[0] as cell}<th scope="col">{@html cell}</th>{/each}</tr></thead>
		{/if}
		<tbody>
			{#each data.withHeadings ? rows.slice(1) : rows as row}
				<tr>{#each row as cell}<td>{@html cell}</td>{/each}</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-scroll {
		min-width: 0;
		max-width: 100%;
		overflow-x: auto;
		margin-block: 1.5em;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
	}
	.table-scroll:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
	.table-scroll > table.table-content {
		display: table;
		width: 100%;
		border-collapse: collapse;
		font: inherit;
		color: inherit;
	}
	th, td {
		min-width: 12ch;
		padding: 0.65em 0.85em;
		text-align: start;
		vertical-align: top;
		overflow-wrap: normal;
		border: 1px solid var(--border-subtle);
	}
	th { font-weight: 600; color: var(--foreground); background: var(--card); }
</style>
