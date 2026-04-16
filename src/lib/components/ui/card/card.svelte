<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils.js";

	let {
		ref = $bindable(null),
		class: className,
		children,
		size = "default",
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & { size?: "default" | "sm" } = $props();
</script>

<div
	bind:this={ref}
	data-slot="card"
	data-size={size}
	class={cn("card-surface text-card-foreground gap-4 overflow-hidden py-4 text-sm has-data-[slot=card-footer]:pb-0 has-[>img:first-child]:pt-0 data-[size=sm]:gap-3 data-[size=sm]:py-3 data-[size=sm]:has-data-[slot=card-footer]:pb-0 *:[img:first-child]:rounded-t-xl *:[img:last-child]:rounded-b-xl group/card flex flex-col", className)}
	{...restProps}
>
	{@render children?.()}
</div>

<style>
	/* Unified ProofReel surface — Constitution Section 13 Card spec */
	.card-surface {
		background: var(--background);
		border: 1px solid color-mix(in srgb, var(--primary) 25%, transparent);
		border-radius: var(--radius-lg);
		transition: border-color var(--duration-normal) var(--ease-default),
		            box-shadow var(--duration-normal) var(--ease-default);
	}
	.card-surface:hover {
		border-color: color-mix(in srgb, var(--primary) 60%, transparent);
		box-shadow: var(--shadow-section);
	}
</style>
