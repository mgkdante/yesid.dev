<script lang="ts">
	import { BlueprintShell } from '@yesid/ui/brand';
	import { BlueprintAzurSide, BlueprintAzurFront, BlueprintAzurTop, BlueprintAzurBogie, BlueprintAzurCross, BlueprintMr73Side, BlueprintDetailBogie, BlueprintDetailDoor, BlueprintDetailInterior, BlueprintDetailHandrails, BlueprintDetailWindow, BlueprintDetailSeat } from '@yesid/ui/blueprints';
</script>

<BlueprintShell normalizeTextFont={false} labels={['SEC-04 / SERVICES', 'DWG: AZUR-MPM10-ELEV', 'SCALE 1:48 | REV.A']}>
	{#snippet hero()}
		<BlueprintAzurSide class="hidden h-full w-full md:block" />
	{/snippet}
	{#snippet details()}
		<div class="absolute inset-0 hidden md:block">
			<BlueprintAzurFront class="edge-detail" style="top:0;left:0;width:22%;height:38%;opacity:0.16;" />
			<BlueprintDetailBogie class="edge-detail" style="top:0;left:22%;width:28%;height:28%;opacity:0.16;" />
			<BlueprintAzurTop class="edge-detail" style="top:0;left:50%;width:28%;height:22%;opacity:0.16;" />
			<BlueprintAzurBogie class="edge-detail" style="top:0;right:0;width:22%;height:30%;opacity:0.16;" />
			<BlueprintDetailDoor class="edge-detail" style="top:22%;left:38%;width:18%;height:22%;opacity:0.16;" />
			<BlueprintDetailWindow class="edge-detail" style="top:24%;right:0;width:18%;height:20%;opacity:0.16;" />
			<BlueprintAzurCross class="edge-detail" style="top:38%;left:0;width:20%;height:34%;opacity:0.16;" />
			<BlueprintDetailInterior class="edge-detail" style="top:40%;left:20%;width:18%;height:30%;opacity:0.16;" />
			<BlueprintDetailHandrails class="edge-detail" style="top:44%;right:0;width:18%;height:28%;opacity:0.16;" />
			<BlueprintMr73Side class="edge-detail" style="bottom:0;left:0;width:38%;height:30%;opacity:0.16;" />
			<BlueprintDetailSeat class="edge-detail" style="bottom:0;left:38%;width:24%;height:28%;opacity:0.16;" />
			<BlueprintAzurSide class="edge-detail" style="bottom:0;right:0;width:38%;height:30%;opacity:0.16;" />
		</div>
		<!-- Mobile tiling keeps drawings legible through the card gaps and margins. -->
		<div class="absolute inset-0 md:hidden">
			<BlueprintMr73Side class="edge-detail" style="top:0;left:-15%;width:130%;height:10%;" />
			<BlueprintAzurSide class="edge-detail" style="top:26%;left:-30%;width:160%;height:15%;" />
			<BlueprintAzurTop class="edge-detail" style="top:51%;left:-25%;width:150%;height:12%;" />
			<BlueprintAzurSide class="edge-detail" style="top:74%;left:-40%;width:170%;height:15%;" />
			<BlueprintDetailBogie class="edge-detail" style="top:14%;right:1%;width:36%;height:9%;" />
			<BlueprintAzurFront class="edge-detail" style="top:20%;left:2%;width:36%;height:11%;" />
			<BlueprintDetailDoor class="edge-detail" style="top:42%;right:1%;width:34%;height:9%;" />
			<BlueprintAzurCross class="edge-detail" style="top:47%;left:2%;width:40%;height:11%;" />
			<BlueprintDetailSeat class="edge-detail" style="top:68%;left:2%;width:32%;height:8%;" />
			<BlueprintDetailHandrails class="edge-detail" style="top:88%;left:-6%;width:34%;height:10%;" />
			<BlueprintAzurBogie class="edge-detail" style="top:86.5%;right:-12%;width:72%;height:13%;" />
		</div>
	{/snippet}
</BlueprintShell>
