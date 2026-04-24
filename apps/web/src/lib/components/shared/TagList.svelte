<script lang="ts">
	// Tags are resolved strings — no locale logic here.
	// Render nothing for empty arrays so callers don't get a dangling empty list.
	import { Badge } from '$lib/components/ui/badge';

	let { tags = [] }: { tags: string[] } = $props();
</script>

{#if tags.length > 0}
	<ul class="flex flex-wrap gap-2" data-testid="tag-list">
		{#each tags as tag}
			<li>
				<Badge variant="tag" size="sm">{tag}</Badge>
			</li>
		{/each}
	</ul>
{/if}
