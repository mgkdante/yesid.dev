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

<style>
	.about-teaser {
		display: grid;
		gap: 2.5rem;
		width: 100%;
		max-width: 72rem;
		margin-inline: auto;
		padding: 3.5rem var(--space-page-x);
	}

	.teaser-identity {
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

	/* The badge wall: one column on phones (each widget keeps its full
	   interactive treatment), two columns from sm, the full four-across row
	   on xl. Heights are generous so the flag strips, school marks, weather
	   scene and interest panels all breathe. */
	.teaser-badges {
		display: grid;
		grid-template-columns: 1fr;
		gap: var(--space-card-gap);
	}

	.badge-cell {
		min-height: 15rem;
	}

	@media (min-width: 640px) {
		.teaser-badges {
			grid-template-columns: repeat(2, 1fr);
		}
	}

	@media (min-width: 1280px) {
		.teaser-badges {
			grid-template-columns: repeat(4, 1fr);
		}

		.badge-cell {
			min-height: 17rem;
		}
	}
</style>
