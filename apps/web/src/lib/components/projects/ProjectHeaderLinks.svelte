<!-- A project's proof links (live site, repository, documentation) in its page header. -->
<script lang="ts">
	import { trackAnalyticsEvent } from '#lib/analytics/client.ts';
	import type { Project } from '#lib/types.ts';
	import { isProjectProofHref } from '#lib/utils/high-intent-links.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { siteLabels } from '#lib/content/index.ts';
	import { SectionIcon } from '@yesid/ui/brand';
	import Globe from '@lucide/svelte/icons/globe';
	import BookOpen from '@lucide/svelte/icons/book-open';

	const locale = getLocale();
	const glanceChrome = siteLabels.projectsChrome.detail.glance;
	const linksLabel = resolveLocale(glanceChrome.links, locale);
	const liveSiteLabel = resolveLocale(glanceChrome.liveSiteLabel, locale);
	const githubLabel = resolveLocale(glanceChrome.githubLabel, locale);
	const docsLabel = resolveLocale(glanceChrome.docsLabel, locale);
	const repoPrivateLabel = resolveLocale(glanceChrome.repoPrivateLabel, locale);

	let { project }: { project: Project } = $props();

	function handleProjectProofClick(href: string | undefined, link: 'live' | 'repo' | 'docs'): void {
		if (href && isProjectProofHref(href)) {
			trackAnalyticsEvent('project_proof_click', { link });
		}
	}

	const hasLinks = $derived(!!project.liveUrl || !!project.repoUrl || !!project.docsUrl || !!project.repoPrivate);
</script>

{#if hasLinks}
	<ul class="project-links" data-testid="project-links-card" aria-label={linksLabel}>
		{#if project.liveUrl}
			<li>
				<a
					href={project.liveUrl}
					target="_blank"
					rel="noopener noreferrer"
					onclick={() => handleProjectProofClick(project.liveUrl, 'live')}
				>
					<Globe class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					{liveSiteLabel}
				</a>
			</li>
		{/if}
		{#if project.repoUrl && !project.repoPrivate}
			<li>
				<a
					href={project.repoUrl}
					target="_blank"
					rel="noopener noreferrer"
					onclick={() => handleProjectProofClick(project.repoUrl, 'repo')}
				>
					<SectionIcon name="github" class="h-3.5 w-3.5 shrink-0" />
					{githubLabel}
				</a>
			</li>
		{:else if project.repoPrivate}
			<!-- Private repositories render as non-links to avoid sending visitors to a 404. -->
			<li>
				<span data-testid="project-repo-private" class="project-links__private">
					<SectionIcon name="github" class="h-3.5 w-3.5 shrink-0" />
					{repoPrivateLabel}
				</span>
			</li>
		{/if}
		{#if project.docsUrl}
			<li>
				<a
					href={project.docsUrl}
					target="_blank"
					rel="noopener noreferrer"
					onclick={() => handleProjectProofClick(project.docsUrl, 'docs')}
					data-testid="project-docs-link"
				>
					<BookOpen class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
					{docsLabel}
				</a>
			</li>
		{/if}
	</ul>
{/if}

<style>
	.project-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0 1.5rem;
		margin: 0;
		padding: 0;
		list-style: none;
	}
	.project-links a,
	.project-links__private {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		min-height: var(--size-tap-min);
		font-family: var(--font-mono);
		font-size: var(--text-mono);
	}
	.project-links a {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.project-links a:hover { color: var(--accent-text); }
	.project-links a:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
	.project-links__private { color: var(--secondary-foreground); }
</style>
