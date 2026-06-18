<!--
  Reusable collapsible section card.
  Used in project, service, and blog detail pages.
  Pattern: blog-card style — bg-card border-border-subtle, white title → orange hover.
  Uses bits-ui Collapsible for a11y (aria-controls, aria-expanded, focus management).
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { ChevronToggle } from '$lib/components/brand';
	import { Badge } from '$lib/components/ui/badge';
	import { Card } from '$lib/components/ui/card';
	import { persisted } from '$lib/state/persisted.svelte';
	import { quietModeStore } from '$lib/state/quiet-mode.svelte';

	let {
		title,
		open = $bindable(true),
		sectionKey = undefined,
		index = null,
		accentColor = 'var(--primary)',
		collapsible = true,
		anchor = undefined,
		icon,
		children
	}: {
		title: string;
		open?: boolean;
		/**
		 * slice-34.6 — opt this section's open/closed state into surviving a locale
		 * switch. When set, a session value keyed by `sectionKey` (a stable,
		 * locale-free string — NOT the translated title) is registered with the
		 * locale-handoff orchestrator and drives `open`, seeded with the `open`
		 * prop as the per-slot default. When absent, the plain `$bindable` `open`
		 * is used (existing call sites are unchanged).
		 */
		sectionKey?: string;
		index?: number | null;
		accentColor?: string;
		collapsible?: boolean;
		/** When set, renders `data-toc={anchor}` on the card root so the shared TOC
		 *  (TocNav / TocPill via toc.ts) can scroll to + active-track this section. */
		anchor?: string;
		icon?: Snippet;
		children?: Snippet;
	} = $props();

	// When a sectionKey is supplied, the open state is session-scoped: persisted()
	// seeds from the `open` prop default (or the carried value on a switch-restore)
	// and registers the key with the orchestrator. The key is captured once at
	// init — like every persisted() call site, it must be a stable string. When no
	// key is supplied, `persistedOpen` is null and the bindable `open` is the
	// source of truth (the existing behaviour).
	const persistedOpen = sectionKey ? persisted(sectionKey, open) : null;

	// Single source of truth the template binds to: the persisted value when keyed,
	// otherwise the local bindable. Writes route back to whichever owns the state.
	let isOpen = $derived(persistedOpen ? persistedOpen.value : open);
	function setOpen(next: boolean): void {
		if (persistedOpen) persistedOpen.value = next;
		else open = next;
	}

	$effect(() => {
		quietModeStore.closeSignal;
		if (collapsible && quietModeStore.enabled) setOpen(false);
	});

	let lastQuietOpenSignal = quietModeStore.openSignal;
	$effect(() => {
		const signal = quietModeStore.openSignal;
		if (signal === lastQuietOpenSignal) return;
		lastQuietOpenSignal = signal;
		if (collapsible && !quietModeStore.enabled) setOpen(true);
	});

	// GO2-W5 final batch (6d): the WHOLE card is the toggle surface.
	// Interactive children take priority — a click that originates inside a
	// link/button/input never toggles. The header button matches 'button'
	// here too, which is exactly right: its own bits-ui trigger already
	// toggles, so skipping it prevents a double-toggle. The header stays the
	// semantic button (aria-expanded, keyboard) — this handler is a pointer
	// convenience on top.
	const INTERACTIVE_CHILD = 'a,button,input,select,textarea,[role="button"]';
	function onCardClick(event: MouseEvent) {
		const target = event.target as Element | null;
		if (!target) return;
		if (target.closest(INTERACTIVE_CHILD)) return;
		// A nested card owns its own clicks — never toggle an ancestor card.
		if (target.closest('[data-slot="card"]') !== event.currentTarget) return;
		// A click that ends a text selection is content interaction, not a toggle.
		if (window.getSelection()?.toString()) return;
		setOpen(!isOpen);
	}
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
<Card
	class="section-card {collapsible ? 'section-card--toggleable' : ''}"
	style="--accent: {accentColor};"
	data-toc={anchor}
	onclick={collapsible ? onCardClick : undefined}
>
	<Collapsible bind:open={() => isOpen, setOpen}>
		{#if collapsible}
			<CollapsibleTrigger>
				{#snippet child({ props })}
					<button
						{...props}
						type="button"
						class="section-header flex w-full items-center gap-2.5 px-6 py-4 text-left"
					>
						{@render headerContent()}
						<ChevronToggle open={isOpen} direction="right" />
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

	/* GO2-W5 final batch (6d): the whole card is the toggle surface — pointer
	   affordance + the fun-pass tap-press tier (scale .97 / opacity .92,
	   ProjectCard precedent) on the NON-INTERACTIVE surface only. Presses that
	   start on interactive children (links/buttons/inputs — they keep priority
	   and their own feedback, incl. the header button) don't press the shell.
	   Extra .section-card qualifier outranks card.svelte's scoped transition. */
	/* Round 7: buttons default to cursor:default in UAs — state the pointer on
	   the header trigger explicitly so the affordance covers the WHOLE card. */
	.section-header {
		cursor: pointer;
	}

	:global([data-slot="card"].section-card.section-card--toggleable) {
		cursor: pointer;
		transition:
			border-color var(--duration-normal) var(--ease-default),
			box-shadow var(--duration-normal) var(--ease-default),
			scale 120ms cubic-bezier(0.2, 0, 0, 1),
			opacity 120ms cubic-bezier(0.2, 0, 0, 1);
	}
	:global([data-slot="card"].section-card.section-card--toggleable:active:not(
		:has(a:active, button:active, input:active, select:active, textarea:active, [role="button"]:active)
	)) {
		scale: 0.97;
		opacity: 0.92;
	}
	/* tap-press contract: reduced motion drops the timing, keeps the :active
	   state change (color transitions stay — SAFE-ALWAYS). */
	@media (prefers-reduced-motion: reduce) {
		/* Round 7: buttons default to cursor:default in UAs — state the pointer on
	   the header trigger explicitly so the affordance covers the WHOLE card. */
	.section-header {
		cursor: pointer;
	}

	:global([data-slot="card"].section-card.section-card--toggleable) {
			transition:
				border-color var(--duration-normal) var(--ease-default),
				box-shadow var(--duration-normal) var(--ease-default);
		}
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
