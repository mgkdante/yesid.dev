<script lang="ts">
	import ProjectCard from './ProjectCard.svelte';

	// Filtering happens at the page level — this grid renders exactly what it receives.
	// slug is used as the keyed-each identifier; slugs are guaranteed unique by data-integrity tests.
	interface ProjectCardProps {
		title: string;
		oneLiner: string;
		slug: string;
		tags: string[];
		status: 'public' | 'private' | 'wip';
	}

	let { projects }: { projects: ProjectCardProps[] } = $props();
</script>

{#if projects.length > 0}
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2" data-testid="project-grid">
		{#each projects as project (project.slug)}
			<ProjectCard
				title={project.title}
				oneLiner={project.oneLiner}
				slug={project.slug}
				tags={project.tags}
				status={project.status}
			/>
		{/each}
	</div>
{/if}
