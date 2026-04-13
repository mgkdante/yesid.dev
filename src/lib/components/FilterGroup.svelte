<!--
  Reusable filter button group: monospace label + "All" + filter buttons.
  Shared by BlogFilterSidebar and WorkFilterSidebar.

  WHY extracted: Both sidebars duplicate the exact same pattern (label + All + list
  of buttons with active/tag-active states). Centralizing here means style fixes and
  new behaviors (ripple, deselect) only need to happen once.

  Uses bits-ui ToggleGroup for keyboard navigation (arrow keys) and ARIA semantics.
  Includes use:ripple for click feedback (QW-3 from the slice 09c spec).
-->
<script lang="ts">
	import { ripple } from '$lib/motion/actions/ripple.js';
	import { ChevronToggle } from '$lib/components/brand';
	import { resolveLocale } from '$lib/data/locale.js';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';

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

	// Map activeKey to ToggleGroup value: null → '__all__', string → string
	const groupValue = $derived(activeKey ?? '__all__');

	function handleValueChange(value: string) {
		if (!value) {
			// Deselect: ToggleGroup cleared the selection
			if (allowDeselect) {
				onSelect(null);
			}
			// If !allowDeselect, the controlled value prop keeps the current selection
			return;
		}
		onSelect(value === '__all__' ? null : value);
	}
</script>

<div>
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
		<ToggleGroup
			type="single"
			value={groupValue}
			onValueChange={handleValueChange}
			class="mt-2 flex flex-col gap-1"
			style="--accent: {accentColor};"
			orientation="vertical"
		>
			<ToggleGroupItem value="__all__">
				{#snippet child({ props })}
					<button
						{...props}
						class="filter-btn rounded px-2 py-1 text-left text-xs transition-colors"
						class:active={activeKey === null}
						use:ripple={{ color: accentColor }}
					>
						{resolveLocale(allLabel, 'en')}
					</button>
				{/snippet}
			</ToggleGroupItem>

			{#each items as item}
				<ToggleGroupItem value={item.key}>
					{#snippet child({ props })}
						<button
							{...props}
							class="filter-btn rounded border border-border-subtle px-2 py-1 text-left text-xs text-[var(--muted-foreground)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
							class:tag-active={activeKey === item.key}
							data-testid={testIdPrefix ? `${testIdPrefix}-${item.key}` : undefined}
							use:ripple={{ color: accentColor }}
						>
							{item.label}
						</button>
					{/snippet}
				</ToggleGroupItem>
			{/each}
		</ToggleGroup>
	{/if}
</div>

<style>
	.active {
		background: var(--accent);
		color: var(--foreground);
	}

	.tag-active {
		border-color: var(--accent) !important;
		color: var(--accent) !important;
		background: color-mix(in srgb, var(--accent) 10%, transparent);
	}
</style>
