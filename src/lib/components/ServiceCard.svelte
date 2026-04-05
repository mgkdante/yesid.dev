<script lang="ts">
	// icon is a string identifier (e.g. 'database') — rendered as text placeholder
	// until an icon library is integrated in a future slice.
	let { title, description, icon }: { title: string; description: string; icon?: string } =
		$props();
</script>

<article
	class="rounded-brand-lg border border-[var(--border)] bg-[var(--bg-surface)] p-6 hover:border-brand-primary"
	data-testid="service-card"
>
	{#if icon}
		<!-- Placeholder: renders the icon identifier as text. Swap for SVG in a future slice. -->
		<div
			class="mb-4 flex h-10 w-10 items-center justify-center rounded-brand bg-[var(--bg-elevated)] font-mono text-sm text-brand-primary"
			data-testid="service-icon"
			aria-hidden="true"
		>
			{icon}
		</div>
	{/if}
	<h3 class="mb-2 font-heading font-semibold text-[var(--text-primary)] text-[var(--text-h3)]">
		{title}
	</h3>
	<p class="leading-relaxed text-[var(--text-body)] text-[var(--text-secondary)]">
		{description}
	</p>
</article>
