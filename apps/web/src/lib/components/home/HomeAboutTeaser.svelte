<!--
  HomeAboutTeaser — the identity strip (homework #20/#21c, reshaped by the
  operator's 2026-07-03 round): the short story (name, title, bio, more-link)
  plus the REAL About-page badges, borrowed as-is so home and /about stay one
  identity: languages (flag reveal), education (school marks), location
  (weather scene), interests (comic strips). No photo widget, no stack row
  (the stack has its own page), no parallax, no scroll tricks. Big fonts.
-->
<script lang="ts">
	import type { AboutIntroContent } from '$lib/types';
	import { aboutPageContent } from '$lib/content';
	import AboutLanguages from '$lib/components/about/AboutLanguages.svelte';
	import AboutEducation from '$lib/components/about/AboutEducation.svelte';
	import AboutWeather from '$lib/components/about/AboutWeather.svelte';
	import AboutInterests from '$lib/components/about/AboutInterests.svelte';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';

	const locale = getLocale();

	let { about }: { about: AboutIntroContent } = $props();

	const name = $derived(resolveLocale(about.name, locale));
	const title = $derived(resolveLocale(about.title, locale));
	const bio = $derived(resolveLocale(about.bio, locale));
	const moreLink = $derived(resolveLocale(about.moreLink, locale));

	// The badges read the same generated About content as /about itself, so
	// a CMS edit lands in both places from one publish. Weather self-refreshes
	// from /api/weather after hydration (the widget's own behavior).
	const c = aboutPageContent;
	const badges = $derived([
		{
			area: 'languages',
			stop: '01',
			label: resolveLocale(c.stopLabels.clients, locale),
		},
		{
			area: 'education',
			stop: '02',
			label: resolveLocale(c.stopLabels.stack, locale),
		},
		{
			area: 'weather',
			stop: '03',
			label: resolveLocale(c.stopLabels.location, locale),
		},
		{
			area: 'interests',
			stop: '04',
			label: resolveLocale(c.stopLabels.interests, locale),
		},
	]);
</script>

<div class="about-teaser" data-testid="home-about-teaser">
	<div class="teaser-identity">
		<p class="teaser-name">{name}<span class="teaser-dot">.</span></p>
		<p class="teaser-title">{title}</p>
		<p class="teaser-bio">{bio}</p>
		<a href={localizeHref('/about', locale)} class="teaser-more tap-feedback" data-testid="home-about-more">
			{moreLink}
		</a>
	</div>

	<!-- Full-bleed badge wall: About's exact container (px-3) + 4px bento
	     seams, so the cards render at their true About size. -->
	<div class="teaser-badges-bleed">
		<div class="teaser-badges" data-testid="home-about-badges">
			{#each badges as badge (badge.area)}
				<div class="badge-cell badge-cell--{badge.area}">
					{#if badge.area === 'languages'}
						<AboutLanguages languages={c.languages} stop={badge.stop} label={badge.label} />
					{:else if badge.area === 'education'}
						<AboutEducation education={c.education} stop={badge.stop} label={badge.label} />
					{:else if badge.area === 'weather'}
						<AboutWeather config={c.weather} weather={null} stop={badge.stop} label={badge.label} />
					{:else}
						<AboutInterests interests={c.interests} stop={badge.stop} label={badge.label} />
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	/* Full width: the strip is a little piece of About dropped into home
	   (operator 2026-07-03), so no content cap. The story keeps page gutters;
	   the badge wall goes full-bleed like About's dashboard. */
	.about-teaser {
		display: grid;
		gap: 2.5rem;
		width: 100%;
		padding-block: 3.5rem;
	}

	.teaser-identity {
		padding-inline: var(--space-page-x);
		text-align: center;
	}

	/* Big-fonts rule (operator round 2026-07-03). */
	.teaser-name {
		font-family: var(--font-heading);
		font-size: var(--text-display);
		font-weight: 900;
		line-height: 1.05;
		color: var(--foreground);
	}

	.teaser-dot {
		color: var(--primary);
	}

	.teaser-title {
		margin-top: 0.5rem;
		font-family: var(--font-mono);
		font-size: var(--text-subheading);
		letter-spacing: 1.5px;
		text-transform: uppercase;
		color: var(--accent-text);
	}

	.teaser-bio {
		margin-top: 1.25rem;
		margin-inline: auto;
		max-width: 52ch;
		font-size: 1.125rem;
		color: var(--secondary-foreground);
		line-height: 1.8;
	}

	@media (min-width: 768px) {
		.teaser-bio {
			font-size: 1.25rem;
		}
	}

	.teaser-more {
		display: inline-block;
		margin-top: 1.25rem;
		padding: 0.5rem 0.25rem;
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: var(--text-body);
		color: var(--primary);
	}

	/* The badge wall mirrors the About bento EXACTLY (operator 2026-07-03):
	   mobile = About's mobile model (one column, auto rows, each card sizes
	   itself); desktop = a 4-column square, two rows at About's own row
	   height ((100dvh - nav - stripes) / 4 per row): languages (1 col) |
	   college (2 cols, About's education footprint) | weather (1 col), then
	   interests spanning all four (About gives it a 4-column run too). */
	/* About's exact container: px-3 wrapper + 4px bento seams. */
	.teaser-badges-bleed {
		padding-inline: 0.75rem;
	}

	.teaser-badges {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-areas:
			'languages'
			'education'
			'weather'
			'interests';
		grid-auto-rows: auto;
		gap: 4px;
	}

	.badge-cell--languages { grid-area: languages; }
	.badge-cell--education { grid-area: education; }
	.badge-cell--weather { grid-area: weather; }
	.badge-cell--interests { grid-area: interests; }

	/* Foldable/tablet: 2-col, natural heights (About's mid-breakpoint model). */
	@media (min-width: 640px) {
		.teaser-badges {
			grid-template-columns: repeat(2, 1fr);
			grid-template-areas:
				'languages education'
				'weather   interests';
		}
	}

	/* Desktop: the 4-column square, CENTERED, at About's TRUE cell size:
	   each column is exactly one About dashboard column
	   ((100vw - px-3*2 - 5 seams) / 6), so four of them + 3 seams sit as a
	   centered block; rows keep About's exact row height. */
	@media (min-width: 1024px) {
		.teaser-badges-bleed {
			width: calc((100vw - 24px - 20px) / 6 * 4 + 12px);
			margin-inline: auto;
			padding-inline: 0;
		}

		.teaser-badges {
			grid-template-columns: repeat(4, 1fr);
			grid-template-rows: repeat(2, 1fr);
			grid-template-areas:
				'languages education education weather'
				'interests interests interests interests';
			height: calc((100dvh - 5rem - 48px) / 2);
		}
	}
</style>
