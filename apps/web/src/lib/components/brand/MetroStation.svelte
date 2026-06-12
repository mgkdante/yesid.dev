<script lang="ts">
	import { cn } from '$lib/utils';
	import { Badge } from '$lib/components/ui/badge';

	export interface MetroStationProps {
		/** Station index (1-based, zero-padded to 2 digits) */
		index: number;
		/** Show vertical SVG line connecting to next station */
		showLine?: boolean;
		/** Stagger delay multiplier for pulse animation */
		pulseDelay?: number;
		/** Consumer styling */
		class?: string;
		[key: string]: unknown;
	}

	let {
		index,
		showLine = false,
		pulseDelay = 0,
		class: className,
		...rest
	}: MetroStationProps = $props();
</script>

<div data-slot="metro-station" class={cn('flex flex-col items-center', className)} {...rest}>
	<!-- Station badge with sonar pulse — GO2-W5: backlit STM station roundel
	     (theme-invariant signage chip; real signs don't reskin). -->
	<div class="station-badge-wrapper">
		<div
			data-slot="metro-station-pulse"
			class="station-pulse"
			style="animation-delay: {pulseDelay}s;"
		></div>
		<Badge variant="number" style="background-color: var(--signage-bg); color: var(--signage-text);" aria-hidden="true">{String(index).padStart(2, '0')}</Badge>
	</div>
	<!-- Vertical metro line connecting stations — GO2-W5: real track. The
	     yellow line survives daylight via --line-amber; darker dashes overlay
	     as rail ties (SVG attrs only, zero layout change). -->
	{#if showLine}
		<svg
			class="metro-line-svg flex-1"
			width="2"
			viewBox="0 0 2 100"
			preserveAspectRatio="none"
			aria-hidden="true"
			data-metro-line
		>
			<line
				x1="1" y1="0" x2="1" y2="100"
				stroke="var(--line-amber, var(--primary))"
				stroke-width="2"
			/>
			<line
				x1="1" y1="0" x2="1" y2="100"
				stroke="var(--border-strong)"
				stroke-width="2"
				stroke-dasharray="1 4"
				data-metro-line-ties
			/>
		</svg>
	{/if}
</div>

<style>
	.station-badge-wrapper {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.station-pulse {
		position: absolute;
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: color-mix(in srgb, var(--accent, var(--primary)) 50%, transparent);
		animation: station-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
	}
	.metro-line-svg {
		display: block;
		min-height: 20px;
	}
	@media (prefers-reduced-motion: reduce) {
		.station-pulse {
			animation: none;
			display: none;
		}
	}
</style>
