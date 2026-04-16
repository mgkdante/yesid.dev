<!--
  ProjectsBlueprint — Tunneling infrastructure blueprint background for the projects header.
  Uses BlueprintShell for shared crosshairs, ref-labels, and CSS.
-->
<script lang="ts">
	import { BlueprintShell } from '$lib/components/brand';
	import BlueprintTBM from '$lib/components/svg/tunneling/BlueprintTBM.svelte';
	import BlueprintTunnelSection from '$lib/components/svg/tunneling/BlueprintTunnelSection.svelte';
	import BlueprintErector from '$lib/components/svg/tunneling/BlueprintErector.svelte';
	import BlueprintGeology from '$lib/components/svg/tunneling/BlueprintGeology.svelte';
	import BlueprintVentShaft from '$lib/components/svg/tunneling/BlueprintVentShaft.svelte';
	import BlueprintGroutInjection from '$lib/components/svg/tunneling/BlueprintGroutInjection.svelte';
</script>

<BlueprintShell labels={['SEC-PROJ / TUNNELING', 'DWG: TBM-EPB-SECTION', 'SCALE NTS | REV.B']}>
	{#snippet hero()}
		<BlueprintTBM class="h-full w-full" />
	{/snippet}

	{#snippet details()}
		<BlueprintGeology
			class="edge-detail"
			style="top:0;left:0;width:100%;height:100%;opacity:0.10;"
		/>
		<BlueprintTunnelSection
			class="edge-detail"
			style="top:5%;right:0;width:22%;height:90%;opacity:0.18;"
		/>
		<BlueprintErector
			class="edge-detail"
			style="top:20%;left:12%;width:15%;height:60%;opacity:0.16;"
		/>
		<BlueprintVentShaft
			class="edge-detail"
			style="top:10%;right:25%;width:8%;height:80%;opacity:0.14;"
		/>
		<BlueprintGroutInjection
			class="edge-detail"
			style="bottom:5%;left:43%;width:14%;height:35%;opacity:0.16;"
		/>
	{/snippet}
</BlueprintShell>
