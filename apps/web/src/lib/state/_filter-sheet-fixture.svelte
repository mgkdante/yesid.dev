<!--
  Test-only fixture (not a route, not shipped): mirrors the slice-34.6 mobile
  filter-sheet wiring in BlogFilterMobile / ProjectFilterMobile — `let open =
  $state(false)` became `persisted('<page>-filter-sheet', false)` bound into the
  bits-ui Collapsible via `bind:open={sheet.value}`. This fixture keeps the exact
  bind so a test can assert the sheet open/closed survives a switch without
  dragging the full content/locale context of the real components into the test.
-->
<script lang="ts">
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { persisted } from './persisted.svelte';

	let { storageKey }: { storageKey: string } = $props();

	const sheet = persisted(storageKey, false);
</script>

<Collapsible bind:open={sheet.value}>
	<CollapsibleTrigger>
		{#snippet child({ props })}
			<button {...props} data-testid="sheet-trigger">Filters {sheet.value ? '▲' : '▼'}</button>
		{/snippet}
	</CollapsibleTrigger>
	<CollapsibleContent>
		<div data-testid="sheet-body">filter body</div>
	</CollapsibleContent>
</Collapsible>
