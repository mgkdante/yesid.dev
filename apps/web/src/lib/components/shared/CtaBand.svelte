<!--
  CtaBand — THE site conversion band (operator round 2026-07-03: one CTA,
  recycled everywhere, always centered). Renders the block_cta CMS content:
  two-line heading, the four-trades subtitle, and the contact + GitHub
  actions. Mounted on home (mid-page), service details, and project details;
  per-surface data-testids come from `testidPrefix`.
-->
<script lang="ts">
	import type { CtaContent, SiteMeta } from '$lib/types';
	import { ctaContent, siteMeta as siteMetaContent } from '$lib/content';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';
	import { pressBounce } from '$lib/motion/actions';

	const locale = getLocale();

	let {
		cta = ctaContent,
		siteMeta = siteMetaContent,
		testidPrefix = 'cta-band',
	}: { cta?: CtaContent; siteMeta?: SiteMeta; testidPrefix?: string } = $props();

	// The CMS heading carries a deliberate \n line break.
	const headingLines = $derived(resolveLocale(cta.heading, locale).split('\n'));
	const subtitle = $derived(resolveLocale(cta.subtitle, locale));
	const contactLabel = $derived(resolveLocale(cta.ctaContact, locale));
	const githubLabel = $derived(resolveLocale(cta.ctaGithub, locale));
</script>

<!-- Every CTA wears the hazard band on top (operator rule 2026-07-03). -->
<Separator variant="hazard" />
<div class="cta-band" data-testid={testidPrefix}>
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
				data-testid="{testidPrefix}-contact"
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
			data-testid="{testidPrefix}-github"
			class="tap-press"
		>
			{githubLabel}
		</Button>
	</div>
</div>

<style>
	/* Always centered, on every surface that mounts it (operator rule). */
	.cta-band {
		width: 100%;
		max-width: 72rem;
		margin-inline: auto;
		padding: 4rem var(--space-page-x);
		text-align: center;
	}

	/* Big-fonts rule (operator round 2026-07-03). */
	.band-heading {
		font-family: var(--font-heading);
		font-size: clamp(2.5rem, 6vw, 4rem);
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
		margin-top: 1.25rem;
		margin-inline: auto;
		max-width: 58ch;
		font-size: 1.125rem;
		color: var(--secondary-foreground);
		line-height: 1.7;
	}

	@media (min-width: 768px) {
		.band-subtitle {
			font-size: 1.25rem;
		}
	}

	.band-actions {
		margin-top: 2.25rem;
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		gap: 1rem;
	}
</style>
