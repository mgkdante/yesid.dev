<!--
  Mobile bottom sheet for tech stack detail view.
  Slides up from bottom when a node is tapped.
  Same content as StackSidebar + prev/next navigation + swipe-to-dismiss.
-->
<script lang="ts">
	import type { TechStackItem, TechRelation, Proficiency } from '$lib/data/types.js';
	import { Marked } from 'marked';
	import { onMount } from 'svelte';
	import { gsap } from '$lib/motion/utils/gsap.js';
	import { isPrefersReducedMotion } from '$lib/motion/stores/reducedMotion.js';
	import { getTechItemContent, getOutgoingRelations, getIncomingRelations, getTechItemById } from '$lib/data/tech-stack.js';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import { BrandButton } from '$lib/components/brand';

	let {
		item,
		items,
		onclose,
		onnavigate,
	}: {
		item: TechStackItem;
		items: readonly TechStackItem[];
		onclose: () => void;
		onnavigate: (item: TechStackItem | null) => void;
	} = $props();

	let sheetEl = $state<HTMLElement | null>(null);
	let backdropEl = $state<HTMLElement | null>(null);

	const md = new Marked();

	const proficiencyLabel: Record<Proficiency, string> = {
		expert: 'Expert',
		proficient: 'Proficient',
		familiar: 'Familiar',
	};

	const content = $derived(getTechItemContent(item.id));
	const renderedContent = $derived(md.parse(content) as string);
	const outgoing = $derived<readonly TechRelation[]>(getOutgoingRelations(item.id));
	const incoming = $derived<readonly TechRelation[]>(getIncomingRelations(item.id));

	function handleRelationClick(itemId: string) {
		const target = getTechItemById(itemId);
		if (target) onnavigate(target);
	}

	// --- Prev / Next navigation ---
	// Flatten items in layer order for sequential navigation
	const flatItems = $derived([...items]);
	const currentIndex = $derived(flatItems.findIndex((i) => i.id === item.id));

	const prevItem = $derived(currentIndex > 0 ? flatItems[currentIndex - 1] : null);
	const nextItem = $derived(
		currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null,
	);

	function navigateTo(target: TechStackItem) {
		onnavigate(target);
	}

	function formatProjectSlug(slug: string): string {
		if (slug === 'yesid-dev') return 'yesid.dev';
		return slug
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	// --- Touch swipe to dismiss ---
	let touchStartY = 0;
	let touchDeltaY = 0;

	function handleTouchStart(e: TouchEvent) {
		touchStartY = e.touches[0].clientY;
		touchDeltaY = 0;
	}

	function handleTouchMove(e: TouchEvent) {
		touchDeltaY = e.touches[0].clientY - touchStartY;
		// Only allow downward drag
		if (touchDeltaY > 0 && sheetEl) {
			sheetEl.style.transform = `translateY(${touchDeltaY}px)`;
		}
	}

	function handleTouchEnd() {
		if (touchDeltaY > 100) {
			// Dismiss
			onclose();
		} else if (sheetEl) {
			// Snap back
			gsap.to(sheetEl, { y: 0, duration: 0.2, ease: 'power2.out' });
		}
		touchDeltaY = 0;
	}

	onMount(() => {
		if (!isPrefersReducedMotion()) {
			if (backdropEl) {
				gsap.fromTo(backdropEl, { opacity: 0 }, { opacity: 1, duration: 0.25 });
			}
			if (sheetEl) {
				gsap.fromTo(
					sheetEl,
					{ y: '100%' },
					{ y: '0%', duration: 0.35, ease: 'power2.out' },
				);
			}
		}
	});
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="bottomsheet-backdrop" bind:this={backdropEl} onclick={onclose} data-testid="bottomsheet-backdrop">
	<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions a11y_interactive_supports_focus -->
	<div
		class="bottomsheet"
		bind:this={sheetEl}
		onclick={(e) => e.stopPropagation()}
		ontouchstart={handleTouchStart}
		ontouchmove={handleTouchMove}
		ontouchend={handleTouchEnd}
		data-testid="stack-bottomsheet"
		role="dialog"
		aria-label="Technology details"
	>
		<!-- Drag handle -->
		<div class="drag-handle">
			<span class="handle-bar"></span>
		</div>

		<!-- Header -->
		<div class="sheet-header">
			<div class="sheet-identity">
				<span class="sheet-icon" aria-hidden="true">
					{item.name.slice(0, 2).toUpperCase()}
				</span>
				<div>
					<h3 class="sheet-name">{item.name}</h3>
					<span class="proficiency-badge" data-proficiency={item.proficiency}>
						{proficiencyLabel[item.proficiency]}
					</span>
				</div>
			</div>
			<button class="close-btn" onclick={onclose} aria-label="Close" data-testid="bottomsheet-close">
				<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
					<path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
				</svg>
			</button>
		</div>

		<!-- Content -->
		<div class="sheet-body" data-testid="bottomsheet-content">
			{@html renderedContent}
		</div>

		<!-- Project badges -->
		{#if item.relatedProjects.length > 0}
			<div class="sheet-projects">
				<span class="projects-label label-section font-semibold">Used in</span>
				<div class="project-badges">
					{#each item.relatedProjects as slug}
						<span class="project-badge">{formatProjectSlug(slug)}</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Relations (collapsible, between Used in and nav) -->
		{#if outgoing.length > 0}
			<div class="sheet-relations" data-testid="relations-outgoing">
				<CollapsibleSection title="Sends data to ({outgoing.length})" open={false}>
					<ul class="relations-list">
						{#each outgoing as rel}
							<li class="relation-item">
								<button class="relation-link" onclick={() => handleRelationClick(rel.itemId)}>
									{rel.itemName}
								</button>
								<span class="relation-context">{rel.contextPhrase}</span>
							</li>
						{/each}
					</ul>
				</CollapsibleSection>
			</div>
		{/if}

		{#if incoming.length > 0}
			<div class="sheet-relations" data-testid="relations-incoming">
				<CollapsibleSection title="Receives from ({incoming.length})" open={false}>
					<ul class="relations-list">
						{#each incoming as rel}
							<li class="relation-item">
								<button class="relation-link" onclick={() => handleRelationClick(rel.itemId)}>
									{rel.itemName}
								</button>
								<span class="relation-context">{rel.contextPhrase}</span>
							</li>
						{/each}
					</ul>
				</CollapsibleSection>
			</div>
		{/if}

		<!-- Prev/Next navigation -->
		<div class="sheet-nav">
			<button
				class="nav-btn"
				disabled={!prevItem}
				onclick={() => prevItem && navigateTo(prevItem)}
				aria-label="Previous technology"
			>
				← {prevItem?.name ?? ''}
			</button>
			<button
				class="nav-btn"
				disabled={!nextItem}
				onclick={() => nextItem && navigateTo(nextItem)}
				aria-label="Next technology"
			>
				{nextItem?.name ?? ''} →
			</button>
		</div>

		<!-- CTA -->
		<div class="sheet-cta-wrapper">
			<BrandButton variant="primary" size="sm" href="/contact">
				Let's build with {item.name} <span aria-hidden="true">→</span>
			</BrandButton>
		</div>
	</div>
</div>

<style>
	.bottomsheet-backdrop {
		position: fixed;
		inset: 0;
		z-index: var(--z-sheet);
		background: rgba(0, 0, 0, 0.5);
	}

	.bottomsheet {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: calc(var(--z-sheet) + 1);
		max-height: 85vh;
		overflow-y: auto;
		background: var(--bg-surface);
		border-top: 1px solid var(--border);
		border-radius: var(--radius-lg) var(--radius-lg) 0 0;
		padding: 0.5rem 1.25rem 0;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.drag-handle {
		display: flex;
		justify-content: center;
		padding: 0.5rem 0;
	}

	.handle-bar {
		width: 2.5rem;
		height: 0.25rem;
		border-radius: var(--radius-pill);
		background: var(--text-muted);
		opacity: var(--opacity-dim);
	}

	.sheet-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.sheet-identity {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.sheet-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--brand-primary) 15%, transparent);
		color: var(--brand-primary);
		font-family: var(--font-mono);
		font-size: var(--text-small);
		font-weight: 700;
		flex-shrink: 0;
	}

	.sheet-name {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--text-primary);
		margin: 0;
		line-height: 1.2;
	}

	.proficiency-badge {
		display: inline-block;
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 0.125rem 0.5rem;
		border-radius: var(--radius-sm);
		margin-top: 0.25rem;
	}

	.proficiency-badge[data-proficiency='expert'] {
		color: var(--brand-primary);
		background: color-mix(in srgb, var(--brand-primary) 12%, transparent);
	}

	.proficiency-badge[data-proficiency='proficient'] {
		color: var(--brand-accent);
		background: color-mix(in srgb, var(--brand-accent) 12%, transparent);
	}

	.proficiency-badge[data-proficiency='familiar'] {
		color: var(--text-muted);
		background: color-mix(in srgb, var(--text-muted) 12%, transparent);
	}

	.close-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		height: 2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-muted);
		cursor: pointer;
		flex-shrink: 0;
	}

	/* Relations */
	.sheet-relations {
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
	}

	.relations-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.relation-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.relation-link {
		background: none;
		border: none;
		padding: 0;
		cursor: pointer;
		font-family: var(--font-body);
		font-size: var(--text-small);
		font-weight: 600;
		color: var(--brand-primary);
		text-align: left;
	}

	.relation-context {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		color: var(--text-muted);
		padding-inline-start: 0.75rem;
	}

	/* Markdown body */
	.sheet-body {
		font-family: var(--font-body);
		font-size: var(--text-small);
		line-height: 1.7;
		color: var(--text-secondary);
	}

	.sheet-body :global(h2) {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin: 1rem 0 0.5rem;
	}

	.sheet-body :global(h2:first-child) {
		margin-top: 0;
	}

	.sheet-body :global(p) {
		margin: 0 0 0.75rem;
	}

	/* Projects */
	.sheet-projects {
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
	}

	.projects-label {
		display: block;
		margin-bottom: 0.375rem;
	}

	.project-badges {
		display: flex;
		flex-wrap: wrap;
		gap: 0.375rem;
	}

	.project-badge {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		padding: 0.25rem 0.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		background: var(--bg-elevated);
	}

	/* Prev/Next */
	.sheet-nav {
		display: flex;
		justify-content: space-between;
		gap: 0.5rem;
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
	}

	.nav-btn {
		flex: 1;
		padding: 0.5rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		background: transparent;
		color: var(--text-secondary);
		font-family: var(--font-body);
		font-size: var(--text-caption);
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.nav-btn:disabled {
		opacity: 0.3;
		cursor: default;
	}

	.nav-btn:not(:disabled):hover {
		border-color: var(--brand-primary);
		color: var(--brand-primary);
	}

	/* CTA wrapper — sticky at bottom so it's always visible */
	.sheet-cta-wrapper {
		display: flex;
		justify-content: center;
		position: sticky;
		bottom: 0;
		margin-top: auto;
		padding: 0.75rem 1.25rem;
		margin-inline: -1.25rem;
		background: var(--bg-surface);
		box-shadow: 0 -1px 0 var(--border);
	}

	@media (prefers-reduced-motion: reduce) {
		.bottomsheet,
		.bottomsheet-backdrop {
			transition: none;
		}
	}
</style>
