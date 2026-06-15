<!--
  ProjectsStrip — solid orange bottom strip for services pages.
  Shows related project links. Updates dynamically on listing page (D195).
  Layout: label | separator | project links (scrollable) | count
-->
<script lang="ts">
	import type { Project } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { siteLabels } from '$lib/content';
	import { Separator } from '$lib/components/ui/separator';
	import { cn } from '$lib/utils';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';

	export interface ProjectsStripProps {
		/** Projects to display */
		projects: readonly Project[];
		/** Optional service name for contextual label */
		serviceTitle?: string;
		class?: string;
		[key: string]: unknown;
	}

	let {
		projects,
		serviceTitle,
		class: className = '',
		...rest
	}: ProjectsStripProps = $props();

	let label = $derived(
		serviceTitle
			? resolveLocale(siteLabels.servicesChrome.listing.projectsStrip.builtWithService, locale).replace(
					'{serviceTitle}',
					serviceTitle
				)
			: resolveLocale(siteLabels.servicesChrome.listing.projectsStrip.builtWithFallback, locale)
	);
	let countLabel = $derived(
		`${projects.length} ${resolveLocale(
			projects.length === 1
				? siteLabels.servicesChrome.listing.projectsStrip.projectSingular
				: siteLabels.servicesChrome.listing.projectsStrip.projectPlural,
			locale
		)}`
	);
</script>

<div class={cn('projects-strip', className)} data-testid="projects-strip" {...rest}>
	<Separator variant="hazard" hazardSize="sm" />
	<div class="strip-inner">
		<span class="strip-label">{label}</span>
		<div class="strip-separator" aria-hidden="true"></div>
		<div class="strip-links" use:scrollChain>
			{#each projects as project (project.slug)}
				<a href={localizeHref(`/projects/${project.slug}`, locale)} class="strip-link tap-feedback">
					<span class="strip-dot" aria-hidden="true"></span>
					<span class="strip-name">{resolveLocale(project.title, locale)}</span>
				</a>
			{/each}
		</div>
		<span class="strip-count">{countLabel}</span>
	</div>
</div>

<style>
	.projects-strip {
		background: var(--primary);
		color: var(--background);
		overflow: hidden;
	}

	.strip-inner {
		display: flex;
		align-items: center;
		padding: 0.875rem var(--space-page-x);
		gap: 1.5rem;
	}

	@media (min-width: 1024px) {
		.strip-inner {
			padding: 1rem var(--space-page-x);
			gap: 2rem;
		}
	}

	.strip-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		text-transform: uppercase;
		letter-spacing: 2px;
		opacity: 0.45;
		font-weight: 700;
		white-space: nowrap;
		display: none;
	}

	@media (min-width: 768px) {
		.strip-label {
			display: block;
			flex-shrink: 0;
		}
	}

	.strip-separator {
		width: 1px;
		height: 1rem;
		background: color-mix(in srgb, var(--background) 20%, transparent);
		flex-shrink: 0;
		display: none;
	}

	@media (min-width: 768px) {
		.strip-separator {
			display: block;
		}
	}

	.strip-links {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: center;
		gap: 1rem;
		overflow-x: auto;
	}

	@media (min-width: 768px) {
		.strip-links {
			justify-content: space-evenly;
		}
	}

	.strip-link {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		flex-shrink: 0;
		text-decoration: none;
		color: var(--background);
		font-size: var(--text-small);
		font-weight: 600;
		white-space: nowrap;
		transition: opacity var(--duration-fast);
		padding-block: 12px;
		min-height: 44px;
	}
	.strip-link:hover {
		opacity: 0.7;
	}

	.strip-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--background);
		opacity: 0.4;
		flex-shrink: 0;
	}

	.strip-count {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: var(--text-micro);
		letter-spacing: 1px;
		opacity: 0.4;
		white-space: nowrap;
	}
</style>
