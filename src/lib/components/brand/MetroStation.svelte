<script lang="ts">
	import { cn } from '$lib/utils.js';
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
	<!-- Station badge with sonar pulse -->
	<div class="station-badge-wrapper">
		<div
			data-slot="metro-station-pulse"
			class="station-pulse"
			style="animation-delay: {pulseDelay}s;"
		></div>
		<Badge variant="number" aria-hidden="true">{String(index).padStart(2, '0')}</Badge>
	</div>
	<!-- Vertical metro line connecting stations -->
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
				stroke="var(--primary)"
				stroke-width="2"
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
		background: color-mix(in srgb, var(--primary) 50%, transparent);
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
