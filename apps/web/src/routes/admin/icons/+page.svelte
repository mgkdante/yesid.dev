<script lang="ts">
	import IconRenderer from '$lib/components/cms/IconRenderer.svelte';
	import IconifySearch from '$lib/components/admin/IconifySearch.svelte';
	import type { IconRecord } from '@repo/shared';

	interface Props {
		data: { icons: IconRecord[] };
	}

	let { data }: Props = $props();

	// Tracks which cell was most recently clicked for brief highlight feedback.
	let copiedId = $state<string | null>(null);

	function copyToClipboard(text: string) {
		if (!text) return;
		navigator.clipboard.writeText(text).then(() => {
			copiedId = text;
			setTimeout(() => {
				copiedId = null;
			}, 600);
		});
	}
</script>

<svelte:head>
	<title>Icons — yesid.dev admin</title>
</svelte:head>

<main class="admin-icons">
	<header class="page-header">
		<h1>Icons</h1>
		<p class="subtitle">Curated icons we use across the site, plus Iconify search for adding new ones.</p>
		<p class="hint">
			Click any icon below to copy its <code>iconify_id</code>. Then paste into Data Studio:
			<strong>Content → Icons → New row → iconify_id field</strong>.
		</p>
	</header>

	<section class="curated">
		<h2>Curated ({data.icons.length})</h2>
		<div class="grid">
			{#each data.icons as icon (icon.id)}
				<button
					type="button"
					class="cell"
					class:copied={copiedId === (icon.iconify_id ?? '')}
					onclick={() => copyToClipboard(icon.iconify_id ?? '')}
					disabled={!icon.iconify_id}
					title={icon.iconify_id ? `Copy ${icon.iconify_id}` : 'No iconify_id (deferred — see notes)'}
				>
					<IconRenderer {icon} size={48} />
					<span class="name">{icon.name}</span>
					<span class="id-text">{icon.iconify_id ?? '— deferred —'}</span>
				</button>
			{/each}
		</div>
	</section>

	<section class="search">
		<h2>Search Iconify</h2>
		<IconifySearch onPick={copyToClipboard} />
	</section>
</main>

<style>
	.admin-icons {
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: 2rem;
	}

	h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 600;
		margin: 0 0 1rem;
	}

	.subtitle {
		margin: 0 0 0.5rem;
		color: var(--color-text-muted, #6b7280);
	}

	.hint {
		margin: 0;
		font-size: 0.875rem;
		color: var(--color-text-muted, #6b7280);
	}

	code {
		font-family: var(--font-mono, monospace);
		background: var(--color-surface-muted, #e5e7eb);
		padding: 0.1em 0.3em;
		border-radius: 3px;
		font-size: 0.875em;
	}

	.curated {
		margin-bottom: 3rem;
	}

	.search {
		margin-bottom: 3rem;
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
		transition: background 150ms ease, border-color 150ms ease;
		text-align: center;
	}

	.cell:hover:not(:disabled) {
		background: var(--color-surface-hover, #f9fafb);
	}

	.cell:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.cell.copied {
		border-color: var(--color-success, #16a34a);
		background: var(--color-success-muted, #f0fdf4);
	}

	.name {
		font-weight: 500;
		font-size: 0.875rem;
		line-height: 1.3;
		word-break: break-word;
	}

	.id-text {
		font-family: var(--font-mono, monospace);
		font-size: 0.7rem;
		color: var(--color-text-muted, #6b7280);
		word-break: break-all;
		line-height: 1.3;
	}
</style>
