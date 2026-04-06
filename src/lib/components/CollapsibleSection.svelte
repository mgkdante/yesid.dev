<!--
  Reusable collapsible section card.
  Used in WorkDetailPage, ServiceDetailPage (collapsible=true)
  and BlogContent (collapsible=false, visual card wrapper only).
  Pattern: border-l-[3px] accent bg-[#141414] card with optional toggle.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		open = $bindable(true),
		index = null,
		accentColor = '#E07800',
		collapsible = true,
		icon,
		children
	}: {
		title: string;
		open?: boolean;
		index?: number | null;
		accentColor?: string;
		collapsible?: boolean;
		icon?: Snippet;
		children?: Snippet;
	} = $props();

	// WHY $bindable: parents like WorkDetailPage need to read open state
	// to sync sibling elements (e.g. desktop ToC collapses with README section).
	function toggle() {
		if (collapsible) open = !open;
	}
</script>

<!--
  --accent CSS custom property propagates accentColor into the style block,
  allowing hover rules to reference the dynamic value without inline duplication.
-->
<div
	class="section-card rounded-lg border-l-[3px] bg-[#141414]"
	style="--accent: {accentColor}; border-color: {accentColor};"
>
	{#snippet headerContent()}
		{#if index !== null}
			<span
				class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold text-[#0a0a0a]"
				style="background-color: {accentColor};"
				aria-hidden="true"
			>
				{index + 1}
			</span>
		{:else if icon}
			{@render icon()}
		{/if}

		<h2 class="flex-1 font-heading text-lg font-bold" style="color: {accentColor};">
			{title}
		</h2>
	{/snippet}

	{#if collapsible}
		<!--
		  type="button" prevents accidental form submission if ever nested in a form.
		  aria-expanded conveys open/closed state to screen readers.
		-->
		<button
			type="button"
			aria-expanded={open}
			class="section-header flex w-full items-center gap-2.5 px-6 py-4 text-left"
			onclick={toggle}
		>
			{@render headerContent()}

			<svg
				class="section-chevron h-5 w-5 shrink-0 text-[#555]"
				class:rotated={open}
				viewBox="0 0 20 20"
				fill="currentColor"
				aria-hidden="true"
			>
				<path d="M8 4l7 6-7 6V4z" />
			</svg>
		</button>
	{:else}
		<div class="flex items-center gap-2.5 px-6 py-4">
			{@render headerContent()}
		</div>
	{/if}

	<!--
	  role="region" marks this as a landmark region that is controlled by the button above,
	  giving screen readers a named collapsible area to navigate.
	-->
	<div
		role="region"
		class="section-body overflow-hidden"
		class:expanded={collapsible ? open : true}
	>
		<div class="min-h-0 overflow-hidden">
			<div class="px-6 pb-6 pt-3">
				{#if children}
					{@render children()}
				{/if}
			</div>
		</div>
	</div>
</div>

<style>
	.section-card {
		transition: box-shadow 0.25s ease, border-color 0.25s ease;
	}
	/* Uses --accent custom property so hover glow matches any accentColor prop, not just the default orange. */
	.section-card:hover {
		box-shadow: 0 0 16px color-mix(in srgb, var(--accent) 10%, transparent),
					0 2px 8px rgba(0, 0, 0, 0.3);
	}

	.section-chevron {
		transition: transform 0.25s ease, color 0.15s ease;
	}
	.section-chevron.rotated {
		transform: rotate(90deg);
	}
	.section-header:hover .section-chevron {
		color: var(--accent);
	}

	.section-body {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.3s ease;
	}
	.section-body.expanded {
		grid-template-rows: 1fr;
	}
	.section-body > div {
		overflow: hidden;
	}
</style>
