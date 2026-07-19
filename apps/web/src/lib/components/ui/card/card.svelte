<!-- Kept app-side per vendor/design/ui/PARITY-NOTES.md: yesid.dev requires its bevel and hover shadow. -->
<script lang="ts">
	import type { HTMLAttributes } from "svelte/elements";
	import { cn, type WithElementRef } from "$lib/utils";

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
	/* Unified card surface — Constitution Section 13 spec, tokenized GO-W2.2.
	   Spec lives in vendor/design/tokens/tokens.json (surface.2 / border.brand).
	   GO2-W5 INTERLOCKING: the panel lifts off the board — surface.2 (--card)
	   sits one solid step above the page, plus a 1px inset top bevel
	   (--edge-highlight) so the panel catches the lamp light. SOLID hex
	   always; alpha on --card is forbidden (grid must never bleed through).
	   Round 3: the brand grid draws at 2px (light also runs a stronger
	   --border-brand mix — see app.css hand region). */
	.card-surface {
		background: var(--surface-2);
		border: 2px solid var(--border-brand);
		border-radius: var(--radius-lg);
		box-shadow: inset 0 1px 0 var(--edge-highlight);
		transition: border-color var(--duration-normal) var(--ease-default),
		            box-shadow var(--duration-normal) var(--ease-default);
	}
	.card-surface:hover {
		border-color: var(--border-brand-active);
		box-shadow: var(--shadow-section), inset 0 1px 0 var(--edge-highlight);
	}
</style>
