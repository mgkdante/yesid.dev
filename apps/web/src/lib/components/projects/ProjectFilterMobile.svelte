<!--
  Mobile collapsible filter for the /work listing page.
  Shows service pills + tag pills in a toggle-open panel.
  Hidden on desktop — ProjectFilterSidebar handles that viewport.
  Follows the same pattern as BlogFilterMobile.
  Uses bits-ui Collapsible for a11y (aria-controls, aria-expanded, focus management).
-->
<script lang="ts">
	import { resolveLocale } from '$lib/utils/locale';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { scrollChain } from '$lib/motion/actions/scrollChain.js';
	import { projectsListingContent } from '$lib/content/projects';

	let {
		serviceIds,
		serviceMap,
		tags,
		stack = [],
		activeService = null,
		activeTag = null,
		activeStack = null,
		onServiceSelect,
		onTagSelect,
		onStackSelect
	}: {
		serviceIds: readonly string[];
		serviceMap: Map<string, string>;
		tags: readonly string[];
		stack?: readonly string[];
		activeService: string | null;
		activeTag: string | null;
		activeStack?: string | null;
		onServiceSelect: (serviceId: string | null) => void;
		onTagSelect: (tag: string | null) => void;
		onStackSelect?: (stack: string | null) => void;
	} = $props();

	let open = $state(false);

	// Labels pulled from content layer (Task 17b-7d). Same object as
	// ProjectFilterSidebar for deduplication.
	const labels = {
		filters: projectsListingContent.filters.filtersLabel,
		services: projectsListingContent.filters.services,
		tags: projectsListingContent.filters.tags,
		stack: projectsListingContent.filters.techStack,
		all: projectsListingContent.filters.allLabel,
		showing: projectsListingContent.filters.showingPrefix,
	};

	let summary = $derived.by(() => {
		const parts: string[] = [];
		if (activeService) parts.push(serviceMap.get(activeService) ?? activeService);
		if (activeStack) parts.push(activeStack);
		if (activeTag) parts.push(activeTag);
		return parts.length > 0 ? parts.join(' + ') : resolveLocale(labels.all, 'en');
	});
</script>

<div class="md:hidden" data-testid="project-filter-mobile">
	<Collapsible bind:open>
		<div class="mb-3 flex items-center gap-3">
			<CollapsibleTrigger>
				{#snippet child({ props })}
					<button
						{...props}
						class="tap-press inline-flex items-center gap-1.5 rounded border px-4 py-2.5 min-h-11 font-mono text-xs transition-colors"
						style="border-color: var(--primary); color: var(--primary);"
					>
						{resolveLocale(labels.filters, 'en')}
						<span class="text-caption">{open ? '\u25B2' : '\u25BC'}</span>
					</button>
				{/snippet}
			</CollapsibleTrigger>
			<span class="text-caption text-[var(--muted-foreground)]">
				{resolveLocale(labels.showing, 'en')}: {summary}
			</span>
		</div>

		<CollapsibleContent forceMount class="project-filter-body">
			<div class="min-h-0 overflow-hidden">
				<div class="mb-4 max-h-[60dvh] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--card)] p-3" use:scrollChain>
					<!-- Service filter -->
					<div class="label-section font-semibold">
						{resolveLocale(labels.services, 'en')}
					</div>
					<div class="mt-1.5 flex flex-wrap gap-1.5">
						<button
							class="tap-press rounded px-3 py-2.5 min-h-11 text-caption transition-colors"
							class:m-active={activeService === null}
							onclick={() => onServiceSelect(null)}
						>
							{resolveLocale(labels.all, 'en')}
						</button>
						{#each serviceIds as svcId}
							<button
								class="tap-press rounded border border-[var(--border-subtle)] px-3 py-2.5 min-h-11 text-caption text-[var(--muted-foreground)] transition-colors"
								class:m-tag-active={activeService === svcId}
								onclick={() => onServiceSelect(activeService === svcId ? null : svcId)}
							>
								{serviceMap.get(svcId) ?? svcId}
							</button>
						{/each}
					</div>

					<!-- Tech Stack -->
					{#if stack.length > 0 && onStackSelect}
						<div class="mt-3 divider-dashed pt-2">
							<div class="label-section font-semibold">
								{resolveLocale(labels.stack, 'en')}
							</div>
							<div class="mt-1.5 flex flex-wrap gap-1.5">
								<button
									class="tap-press rounded px-3 py-2.5 min-h-11 text-caption transition-colors"
									class:m-active={activeStack === null}
									onclick={() => onStackSelect(null)}
								>
									{resolveLocale(labels.all, 'en')}
								</button>
								{#each stack as item}
									<button
										class="tap-press rounded border border-[var(--border-subtle)] px-3 py-2.5 min-h-11 text-caption text-[var(--muted-foreground)] transition-colors"
										class:m-tag-active={activeStack === item}
										onclick={() => onStackSelect(activeStack === item ? null : item)}
									>
										{item}
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Tags -->
					<div class="mt-3 divider-dashed pt-2">
						<div class="label-section font-semibold">
							{resolveLocale(labels.tags, 'en')}
						</div>
						<div class="mt-1.5 flex flex-wrap gap-1.5">
							<button
								class="tap-press rounded px-3 py-2.5 min-h-11 text-caption transition-colors"
								class:m-active={activeTag === null}
								onclick={() => onTagSelect(null)}
							>
								{resolveLocale(labels.all, 'en')}
							</button>
							{#each tags as tag}
								<button
									class="tap-press rounded border border-[var(--border-subtle)] px-3 py-2.5 min-h-11 text-caption text-[var(--muted-foreground)] transition-colors"
									class:m-tag-active={activeTag === tag}
									onclick={() => onTagSelect(activeTag === tag ? null : tag)}
								>
									{tag}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</CollapsibleContent>
	</Collapsible>
</div>

<style>
	.m-active {
		background: var(--primary);
		color: var(--foreground);
	}
	.m-tag-active {
		border-color: var(--primary) !important;
		color: var(--primary) !important;
	}
	/* CSS grid animation for smooth expand/collapse — matches CollapsibleSection pattern */
	:global([data-slot="collapsible-content"].project-filter-body) {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-slow) var(--ease-default);
	}
	:global([data-slot="collapsible-content"].project-filter-body[data-state="open"]) {
		grid-template-rows: 1fr;
	}
</style>
