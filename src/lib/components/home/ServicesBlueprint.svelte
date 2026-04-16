<!--
  ServicesBlueprint — Decorative blueprint background for HomeServices.
  AZUR MPM-10 + MR-73 technical drawings, crosshairs, reference labels.
  Inline Svelte SVG components enable CSS var tokenization (currentColor → var(--primary)).
-->
<script lang="ts">
	import BlueprintAzurSide from '$lib/components/svg/azur/BlueprintAzurSide.svelte';
	import BlueprintAzurFront from '$lib/components/svg/azur/BlueprintAzurFront.svelte';
	import BlueprintAzurTop from '$lib/components/svg/azur/BlueprintAzurTop.svelte';
	import BlueprintAzurBogie from '$lib/components/svg/azur/BlueprintAzurBogie.svelte';
	import BlueprintAzurCross from '$lib/components/svg/azur/BlueprintAzurCross.svelte';
	import BlueprintMr73Side from '$lib/components/svg/azur/BlueprintMr73Side.svelte';
	import BlueprintDetailBogie from '$lib/components/svg/detail/BlueprintDetailBogie.svelte';
	import BlueprintDetailDoor from '$lib/components/svg/detail/BlueprintDetailDoor.svelte';
	import BlueprintDetailInterior from '$lib/components/svg/detail/BlueprintDetailInterior.svelte';
	import BlueprintDetailHandrails from '$lib/components/svg/detail/BlueprintDetailHandrails.svelte';
	import BlueprintDetailWindow from '$lib/components/svg/detail/BlueprintDetailWindow.svelte';
	import BlueprintDetailSeat from '$lib/components/svg/detail/BlueprintDetailSeat.svelte';
</script>

<div class="blueprint-bg absolute inset-0 z-0 text-[var(--primary)]" aria-hidden="true">
	<!-- AZUR side elevation — primary full-page blueprint (centered, faint) -->
	<div class="train-svg absolute inset-x-[2%] top-[25%] bottom-[25%] z-0 opacity-[0.08]">
		<BlueprintAzurSide class="h-full w-full" />
	</div>

	<!-- ALL 12 blueprint SVGs — tiled wall-to-wall, no gaps -->
	<div class="edge-details absolute inset-0 z-0 opacity-[0.10] overflow-hidden">
		<!-- Row 1: top band (4 panels spanning full width) -->
		<BlueprintAzurFront class="edge-detail" style="top:0;left:0;width:22%;height:38%;" />
		<BlueprintDetailBogie class="edge-detail" style="top:0;left:22%;width:28%;height:28%;" />
		<BlueprintAzurTop class="edge-detail" style="top:0;left:50%;width:28%;height:22%;" />
		<BlueprintAzurBogie class="edge-detail" style="top:0;right:0;width:22%;height:30%;" />
		<!-- Row 1 fill: plug gap between bogie+top-view row and middle -->
		<BlueprintDetailDoor class="edge-detail" style="top:22%;left:38%;width:18%;height:22%;" />
		<BlueprintDetailWindow class="edge-detail" style="top:24%;right:0;width:18%;height:20%;" />
		<!-- Row 2: middle band (3 panels) -->
		<BlueprintAzurCross class="edge-detail" style="top:38%;left:0;width:20%;height:34%;" />
		<BlueprintDetailInterior class="edge-detail" style="top:40%;left:20%;width:18%;height:30%;" />
		<BlueprintDetailHandrails class="edge-detail" style="top:44%;right:0;width:18%;height:28%;" />
		<!-- Row 3: bottom band (3 panels spanning full width) -->
		<BlueprintMr73Side class="edge-detail" style="bottom:0;left:0;width:38%;height:30%;" />
		<BlueprintDetailSeat class="edge-detail" style="bottom:0;left:38%;width:24%;height:28%;" />
		<BlueprintAzurSide class="edge-detail" style="bottom:0;right:0;width:38%;height:30%;" />
	</div>

	<!-- Corner crosshairs -->
	<div class="crosshair" style="top:24px;left:24px;"></div>
	<div class="crosshair" style="top:24px;right:24px;"></div>
	<div class="crosshair" style="bottom:24px;left:24px;"></div>
	<div class="crosshair" style="bottom:24px;right:24px;"></div>
	<!-- Reference labels -->
	<span class="ref-label" style="top:16px;right:56px;">SEC-04 / SERVICES</span>
	<span class="ref-label" style="bottom:16px;left:56px;">DWG: AZUR-MPM10-ELEV</span>
	<span class="ref-label" style="bottom:16px;right:56px;">SCALE 1:48 | REV.A</span>
	<span class="ref-label" style="top:16px;left:56px;">STM / ALSTOM-BBD</span>
</div>

<style>
	.crosshair {
		position: absolute;
		width: 32px;
		height: 32px;
	}
	.crosshair::before {
		content: '';
		position: absolute;
		width: 32px;
		height: 1px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		top: 50%;
	}
	.crosshair::after {
		content: '';
		position: absolute;
		width: 1px;
		height: 32px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		left: 50%;
	}

	.ref-label {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 10px;
		color: color-mix(in srgb, var(--primary) 20%, transparent);
		letter-spacing: 1.5px;
		z-index: var(--z-base);
	}

	/* Edge detail positioning — targets SVG root elements inside components */
	:global(.edge-detail) {
		position: absolute;
	}

	/* Hide engineering annotations on smaller screens */
	@media (max-width: 1023px) {
		.ref-label,
		.crosshair {
			display: none;
		}
	}

	/* Reduce opacity on mobile */
	@media (max-width: 767px) {
		.edge-details {
			opacity: var(--opacity-faint);
		}

		.train-svg {
			opacity: var(--opacity-faint);
		}
	}
</style>
