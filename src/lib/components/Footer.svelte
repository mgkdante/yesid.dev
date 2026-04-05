<script lang="ts">
	import { siteMeta } from '$lib/data';

	const year = new Date().getFullYear();
</script>

<footer
	data-testid="footer"
	class="relative z-50 border-t border-[var(--border)] bg-[var(--bg-primary)] px-6 py-8"
>
	<div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
		<p class="text-sm text-[var(--text-secondary)]">
			&copy; {year} <span class="font-heading font-semibold text-[var(--text-primary)]">yesid<span class="text-brand-primary">.</span></span>
		</p>

		<p class="text-[10px] text-[var(--text-muted)]">
			3D model "Montreal Metro" by <a href="https://sketchfab.com/mamontnikita62" target="_blank" rel="noopener noreferrer" class="hover:text-brand-primary">mamont nikita</a>, CC BY 4.0
		</p>

		<div class="flex items-center gap-4">
			{#if siteMeta.links.github}
				<a
					href={siteMeta.links.github}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-[var(--text-secondary)] hover:text-brand-primary"
					aria-label="GitHub"
				>
					GitHub
				</a>
			{/if}
			{#if siteMeta.links.linkedin}
				<a
					href={siteMeta.links.linkedin}
					target="_blank"
					rel="noopener noreferrer"
					class="text-sm text-[var(--text-secondary)] hover:text-brand-primary"
					aria-label="LinkedIn"
				>
					LinkedIn
				</a>
			{/if}
		</div>
	</div>
</footer>
