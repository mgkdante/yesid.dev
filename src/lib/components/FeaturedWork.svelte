<!--
  Featured projects showcase: shows 2-3 featured public projects.
  Station header "STOP 05 — FEATURED WORK" in accent yellow.
-->
<script lang="ts">
	import { getFeaturedProjects } from '$lib/data/projects.js';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import ProjectCard from './ProjectCard.svelte';

	// Only show public featured projects
	const featured = getFeaturedProjects().filter((p) => p.status !== 'private');
</script>

<section
	class="relative mx-auto flex max-w-5xl flex-col px-6 py-24 pr-10 md:pr-[72px]"
	data-testid="section-featured-work"
	use:reveal
>
	<div class="grid gap-4 sm:grid-cols-2">
		{#each featured as project, i (project.slug)}
			<div use:reveal={{ delay: stagger(i, 120) }}>
				<ProjectCard
					slug={project.slug}
					title={resolveLocale(project.title, 'en')}
					oneLiner={resolveLocale(project.oneLiner, 'en')}
					tags={project.stack}
					status={project.status}
				/>
			</div>
		{/each}
	</div>
</section>
