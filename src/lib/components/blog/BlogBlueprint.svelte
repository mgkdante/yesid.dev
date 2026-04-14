<!--
  BlogBlueprint — Transit infrastructure blueprint background for the blog header.
  Uses BlueprintShell for shared crosshairs, ref-labels, and CSS.
-->
<script lang="ts">
	import { BlueprintShell } from '$lib/components/shells';
	import BlueprintBridge from '$lib/components/svg/transit/BlueprintBridge.svelte';
	import BlueprintTrackPlan from '$lib/components/svg/transit/BlueprintTrackPlan.svelte';
	import BlueprintCatenary from '$lib/components/svg/transit/BlueprintCatenary.svelte';
	import BlueprintSignal from '$lib/components/svg/transit/BlueprintSignal.svelte';
	import BlueprintStationSection from '$lib/components/svg/transit/BlueprintStationSection.svelte';
	import BlueprintDetailBogie from '$lib/components/svg/detail/BlueprintDetailBogie.svelte';
</script>

<BlueprintShell labels={['SEC-BLOG / DISPATCHES', 'DWG: TRANSIT-OPS-ELEV', 'SCALE NTS | REV.A']}>
	{#snippet hero()}
		<BlueprintBridge class="h-full w-full" />
	{/snippet}

	{#snippet details()}
		<BlueprintTrackPlan
			class="edge-detail"
			style="top:2%;left:0;width:45%;height:50%;opacity:0.18;"
		/>
		<BlueprintCatenary
			class="edge-detail"
			style="top:0;right:0;width:48%;height:42%;opacity:0.16;"
		/>
		<BlueprintDetailBogie
			class="edge-detail"
			style="bottom:2%;left:2%;width:22%;height:42%;opacity:0.16;"
		/>
		<BlueprintStationSection
			class="edge-detail"
			style="bottom:0;left:28%;width:35%;height:52%;opacity:0.14;"
		/>
		<BlueprintSignal
			class="edge-detail"
			style="bottom:4%;right:8%;width:10%;height:58%;opacity:0.20;"
		/>
	{/snippet}
</BlueprintShell>
