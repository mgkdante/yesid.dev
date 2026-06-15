<!--
  Test-only fixture (not a route, not shipped): renders the REAL CollapsibleSection
  with a `sectionKey` so slice-34.6 can assert the full open/closed handoff wiring
  end to end — registration with the orchestrator, capture on toggle, and the
  switch-restore round-trip via applyEntries. The `open` prop is the per-slot
  default (true here, matching the project/service section call sites).
-->
<script lang="ts">
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';

	let { sectionKey, open = true }: { sectionKey?: string; open?: boolean } = $props();
</script>

<CollapsibleSection title="Fixture Section" {sectionKey} {open}>
	<p data-testid="section-content">body</p>
</CollapsibleSection>
