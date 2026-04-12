<!--
  ProofStrip — compact bottom strip showing related projects.
  Name + count only. Horizontally scrollable when projects overflow.
-->
<script lang="ts">
	import type { Project } from '$lib/data/types.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { HazardStripe } from '$lib/components/brand';

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
<HazardStripe size="sm" />

<style>
	.proof-strip {
		display: flex;
		align-items: center;
		gap: 1rem;
		border-top: 1px solid var(--border, #1a1a1a);
		background: var(--bg-primary, #141414);
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
		transition: opacity 0.15s;
	}
	.proof-link:hover {
		opacity: 0.75;
	}

	.proof-dot {
		width: 5px;
		height: 5px;
		border-radius: 50%;
		background: #E07800;
	}

	.proof-name {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-primary, #f5f5f0);
		white-space: nowrap;
	}

	.proof-count {
		flex-shrink: 0;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		font-weight: 700;
		color: #E07800;
	}
</style>
