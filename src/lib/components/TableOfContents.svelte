<!--
  Reusable Table of Contents component.
  Parses HTML content to extract headings (h1-h4), generates a nested ToC with
  collapsible sections. Supports two modes:
  - Default: Desktop sticky sidebar + mobile collapsible toggle
  - Embedded: Just the nav content, parent controls layout/visibility
  Features: IntersectionObserver active tracking, collapsible header, collapsible
  section groups (h1/h2 parents toggle their h3/h4 children).
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface TocEntry {
		id: string;
		text: string;
		level: number;
	}

	let {
		html,
		class: className = '',
		embedded = false,
		startOpen = true,
		syncOpen = undefined
	}: {
		html: string;
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

	// -- Heading extraction ---------------------------------------------
	function slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();
	}

	function parseHeadings(source: string): { entries: TocEntry[]; processed: string } {
		const entries: TocEntry[] = [];
		const usedIds = new Set<string>();

		const processed = source.replace(
			/<(h[1-4])(\s[^>]*)?>([^<]*(?:<[^/h][^>]*>[^<]*)*?)<\/\1>/gi,
			(match, tag: string, attrs: string | undefined, inner: string) => {
				const level = parseInt(tag.charAt(1), 10);
				const text = inner.replace(/<[^>]+>/g, '').trim();
				if (!text) return match;

				const existingId = attrs?.match(/id="([^"]+)"/)?.[1];
				let id = existingId || slugify(text);

				const base = id;
				let suffix = 1;
				while (usedIds.has(id)) {
					id = `${base}-${suffix++}`;
				}
				usedIds.add(id);

				entries.push({ id, text, level });

				if (existingId) return match;
				if (attrs) {
					return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
				}
				return `<${tag} id="${id}">${inner}</${tag}>`;
			}
		);

		return { entries, processed };
	}

	let parsed = $derived(parseHeadings(html));
	let entries = $derived(parsed.entries);

	export function getProcessedHtml(): string {
		return parsed.processed;
	}

	// -- Section grouping for collapsible sub-items ----------------------
	// Map each child entry (h3/h4) to its parent heading (h1/h2)
	let parentMap = $derived.by(() => {
		const map: Record<string, string> = {};
		let currentParent = '';
		for (const entry of entries) {
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
		for (let i = 0; i < entries.length; i++) {
			if (entries[i].level <= 2 && i + 1 < entries.length && entries[i + 1].level > 2) {
				set.add(entries[i].id);
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

		for (const tocEntry of entries) {
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
		{#each entries as entry}
			{@const isChild = entry.level > 2}
			{@const parentCollapsed = isChild && collapsedSections.has(parentMap[entry.id])}

			{#if !parentCollapsed}
				<li style="padding-left: {indent(entry.level)};">
					<div class="flex items-center">
						{#if hasChildrenSet.has(entry.id)}
							<button
								class="toc-section-chevron shrink-0"
								class:rotated={!collapsedSections.has(entry.id)}
								onclick={(e) => { e.stopPropagation(); toggleSection(entry.id); }}
								aria-label="Toggle section"
							>
								<svg class="h-3.5 w-3.5" viewBox="0 0 16 16" fill="currentColor">
									<path d="M6 3l6 5-6 5V3z" />
								</svg>
							</button>
						{:else}
							<!-- Spacer to align entries without chevrons -->
							<span class="inline-block w-[18px] shrink-0"></span>
						{/if}
						<button
							class="toc-link flex-1 text-left font-mono text-[11px] leading-relaxed transition-all"
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
	{#if entries.length > 0}
		<nav class="toc-embedded {className}" aria-label="Table of contents" data-testid="toc-embedded">
			<!-- Collapsible header -->
			<button
				class="toc-header mb-2 flex w-full items-center gap-1.5"
				onclick={() => tocOpen = !tocOpen}
			>
				<svg
					class="toc-header-chevron h-3 w-3 text-[#666]"
					class:rotated={tocOpen}
					viewBox="0 0 16 16"
					fill="currentColor"
				>
					<path d="M6 3l6 5-6 5V3z" />
				</svg>
				<span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#666]">
					On this page
				</span>
			</button>
			<div class="toc-body" class:expanded={tocOpen}>
				<div>
					{@render tocEntries()}
				</div>
			</div>
		</nav>
	{/if}
{:else}
	<!-- Desktop: sticky sidebar ToC (hidden below lg breakpoint) -->
	<nav
		class="toc-desktop hidden lg:block {className}"
		aria-label="Table of contents"
		data-testid="toc-desktop"
	>
		<button
			class="toc-header mb-2 flex w-full items-center gap-1.5"
			onclick={() => tocOpen = !tocOpen}
		>
			<svg
				class="toc-header-chevron h-3 w-3 text-[#666]"
				class:rotated={tocOpen}
				viewBox="0 0 16 16"
				fill="currentColor"
			>
				<path d="M6 3l6 5-6 5V3z" />
			</svg>
			<span class="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#666]">
				On this page
			</span>
		</button>
		<div class="toc-body" class:expanded={tocOpen}>
			<div>
				{@render tocEntries()}
			</div>
		</div>
	</nav>

	<!-- Mobile: collapsible toggle (hidden at lg+ breakpoint) -->
	{#if entries.length > 0}
		<div class="toc-mobile mb-6 lg:hidden" data-testid="toc-mobile">
			<button
				class="toc-toggle flex items-center gap-1.5 rounded border border-[#2a2a2a] bg-[#141414] px-3 py-2 font-mono text-[11px] text-[#999] transition-colors hover:border-[#E07800] hover:text-[#E07800]"
				onclick={() => mobileOpen = !mobileOpen}
				aria-expanded={mobileOpen}
			>
				<svg
					class="toc-header-chevron h-3 w-3"
					class:rotated={mobileOpen}
					viewBox="0 0 16 16"
					fill="currentColor"
				>
					<path d="M6 3l6 5-6 5V3z" />
				</svg>
				Table of Contents
			</button>

			{#if mobileOpen}
				<div class="mt-2 rounded border border-[#2a2a2a] bg-[#141414] p-3">
					{@render tocEntries()}
				</div>
			{/if}
		</div>
	{/if}
{/if}

<style>
	/* ToC link: left border accent for active tracking */
	.toc-link {
		color: #666;
		cursor: pointer;
		background: none;
		border: none;
		border-left: 2px solid transparent;
		padding: 0.2rem 0 0.2rem 0.5rem;
		border-radius: 0 0.25rem 0.25rem 0;
	}
	.toc-link:hover {
		color: #ccc;
		background: rgba(224, 120, 0, 0.04);
		border-left-color: rgba(224, 120, 0, 0.3);
	}
	.toc-link.active {
		color: #E07800;
		font-weight: 600;
		border-left-color: #E07800;
		background: rgba(224, 120, 0, 0.06);
	}

	/* Section collapse chevron */
	.toc-section-chevron {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		color: #555;
		transition: transform 0.2s ease, color 0.15s ease;
		border: none;
		background: none;
		cursor: pointer;
		padding: 0;
	}
	.toc-section-chevron:hover {
		color: #E07800;
	}
	.toc-section-chevron.rotated {
		transform: rotate(90deg);
	}

	/* Header collapse chevron */
	.toc-header {
		cursor: pointer;
		background: none;
		border: none;
		padding: 0;
	}
	.toc-header:hover .toc-header-chevron {
		color: #E07800;
	}
	.toc-header-chevron {
		transition: transform 0.2s ease, color 0.15s ease;
	}
	.toc-header-chevron.rotated {
		transform: rotate(90deg);
	}

	/* Smooth collapse animation for the ToC entry list */
	.toc-body {
		display: grid;
		grid-template-rows: 0fr;
		transition: grid-template-rows 0.3s ease;
	}
	.toc-body.expanded {
		grid-template-rows: 1fr;
	}
	.toc-body > div {
		overflow: hidden;
	}

	/* Desktop sticky positioning */
	.toc-desktop {
		position: sticky;
		top: 5rem;
		max-height: calc(100vh - 8rem);
		overflow-y: auto;
		width: 200px;
		flex-shrink: 0;
	}

	/* Scrollbar handled by global brand styles in app.css */
</style>
