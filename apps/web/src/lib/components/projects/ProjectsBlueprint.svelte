<script lang="ts">
	import { BlueprintShell } from '@yesid/ui/brand';
	import { BlueprintTBM, BlueprintTunnelSection, BlueprintErector, BlueprintGeology, BlueprintVentShaft, BlueprintGroutInjection } from '@yesid/ui/blueprints';
</script>

<BlueprintShell normalizeTextFont={false} labels={['SEC-PROJ / TUNNELING', 'DWG: TBM-EPB-SECTION', 'SCALE NTS | REV.B']}>
	{#snippet hero()}
		<BlueprintTBM class="h-full w-full" />
	{/snippet}

	{#snippet details()}
		<BlueprintGeology
			class="edge-detail"
			style="top:0;left:0;width:100%;height:100%;"
		/>
		<BlueprintTunnelSection
			class="edge-detail"
			style="top:5%;right:0;width:22%;height:90%;"
		/>
		<BlueprintErector
			class="edge-detail"
			style="top:20%;left:12%;width:15%;height:60%;"
		/>
		<BlueprintVentShaft
			class="edge-detail"
			style="top:10%;right:25%;width:8%;height:80%;"
		/>
		<BlueprintGroutInjection
			class="edge-detail"
			style="bottom:5%;left:43%;width:14%;height:35%;"
		/>
	{/snippet}
</BlueprintShell>
