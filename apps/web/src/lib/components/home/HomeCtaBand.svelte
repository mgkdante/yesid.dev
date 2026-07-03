<!--
  HomeCtaBand — the mid-page conversion band (homework #21c). Renders the
  block_cta CMS block that HomePage previously discarded: two-line heading,
  the four-trades subtitle, and the contact + GitHub actions.
-->
<script lang="ts">
	import type { CtaContent, SiteMeta } from '$lib/types';
	import { Button } from '$lib/components/ui/button';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { pressBounce } from '$lib/motion/actions';

	const locale = getLocale();

	let { cta, siteMeta }: { cta: CtaContent; siteMeta: SiteMeta } = $props();

	// The CMS heading carries a deliberate \n line break.
	const headingLines = $derived(resolveLocale(cta.heading, locale).split('\n'));
	const subtitle = $derived(resolveLocale(cta.subtitle, locale));
	const contactLabel = $derived(resolveLocale(cta.ctaContact, locale));
	const githubLabel = $derived(resolveLocale(cta.ctaGithub, locale));
</script>

<div class="cta-band" data-testid="home-cta-band">
	<h2 class="band-heading">
		{#each headingLines as line, i}
			<span class="band-line">{line}{#if i === headingLines.length - 1}<span class="band-dot">.</span>{/if}</span>
		{/each}
	</h2>
	<p class="band-subtitle">{subtitle}</p>
	<div class="band-actions">
		<span class="tap-press" use:pressBounce>
			<Button
				variant="conversion"
				size="cta-lg"
				href={localizeHref('/contact', locale)}
				data-testid="home-cta-contact"
			>
				{contactLabel}
			</Button>
		</span>
		<Button
			variant="default"
			size="cta-lg"
			href={siteMeta.links.github}
			target="_blank"
			rel="noopener"
			data-testid="home-cta-github"
			class="tap-press"
		>
			{githubLabel}
		</Button>
	</div>
</div>

<style>
	.cta-band {
		width: 100%;
		max-width: 72rem;
		margin-inline: auto;
		padding: 4rem var(--space-page-x);
		text-align: center;
	}

	.band-heading {
		font-family: var(--font-heading);
		font-size: clamp(2rem, 5vw, 3.5rem);
		font-weight: 900;
		line-height: 1.05;
		letter-spacing: -0.02em;
		color: var(--foreground);
	}

	.band-line {
		display: block;
	}

	.band-dot {
		color: var(--primary);
	}

	.band-subtitle {
		margin-top: 1rem;
		margin-inline: auto;
		max-width: 58ch;
		color: var(--secondary-foreground);
		line-height: 1.7;
	}

	.band-actions {
		margin-top: 2rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}
</style>
