<!--
  Test-only fixture (not a route, not shipped): a presentational child that takes
  its search text as $bindable — the exact shape of ProjectFilterSidebar /
  BlogFilterSidebar (`searchQuery = $bindable('')` → `bind:value={searchQuery}`).
  The parent fixture binds a persisted() rune into it.
-->
<script lang="ts">
	let { searchQuery = $bindable('') }: { searchQuery?: string } = $props();
</script>

<input data-testid="child-search" bind:value={searchQuery} />
