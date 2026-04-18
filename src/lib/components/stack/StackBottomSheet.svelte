<!--
  Mobile bottom sheet for tech stack detail view.
  Slides up from bottom when a node is tapped.
  Same content as StackSidebar + prev/next navigation.
  Swipe-to-dismiss, focus trap, ESC close via vaul-svelte Drawer.
-->
<script lang="ts">
	import type { TechStackItem, TechRelation, Proficiency } from '$lib/types';
	import { Marked } from 'marked';
	import { getTechItemContent, getOutgoingRelations, getIncomingRelations, getTechItemById } from '$lib/content/tech-stack';
	import CollapsibleSection from '$lib/components/shared/CollapsibleSection.svelte';
	import { Button } from '$lib/components/ui/button';
	import { Drawer, DrawerContent, DrawerTitle, DrawerClose } from '$lib/components/ui/drawer';

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
	const flatItems = $derived([...items]);
	const currentIndex = $derived(flatItems.findIndex((i) => i.id === item.id));
	const prevItem = $derived(currentIndex > 0 ? flatItems[currentIndex - 1] : null);
	const nextItem = $derived(currentIndex < flatItems.length - 1 ? flatItems[currentIndex + 1] : null);

	function navigateTo(target: TechStackItem) {
		onnavigate(target);
	}

	function formatProjectSlug(slug: string): string {
		if (slug === 'yesid-dev') return 'yesid.dev';
		return slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
	}
</script>

<Drawer open={true} onOpenChange={(v) => { if (!v) onclose(); }}>
	<DrawerContent class="max-h-[85dvh] gap-4 px-5 pb-[env(safe-area-inset-bottom,0px)]" data-testid="stack-bottomsheet">
		<DrawerTitle class="sr-only">Technology details — {item.name}</DrawerTitle>

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
			<DrawerClose>
				{#snippet child({ props })}
					<button {...props} class="close-btn" aria-label="Close" data-testid="bottomsheet-close">
						<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
							<path d="M5 5L15 15M15 5L5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
						</svg>
					</button>
				{/snippet}
			</DrawerClose>
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

		<!-- Relations (collapsible) -->
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
			<Button variant="default" size="cta-sm" href="/contact">
				Let's build with {item.name} <span aria-hidden="true">→</span>
			</Button>
		</div>
	</DrawerContent>
</Drawer>

<style>
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
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		color: var(--primary);
		font-family: var(--font-mono);
		font-size: var(--text-small);
		font-weight: 700;
		flex-shrink: 0;
	}

	.sheet-name {
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
		color: var(--primary);
		text-align: left;
	}

	.relation-context {
		font-family: var(--font-body);
		font-size: var(--text-caption);
		color: var(--muted-foreground);
		padding-inline-start: 0.75rem;
	}

	/* Markdown body */
	.sheet-body {
		font-family: var(--font-body);
		font-size: var(--text-small);
		line-height: 1.7;
		color: var(--secondary-foreground);
	}

	.sheet-body :global(h2) {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--muted-foreground);
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
		color: var(--secondary-foreground);
		background: var(--popover);
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
		color: var(--secondary-foreground);
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
		border-color: var(--primary);
		color: var(--primary);
	}

	/* CTA wrapper */
	.sheet-cta-wrapper {
		display: flex;
		justify-content: center;
		margin-top: auto;
		padding-top: 0.75rem;
		border-top: 1px solid var(--border);
	}
</style>
