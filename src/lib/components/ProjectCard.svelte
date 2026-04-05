<script lang="ts">
	import TagList from './TagList.svelte';
	// use:boop adds a brief scale pulse on hover — the card "reacts" to attention.
	// It's a no-op when prefers-reduced-motion is on (checked inside the action).
	import { boop } from '$lib/motion/actions/boop.js';

	// Status drives badge rendering: public = no badge, wip = warning, private = muted.
	// The whole card is a link so the entire surface is clickable — better UX than a small button.
	let {
		title,
		oneLiner,
		slug,
		tags = [],
		status
	}: {
		title: string;
		oneLiner: string;
		slug: string;
		tags: string[];
		status: 'public' | 'private' | 'wip';
	} = $props();
</script>

<a href="/work/{slug}" class="group block" data-testid="project-card" use:boop={{ scale: 1.05, timing: 300 }}>
	<article
		class="rounded-brand-lg border border-[var(--border)] bg-[var(--bg-surface)] p-6 group-hover:border-brand-primary"
	>
		<div class="flex items-start justify-between gap-2">
			<h3 class="font-heading font-semibold text-[var(--text-primary)] text-[var(--text-h3)]">
				{title}
			</h3>
			{#if status === 'wip'}
				<!-- Warning style: brand accent yellow at low opacity background -->
				<span
					class="shrink-0 rounded-full border border-[#FFB627]/30 bg-[#FFB627]/15 px-2 py-0.5 font-mono text-xs text-[#FFB627]"
					data-testid="status-badge"
				>
					WIP
				</span>
			{:else if status === 'private'}
				<!-- Muted/locked style: blends into the surface -->
				<span
					class="shrink-0 rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)]"
					data-testid="status-badge"
				>
					Private
				</span>
			{/if}
		</div>
		<p class="mt-2 text-[var(--text-body)] text-[var(--text-secondary)]">
			{oneLiner}
		</p>
		{#if tags.length > 0}
			<div class="mt-4">
				<TagList {tags} />
			</div>
		{/if}
	</article>
</a>
