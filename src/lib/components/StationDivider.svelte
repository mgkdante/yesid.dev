<!--
  Yellow/black hazard-stripe divider between metro stops.
  Evokes the platform edge warning strips found in real metro stations.
-->
<script lang="ts">
	let {
		label = ''
	}: {
		label?: string;
	} = $props();
</script>

<div class="relative mx-auto w-full max-w-5xl px-6" aria-hidden="true">
	<!-- Hazard stripe bar -->
	<div
		class="h-1.5 rounded-sm"
		style="background: repeating-linear-gradient(
			-45deg,
			#FFB627 0px,
			#FFB627 8px,
			#141414 8px,
			#141414 16px
		);"
	></div>
	{#if label}
		<div class="mt-2 font-mono text-xs tracking-[3px] text-[#E07800] md:text-sm">
			{label}
		</div>
	{/if}
</div>
