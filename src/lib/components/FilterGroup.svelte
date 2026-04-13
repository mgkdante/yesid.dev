<!--
  Reusable filter button group: monospace label + "All" + filter buttons.
  Shared by BlogFilterSidebar and WorkFilterSidebar.

  WHY extracted: Both sidebars duplicate the exact same pattern (label + All + list
  of buttons with active/tag-active states). Centralizing here means style fixes and
  new behaviors (ripple, deselect) only need to happen once.

  Includes use:ripple for click feedback (QW-3 from the slice 09c spec).
-->
<script lang="ts">
	import { ripple } from '$lib/motion/actions/ripple.js';
	import { ChevronToggle } from '$lib/components/brand';
	import { resolveLocale } from '$lib/data/locale.js';

	// WHY: allLabel is LocalizedString so "All" can be translated in future i18n without
	// changing the component. Callers that don't pass it get the English default.
	const defaultAllLabel = { en: 'All' };

	let {
		label,
		items,
		activeKey = null,
		accentColor = 'var(--primary)',
		allowDeselect = true,
		collapsible = false,
		startOpen = true,
		allLabel = defaultAllLabel,
		onSelect,
		testIdPrefix = undefined
	}: {
		label: string;
		items: readonly { key: string; label: string }[];
		activeKey?: string | null;
		accentColor?: string;
		allowDeselect?: boolean;
		collapsible?: boolean;
		startOpen?: boolean;
		allLabel?: { en: string; fr?: string; es?: string };
		onSelect: (key: string | null) => void;
		testIdPrefix?: string | undefined;
	} = $props();

	let isOpen = $state(startOpen);

	// WHY: clicking an already-active filter when allowDeselect=true should clear the
	// filter (set null). When allowDeselect=false (e.g. language selector where "no
	// language" is never a valid state), clicking active has no effect.
	function handleClick(key: string) {
		if (allowDeselect && activeKey === key) {
			onSelect(null);
		} else {
			onSelect(key);
		}
	}
</script>

<div>
	<!-- WHY: collapsible label toggles section open/closed; non-collapsible is static text -->
	{#if collapsible}
		<button
			class="flex w-full items-center justify-between label-section font-semibold transition-colors hover:text-[var(--foreground)]"
			onclick={() => (isOpen = !isOpen)}
		>
			{label}
			<ChevronToggle open={isOpen} size="sm" direction="down" />
		</button>
	{:else}
		<div class="label-section font-semibold">
			{label}
		</div>
	{/if}

	{#if !collapsible || isOpen}
		<div class="mt-2 flex flex-col gap-1" style="--accent: {accentColor};">
			<button
				class="filter-btn rounded px-2 py-1 text-left text-xs transition-colors"
				class:active={activeKey === null}
				onclick={() => onSelect(null)}
				use:ripple={{ color: accentColor }}
			>
				{resolveLocale(allLabel, 'en')}
			</button>
			{#each items as item}
				<button
					class="filter-btn rounded border border-border-subtle px-2 py-1 text-left text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
					class:tag-active={activeKey === item.key}
					data-testid={testIdPrefix ? `${testIdPrefix}-${item.key}` : undefined}
					onclick={() => handleClick(item.key)}
					use:ripple={{ color: accentColor }}
				>
					{item.label}
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	/* WHY: .active on "All" uses full brand fill to show it's selected, matching
	   the established filter pattern from BlogFilterSidebar and WorkFilterSidebar. */
	.active {
		background: var(--accent);
		color: var(--foreground);
	}

	/* WHY: .tag-active on individual items uses a subtle tinted background +
	   accent border instead of full fill, so the selected item is distinct from
	   "All" but still clearly highlighted. */
	.tag-active {
		border-color: var(--accent) !important;
		color: var(--accent) !important;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
</style>
