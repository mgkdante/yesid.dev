<!--
  Domain filter pills for the Control Room diagram.
  Toggle behavior: multiple domains active simultaneously.
  "All" resets to no filter (everything visible).
  Mobile: horizontal scroll. Desktop: flex wrap.
-->
<script lang="ts">
	import type { DomainCluster } from '$lib/data/types.js';

	let {
		activeDomains = [],
		onchange,
	}: {
		activeDomains?: readonly DomainCluster[];
		onchange?: (domains: DomainCluster[]) => void;
	} = $props();

	const DOMAIN_LABELS: { id: DomainCluster; label: string }[] = [
		{ id: 'data-engineering', label: 'Data Engineering' },
		{ id: 'web-development', label: 'Web Dev' },
		{ id: 'mobile-development', label: 'Mobile' },
		{ id: 'analytics-bi', label: 'Analytics' },
		{ id: 'systems-programming', label: 'Systems' },
		{ id: 'devops-infra', label: 'DevOps' },
		{ id: 'internal-tooling', label: 'Internal Tooling' },
	];

	const isAllActive = $derived(activeDomains.length === 0);

	function handleAllClick() {
		onchange?.([]);
	}

	function handleDomainClick(domain: DomainCluster) {
		const current = [...activeDomains];
		const idx = current.indexOf(domain);

		if (idx >= 0) {
			current.splice(idx, 1);
		} else {
			current.push(domain);
		}

		onchange?.(current);
	}
</script>

<div class="stack-filters" data-testid="stack-filters" role="toolbar" aria-label="Filter by domain">
	<span class="filter-label">Domain</span>
	<div class="filter-pills">
		<button
			type="button"
			class="filter-pill"
			class:active={isAllActive}
			data-testid="filter-all"
			aria-pressed={isAllActive}
			onclick={handleAllClick}
		>
			All
		</button>

		{#each DOMAIN_LABELS as { id, label } (id)}
			<button
				type="button"
				class="filter-pill"
				class:active={activeDomains.includes(id)}
				data-testid="filter-{id}"
				aria-pressed={activeDomains.includes(id)}
				onclick={() => handleDomainClick(id)}
			>
				{label}
			</button>
		{/each}
	</div>
</div>

<style>
	.stack-filters {
		padding-block: 0.75rem;
		margin-bottom: 0.5rem;
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.filter-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.filter-pills {
		display: flex;
		gap: 0.5rem;
		overflow-x: auto;
		scrollbar-width: none;
		-webkit-overflow-scrolling: touch;
		padding-inline: 0.25rem;
	}

	.filter-pills::-webkit-scrollbar {
		display: none;
	}

	@media (min-width: 768px) {
		.filter-pills {
			flex-wrap: wrap;
			overflow-x: visible;
		}
	}

	.filter-pill {
		flex-shrink: 0;
		padding: 0.375rem 0.875rem;
		border: 1px solid var(--border);
		border-radius: 9999px;
		background: var(--bg-surface);
		color: var(--text-muted);
		font-family: var(--font-body);
		font-size: var(--text-small);
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition:
			border-color 0.2s ease,
			background-color 0.2s ease,
			color 0.2s ease,
			box-shadow 0.2s ease;
	}

	.filter-pill:hover {
		border-color: var(--brand-primary);
		color: var(--text-primary);
	}

	.filter-pill:focus-visible {
		outline: 2px solid var(--brand-primary);
		outline-offset: 2px;
	}

	.filter-pill.active {
		border-color: var(--brand-primary);
		background: color-mix(in srgb, var(--brand-primary) 15%, transparent);
		color: var(--brand-primary);
		box-shadow: 0 0 8px color-mix(in srgb, var(--brand-primary) 15%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.filter-pill {
			transition: none;
		}
	}
</style>
