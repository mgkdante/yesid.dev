<script lang="ts">
	import type { BlogEntryRail as BlogEntryRailContent } from '@repo/shared';
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
	import SectionIcon from '$lib/components/shared/SectionIcon.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';

	const locale = getLocale();

	let {
		rail,
		mobile = false,
		class: className = '',
	}: {
		rail: BlogEntryRailContent;
		mobile?: boolean;
		class?: string;
	} = $props();

	const work = $derived(rail.workWithMe);
	const routes = $derived(rail.routes);
	const k = (key: string) => (mobile ? `${key}-mobile` : key);
</script>

<div
	class="blog-entry-rail {mobile ? '' : 'blog-entry-rail--sticky'} {className}"
	data-testid={mobile ? 'blog-entry-rail-mobile' : 'blog-entry-rail'}
>
	<div class="entry-panel" data-toc={mobile ? 'blog-work-with-me' : undefined}>
		<CollapsibleSection title={resolveLocale(work.title, locale)} sectionKey={k('blog-entry-work')} open={true}>
			{#snippet icon()}
				<SectionIcon name="briefcase" class="h-4 w-4 shrink-0 text-primary" />
			{/snippet}
			<p>{resolveLocale(work.prompt, locale)}</p>
			<div class="entry-card__actions" data-testid="blog-entry-actions">
				<a href={localizeHref(work.primary.href, locale)} class="entry-action entry-action--primary">
					{resolveLocale(work.primary.label, locale)}
				</a>
				<a href={localizeHref(work.secondary.href, locale)} class="entry-action">
					{resolveLocale(work.secondary.label, locale)}
				</a>
			</div>
		</CollapsibleSection>
	</div>

	<div class="entry-panel" data-toc={mobile ? 'blog-pick-route' : undefined}>
		<CollapsibleSection title={resolveLocale(routes.title, locale)} sectionKey={k('blog-entry-routes')} open={true}>
			{#snippet icon()}
				<SectionIcon name="toc" class="h-4 w-4 shrink-0 text-primary" />
			{/snippet}
			<nav aria-label={resolveLocale(routes.title, locale)}>
				<div class="entry-routes">
					{#each routes.links as link}
						<a
							href={localizeHref(link.href, locale)}
							class="entry-route"
							data-testid="blog-entry-route"
						>
							<span>{resolveLocale(link.label, locale)}</span>
							<SectionIcon name="arrow" class="h-3.5 w-3.5 shrink-0" />
						</a>
					{/each}
				</div>
			</nav>
		</CollapsibleSection>
	</div>
</div>

<style>
	.blog-entry-rail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.blog-entry-rail--sticky {
		position: sticky;
		top: 5rem;
	}

	p {
		margin: 0;
		color: var(--secondary-foreground);
		font-size: 0.95rem;
		line-height: 1.45;
	}

	.entry-card__actions {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.625rem;
		margin-top: 1rem;
	}

	.entry-action,
	.entry-route {
		min-height: 2.5rem;
		border: 1px solid color-mix(in srgb, var(--primary) 34%, transparent);
		background: var(--card);
		color: var(--foreground);
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 800;
		line-height: 1.1;
		text-decoration: none;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			background var(--duration-normal) var(--ease-default),
			color var(--duration-normal) var(--ease-default);
	}

	.entry-action {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		border-radius: var(--radius-pill);
		padding: 0.75rem 0.9rem;
	}

	.entry-action--primary {
		border-color: color-mix(in srgb, var(--primary) 72%, transparent);
		background: color-mix(in srgb, var(--primary) 14%, var(--card));
		color: var(--primary);
	}

	.entry-routes {
		display: grid;
		gap: 0.5rem;
		margin-top: 1rem;
	}

	.entry-route {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.75rem;
		border-radius: 0.5rem;
		padding: 0.7rem 0.75rem;
	}

	.entry-action:hover,
	.entry-action:focus-visible,
	.entry-route:hover,
	.entry-route:focus-visible {
		border-color: color-mix(in srgb, var(--primary) 70%, transparent);
		background: color-mix(in srgb, var(--primary) 10%, var(--card));
		color: var(--primary);
		outline: none;
	}

	@media (min-width: 768px) and (max-width: 1023px) {
		.blog-entry-rail {
			display: grid;
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}
	}
</style>
