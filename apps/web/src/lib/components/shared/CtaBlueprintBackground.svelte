<script lang="ts">
	import { BlueprintShell } from '$lib/components/brand';
	import BlueprintAzurSide from '$lib/components/svg/azur/BlueprintAzurSide.svelte';
	import BlueprintBridge from '$lib/components/svg/transit/BlueprintBridge.svelte';
	import BlueprintCatenary from '$lib/components/svg/transit/BlueprintCatenary.svelte';
	import BlueprintSignal from '$lib/components/svg/transit/BlueprintSignal.svelte';
	import BlueprintStationSection from '$lib/components/svg/transit/BlueprintStationSection.svelte';
	import BlueprintGeology from '$lib/components/svg/tunneling/BlueprintGeology.svelte';
	import BlueprintTBM from '$lib/components/svg/tunneling/BlueprintTBM.svelte';
	import BlueprintTunnelSection from '$lib/components/svg/tunneling/BlueprintTunnelSection.svelte';
	import BlueprintVentShaft from '$lib/components/svg/tunneling/BlueprintVentShaft.svelte';
	import BlueprintTransitRoute from '$lib/components/svg/cta/BlueprintTransitRoute.svelte';
	import BlueprintInterfaceSuite from '$lib/components/svg/cta/BlueprintInterfaceSuite.svelte';
	import BlueprintDataPipeline from '$lib/components/svg/cta/BlueprintDataPipeline.svelte';
	import BlueprintCodeSystem from '$lib/components/svg/cta/BlueprintCodeSystem.svelte';
</script>

<BlueprintShell
	class="cta-blueprint-background"
	labels={['SEC-CTA / MOVE', 'DWG: MOVE-04', 'SCALE NTS | REV.A']}
	data-testid="cta-blueprint-background"
>
	{#snippet hero()}
		<BlueprintAzurSide class="h-full w-full" />
	{/snippet}

	{#snippet details()}
		<BlueprintBridge
			class="edge-detail cta-sheet cta-sheet--bridge"
			data-cta-sheet="bridge"
		/>
		<BlueprintCatenary
			class="edge-detail cta-sheet cta-sheet--catenary"
			data-cta-sheet="catenary"
		/>
		<BlueprintTunnelSection
			class="edge-detail cta-sheet cta-sheet--tunnel"
			data-cta-sheet="tunnel"
		/>
		<BlueprintGeology
			class="edge-detail cta-sheet cta-sheet--geology"
			data-cta-sheet="geology"
		/>
		<BlueprintInterfaceSuite
			class="edge-detail cta-sheet cta-sheet--interface"
			data-cta-sheet="interface"
		/>
		<BlueprintSignal
			class="edge-detail cta-sheet cta-sheet--signal"
			data-cta-sheet="signal"
		/>
		<BlueprintVentShaft
			class="edge-detail cta-sheet cta-sheet--vent-shaft"
			data-cta-sheet="vent-shaft"
		/>
		<BlueprintTransitRoute
			class="edge-detail cta-sheet cta-sheet--transit"
			data-cta-sheet="transit"
		/>
		<BlueprintTBM
			class="edge-detail cta-sheet cta-sheet--tbm"
			data-cta-sheet="tbm"
		/>
		<BlueprintDataPipeline
			class="edge-detail cta-sheet cta-sheet--pipeline"
			data-cta-sheet="pipeline"
		/>
		<BlueprintStationSection
			class="edge-detail cta-sheet cta-sheet--station"
			data-cta-sheet="station"
		/>
		<BlueprintCodeSystem
			class="edge-detail cta-sheet cta-sheet--code"
			data-cta-sheet="code"
		/>
	{/snippet}
</BlueprintShell>

<style>
	:global(.cta-blueprint-background) {
		pointer-events: none;
		contain: paint;
	}

	:global(.cta-sheet) {
		max-width: none;
	}

	:global(.cta-sheet--bridge) {
		top: -1%;
		left: -4%;
		width: 40%;
		height: 32%;
		opacity: 0.15;
	}

	:global(.cta-sheet--catenary) {
		top: 0;
		left: 28%;
		width: 30%;
		height: 24%;
		opacity: 0.16;
	}

	:global(.cta-sheet--tunnel) {
		top: -3%;
		left: 44%;
		width: 14%;
		height: 44%;
		opacity: 0.18;
	}

	:global(.cta-sheet--geology) {
		top: 20%;
		left: 18%;
		width: 58%;
		height: 34%;
		opacity: 0.15;
	}

	:global(.cta-sheet--interface) {
		top: -4%;
		right: -2%;
		width: 31%;
		height: 56%;
		opacity: 0.17;
	}

	:global(.cta-sheet--signal) {
		top: 27%;
		left: 0;
		width: 7%;
		height: 38%;
		opacity: 0.17;
	}

	:global(.cta-sheet--vent-shaft) {
		top: 23%;
		right: 0;
		width: 6.5%;
		height: 50%;
		opacity: 0.17;
	}

	:global(.cta-sheet--transit) {
		bottom: -3%;
		left: -3%;
		width: 34%;
		height: 36%;
		opacity: 0.2;
	}

	:global(.cta-sheet--tbm) {
		bottom: 22%;
		left: 5%;
		width: 55%;
		height: 30%;
		opacity: 0.16;
	}

	:global(.cta-sheet--pipeline) {
		bottom: -2%;
		left: 28%;
		width: 39%;
		height: 39%;
		opacity: 0.18;
	}

	:global(.cta-sheet--station) {
		bottom: -4%;
		left: 62%;
		width: 15%;
		height: 28%;
		opacity: 0.18;
	}

	:global(.cta-sheet--code) {
		right: -3%;
		bottom: -10%;
		width: 26%;
		height: 52%;
		opacity: 0.16;
	}

	@media (max-width: 1023px) {
		:global(.cta-sheet--bridge) {
			top: -2%;
			left: -8%;
			width: 60%;
			height: 27%;
		}

		:global(.cta-sheet--catenary) {
			top: 0;
			left: 28%;
			width: 42%;
			height: 22%;
		}

		:global(.cta-sheet--tunnel) {
			top: -3%;
			left: 45%;
			width: 20%;
			height: 42%;
		}

		:global(.cta-sheet--geology) {
			top: 20%;
			left: 14%;
			width: 72%;
			height: 24%;
		}

		:global(.cta-sheet--interface) {
			top: -2%;
			right: -8%;
			width: 42%;
			height: 48%;
		}

		:global(.cta-sheet--signal) {
			top: 27%;
			left: -1%;
			width: 9.5%;
			height: 34%;
		}

		:global(.cta-sheet--vent-shaft) {
			top: 24%;
			right: -1%;
			width: 9%;
			height: 46%;
		}

		:global(.cta-sheet--transit) {
			bottom: -3%;
			left: -8%;
			width: 48%;
			height: 32%;
		}

		:global(.cta-sheet--tbm) {
			bottom: 23%;
			left: 0;
			width: 74%;
			height: 22%;
		}

		:global(.cta-sheet--pipeline) {
			bottom: -2%;
			left: 21%;
			width: 52%;
			height: 30%;
		}

		:global(.cta-sheet--station) {
			bottom: -4%;
			left: 62%;
			width: 24%;
			height: 27%;
		}

		:global(.cta-sheet--code) {
			right: -10%;
			bottom: -10%;
			width: 38%;
			height: 45%;
		}
	}

	@media (max-width: 767px) {
		:global(.cta-sheet--catenary),
		:global(.cta-sheet--geology),
		:global(.cta-sheet--signal),
		:global(.cta-sheet--vent-shaft),
		:global(.cta-sheet--tbm) {
			display: none;
		}

		:global(.cta-sheet--bridge) {
			top: -2%;
			left: -62%;
			width: 140%;
			height: 30%;
		}

		:global(.cta-sheet--tunnel) {
			top: 3%;
			right: -24%;
			left: auto;
			width: 64%;
			height: 49%;
		}

		:global(.cta-sheet--interface) {
			top: 18%;
			right: auto;
			left: -43%;
			width: 112%;
			height: 52%;
		}

		:global(.cta-sheet--transit) {
			top: 44%;
			bottom: auto;
			left: -54%;
			width: 148%;
			height: 30%;
		}

		:global(.cta-sheet--pipeline) {
			bottom: 3%;
			left: -44%;
			width: 118%;
			height: 28%;
		}

		:global(.cta-sheet--station) {
			top: 31%;
			right: -42%;
			bottom: auto;
			left: auto;
			width: 94%;
			height: 28%;
		}

		:global(.cta-sheet--code) {
			right: -48%;
			bottom: -15%;
			width: 108%;
			height: 52%;
		}
	}
</style>
