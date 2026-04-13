<!--
  Mobile collapsible filter for the /work listing page.
  Shows service pills + tag pills in a toggle-open panel.
  Hidden on desktop — WorkFilterSidebar handles that viewport.
  Follows the same pattern as BlogFilterMobile.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/data/locale.js';

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

	const labels = {
		filters: { en: 'Filters' },
		services: { en: 'Services' },
		tags: { en: 'Tags' },
		stack: { en: 'Tech Stack' },
		all: { en: 'All' },
		showing: { en: 'Showing' }
	};

	let summary = $derived.by(() => {
		const parts: string[] = [];
		if (activeService) parts.push(serviceMap.get(activeService) ?? activeService);
		if (activeStack) parts.push(activeStack);
		if (activeTag) parts.push(activeTag);
		return parts.length > 0 ? parts.join(' + ') : resolveLocale(labels.all, 'en');
	});
</script>

<div class="md:hidden" data-testid="work-filter-mobile">
	<div class="mb-3 flex items-center gap-3">
		<button
			class="inline-flex items-center gap-1.5 rounded border px-2.5 py-1 font-mono text-xs transition-colors"
			style="border-color: var(--brand-primary); color: var(--brand-primary);"
			onclick={() => (open = !open)}
		>
			{resolveLocale(labels.filters, 'en')}
			<span class="text-caption">{open ? '\u25B2' : '\u25BC'}</span>
		</button>
		<span class="text-caption text-[var(--text-muted)]">
			{resolveLocale(labels.showing, 'en')}: {summary}
		</span>
	</div>

	{#if open}
		<div class="mb-4 max-h-[60vh] overflow-y-auto rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] p-3">
			<!-- Service filter -->
			<div class="label-section font-semibold">
				{resolveLocale(labels.services, 'en')}
			</div>
			<div class="mt-1.5 flex flex-wrap gap-1.5">
				<button
					class="rounded px-2 py-1 text-caption transition-colors"
					class:m-active={activeService === null}
					onclick={() => onServiceSelect(null)}
				>
					{resolveLocale(labels.all, 'en')}
				</button>
				{#each serviceIds as svcId}
					<button
						class="rounded border border-[var(--border-subtle)] px-2 py-1 text-caption text-[var(--text-muted)] transition-colors"
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
							class="rounded px-2 py-1 text-caption transition-colors"
							class:m-active={activeStack === null}
							onclick={() => onStackSelect(null)}
						>
							{resolveLocale(labels.all, 'en')}
						</button>
						{#each stack as item}
							<button
								class="rounded border border-[var(--border-subtle)] px-2 py-1 text-caption text-[var(--text-muted)] transition-colors"
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
						class="rounded px-2 py-1 text-caption transition-colors"
						class:m-active={activeTag === null}
						onclick={() => onTagSelect(null)}
					>
						{resolveLocale(labels.all, 'en')}
					</button>
					{#each tags as tag}
						<button
							class="rounded border border-[var(--border-subtle)] px-2 py-1 text-caption text-[var(--text-muted)] transition-colors"
							class:m-tag-active={activeTag === tag}
							onclick={() => onTagSelect(activeTag === tag ? null : tag)}
						>
							{tag}
						</button>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.m-active {
		background: var(--brand-primary);
		color: var(--text-primary);
	}
	.m-tag-active {
		border-color: var(--brand-primary) !important;
		color: var(--brand-primary) !important;
	}
</style>
