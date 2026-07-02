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
	import { untrack } from 'svelte';
	import { ChevronToggle } from '$lib/components/brand';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';
	import { persisted } from '$lib/state/persisted.svelte';

	const defaultAllLabel = { en: 'All', fr: 'Tous', es: 'Todos' };

	let {
		label,
		items,
		activeKey = null,
		accentColor = 'var(--primary)',
		allowDeselect = true,
		collapsible = false,
		startOpen = true,
		persistKey = undefined,
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
		/**
		 * slice-34.6 — opt this group's expand/collapse into surviving a locale
		 * switch. When set, a session boolean keyed by `persistKey` (a stable,
		 * locale-free string) drives `isOpen`, seeded with `startOpen` as the
		 * default. When absent, a plain local rune is used (existing behaviour).
		 */
		persistKey?: string;
		allLabel?: { en: string; fr?: string; es?: string };
		onSelect: (key: string | null) => void;
		testIdPrefix?: string | undefined;
	} = $props();

	// Keyed → session-scoped (survives a locale switch, paints directly in its
	// restored state via persisted()'s synchronous seed); unkeyed → local rune.
	// untrack marks the one-shot init capture as intentional: the key must stay
	// a stable string and startOpen is only the seed, owned locally afterwards.
	const persistedOpen = untrack(() => (persistKey ? persisted(persistKey, startOpen) : null));
	let localOpen = $state(untrack(() => startOpen));
	const isOpen = $derived(persistedOpen ? persistedOpen.value : localOpen);
	function toggleOpen(): void {
		if (persistedOpen) persistedOpen.value = !persistedOpen.value;
		else localOpen = !localOpen;
	}

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
			class="tap-press flex w-full items-center justify-between label-section text-sm font-semibold py-2.5 min-h-11 transition-colors hover:text-[var(--foreground)] active:text-[var(--foreground)]"
			onclick={toggleOpen}
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
							class="tap-press filter-btn w-full rounded px-2 py-3 min-h-11 text-left text-sm transition-colors"
							class:active={activeKey === null}
						>
							{resolveLocale(allLabel, locale)}
						</button>
					{/snippet}
				</ToggleGroupItem>

				{#each items as item}
					<ToggleGroupItem value={item.key}>
						{#snippet child({ props })}
							<button
								{...props}
								class="tap-press filter-btn w-full rounded border border-border px-2 py-3 min-h-11 text-left text-sm text-[var(--muted-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)] active:border-[var(--primary)] active:text-[var(--primary)]"
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
	.filter-btn {
		background: var(--card);
		border: 1px solid var(--border-subtle);
		box-shadow: inset 0 1px 0 var(--edge-highlight);
		color: var(--muted-foreground);
	}

	/* GO2-W5: text on the route-set fill pairs with primary-foreground
	   (foreground-on-primary computed 2.4–2.9:1 — latent AA fail). */
	.active {
		background: var(--primary);
		border-color: var(--primary);
		color: var(--primary-foreground);
	}

	/* GO2-W5 selected chip = yellow wayfinding voice: SOLID --accent-surface
	   (no alpha — the grid never bleeds through a chip), --accent-text type,
	   and an --accent "you are here" lamp on the right edge (absolute, zero
	   layout shift). */
	/* `.filter-btn.tag-active` (+ Svelte's scope hash) outranks the button's
	   inline hover:/active: primary utilities, so the selected chip keeps the
	   yellow wayfinding voice on hover without reaching for !important. */
	.filter-btn.tag-active {
		border-color: var(--accent-text);
		color: var(--accent-text);
		background: var(--accent-surface);
		position: relative;
	}
	.tag-active::after {
		content: '';
		position: absolute;
		right: 8px;
		top: 50%;
		transform: translateY(-50%);
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--accent);
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
