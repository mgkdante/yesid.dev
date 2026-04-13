<!--
  Reusable project card for use OUTSIDE /work pages (service detail, home, etc.).
  Compact card with title, one-liner, stack pills, and hover effect.
  Links to /work/[slug].
-->
<script lang="ts">
	import type { Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';

	let {
		project,
		index = 0
	}: {
		project: Project;
		index?: number;
	} = $props();

	let title = $derived(resolveLocale(project.title, 'en'));
	let oneLiner = $derived(resolveLocale(project.oneLiner, 'en'));
	let displayStack = $derived(project.stack.slice(0, 4));
</script>

<a
	href="/work/{project.slug}"
	class="project-mini-card group relative overflow-hidden"
	data-testid="project-mini-card"
	use:reveal={{ direction: 'up', delay: 50 + index * 80 }}
>
	<!-- Radial-gradient glow overlay — matches standard card hover system -->
	<div
		class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		style="background: radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--brand-primary) 6%, transparent), transparent 70%);"
	></div>

	<div class="card-body">
		<h3 class="card-title">{title}</h3>
		<p class="card-liner">{oneLiner}</p>

		{#if displayStack.length > 0}
			<div class="card-stack">
				{#each displayStack as tech}
					<span class="card-pill">{tech}</span>
				{/each}
				{#if project.stack.length > 4}
					<span class="card-pill card-pill-more">+{project.stack.length - 4}</span>
				{/if}
			</div>
		{/if}
	</div>

	<span class="card-arrow" aria-hidden="true">&rarr;</span>
</a>

<style>
	.project-mini-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1.25rem 1.5rem;
		background: var(--bg-primary);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-lg);
		text-decoration: none;
		transition: border-color var(--duration-slow) var(--ease-default), box-shadow var(--duration-slow) var(--ease-default), transform var(--duration-slow) var(--ease-default);
	}

	.project-mini-card:hover {
		border-color: color-mix(in srgb, var(--brand-primary) 50%, transparent);
		box-shadow: var(--shadow-card);
		transform: translateY(-2px);
	}

	.card-body {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-family: var(--font-heading);
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary);
		transition: color var(--duration-normal);
	}
	.project-mini-card:hover .card-title {
		color: var(--brand-primary);
	}

	.card-liner {
		margin-top: 0.375rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--text-secondary);
	}

	.card-stack {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.75rem;
	}

	.card-pill {
		font-family: var(--font-mono);
		font-size: 0.625rem;
		padding: 0.1875rem 0.5rem;
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-pill);
		color: var(--text-muted);
		transition: border-color var(--duration-normal);
	}
	.project-mini-card:hover .card-pill {
		border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent);
	}

	.card-pill-more {
		color: var(--brand-primary);
		border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent);
	}

	.card-arrow {
		font-size: 1.125rem;
		color: var(--border-strong);
		transition: color var(--duration-normal), transform var(--duration-normal);
		flex-shrink: 0;
	}
	.project-mini-card:hover .card-arrow {
		color: var(--brand-primary);
		transform: translateX(3px);
	}
</style>
