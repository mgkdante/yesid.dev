<!--
  ProjectsBlueprint — Decorative blueprint background for the projects header.
  Tunneling infrastructure drawings (TBM, tunnel section, erector, geology, vent shaft, grout injection)
  layered Da Vinci-style with crosshairs, reference labels, and vignette.
  Inline Svelte SVG components enable CSS var tokenization (currentColor → var(--primary)).
-->
<script lang="ts">
	import BlueprintTBM from '$lib/components/svg/tunneling/BlueprintTBM.svelte';
	import BlueprintTunnelSection from '$lib/components/svg/tunneling/BlueprintTunnelSection.svelte';
	import BlueprintErector from '$lib/components/svg/tunneling/BlueprintErector.svelte';
	import BlueprintGeology from '$lib/components/svg/tunneling/BlueprintGeology.svelte';
	import BlueprintVentShaft from '$lib/components/svg/tunneling/BlueprintVentShaft.svelte';
	import BlueprintGroutInjection from '$lib/components/svg/tunneling/BlueprintGroutInjection.svelte';
</script>

<div class="blueprint-bg absolute inset-0 z-0 text-[var(--primary)]" aria-hidden="true">
	<!-- TBM elevation — full-width hero layer spanning the entire header -->
	<div class="hero-svg absolute inset-x-0 top-[10%] bottom-[10%] z-0 opacity-[0.16]">
		<BlueprintTBM class="h-full w-full" />
	</div>

	<!-- Detail drawings — spread across all quadrants, no overlap concentration -->
	<div class="edge-details absolute inset-0 z-0 overflow-hidden">
		<!-- FULL-WIDTH: Geology background texture -->
		<BlueprintGeology
			class="edge-detail"
			style="top:0;left:0;width:100%;height:100%;opacity:0.10;"
		/>
		<!-- RIGHT: Tunnel cross-section -->
		<BlueprintTunnelSection
			class="edge-detail"
			style="top:5%;right:0;width:22%;height:90%;opacity:0.18;"
		/>
		<!-- LEFT-CENTER: Erector arm -->
		<BlueprintErector
			class="edge-detail"
			style="top:20%;left:12%;width:15%;height:60%;opacity:0.16;"
		/>
		<!-- CENTER-RIGHT: Ventilation shaft -->
		<BlueprintVentShaft
			class="edge-detail"
			style="top:10%;right:25%;width:8%;height:80%;opacity:0.14;"
		/>
		<!-- BOTTOM-CENTER: Grout injection -->
		<BlueprintGroutInjection
			class="edge-detail"
			style="bottom:5%;left:43%;width:14%;height:35%;opacity:0.16;"
		/>
	</div>

	<!-- Corner crosshairs -->
	<div class="crosshair" style="top:24px;left:24px;"></div>
	<div class="crosshair" style="top:24px;right:24px;"></div>
	<div class="crosshair" style="bottom:24px;left:24px;"></div>
	<div class="crosshair" style="bottom:24px;right:24px;"></div>

	<!-- Reference labels -->
	<span class="ref-label" style="top:16px;right:56px;">SEC-PROJ / TUNNELING</span>
	<span class="ref-label" style="bottom:16px;left:56px;">DWG: TBM-EPB-SECTION</span>
	<span class="ref-label" style="bottom:16px;right:56px;">SCALE NTS | REV.B</span>

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
