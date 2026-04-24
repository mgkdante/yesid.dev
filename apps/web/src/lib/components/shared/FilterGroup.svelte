<!--
  Reusable filter button group: monospace label + "All" + filter buttons.
  Shared by BlogFilterSidebar and WorkFilterSidebar.

  WHY extracted: Both sidebars duplicate the exact same pattern (label + All + list
  of buttons with active/tag-active states). Centralizing here means style fixes and
  new behaviors (deselect, collapse) only need to happen once.

  Uses bits-ui ToggleGroup for keyboard navigation (arrow keys) and ARIA semantics.
  Click feedback via CSS :active state (use:ripple removed in 17e-2 — Snappy Doctrine).
  `accentColor` prop accepted but unused inside this component after ripple removal;
  upstream callers still thread it through the sidebar chain. 17a-4 can prune.
-->
<script lang="ts">
	import { ChevronToggle } from '$lib/components/brand';
	import { resolveLocale } from '$lib/utils/locale';
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
			class="flex w-full items-center justify-between label-section text-sm font-semibold transition-colors hover:text-[var(--foreground)]"
			onclick={() => (isOpen = !isOpen)}
		>
			{label}
			<ChevronToggle open={isOpen} size="sm" direction="down" />
		</button>
	{:else}
		<div class="label-section text-sm font-semibold">
			{label}
		</div>
	{/if}

	<div class="filter-collapse" class:filter-open={!collapsible || isOpen}>
		<div class="filter-collapse-inner">
			<ToggleGroup
				type="single"
				value={groupValue}
				onValueChange={handleValueChange}
				class="mt-2 flex w-full flex-col gap-1"
				orientation="vertical"
			>
				<ToggleGroupItem value="__all__">
					{#snippet child({ props })}
						<button
							{...props}
							class="filter-btn w-full rounded px-2 py-1.5 text-left text-sm transition-colors"
							class:active={activeKey === null}
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
								class="filter-btn w-full rounded border border-border-subtle px-2 py-1.5 text-left text-sm text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
								class:tag-active={activeKey === item.key}
								data-testid={testIdPrefix ? `${testIdPrefix}-${item.key}` : undefined}
							>
								{item.label}
							</button>
						{/snippet}
					</ToggleGroupItem>
				{/each}
			</ToggleGroup>
		</div>
	</div>
</div>

<style>
	.active {
		background: var(--primary);
		color: var(--foreground);
	}

	.tag-active {
		border-color: var(--primary) !important;
		color: var(--primary) !important;
		background: color-mix(in srgb, var(--primary) 10%, transparent);
	}

	/* Smooth collapse/expand via CSS grid rows */
	.filter-collapse {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-slow) var(--ease-default);
	}
	.filter-collapse.filter-open {
		grid-template-rows: 1fr;
	}
	.filter-collapse-inner {
		overflow: hidden;
		min-height: 0;
	}
</style>
