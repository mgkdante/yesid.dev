<!--
  Domain filter pills for the Control Room diagram.
  Toggle behavior: multiple domains active simultaneously.
  "All" resets to no filter (everything visible).
  Mobile: horizontal scroll. Desktop: flex wrap.
-->
<script lang="ts">
	import type { DomainCluster } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { techStackVizContent } from '$lib/content/tech-stack';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';

	let {
		activeDomains = [],
		onchange,
	}: {
		activeDomains?: readonly DomainCluster[];
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

	const f = techStackVizContent.filters;
	const sectionLabel = resolveLocale(f.sectionLabel, 'en');
	const allLabel = resolveLocale(f.filterAll, 'en');
	const toolbarAria = resolveLocale(f.toolbarAria, 'en');
	function labelFor(domain: DomainCluster): string {
		return resolveLocale(f.domainLabels[domain], 'en');
	}

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

<div class="stack-filters" data-testid="stack-filters" role="toolbar" aria-label={toolbarAria}>
	<span class="filter-label label-section font-semibold">{sectionLabel}</span>
	<div class="filter-pills" use:scrollChain>
		<button
			type="button"
			class="filter-pill"
			class:active={isAllActive}
			data-testid="filter-all"
			aria-pressed={isAllActive}
			onclick={handleAllClick}
		>
			{allLabel}
		</button>

		{#each DOMAIN_ORDER as id (id)}
			<button
				type="button"
				class="filter-pill"
				class:active={activeDomains.includes(id)}
				data-testid="filter-{id}"
				aria-pressed={activeDomains.includes(id)}
				onclick={() => handleDomainClick(id)}
			>
				{labelFor(id)}
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
