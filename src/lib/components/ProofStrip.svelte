<!--
  ProofStrip — compact bottom strip showing related projects.
  Name + count only. Horizontally scrollable when projects overflow.
-->
<script lang="ts">
	import type { Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { Separator } from '$lib/components/ui/separator';

	let { projects }: { projects: readonly Project[] } = $props();
</script>

<div
	class="proof-strip"
	data-testid="proof-strip"
>
	<span class="proof-label label-section">Built with this</span>

	<div class="proof-projects">
		{#each projects as project (project.slug)}
			<a
				href="/work/{project.slug}"
				class="proof-link"
			>
				<span class="proof-dot" aria-hidden="true"></span>
				<span class="proof-name">{resolveLocale(project.title, 'en')}</span>
			</a>
		{/each}
	</div>

	<span class="proof-count">{projects.length} {projects.length === 1 ? 'project' : 'projects'}</span>
</div>

<!-- Hazard stripe — bottom accent -->
<Separator variant="hazard" hazardSize="sm" />

<style>
	.proof-strip {
		display: flex;
		align-items: center;
		gap: 1rem;
		border-top: 1px solid var(--border);
		background: var(--background);
		padding: 0.875rem 1.5rem;
		min-height: 48px;
	}

	.proof-label {
		flex-shrink: 0;
		font-size: var(--text-micro);
	}

	.proof-projects {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	.proof-projects::-webkit-scrollbar {
		display: none;
	}

	.proof-link {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
		text-decoration: none;
		transition: opacity var(--duration-fast);
	}
	.proof-link:hover {
		opacity: var(--opacity-muted);
	}

	.proof-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: var(--primary);
	}

	.proof-name {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--foreground);
		white-space: nowrap;
	}

	.proof-count {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--primary);
	}
</style>
