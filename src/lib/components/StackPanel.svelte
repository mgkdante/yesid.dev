<!--
  Morphing panel for the tech stack page.
  Default: orientation card for first-time visitors.
  Selected: detail card with relations, markdown content, project badges, CTA.
  Used on desktop (persistent) and tablet (overlay).
-->
<script lang="ts">
	import type { TechStackItem, TechRelation, Proficiency } from '$lib/data/types.js';
	import { Marked } from 'marked';
	import { getOutgoingRelations, getIncomingRelations, getTechItemContent } from '$lib/data/tech-stack.js';
	import CollapsibleSection from './CollapsibleSection.svelte';
	import { BrandButton } from '$lib/components/brand';

	let {
		item = null,
		onclose,
		onnavigate,
	}: {
		item?: TechStackItem | null;
		onclose?: () => void;
		onnavigate?: (itemId: string) => void;
	} = $props();

	const md = new Marked();

	const proficiencyLabel: Record<Proficiency, string> = {
		expert: 'Expert',
		proficient: 'Proficient',
		familiar: 'Familiar',
	};

	// Derived content for the selected item
	const content = $derived(item ? getTechItemContent(item.id) : '');
	const renderedContent = $derived(content ? (md.parse(content) as string) : '');
	const outgoing = $derived<readonly TechRelation[]>(item ? getOutgoingRelations(item.id) : []);
	const incoming = $derived<readonly TechRelation[]>(item ? getIncomingRelations(item.id) : []);

	function formatProjectSlug(slug: string): string {
		if (slug === 'yesid-dev') return 'yesid.dev';
		return slug
			.split('-')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	function handleRelationClick(itemId: string) {
		onnavigate?.(itemId);
	}
</script>

<div class="stack-panel" data-testid="stack-panel">
	{#if item}
		<!-- Detail Card -->
		<div class="panel-detail" data-testid="panel-detail">
			<!-- Header -->
			<div class="panel-header">
				<div class="panel-identity">
					<span class="panel-icon" aria-hidden="true">
						{item.name.slice(0, 2).toUpperCase()}
					</span>
					<div>
						<h3 class="panel-name">{item.name}</h3>
						<span class="proficiency-badge" data-proficiency={item.proficiency}>
							{proficiencyLabel[item.proficiency]}
						</span>
					</div>
				</div>
				{#if onclose}
					<button
						class="close-btn"
						onclick={onclose}
						aria-label="Close panel"
						data-testid="panel-close"
					>
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
						</svg>
					</button>
				{/if}
			</div>

			<!-- Markdown content -->
			{#if renderedContent}
				<div class="panel-body" data-testid="panel-content">
					{@html renderedContent}
				</div>
			{/if}

			<!-- Project badges -->
			{#if item.relatedProjects.length > 0}
				<div class="panel-projects">
					<span class="section-label label-section font-semibold">Used in</span>
					<div class="project-badges">
						{#each item.relatedProjects as slug}
							<span class="project-badge">{formatProjectSlug(slug)}</span>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Relations (collapsible, after content) -->
			{#if outgoing.length > 0}
				<div class="relations-section" data-testid="relations-outgoing">
					<CollapsibleSection title="Sends data to ({outgoing.length})" open={false}>
						<ul class="relations-list">
							{#each outgoing as rel}
								<li class="relation-item">
									<button
										class="relation-link"
										onclick={() => handleRelationClick(rel.itemId)}
										title="View {rel.itemName}"
									>
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
				<div class="relations-section" data-testid="relations-incoming">
					<CollapsibleSection title="Receives from ({incoming.length})" open={false}>
						<ul class="relations-list">
							{#each incoming as rel}
								<li class="relation-item">
									<button
										class="relation-link"
										onclick={() => handleRelationClick(rel.itemId)}
										title="View {rel.itemName}"
									>
										{rel.itemName}
									</button>
									<span class="relation-context">{rel.contextPhrase}</span>
								</li>
							{/each}
						</ul>
					</CollapsibleSection>
				</div>
			{/if}

			<!-- CTA -->
			<div class="mt-4">
				<BrandButton variant="primary" size="sm" href="/contact" data-testid="panel-cta">
					Let's build with {item.name} <span aria-hidden="true">&rarr;</span>
				</BrandButton>
			</div>
		</div>
	{:else}
		<!-- Hint Card — nudges user to interact -->
		<div class="panel-orientation" data-testid="panel-orientation">
			<span class="orientation-label label-section font-semibold">SELECT A NODE</span>
			<p class="orientation-text">
				Click on any technology in the diagram to learn more about it — what it does,
				why it was chosen, and which projects use it.
			</p>

			<div class="orientation-hints">
				<div class="hint-item">
					<span class="hint-icon" aria-hidden="true">
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.2"/><path d="M7 4v3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="7" cy="10" r="0.75" fill="currentColor"/></svg>
					</span>
					<span class="hint-text">Click a node for details</span>
				</div>
				<div class="hint-item">
					<span class="hint-icon" aria-hidden="true">
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
					</span>
					<span class="hint-text">Hover to see connections</span>
				</div>
				<div class="hint-item">
					<span class="hint-icon" aria-hidden="true">
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1.5" y="1.5" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.2"/><path d="M4.5 7h5M7 4.5v5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
					</span>
					<span class="hint-text">Use filters to explore domains</span>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.stack-panel {
		background: var(--muted);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow-y: auto;
		max-height: calc(100dvh - 6rem);
	}

	/* --- Detail Card --- */

	.panel-detail {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1.25rem;
	}

	.panel-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.panel-identity {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.panel-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2.5rem;
		height: 2.5rem;
		border-radius: var(--radius-md);
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: var(--text-small);
		font-weight: 700;
		flex-shrink: 0;
	}

	.panel-name {
		font-family: var(--font-heading);
		font-size: var(--text-lg);
		font-weight: 600;
		color: var(--foreground);
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
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 12%, transparent);
	}

	.proficiency-badge[data-proficiency='proficient'] {
		color: var(--accent);
		background: color-mix(in srgb, var(--accent) 12%, transparent);
	}

	.proficiency-badge[data-proficiency='familiar'] {
		color: var(--muted-foreground);
		background: color-mix(in srgb, var(--muted-foreground) 12%, transparent);
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
		color: var(--muted-foreground);
		cursor: pointer;
		flex-shrink: 0;
		transition: color var(--duration-normal) var(--ease-default), border-color var(--duration-normal) var(--ease-default);
	}

	.close-btn:hover {
		color: var(--foreground);
		border-color: var(--muted-foreground);
	}

	/* --- Relations --- */

	.relations-section {
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
	}

	.relations-label,
	.section-label {
		display: block;
		margin-bottom: 0.5rem;
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
		color: var(--primary);
		text-align: left;
		transition: color var(--duration-fast) var(--ease-default);
	}

	.relation-link:hover {
		color: var(--accent);
	}

	.relation-context {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		padding-inline-start: 0.75rem;
	}

	/* --- Markdown body --- */

	.panel-body {
		font-family: var(--font-body);
		font-size: var(--text-small);
		line-height: 1.7;
		color: var(--secondary-foreground);
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
	}

	.panel-body :global(h2) {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted-foreground);
		margin: 1rem 0 0.5rem;
	}

	.panel-body :global(h2:first-child) {
		margin-top: 0;
	}

	.panel-body :global(p) {
		margin: 0 0 0.75rem;
	}

	.panel-body :global(a) {
		color: var(--primary);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	/* --- Projects --- */

	.panel-projects {
		border-top: 1px solid var(--border);
		padding-top: 0.75rem;
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
		color: var(--secondary-foreground);
		background: var(--popover);
	}

	/* --- Orientation Card --- */

	.panel-orientation {
		padding: 1.5rem 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.orientation-label {
		color: var(--primary);
	}

	.orientation-text {
		font-family: var(--font-body);
		font-size: var(--text-small);
		line-height: 1.7;
		color: var(--secondary-foreground);
		margin: 0;
	}

	.orientation-hints {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		border-top: 1px solid var(--border);
		padding-top: 1rem;
	}

	.hint-item {
		display: flex;
		align-items: center;
		gap: 0.625rem;
	}

	.hint-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 1.5rem;
		height: 1.5rem;
		flex-shrink: 0;
		color: var(--primary);
	}

	.hint-text {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		color: var(--secondary-foreground);
	}

	@media (prefers-reduced-motion: reduce) {
		.close-btn,
		.relation-link {
			transition: none;
		}
	}
</style>
