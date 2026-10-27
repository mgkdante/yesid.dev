<script lang="ts">
	import QuietModeButton from './QuietModeButton.svelte';
	import { CollapsibleSection } from '@yesid/ui/brand';
</script>

<QuietModeButton />

<CollapsibleSection title="Fixture Section" sectionKey="quiet-fixture" open={true}>
	<p>Quiet body</p>
</CollapsibleSection>
