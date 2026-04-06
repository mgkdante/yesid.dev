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

	let {
		label,
		items,
		activeKey = null,
		accentColor = '#E07800',
		allowDeselect = true,
		onSelect,
		testIdPrefix = undefined
	}: {
		label: string;
		items: readonly { key: string; label: string }[];
		activeKey?: string | null;
		accentColor?: string;
		allowDeselect?: boolean;
		onSelect: (key: string | null) => void;
		testIdPrefix?: string | undefined;
	} = $props();

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
	<div class="font-mono text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
		{label}
	</div>
	<div class="mt-2 flex flex-col gap-1" style="--accent: {accentColor};">
		<button
			class="filter-btn rounded px-2 py-1 text-left text-xs transition-colors"
			class:active={activeKey === null}
			onclick={() => onSelect(null)}
			use:ripple={{ color: accentColor }}
		>
			All
		</button>
		{#each items as item}
			<button
				class="filter-btn rounded border border-[#2a2a2a] px-2 py-1 text-left text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
				class:tag-active={activeKey === item.key}
				data-testid={testIdPrefix ? `${testIdPrefix}-${item.key}` : undefined}
				onclick={() => handleClick(item.key)}
				use:ripple={{ color: accentColor }}
			>
				{item.label}
			</button>
		{/each}
	</div>
</div>

<style>
	/* WHY: .active on "All" uses full brand fill to show it's selected, matching
	   the established filter pattern from BlogFilterSidebar and WorkFilterSidebar. */
	.active {
		background: var(--accent);
		color: #f5f5f0;
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
