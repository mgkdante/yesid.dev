<!--
  Reusable Table of Contents component.
  Accepts a headings array (TocHeading[]) and renders a nested ToC with
  collapsible sections. Supports two modes:
  - Default: Desktop sticky sidebar + mobile collapsible toggle
  - Embedded: Just the nav content, parent controls layout/visibility
  Features: IntersectionObserver active tracking, collapsible header (bits-ui),
  collapsible section groups (h1/h2 parents toggle their h3/h4 children),
  ScrollArea for desktop sidebar.
-->
<script lang="ts">
	import type { TocHeading } from '@repo/shared';
	import { onMount, onDestroy } from 'svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { sharedChromeContent } from '$lib/content';
	import { ChevronToggle } from '$lib/components/brand';
	import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '$lib/components/ui/collapsible';
	import { ScrollArea } from '$lib/components/ui/scroll-area';

	const toggleSectionAria = resolveLocale(sharedChromeContent.tocToggleSectionAria, 'en');
	const tocHeading = resolveLocale(sharedChromeContent.tocHeading, 'en');
	const tocMobileButton = resolveLocale(sharedChromeContent.tocMobileButton, 'en');

	let {
		headings,
		class: className = '',
		embedded = false,
		startOpen = true,
		syncOpen = undefined,
	}: {
		headings: readonly TocHeading[];
		class?: string;
		embedded?: boolean;
		startOpen?: boolean;
		syncOpen?: boolean;
	} = $props();

	let activeId = $state('');
	let tocOpen = $state(startOpen);

	// Sync ToC open state with parent (e.g. README collapse)
	$effect(() => {
		if (syncOpen !== undefined) {
			tocOpen = syncOpen;
		}
	});
	let mobileOpen = $state(false);
	let collapsedSections = $state<Set<string>>(new Set());
	let observer: IntersectionObserver | null = null;

	// -- Section grouping for collapsible sub-items ----------------------
	// Map each child entry (h3/h4) to its parent heading (h1/h2)
	let parentMap = $derived.by(() => {
		const map: Record<string, string> = {};
		let currentParent = '';
		for (const entry of headings) {
			if (entry.level <= 2) {
				currentParent = entry.id;
			} else {
				map[entry.id] = currentParent;
			}
		}
		return map;
	});

	// Which parent entries (h1/h2) have children (h3/h4)
	let hasChildrenSet = $derived.by(() => {
		const set = new Set<string>();
		for (let i = 0; i < headings.length; i++) {
			if (headings[i].level <= 2 && i + 1 < headings.length && headings[i + 1].level > 2) {
				set.add(headings[i].id);
			}
		}
		return set;
	});

	// -- Helpers --------------------------------------------------------
	function indent(level: number): string {
		const base = Math.max(0, level - 1);
		return `${base * 0.75}rem`;
	}

	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
			activeId = id;
		}
		mobileOpen = false;
	}

	function toggleSection(id: string) {
		const next = new Set(collapsedSections);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		collapsedSections = next;
	}

	// -- Scroll + active tracking ---------------------------------------
	onMount(() => {
		observer = new IntersectionObserver(
			(observerEntries) => {
				for (const entry of observerEntries) {
					if (entry.isIntersecting) {
						activeId = entry.target.id;
					}
				}
			},
			{ rootMargin: '-80px 0px -70% 0px', threshold: 0 }
		);

		for (const tocEntry of headings) {
			const el = document.getElementById(tocEntry.id);
			if (el) observer.observe(el);
		}
	});

	onDestroy(() => {
		observer?.disconnect();
	});
</script>

<!-- Shared entry list with collapsible section groups -->
{#snippet tocEntries()}
	<ul class="space-y-0.5">
		{#each headings as entry}
			{@const isChild = entry.level > 2}
			{@const parentCollapsed = isChild && collapsedSections.has(parentMap[entry.id])}

			{#if !parentCollapsed}
				<li style="padding-left: {indent(entry.level)};">
					<div class="flex items-center">
						{#if hasChildrenSet.has(entry.id)}
							<button
								class="toc-section-chevron shrink-0"
								onclick={(e) => { e.stopPropagation(); toggleSection(entry.id); }}
								aria-label={toggleSectionAria}
							>
								<ChevronToggle open={!collapsedSections.has(entry.id)} size="sm" direction="right" />
							</button>
						{:else}
							<!-- Spacer to align entries without chevrons -->
							<span class="inline-block w-[18px] shrink-0"></span>
						{/if}
						<button
							class="toc-link flex-1 text-left font-mono text-caption leading-relaxed transition-all"
							class:active={activeId === entry.id}
							onclick={() => scrollTo(entry.id)}
						>
							{entry.text}
						</button>
					</div>
				</li>
			{/if}
		{/each}
	</ul>
{/snippet}

{#if embedded}
	<!-- Embedded mode: parent controls layout/visibility -->
	{#if headings.length > 0}
		<nav class="toc-embedded {className}" aria-label="Table of contents" data-testid="toc-embedded">
			<Collapsible bind:open={tocOpen}>
				<CollapsibleTrigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="toc-header mb-2 flex w-full items-center gap-1.5"
						>
							<ChevronToggle open={tocOpen} size="sm" direction="right" />
							<span class="label-section font-semibold tracking-wider text-[var(--muted-foreground)]">
								{tocHeading}
							</span>
						</button>
					{/snippet}
				</CollapsibleTrigger>
				<CollapsibleContent forceMount class="toc-collapsible-body">
					<div class="min-h-0 overflow-hidden">
						{@render tocEntries()}
					</div>
				</CollapsibleContent>
			</Collapsible>
		</nav>
	{/if}
{:else}
	<!-- Desktop: sticky sidebar ToC (hidden below lg breakpoint) -->
	<nav
		class="toc-desktop hidden lg:block {className}"
		aria-label="Table of contents"
		data-testid="toc-desktop"
	>
		<Collapsible bind:open={tocOpen}>
			<CollapsibleTrigger>
				{#snippet child({ props })}
					<button
						{...props}
						class="toc-header mb-2 flex w-full items-center gap-1.5"
					>
						<svg
							class="toc-header-chevron h-3 w-3 text-[var(--muted-foreground)]"
							class:rotated={tocOpen}
							viewBox="0 0 16 16"
							fill="currentColor"
						>
							<path d="M6 3l6 5-6 5V3z" />
						</svg>
						<span class="label-section font-semibold tracking-wider text-[var(--muted-foreground)]">
							{tocHeading}
						</span>
					</button>
				{/snippet}
			</CollapsibleTrigger>
			<CollapsibleContent forceMount class="toc-collapsible-body">
				<div class="min-h-0 overflow-hidden">
					<ScrollArea class="toc-scroll-area" orientation="vertical">
						{@render tocEntries()}
					</ScrollArea>
				</div>
			</CollapsibleContent>
		</Collapsible>
	</nav>

	<!-- Mobile: collapsible toggle (hidden at lg+ breakpoint) -->
	{#if headings.length > 0}
		<div class="toc-mobile mb-6 lg:hidden" data-testid="toc-mobile">
			<Collapsible bind:open={mobileOpen}>
				<CollapsibleTrigger>
					{#snippet child({ props })}
						<button
							{...props}
							class="toc-toggle flex items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--surface-3)] px-3 py-2 font-mono text-caption text-[var(--secondary-foreground)] transition-colors hover:border-[var(--primary)] hover:text-[var(--primary)]"
						>
							<ChevronToggle open={mobileOpen} size="sm" direction="right" />
							{tocMobileButton}
						</button>
					{/snippet}
				</CollapsibleTrigger>

				<CollapsibleContent forceMount class="toc-mobile-body">
					<div class="min-h-0 overflow-hidden">
						<div class="mt-2 rounded border border-[var(--border-subtle)] bg-[var(--surface-3)] p-3">
							{@render tocEntries()}
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	{/if}
{/if}

<style>
	/* ToC link: left border accent for active tracking */
	.toc-link {
		color: var(--muted-foreground);
		cursor: pointer;
		background: none;
		border: none;
		border-left: 2px solid transparent;
		padding: 0.2rem 0 0.2rem 0.5rem;
		border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
	}
	.toc-link:hover {
		color: var(--secondary-foreground);
		background: color-mix(in srgb, var(--primary) 4%, transparent);
		border-left-color: color-mix(in srgb, var(--primary) 30%, transparent);
	}
	.toc-link.active {
		color: var(--primary);
		font-weight: 600;
		border-left-color: var(--primary);
		background: color-mix(in srgb, var(--primary) 6%, transparent);
	}

	.toc-section-chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		color: var(--muted-foreground);
		transition: transform var(--duration-normal) var(--ease-default), color var(--duration-fast) var(--ease-default);
		border: none;
		background: none;
		cursor: pointer;
		padding: 0;
	}
	/* Smooth collapse animation via CSS grid — matches CollapsibleSection pattern */
	:global([data-slot="collapsible-content"].toc-collapsible-body) {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-slow) var(--ease-default);
	}
	:global([data-slot="collapsible-content"].toc-collapsible-body[data-state="open"]) {
		grid-template-rows: 1fr;
	}

	/* Mobile collapsible body — same pattern */
	:global([data-slot="collapsible-content"].toc-mobile-body) {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows var(--duration-slow) var(--ease-default);
	}
	:global([data-slot="collapsible-content"].toc-mobile-body[data-state="open"]) {
		grid-template-rows: 1fr;
	}

	/* Desktop sticky positioning — ScrollArea handles overflow */
	.toc-desktop {
		position: sticky;
		top: 5rem;
		max-height: calc(100dvh - 8rem);
		width: 200px;
		flex-shrink: 0;
	}

	/* ScrollArea within desktop ToC respects the sticky container height */
	:global(.toc-scroll-area) {
		max-height: calc(100dvh - 12rem);
	}
</style>
