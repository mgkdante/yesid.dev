<!--
  Test-only fixture (not a route, not shipped): mirrors the slice-34.1 parent
  wiring on ProjectListingPage / BlogListingPage — a persisted() search rune is
  bound INTO a $bindable child via `bind:searchQuery={q.value}`. The same rune is
  read in a derived "filter" so we can assert both the bind chain and the
  orchestrator restore round-trip in one render.
-->
<script lang="ts">
	import { persisted } from './persisted.svelte';
	import Child from './_filters-search-child-fixture.svelte';

	const q = persisted('fixture-projects-q', '');

	// Stand-in for filteredProjects: a derived that reads the persisted value,
	// proving the rune drives the listing filter (not just the input element).
	const matches = $derived(q.value.trim() === '' ? 'all' : `q:${q.value.trim()}`);
</script>

<Child bind:searchQuery={q.value} />
<span data-testid="filter-result">{matches}</span>
