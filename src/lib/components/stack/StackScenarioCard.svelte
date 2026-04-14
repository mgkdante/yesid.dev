<!--
  Scenario summary card for Build Your Stack mode.
  Shows a mini flow of recommended tech, one-paragraph description,
  project links, and a CTA button.
-->
<script lang="ts">
	import type { StackScenario } from '$lib/data/types.js';
	import { getTechItemById } from '$lib/data/tech-stack.js';
	import { onMount } from 'svelte';
	import { gsap } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { Button } from '$lib/components/ui/button';

	let {
		scenario,
	}: {
		scenario: StackScenario;
	} = $props();

	let cardEl = $state<HTMLElement | null>(null);

	// Resolve recommended tech names for the mini flow
	const recommendedItems = $derived(
		scenario.recommended
			.map((id) => getTechItemById(id))
			.filter((item) => item !== undefined)
	);

	function formatProjectSlug(slug: string): string {
		if (slug === 'yesid-dev') return 'yesid.dev';
		return slug
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	onMount(() => {
		if (cardEl && !isPrefersReducedMotion()) {
			gsap.fromTo(
				cardEl,
				{ y: 30, opacity: 0 },
				{ y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
			);
		}
	});
</script>

<div class="scenario-card" bind:this={cardEl} data-testid="scenario-card">
	<!-- Mini flow: recommended tech in order, connected by arrows -->
	<div class="mini-flow" data-testid="scenario-flow">
		{#each recommendedItems as item, i (item.id)}
			{#if i > 0}
				<span class="flow-arrow" aria-hidden="true">
					<svg width="16" height="10" viewBox="0 0 16 10" fill="none">
						<path d="M0 5H14M14 5L10 1M14 5L10 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
					</svg>
				</span>
			{/if}
			<span class="flow-node" title={item.name}>
				<span class="flow-icon" aria-hidden="true">{item.name.slice(0, 2).toUpperCase()}</span>
				<span class="flow-name">{item.name}</span>
			</span>
		{/each}
	</div>

	<!-- Summary text -->
	<p class="scenario-summary">{scenario.summary.en}</p>

	<!-- Project links -->
	{#if scenario.relatedProjects.length > 0}
		<div class="scenario-projects">
			<span class="projects-label label-section font-semibold">Proven in</span>
			<div class="project-badges">
				{#each scenario.relatedProjects as slug}
					<span class="project-badge">{formatProjectSlug(slug)}</span>
				{/each}
			</div>
		</div>
	{/if}

	<!-- CTA -->
	<div class="mt-4">
		<Button variant="default" size="cta-sm" href="/contact" data-testid="scenario-cta">
			Let's build this <span aria-hidden="true">&rarr;</span>
		</Button>
	</div>
</div>

<style>
	.scenario-card {
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		background: var(--muted);
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	/* --- Mini flow --- */

	.mini-flow {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		overflow-x: auto;
		scrollbar-width: none;
		padding-block: 0.25rem;
	}

	.mini-flow::-webkit-scrollbar {
		display: none;
	}

	.flow-node {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
		padding: 0.375rem 0.625rem;
		border: 1px solid color-mix(in srgb, var(--primary) 40%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--primary) 8%, transparent);
	}

	.flow-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: 0.625rem;
		font-weight: 700;
	}

	.flow-name {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		font-weight: 600;
		color: var(--foreground);
		white-space: nowrap;
	}

	.flow-arrow {
		color: var(--primary);
		flex-shrink: 0;
		opacity: var(--opacity-muted);
	}

	/* --- Summary --- */

	.scenario-summary {
		font-family: var(--font-body);
		font-size: var(--text-small);
		line-height: 1.7;
		color: var(--secondary-foreground);
		margin: 0;
	}

	/* --- Projects --- */

	.scenario-projects {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.projects-label {
		white-space: nowrap;
	}

	.project-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.project-badge {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		padding: 0.1875rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--secondary-foreground);
		background: var(--popover);
	}


</style>
