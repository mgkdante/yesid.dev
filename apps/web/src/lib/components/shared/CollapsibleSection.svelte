<!--
  Reusable collapsible section card.
  Used in WorkDetailPage, ServiceDetailPage (collapsible=true)
  and BlogContent (collapsible=false, visual card wrapper only).
  Pattern: blog-card style — bg-card border-border-subtle, white title → orange hover.
  Uses bits-ui Collapsible for a11y (aria-controls, aria-expanded, focus management).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { ChevronToggle } from '$lib/components/brand';
	import { Badge } from '$lib/components/ui/badge';
	import { Card } from '$lib/components/ui/card';

	let {
		title,
		open = $bindable(true),
		index = null,
		accentColor = 'var(--primary)',
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
</script>

{#snippet headerContent()}
	{#if index !== null}
		<Badge variant="number" aria-hidden="true" style={accentColor ? `background-color: ${accentColor}` : ''}>{String(index + 1).padStart(2, '0')}</Badge>
	{:else if icon}
		{@render icon()}
	{/if}

	<h2 class="section-title flex-1 font-heading text-lg font-bold text-[var(--foreground)]">
		{title}
	</h2>
{/snippet}

<!--
  --accent CSS custom property propagates accentColor into the style block.
  Collapsible.Root renders a div that we use as the card wrapper.
-->
<Card class="section-card" style="--accent: {accentColor};">
	<Collapsible bind:open>
		{#if collapsible}
			<CollapsibleTrigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="section-header flex w-full items-center gap-2.5 px-6 py-4 text-left"
					>
						{@render headerContent()}
						<ChevronToggle {open} direction="right" />
					</button>
				{/snippet}
			</CollapsibleTrigger>
		{:else}
			<div class="flex items-center gap-2.5 px-6 py-4">
				{@render headerContent()}
			</div>
		{/if}

		<CollapsibleContent forceMount class="section-body">
			<div class="min-h-0 overflow-hidden">
				<div class="px-6 pb-6 pt-3">
					{#if children}
						{@render children()}
					{/if}
				</div>
			</div>
		</CollapsibleContent>
	</Collapsible>
</Card>

<style>
	/* Round-4: thicker delimitation around content blocks — the section-card
	   frame steps 2px → 3px (round-3 divider progression; blog/project/service
	   detail sections all compose this card). */
	:global([data-slot="card"].section-card) {
		border-width: 3px;
	}

	:global([data-slot="card"].section-card:hover) {
		border-color: var(--accent);
	}

	:global([data-slot="card"].section-card:hover .section-title) {
		color: var(--accent-text);
	}

	:global(.section-title) {
		transition: color var(--duration-normal) var(--ease-default);
	}

	:global([data-slot="collapsible-content"].section-body) {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-slow) var(--ease-default);
	}
	:global([data-slot="collapsible-content"].section-body[data-state="open"]) {
		grid-template-rows: 1fr;
	}
	:global([data-slot="collapsible-content"].section-body > div) {
		overflow: hidden;
	}
</style>
