<!--
  Desktop sidebar for the /work listing page.
  Shows SERVICES section + TAGS section, sticky.
  Hidden on mobile — WorkFilterMobile handles that viewport.
  Follows the same layout pattern as BlogFilterSidebar.
-->
<script lang="ts">
	import { resolveLocale } from '$lib/data/locale.js';

	let {
		serviceIds,
		serviceMap,
		tags,
		activeService = null,
		activeTag = null,
		onServiceSelect,
		onTagSelect
	}: {
		serviceIds: readonly string[];
		serviceMap: Map<string, string>;
		tags: readonly string[];
		activeService: string | null;
		activeTag: string | null;
		onServiceSelect: (serviceId: string | null) => void;
		onTagSelect: (tag: string | null) => void;
	} = $props();

	// i18n labels — all user-facing text goes through resolveLocale
	const labels = {
		services: { en: 'Services' },
		tags: { en: 'Tags' },
		all: { en: 'All' }
	};
</script>

<aside class="w-[220px] shrink-0" data-testid="work-filter-sidebar">
	<!-- Services section -->
	<div class="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
		{resolveLocale(labels.services, 'en')}
	</div>
	<div class="mt-2 flex flex-col gap-1 mb-5">
		<button
			class="rounded px-2 py-1 text-left text-xs transition-colors"
			class:active={activeService === null}
			onclick={() => onServiceSelect(null)}
		>
			{resolveLocale(labels.all, 'en')}
		</button>
		{#each serviceIds as svcId}
			<button
				class="rounded border border-[#2a2a2a] px-2 py-1 text-left text-xs text-[var(--text-muted)] transition-colors hover:border-[#E07800] hover:text-[#E07800]"
				class:tag-active={activeService === svcId}
				onclick={() => onServiceSelect(activeService === svcId ? null : svcId)}
				data-testid="service-filter-{svcId}"
			>
				{serviceMap.get(svcId) ?? svcId}
			</button>
		{/each}
	</div>

	<!-- Tags section -->
	<div class="border-t border-dashed border-[#333] pt-3">
		<div class="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
			{resolveLocale(labels.tags, 'en')}
		</div>
		<div class="mt-2 flex flex-col gap-1">
			<button
				class="rounded px-2 py-1 text-left text-xs transition-colors"
				class:active={activeTag === null}
				onclick={() => onTagSelect(null)}
			>
				{resolveLocale(labels.all, 'en')}
			</button>
			{#each tags as tag}
				<button
					class="rounded border border-[#2a2a2a] px-2 py-1 text-left text-xs text-[var(--text-muted)] transition-colors hover:border-[#E07800] hover:text-[#E07800]"
					class:tag-active={activeTag === tag}
					onclick={() => onTagSelect(activeTag === tag ? null : tag)}
					data-testid="tag-filter-{tag}"
				>
					{tag}
				</button>
			{/each}
		</div>
	</div>
</aside>

<style>
	.active {
		background: #E07800;
		color: #f5f5f0;
	}
	.tag-active {
		border-color: #E07800 !important;
		color: #E07800 !important;
		background: color-mix(in srgb, #E07800 10%, transparent);
	}
</style>
