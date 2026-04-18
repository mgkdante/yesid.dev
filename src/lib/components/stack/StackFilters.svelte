<!--
  Domain filter pills for the Control Room diagram.
  Toggle behavior: multiple domains active simultaneously.
  "All" resets to no filter (everything visible).
  Mobile: horizontal scroll. Desktop: flex wrap.
-->
<script lang="ts">
	import type { DomainCluster } from '$lib/types';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';

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
	<span class="filter-label label-section font-semibold">Domain</span>
	<div class="filter-pills" use:scrollChain>
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
		border-radius: var(--radius-pill);
		background: var(--muted);
		color: var(--muted-foreground);
		font-family: var(--font-body);
		font-size: var(--text-small);
		font-weight: 500;
		cursor: pointer;
		white-space: nowrap;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			background-color var(--duration-normal) var(--ease-default),
			color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default);
	}

	.filter-pill:hover {
		border-color: var(--primary);
		color: var(--foreground);
	}

	.filter-pill:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.filter-pill.active {
		border-color: var(--primary);
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		color: var(--primary);
		box-shadow: var(--shadow-glow-sm);
	}

	@media (prefers-reduced-motion: reduce) {
		.filter-pill {
			transition: none;
		}
	}
</style>
