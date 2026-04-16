<!--
  Reusable project card for use OUTSIDE /projects pages (service detail, home, etc.).
  Compact card with title, one-liner, stack pills, and hover effect.
  Links to /projects/[slug].
-->
<script lang="ts">
	import type { Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { Card } from '$lib/components/ui/card';

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
	href="/projects/{project.slug}"
	class="group block"
	data-testid="project-mini-card"
	use:reveal={{ direction: 'up', delay: 50 + index * 80 }}
>
	<Card class="flex items-center gap-4 px-6 py-5">
		<!-- Radial-gradient glow overlay — matches standard card hover system -->
		<div
			class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
			style="background: radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--primary) 6%, transparent), transparent 70%);"
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
	</Card>
</a>

<style>
	.card-body {
		flex: 1;
		min-width: 0;
	}

	.card-title {
		font-family: var(--font-heading);
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--foreground);
		transition: color var(--duration-normal);
	}
	:global([data-slot="card"]:hover) .card-title {
		color: var(--primary);
	}

	.card-liner {
		margin-top: 0.375rem;
		font-size: 0.8125rem;
		line-height: 1.5;
		color: var(--secondary-foreground);
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
		color: var(--muted-foreground);
		transition: border-color var(--duration-normal);
	}
	:global([data-slot="card"]:hover) .card-pill {
		border-color: color-mix(in srgb, var(--primary) 30%, transparent);
	}

	.card-pill-more {
		color: var(--primary);
		border-color: color-mix(in srgb, var(--primary) 30%, transparent);
	}

	.card-arrow {
		font-size: 1.125rem;
		color: var(--border-strong);
		transition: color var(--duration-normal), transform var(--duration-normal);
		flex-shrink: 0;
	}
	:global([data-slot="card"]:hover) .card-arrow {
		color: var(--primary);
		transform: translateX(3px);
	}
</style>
