<!--
  Build Your Stack configurator.
  Replaces filter pills when Build mode is active.
  Domain checkboxes (1-3 selectable) that drive scenario matching.
-->
<script lang="ts">
	import type { DomainCluster } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { techStackVizContent } from '$lib/content/tech-stack';

	let {
		selectedDomains = [],
		onchange,
	}: {
		selectedDomains?: readonly DomainCluster[];
		onchange?: (domains: DomainCluster[]) => void;
	} = $props();

	const DOMAIN_ORDER: readonly DomainCluster[] = [
		'data-engineering',
		'web-development',
		'mobile-development',
		'analytics-bi',
		'systems-programming',
		'devops-infra',
		'internal-tooling',
	] as const;

	const c = techStackVizContent.configurator;
	const heading = resolveLocale(c.heading, 'en');
	const groupAria = resolveLocale(c.groupAria, 'en');
	const selectionCountTemplate = resolveLocale(c.selectionCountTemplate, 'en');

	const MAX_SELECTIONS = 3;
	const atLimit = $derived(selectedDomains.length >= MAX_SELECTIONS);
	const selectionCount = $derived(
		selectionCountTemplate
			.replace('{count}', String(selectedDomains.length))
			.replace('{max}', String(MAX_SELECTIONS))
	);

	function labelFor(domain: DomainCluster): string {
		return resolveLocale(c.domains[domain].label, 'en');
	}
	function descriptionFor(domain: DomainCluster): string {
		return resolveLocale(c.domains[domain].description, 'en');
	}

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

<div class="configurator" data-testid="stack-configurator" role="group" aria-label={groupAria}>
	<div class="configurator-header">
		<span class="configurator-heading">{heading}</span>
		<span class="configurator-hint">
			{selectionCount}
		</span>
	</div>

	<div class="domain-grid">
		{#each DOMAIN_ORDER as id (id)}
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
				<span class="domain-label">{labelFor(id)}</span>
				<span class="domain-desc">{descriptionFor(id)}</span>
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
		color: var(--foreground);
	}

	.configurator-hint {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
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
		background: var(--muted);
		cursor: pointer;
		text-align: left;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			background-color var(--duration-normal) var(--ease-default),
			opacity var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default);
	}

	.domain-option:hover:not(.disabled) {
		border-color: var(--primary);
	}

	.domain-option:focus-visible {
		outline: 2px solid var(--primary);
		outline-offset: 2px;
	}

	.domain-option.selected {
		border-color: var(--primary);
		background: color-mix(in srgb, var(--primary) 10%, transparent);
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
		color: var(--foreground);
	}

	.domain-option.selected .domain-label {
		color: var(--primary);
	}

	.domain-desc {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
	}

	@media (prefers-reduced-motion: reduce) {
		.domain-option {
			transition: none;
		}
	}
</style>
