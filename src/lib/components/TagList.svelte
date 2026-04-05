<script lang="ts">
	// Tags are resolved strings — no locale logic here.
	// Render nothing for empty arrays so callers don't get a dangling empty list.
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';

	let { tags = [] }: { tags: string[] } = $props();
</script>

{#if tags.length > 0}
	<ul class="flex flex-wrap gap-2" data-testid="tag-list">
		{#each tags as tag, i}
			<!-- Tags enter left-to-right with stagger — like data flowing through a pipeline. -->
			<li
				class="inline-flex items-center rounded-full border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)]"
				use:reveal={{ direction: 'up', delay: stagger(i, 80) }}
			>
				{tag}
			</li>
		{/each}
	</ul>
{/if}
