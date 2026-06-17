<script lang="ts">
	import type { Project } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { siteLabels } from '$lib/content';
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
	import SectionIcon from '$lib/components/shared/SectionIcon.svelte';

	const locale = getLocale();
	const glanceChrome = siteLabels.projectsChrome.detail.glance;
	const glanceLinksTitle = resolveLocale(glanceChrome.links, locale);
	const liveSiteLabel = resolveLocale(glanceChrome.liveSiteLabel, locale);
	const githubLabel = resolveLocale(glanceChrome.githubLabel, locale);

	let {
		project,
		sectionKey,
		anchor = undefined,
	}: {
		project: Project;
		sectionKey: string;
		anchor?: string;
	} = $props();

	const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl);
</script>

{#if hasLinks}
	<div data-testid="project-links-card">
		<CollapsibleSection title={glanceLinksTitle} {sectionKey} {anchor} open={true}>
			{#snippet icon()}
				<SectionIcon name="arrow" />
			{/snippet}
			<div class="flex flex-col gap-2">
				{#if project.liveUrl}
					<a
						href={project.liveUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 font-mono text-mono text-primary no-underline"
					>
						<SectionIcon name="arrow" class="h-3.5 w-3.5 shrink-0" />
						{liveSiteLabel}
					</a>
				{/if}
				{#if project.repoUrl}
					<a
						href={project.repoUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center gap-2 font-mono text-mono text-primary no-underline"
					>
						<SectionIcon name="github" class="h-3.5 w-3.5 shrink-0" />
						{githubLabel}
					</a>
				{/if}
			</div>
		</CollapsibleSection>
	</div>
{/if}
