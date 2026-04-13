<!--
  Build Your Stack configurator.
  Replaces filter pills when Build mode is active.
  Domain checkboxes (1-3 selectable) that drive scenario matching.
-->
<script lang="ts">
	import type { DomainCluster } from '$lib/data/types.js';

	let {
		selectedDomains = [],
		onchange,
	}: {
		selectedDomains?: readonly DomainCluster[];
		onchange?: (domains: DomainCluster[]) => void;
	} = $props();

	const DOMAIN_OPTIONS: { id: DomainCluster; label: string; description: string }[] = [
		{ id: 'data-engineering', label: 'Data Engineering', description: 'Pipelines, ETL, warehouses' },
		{ id: 'web-development', label: 'Web Development', description: 'Full-stack web apps' },
		{ id: 'mobile-development', label: 'Mobile', description: 'Native & cross-platform' },
		{ id: 'analytics-bi', label: 'Analytics & BI', description: 'Dashboards, reporting' },
		{ id: 'systems-programming', label: 'Systems', description: 'Low-level, performance' },
		{ id: 'devops-infra', label: 'DevOps & Infra', description: 'CI/CD, containers, cloud' },
		{ id: 'internal-tooling', label: 'Internal Tooling', description: 'Admin panels, ops tools' },
	];

	const MAX_SELECTIONS = 3;
	const atLimit = $derived(selectedDomains.length >= MAX_SELECTIONS);

	function handleToggle(domain: DomainCluster) {
		const current = [...selectedDomains];
		const idx = current.indexOf(domain);

		if (idx >= 0) {
			current.splice(idx, 1);
		} else if (!atLimit) {
			current.push(domain);
		}

		onchange?.(current);
	}

	function isSelected(domain: DomainCluster): boolean {
		return selectedDomains.includes(domain);
	}

	function isDisabled(domain: DomainCluster): boolean {
		return atLimit && !selectedDomains.includes(domain);
	}
</script>

<div class="configurator" data-testid="stack-configurator" role="group" aria-label="Build Your Stack — select up to 3 domains">
	<div class="configurator-header">
		<span class="configurator-heading">What do you need?</span>
		<span class="configurator-hint">
			{selectedDomains.length}/{MAX_SELECTIONS} selected
		</span>
	</div>

	<div class="domain-grid">
		{#each DOMAIN_OPTIONS as { id, label, description } (id)}
			<button
				type="button"
				class="domain-option"
				class:selected={isSelected(id)}
				class:disabled={isDisabled(id)}
				data-testid="configurator-{id}"
				aria-pressed={isSelected(id)}
				disabled={isDisabled(id)}
				onclick={() => handleToggle(id)}
			>
				<span class="domain-label">{label}</span>
				<span class="domain-desc">{description}</span>
			</button>
		{/each}
	</div>
</div>

<style>
	.configurator {
		padding-block: 0.75rem;
		margin-bottom: 0.5rem;
	}

	.configurator-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}

	.configurator-heading {
		font-family: var(--font-heading);
		font-size: var(--text-base);
		font-weight: 600;
		color: var(--text-primary);
	}

	.configurator-hint {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--text-muted);
	}

	.domain-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.domain-option {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
		padding: 0.5rem 0.875rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-surface);
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			background-color var(--duration-normal) var(--ease-default),
			opacity var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default);
	}

	.domain-option:hover:not(.disabled) {
		border-color: var(--brand-primary);
	}

	.domain-option:focus-visible {
		outline: 2px solid var(--brand-primary);
		outline-offset: 2px;
	}

	.domain-option.selected {
		border-color: var(--brand-primary);
		background: color-mix(in srgb, var(--brand-primary) 10%, transparent);
		box-shadow: var(--shadow-glow-sm);
	}

	.domain-option.disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.domain-label {
		font-family: var(--font-body);
		font-size: var(--text-small);
		font-weight: 600;
		color: var(--text-primary);
	}

	.domain-option.selected .domain-label {
		color: var(--brand-primary);
	}

	.domain-desc {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		color: var(--text-muted);
	}

	@media (prefers-reduced-motion: reduce) {
		.domain-option {
			transition: none;
		}
	}
</style>
