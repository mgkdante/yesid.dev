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
		style="background: radial-gradient(ellipse at 50% 50%, rgba(224, 120, 0, 0.06), transparent 70%);"
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
		background: #141414;
		border: 1px solid #2a2a2a;
		border-radius: 0.75rem;
		text-decoration: none;
		transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
	}

	.project-mini-card:hover {
		border-color: rgba(224, 120, 0, 0.5);
		box-shadow: 0 0 16px rgba(224, 120, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.3);
		transform: translateY(-2px);
	}

	.card-body {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-family: 'Inter', sans-serif;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary, #f5f5f0);
		transition: color 0.2s;
	}
	.project-mini-card:hover .card-title {
		color: #E07800;
	}

	.card-liner {
		margin-top: 0.375rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: #888;
	}

	.card-stack {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
		margin-top: 0.75rem;
	}

	.card-pill {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.625rem;
		padding: 0.1875rem 0.5rem;
		border: 1px solid #282828;
		border-radius: 999px;
		color: #666;
		transition: border-color 0.2s;
	}
	.project-mini-card:hover .card-pill {
		border-color: rgba(224, 120, 0, 0.3);
	}

	.card-pill-more {
		color: #E07800;
		border-color: rgba(224, 120, 0, 0.3);
	}

	.card-arrow {
		font-size: 1.125rem;
		color: #333;
		transition: color 0.2s, transform 0.2s;
		flex-shrink: 0;
	}
	.project-mini-card:hover .card-arrow {
		color: #E07800;
		transform: translateX(3px);
	}
</style>
