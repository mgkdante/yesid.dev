<!--
  BlogBlueprint — Decorative blueprint background for the blog header.
  Transit infrastructure drawings (bridge, track plan, catenary, signal, station, bogie)
  layered Da Vinci-style with crosshairs, reference labels, and vignette.
  Inline Svelte SVG components enable CSS var tokenization (currentColor → var(--primary)).
-->
<script lang="ts">
	import BlueprintBridge from '$lib/components/svg/transit/BlueprintBridge.svelte';
	import BlueprintTrackPlan from '$lib/components/svg/transit/BlueprintTrackPlan.svelte';
	import BlueprintCatenary from '$lib/components/svg/transit/BlueprintCatenary.svelte';
	import BlueprintSignal from '$lib/components/svg/transit/BlueprintSignal.svelte';
	import BlueprintStationSection from '$lib/components/svg/transit/BlueprintStationSection.svelte';
	import BlueprintDetailBogie from '$lib/components/svg/detail/BlueprintDetailBogie.svelte';
</script>

<div class="blueprint-bg absolute inset-0 z-0 text-[var(--primary)]" aria-hidden="true">
	<!-- Bridge elevation — full-width hero layer spanning the entire header -->
	<div class="hero-svg absolute inset-x-0 top-[10%] bottom-[10%] z-0 opacity-[0.16]">
		<BlueprintBridge class="h-full w-full" />
	</div>

	<!-- Detail drawings — spread across all quadrants, no overlap concentration -->
	<div class="edge-details absolute inset-0 z-0 overflow-hidden">
		<!-- TOP-LEFT: Track plan with turnout -->
		<BlueprintTrackPlan
			class="edge-detail"
			style="top:2%;left:0;width:45%;height:50%;opacity:0.18;"
		/>
		<!-- TOP-RIGHT: Catenary overhead wires -->
		<BlueprintCatenary
			class="edge-detail"
			style="top:0;right:0;width:48%;height:42%;opacity:0.16;"
		/>
		<!-- BOTTOM-LEFT: Bogie detail -->
		<BlueprintDetailBogie
			class="edge-detail"
			style="bottom:2%;left:2%;width:22%;height:42%;opacity:0.16;"
		/>
		<!-- BOTTOM-CENTER: Station cross-section -->
		<BlueprintStationSection
			class="edge-detail"
			style="bottom:0;left:28%;width:35%;height:52%;opacity:0.14;"
		/>
		<!-- BOTTOM-RIGHT: Signal diagram -->
		<BlueprintSignal
			class="edge-detail"
			style="bottom:4%;right:8%;width:10%;height:58%;opacity:0.20;"
		/>
	</div>

	<!-- Corner crosshairs -->
	<div class="crosshair" style="top:24px;left:24px;"></div>
	<div class="crosshair" style="top:24px;right:24px;"></div>
	<div class="crosshair" style="bottom:24px;left:24px;"></div>
	<div class="crosshair" style="bottom:24px;right:24px;"></div>

	<!-- Reference labels -->
	<span class="ref-label" style="top:16px;right:56px;">SEC-BLOG / DISPATCHES</span>
	<span class="ref-label" style="bottom:16px;left:56px;">DWG: TRANSIT-OPS-ELEV</span>
	<span class="ref-label" style="bottom:16px;right:56px;">SCALE NTS | REV.A</span>

</div>

<style>
	.crosshair {
		position: absolute;
		width: 24px;
		height: 24px;
	}
	.crosshair::before {
		content: '';
		position: absolute;
		width: 24px;
		height: 1px;
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		top: 50%;
	}
	.crosshair::after {
		content: '';
		position: absolute;
		width: 1px;
		height: 24px;
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

	/* Keep blueprints bold on mobile — no opacity reduction */
</style>
