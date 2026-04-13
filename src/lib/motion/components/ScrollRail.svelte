<script lang="ts">
	import { services } from '$lib/data';
	import { scrollProgress, prefersReducedMotion } from '$lib/motion/stores';

	// pathname is injected by the layout to avoid coupling to $page store.
	let { pathname = '/' }: { pathname?: string } = $props();

	// Home page shows station dots; everything else gets a simple progress bar.
	let isHome = $derived(pathname === '/');

	// Each station's threshold is evenly distributed across the scroll range.
	// Station i activates when scrollProgress >= i / (total - 1).
	function isStationActive(index: number): boolean {
		if (services.length <= 1) return $scrollProgress > 0;
		return $scrollProgress >= index / (services.length - 1);
	}
</script>

<aside
	data-testid="scroll-rail"
	class="fixed right-4 top-1/2 z-40 -translate-y-1/2"
	aria-hidden="true"
>
	{#if isHome}
		<!-- Home page: rail is rendered in +page.svelte, hide the sidebar -->
	{:else}
		<!-- Progress bar mode -->
		<div class="relative h-48 w-0.5 overflow-hidden rounded-full bg-[var(--border)]">
			<div
				data-testid="scroll-rail-progress"
				class="absolute bottom-0 left-0 w-full rounded-full bg-primary {$prefersReducedMotion
					? ''
					: 'transition-[height] duration-150'}"
				style="height: {$scrollProgress * 100}%"
			></div>
		</div>
	{/if}
</aside>
