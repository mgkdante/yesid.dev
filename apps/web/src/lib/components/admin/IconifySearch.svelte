<script lang="ts">
	import Icon from '@iconify/svelte';

	interface Props {
		onPick: (iconifyId: string) => void;
	}

	let { onPick }: Props = $props();

	let query = $state('');
	let results = $state<string[]>([]);
	let loading = $state(false);
	let error = $state<string | null>(null);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		if (debounceTimer) clearTimeout(debounceTimer);

		if (!query.trim()) {
			results = [];
			error = null;
			return;
		}

		debounceTimer = setTimeout(async () => {
			loading = true;
			error = null;
			try {
				const res = await fetch(
					`https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=64`,
				);
				if (!res.ok) {
					throw new Error(`Iconify API error: ${res.status} ${res.statusText}`);
				}
				const data = await res.json();
				results = data.icons ?? [];
			} catch (e) {
				error = e instanceof Error ? e.message : 'Search failed';
				results = [];
			} finally {
				loading = false;
			}
		}, 250);

		return () => {
			if (debounceTimer) clearTimeout(debounceTimer);
		};
	});
</script>

<div class="iconify-search">
	<input
		type="search"
		placeholder="Search Iconify (e.g. react, postgres, home)"
		bind:value={query}
		aria-label="Search Iconify icons"
	/>

	{#if loading}
		<p class="status">Searching…</p>
	{:else if error}
		<p class="status error">Error: {error}</p>
	{:else if query.trim() && results.length === 0}
		<p class="status">No matches.</p>
	{:else if results.length > 0}
		<p class="status">{results.length} results — click any icon to copy its ID</p>
		<div class="grid">
			{#each results as iconId (iconId)}
				<button
					type="button"
					class="cell"
					onclick={() => onPick(iconId)}
					title={`Copy ${iconId}`}
				>
					<Icon icon={iconId} width={48} height={48} />
					<span class="id-text">{iconId}</span>
				</button>
			{/each}
		</div>
	{:else}
		<p class="status hint">Type to search across 150+ Iconify collections.</p>
	{/if}
</div>

<style>
	.iconify-search {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	input {
		padding: 0.75rem 1rem;
		font-size: 1rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 8px;
		background: var(--color-surface, #fff);
		color: inherit;
		width: 100%;
		max-width: 480px;
	}

	input:focus {
		outline: 2px solid var(--color-focus, #3b82f6);
		outline-offset: 2px;
	}

	.status {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
	}

	.status.error {
		color: var(--color-error, #dc2626);
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
		gap: 1rem;
	}

	.cell {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
		padding: 1rem;
		border: 1px solid var(--color-border, #e5e7eb);
		border-radius: 8px;
		background: var(--color-surface, #fff);
		cursor: pointer;
		transition: background 150ms ease;
		text-align: center;
	}

	.cell:hover {
		background: var(--color-surface-hover, #f9fafb);
	}

	.id-text {
		font-family: var(--font-mono, monospace);
		font-size: 0.7rem;
		color: var(--color-text-muted, #6b7280);
		word-break: break-all;
		line-height: 1.3;
	}
</style>
