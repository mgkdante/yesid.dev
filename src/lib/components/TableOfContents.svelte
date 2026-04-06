<!--
  Reusable Table of Contents component.
  Parses HTML content to extract headings (h1-h4), generates a nested ToC with
  indentation based on heading level. Desktop: sticky sidebar on the right.
  Mobile: collapsible toggle button. Uses IntersectionObserver for active tracking.
-->
<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	// -- Types ----------------------------------------------------------
	interface TocEntry {
		id: string;
		text: string;
		level: number;
	}

	// -- Props ----------------------------------------------------------
	let {
		html,
		class: className = ''
	}: {
		html: string;
		class?: string;
	} = $props();

	// -- State ----------------------------------------------------------
	let activeId = $state('');
	let mobileOpen = $state(false);
	let observer: IntersectionObserver | null = null;

	// -- Heading extraction ---------------------------------------------
	// Slugify heading text to a URL-safe id
	function slugify(text: string): string {
		return text
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')
			.trim();
	}

	// Parse headings from HTML string and return entries + modified HTML
	// with injected id attributes on headings that lack them.
	function parseHeadings(source: string): { entries: TocEntry[]; processed: string } {
		const entries: TocEntry[] = [];
		const usedIds = new Set<string>();

		// Match h1-h4 tags, capturing attributes, inner text, and tag name
		const processed = source.replace(
			/<(h[1-4])(\s[^>]*)?>([^<]*(?:<[^/h][^>]*>[^<]*)*?)<\/\1>/gi,
			(match, tag: string, attrs: string | undefined, inner: string) => {
				const level = parseInt(tag.charAt(1), 10);
				// Strip HTML tags from inner content to get plain text
				const text = inner.replace(/<[^>]+>/g, '').trim();
				if (!text) return match;

				// Check if an id already exists
				const existingId = attrs?.match(/id="([^"]+)"/)?.[1];
				let id = existingId || slugify(text);

				// Ensure uniqueness by appending a suffix when collisions occur
				const base = id;
				let suffix = 1;
				while (usedIds.has(id)) {
					id = `${base}-${suffix++}`;
				}
				usedIds.add(id);

				entries.push({ id, text, level });

				// Inject the id attribute if it was not already present
				if (existingId) return match;
				if (attrs) {
					return `<${tag}${attrs} id="${id}">${inner}</${tag}>`;
				}
				return `<${tag} id="${id}">${inner}</${tag}>`;
			}
		);

		return { entries, processed };
	}

	// Reactive derivation: parse headings whenever html changes
	let parsed = $derived(parseHeadings(html));
	let entries = $derived(parsed.entries);

	/**
	 * Returns the HTML with heading ids injected.
	 * Consumers should use this instead of the raw html prop when rendering
	 * content alongside the ToC, so that scroll-to-heading links work.
	 */
	export function getProcessedHtml(): string {
		return parsed.processed;
	}

	// -- Indentation levels ---------------------------------------------
	// Compute left padding per heading level: h1=0, h2=0.75rem, h3=1.5rem, h4=2.25rem
	function indent(level: number): string {
		const base = Math.max(0, level - 1);
		return `${base * 0.75}rem`;
	}

	// -- Scroll + active tracking ---------------------------------------
	function scrollTo(id: string) {
		const el = document.getElementById(id);
		if (el) {
			el.scrollIntoView({ behavior: 'smooth' });
			activeId = id;
		}
		// Close mobile drawer after clicking a link
		mobileOpen = false;
	}

	onMount(() => {
		// Use IntersectionObserver to determine which heading is currently in view.
		// The rootMargin shifts the detection zone so headings near the top of the
		// viewport are considered "active" (matches user scroll position perception).
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

		// Observe all heading elements that match our ToC entries
		for (const tocEntry of entries) {
			const el = document.getElementById(tocEntry.id);
			if (el) observer.observe(el);
		}
	});

	onDestroy(() => {
		observer?.disconnect();
	});
</script>

<!-- Desktop: sticky sidebar ToC (hidden below lg breakpoint) -->
<nav
	class="toc-desktop hidden lg:block {className}"
	aria-label="Table of contents"
	data-testid="toc-desktop"
>
	<h4 class="toc-title mb-3 font-mono text-[10px] font-semibold uppercase tracking-wider text-[#666]">
		On this page
	</h4>
	<ul class="space-y-1">
		{#each entries as entry}
			<li style="padding-left: {indent(entry.level)};">
				<button
					class="toc-link w-full text-left font-mono text-[11px] leading-relaxed transition-colors"
					class:active={activeId === entry.id}
					onclick={() => scrollTo(entry.id)}
				>
					{entry.text}
				</button>
			</li>
		{/each}
	</ul>
</nav>

<!-- Mobile: collapsible toggle (hidden at lg+ breakpoint) -->
{#if entries.length > 0}
	<div class="toc-mobile mb-6 lg:hidden" data-testid="toc-mobile">
		<button
			class="toc-toggle flex items-center gap-1.5 rounded border border-[#2a2a2a] bg-[#141414] px-3 py-2 font-mono text-[11px] text-[#999] transition-colors hover:border-[#E07800] hover:text-[#E07800]"
			onclick={() => mobileOpen = !mobileOpen}
			aria-expanded={mobileOpen}
		>
			<span class="toc-chevron" class:rotated={mobileOpen}>&#x25B8;</span>
			Table of Contents
		</button>

		{#if mobileOpen}
			<ul class="mt-2 space-y-1 rounded border border-[#2a2a2a] bg-[#141414] p-3">
				{#each entries as entry}
					<li style="padding-left: {indent(entry.level)};">
						<button
							class="toc-link w-full text-left font-mono text-[11px] leading-relaxed transition-colors"
							class:active={activeId === entry.id}
							onclick={() => scrollTo(entry.id)}
						>
							{entry.text}
						</button>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
{/if}

<style>
	/* ToC link default: muted gray, active: orange brand color */
	.toc-link {
		color: #666;
		cursor: pointer;
		background: none;
		border: none;
		padding: 0.125rem 0;
	}
	.toc-link:hover {
		color: #ccc;
	}
	.toc-link.active {
		color: #E07800;
		font-weight: 600;
	}

	/* Desktop sticky positioning — sits next to content */
	.toc-desktop {
		position: sticky;
		top: 5rem;
		max-height: calc(100vh - 8rem);
		overflow-y: auto;
		width: 200px;
		flex-shrink: 0;
	}

	/* Mobile chevron rotation */
	.toc-chevron {
		display: inline-block;
		transition: transform 0.2s ease;
		font-size: 10px;
	}
	.toc-chevron.rotated {
		transform: rotate(90deg);
	}
</style>
