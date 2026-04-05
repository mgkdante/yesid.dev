<script lang="ts">
	// Subtitle is optional — omit it and only the heading renders.
	let { title, subtitle }: { title: string; subtitle?: string } = $props();
</script>

<header data-testid="section-header">
	<h2 class="font-heading font-bold text-[var(--text-primary)] text-[var(--text-h2)]">
		{title}
	</h2>
	{#if subtitle}
		<p class="mt-2 text-[var(--text-body)] text-[var(--text-secondary)]">
			{subtitle}
		</p>
	{/if}
</header>
