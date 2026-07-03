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

<!-- Round-4 (operator: "don't forget the blueprints on the home page"):
     DARK opacities boldened for the first time (train 0.08 → 0.18, details
     0.10 → 0.22, crosshairs 15% → 35%, ref labels 20% → 45%) — the wall was
     dark-tuned to subliminal. Light overrides below step up in lockstep so
     light keeps reading slightly more pronounced than dark (round-3 rule). -->
<div class="blueprint-bg absolute inset-0 z-0 text-[var(--primary)]" aria-hidden="true">
	<!-- AZUR side elevation — primary full-page blueprint (centered, faint; desktop) -->
	<div class="train-svg absolute inset-x-[2%] top-[25%] bottom-[25%] z-0 hidden opacity-[0.18] md:block">
		<BlueprintAzurSide class="h-full w-full" />
	</div>

	<!-- ALL 12 blueprint SVGs — tiled wall-to-wall, no gaps (desktop canvas) -->
	<div class="edge-details absolute inset-0 z-0 hidden opacity-[0.22] overflow-hidden md:block">
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

	<!-- Mobile canvas (homework #8 follow-up): the desktop percentage tiling
	     shrinks every drawing to a sliver on a ~390x1760 single-column section,
	     so below md the wall re-tiles: fewer, larger drawings, full-bleed
	     elevations behind the heading and the between-card gaps, detail
	     callouts hugging the side margins the cards leave free. -->
	<!-- Mobile register is one step bolder than desktop (0.22 -> 0.30): the
	     drawings only surface through the heading band, card gaps, margins
	     and the closer band, so they need the extra weight to read. -->
	<div class="edge-details absolute inset-0 z-0 opacity-[0.3] overflow-hidden md:hidden">
		<!-- Heading band (above card 1) -->
		<BlueprintMr73Side class="edge-detail" style="top:0;left:-15%;width:130%;height:10%;" />
		<!-- Wide elevations vertically centered on the three inter-card gaps,
		     so each ~30px slit reveals a dense slice of drawing -->
		<BlueprintAzurSide class="edge-detail" style="top:26%;left:-30%;width:160%;height:15%;" />
		<BlueprintAzurTop class="edge-detail" style="top:51%;left:-25%;width:150%;height:12%;" />
		<BlueprintAzurSide class="edge-detail" style="top:74%;left:-40%;width:170%;height:15%;" />
		<!-- Detail callouts hugging the side margins the cards leave free -->
		<BlueprintDetailBogie class="edge-detail" style="top:14%;right:1%;width:36%;height:9%;" />
		<BlueprintAzurFront class="edge-detail" style="top:20%;left:2%;width:36%;height:11%;" />
		<BlueprintDetailDoor class="edge-detail" style="top:42%;right:1%;width:34%;height:9%;" />
		<BlueprintAzurCross class="edge-detail" style="top:47%;left:2%;width:40%;height:11%;" />
		<BlueprintDetailSeat class="edge-detail" style="top:68%;left:2%;width:32%;height:8%;" />
		<!-- Closer band (below card 4) -->
		<BlueprintDetailHandrails class="edge-detail" style="top:88%;left:-6%;width:34%;height:10%;" />
		<BlueprintAzurBogie class="edge-detail" style="top:86.5%;right:-12%;width:72%;height:13%;" />
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
		background: color-mix(in srgb, var(--primary) 35%, transparent);
		top: 50%;
	}
	.crosshair::after {
		content: '';
		position: absolute;
		width: 1px;
		height: 32px;
		background: color-mix(in srgb, var(--primary) 35%, transparent);
		left: 50%;
	}

	.ref-label {
		position: absolute;
		font-family: var(--font-mono);
		font-size: 10px;
		color: color-mix(in srgb, var(--primary) 45%, transparent);
		letter-spacing: 1.5px;
		z-index: var(--z-base);
	}

	/* GO2-W5 round 3 gave this wall its light treatment; round 4 boldens BOTH
	   modes one step (operator: home blueprints, both modes, to the services
	   register or stronger). Light: train 0.26 → 0.30, details 0.32 → 0.36,
	   crosshairs 55% → 65%, ref labels 70% → 80%. Values still sit below the
	   listing-header shells (0.46/0.42) because card content stacks on top
	   here — confident drawing behind the grid, not noise. */
	:global([data-theme='light']) .train-svg,
	:global(.theme-light) .train-svg {
		opacity: 0.30;
	}
	:global([data-theme='light']) .edge-details,
	:global(.theme-light) .edge-details {
		opacity: 0.36;
	}
	:global([data-theme='light']) .crosshair::before,
	:global([data-theme='light']) .crosshair::after,
	:global(.theme-light) .crosshair::before,
	:global(.theme-light) .crosshair::after {
		background: color-mix(in srgb, var(--primary) 65%, transparent);
	}
	:global([data-theme='light']) .ref-label,
	:global(.theme-light) .ref-label {
		color: color-mix(in srgb, var(--primary) 80%, transparent);
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

	/* Homework #8: no mobile damping. The wall reads at the same register as
	   desktop on every viewport (operator: "on mobile in the service section
	   on home, to be able to see the blueprints as well"). Only the
	   engineering annotations stay hidden below lg. */
</style>
