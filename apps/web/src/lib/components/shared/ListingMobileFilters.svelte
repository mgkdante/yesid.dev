<script lang="ts">
	import type { Snippet } from 'svelte';
	import { ChevronToggle } from '@yesid/ui/brand';
	import { Collapsible, CollapsibleTrigger } from '@yesid/ui/collapsible';
	import CollapsibleContent from '$lib/components/ui/collapsible/collapsible-content.svelte';

	let {
		open,
		label,
		testId,
		onOpenChange,
		children,
	}: {
		open: boolean;
		label: string;
		testId: string;
		onOpenChange: (next: boolean) => void;
		children?: Snippet;
	} = $props();
</script>

<div class="mobile-filter-panel mb-4 lg:hidden" data-testid={testId}>
	<Collapsible bind:open={() => open, onOpenChange}>
		<CollapsibleTrigger>
			{#snippet child({ props })}
				<button
					{...props}
					type="button"
					class="mobile-filter-toggle tap-press"
				>
					<span>{label}</span>
					<ChevronToggle open={open} size="sm" direction="right" />
				</button>
			{/snippet}
		</CollapsibleTrigger>
		<CollapsibleContent forceMount class="mobile-filter-body">
			<div class="min-h-0 overflow-hidden">
				<div class="mobile-filter-shell">
					{#if children}
						{@render children()}
					{/if}
				</div>
			</div>
		</CollapsibleContent>
	</Collapsible>
</div>
