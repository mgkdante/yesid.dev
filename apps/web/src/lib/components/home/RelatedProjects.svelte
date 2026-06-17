<!--
  RelatedProjects — compact bottom strip showing related projects.
  Name + count only. Horizontally scrollable when projects overflow.
-->
<script lang="ts">
	import type { Project } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { Separator } from '$lib/components/ui/separator';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { siteLabels } from '$lib/content';

	let { projects }: { projects: readonly Project[] } = $props();

	const strip = siteLabels.footerChrome.relatedProjectsStrip;
	const builtWithLabel = resolveLocale(strip.builtWithLabel, locale);
	const countSingular = resolveLocale(strip.projectCountSingular, locale);
	const countPlural = resolveLocale(strip.projectCountPlural, locale);
</script>

<div
	class="proof-strip"
	data-testid="proof-strip"
>
	<span class="proof-label label-section">{builtWithLabel}</span>

	<div class="proof-projects" use:scrollChain>
		{#each projects as project (project.slug)}
			<a
				href={localizeHref(`/projects/${project.slug}`, locale)}
				class="proof-link"
			>
				<span class="proof-dot" aria-hidden="true"></span>
				<span class="proof-name">{resolveLocale(project.title, locale)}</span>
			</a>
		{/each}
	</div>

	<span class="proof-count">{projects.length} {projects.length === 1 ? countSingular : countPlural}</span>
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
