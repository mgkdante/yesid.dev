<!--
  Test-only fixture (not a route, not shipped): proves that persisted().value is
  two-way bindable via `bind:value`, so bind-heavy surfaces (search inputs,
  collapsible open) can use persisted() directly without a closure shim.
-->
<script lang="ts">
	import { persisted } from './persisted.svelte';
	const q = persisted('bind-fixture', '');
</script>

<input data-testid="bind-input" bind:value={q.value} />
<span data-testid="bind-echo">{q.value}</span>
