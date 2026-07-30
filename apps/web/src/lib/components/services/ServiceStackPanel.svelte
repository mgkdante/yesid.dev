<!--
  Stack + related-projects fragment shared by the service detail desktop rail
  and mobile block. `variant` is mount-stable: CollapsibleSection captures its
  persistence key once at initialization, so callers must remount rather than
  change the variant on a live instance.
  The duplicate related-projects nav aria-label across variants is intentional:
  display:none removes the inactive variant from the accessibility tree.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import type { Locale, Project } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { boop, pressBounce } from '@yesid/motion/actions';
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
	import SectionIcon from '$lib/components/shared/SectionIcon.svelte';

	let {
		variant,
		stack,
		relatedProjects,
		locale,
		stackLabel,
		seeStackLabel,
		relatedProjectsHeading,
		relatedProjectsAria,
		seeAllProjectsLabel,
	}: {
		variant: 'desktop' | 'mobile';
		stack: readonly string[];
		relatedProjects: readonly Project[];
		locale: Locale;
		stackLabel: string;
		seeStackLabel: string;
		relatedProjectsHeading: string;
		relatedProjectsAria: string;
		seeAllProjectsLabel: string;
	} = $props();

	const mountVariant = untrack(() => variant);
	const stackKey = `svc-stack-${mountVariant}`;
	const relatedKey = `svc-related-${mountVariant}`;
	const stackAnchor = mountVariant === 'mobile' ? 'svc-stack' : undefined;
	const relatedAnchor = mountVariant === 'mobile' ? 'svc-related' : undefined;
</script>

{#if stack?.length}
	<CollapsibleSection
		title="{stackLabel} ({stack.length})"
		sectionKey={stackKey}
		anchor={stackAnchor}
		open={true}
	>
		{#snippet icon()}
			<SectionIcon name="layers" class="h-4 w-4 shrink-0 text-primary" />
		{/snippet}
		<div class="stack-pills">
			{#each stack as tech}
				<span class="stack-pill">{tech}</span>
			{/each}
		</div>
		<a href={localizeHref('/tech-stack', locale)} class="projects-all tap-feedback">
			{seeStackLabel}
		</a>
	</CollapsibleSection>
{/if}
{#if relatedProjects.length}
	<CollapsibleSection
		title="{relatedProjectsHeading} ({relatedProjects.length})"
		sectionKey={relatedKey}
		anchor={relatedAnchor}
		open={true}
	>
		{#snippet icon()}
			<SectionIcon name="briefcase" class="h-4 w-4 shrink-0 text-primary" />
		{/snippet}
		<nav class="projects-list" aria-label={relatedProjectsAria}>
			{#each relatedProjects as project}
				<a
					href={localizeHref(`/projects/${project.slug}`, locale)}
					class="project-link tap-press"
					use:boop={{ scale: 1.02, timing: 150 }}
					use:pressBounce
				>
					<span class="project-dot" aria-hidden="true"></span>
					<span class="project-name">{resolveLocale(project.title, locale)}</span>
				</a>
			{/each}
		</nav>
		<a href={localizeHref('/projects', locale)} class="projects-all tap-feedback">
			{seeAllProjectsLabel}
		</a>
	</CollapsibleSection>
{/if}

<style>
	/* Stack pills — visual pun: rendered as a literal vertical STACK of layers.
	   Connected slabs (shared edges, square middles, rounded top/bottom) read as
	   one stack rather than scattered tags. Shown inside the Stack
	   CollapsibleSection, under Related projects (right rail / mobile). */
	.stack-pills {
		display: flex;
		flex-direction: column;
		align-items: stretch;
		gap: 0;
		margin-bottom: 0.75rem;
	}

	.stack-pill {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		padding: 0.5rem 0.75rem;
		border: 1.5px solid var(--primary);
		border-bottom-width: 0;
		border-radius: 0;
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 5%, transparent);
		cursor: default;
		text-align: left;
	}

	.stack-pill:first-child {
		border-top-left-radius: var(--radius-md);
		border-top-right-radius: var(--radius-md);
	}

	.stack-pill:last-child {
		border-bottom-width: 1.5px;
		border-bottom-left-radius: var(--radius-md);
		border-bottom-right-radius: var(--radius-md);
	}

	.projects-list {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.project-link {
		display: flex;
		align-items: center;
		gap: 0.625rem;
		padding: 0.625rem 0.75rem;
		text-decoration: none;
		color: var(--foreground);
		font-size: var(--text-body);
		font-weight: 500;
		border-radius: var(--radius-md);
		transition: background var(--duration-fast), color var(--duration-fast);
	}
	.project-link:hover {
		background: color-mix(in srgb, var(--primary) 8%, transparent);
	}
	.project-link:hover .project-name {
		color: var(--primary);
	}

	.project-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: var(--primary);
		flex-shrink: 0;
	}

	.project-name {
		transition: color var(--duration-fast);
	}

	.projects-all {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--primary);
		text-decoration: none;
		margin-top: 0.5rem;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border-subtle);
		transition: opacity var(--duration-fast);
	}
	.projects-all:hover {
		text-decoration: underline;
	}

	@media (--tablet-max) {
		.stack-pill {
			font-size: var(--text-caption);
			padding: 0.4rem 0.625rem;
		}
	}
</style>
