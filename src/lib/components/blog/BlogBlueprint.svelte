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
	<!-- Bridge elevation — primary full-page blueprint (centered, faintest) -->
	<div class="hero-svg absolute inset-x-[2%] top-[20%] bottom-[20%] z-0 opacity-[0.05]">
		<BlueprintBridge class="h-full w-full" />
	</div>

	<!-- Detail drawings — layered at different scales, rotations, opacities -->
	<div class="edge-details absolute inset-0 z-0 overflow-hidden">
		<BlueprintTrackPlan
			class="edge-detail"
			style="top:20%;left:2%;width:50%;height:60%;opacity:0.07;transform:rotate(-2deg);"
		/>
		<BlueprintCatenary
			class="edge-detail"
			style="top:4%;right:4%;width:42%;height:48%;opacity:0.06;transform:rotate(1deg);"
		/>
		<BlueprintSignal
			class="edge-detail"
			style="top:22%;right:18%;width:7%;height:55%;opacity:0.08;transform:rotate(3deg);"
		/>
		<BlueprintStationSection
			class="edge-detail"
			style="bottom:4%;right:6%;width:28%;height:55%;opacity:0.05;transform:rotate(-1deg);"
		/>
		<BlueprintDetailBogie
			class="edge-detail"
			style="bottom:8%;left:6%;width:16%;height:32%;opacity:0.06;transform:rotate(2deg);"
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

	<!-- Vignette overlay for depth -->
	<div
		class="absolute inset-0 z-10"
		style="background: radial-gradient(ellipse at 55% 50%, transparent 15%, rgba(10,10,10,0.65) 85%);"
	></div>
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

	/* Reduce detail layer opacity on mobile */
	@media (max-width: 767px) {
		.edge-details {
			opacity: var(--opacity-faint);
		}

		.hero-svg {
			opacity: var(--opacity-faint);
		}
	}
</style>
