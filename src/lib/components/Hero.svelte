<script lang="ts">
	// CTAs are both optional. When both are absent, the CTA row is not rendered at all.
	// Left-aligned layout — more personal/developer feel than centered.
	let {
		heading,
		subheading,
		primaryCta,
		secondaryCta
	}: {
		heading: string;
		subheading: string;
		primaryCta?: { label: string; href: string };
		secondaryCta?: { label: string; href: string };
	} = $props();
</script>

<section class="py-20 md:py-32" data-testid="hero">
	<h1
		class="font-heading text-4xl font-bold leading-tight text-[var(--text-primary)] md:text-5xl"
	>
		{heading}
	</h1>
	<p class="mt-4 max-w-2xl text-lg text-[var(--text-secondary)] md:text-xl">
		{subheading}
	</p>
	{#if primaryCta || secondaryCta}
		<div class="mt-8 flex flex-wrap gap-4" data-testid="hero-ctas">
			{#if primaryCta}
				<a
					href={primaryCta.href}
					class="inline-flex items-center rounded-mdbg-brand-primary px-6 py-3 font-semibold text-white hover:bg-brand-primary-hover"
					data-testid="hero-primary-cta"
				>
					{primaryCta.label}
				</a>
			{/if}
			{#if secondaryCta}
				<a
					href={secondaryCta.href}
					class="inline-flex items-center rounded-mdborder border-[var(--border)] px-6 py-3 font-semibold text-[var(--text-primary)] hover:border-brand-primary hover:text-brand-primary"
					data-testid="hero-secondary-cta"
				>
					{secondaryCta.label}
				</a>
			{/if}
		</div>
	{/if}
</section>
