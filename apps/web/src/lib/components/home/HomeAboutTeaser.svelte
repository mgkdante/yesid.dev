<!--
  HomeAboutTeaser — the identity card the home page was missing (homework #20/#21c).
  Renders the block_about_intro CMS block that HomePage previously discarded:
  name, title, bio, one tool per station, location, interests, and the
  "More about me" route to /about. Terminal-card treatment in the metro voice.
-->
<script lang="ts">
	import type { AboutIntroContent } from '$lib/types';
	import { resolveLocale } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';
	import { localizeHref } from '$lib/utils/locale-routing';

	const locale = getLocale();

	let { about }: { about: AboutIntroContent } = $props();

	const name = $derived(resolveLocale(about.name, locale));
	const title = $derived(resolveLocale(about.title, locale));
	const bio = $derived(resolveLocale(about.bio, locale));
	const moreLink = $derived(resolveLocale(about.moreLink, locale));
	const stackLabel = $derived(resolveLocale(about.stackLabel, locale));
	const locationLabel = $derived(resolveLocale(about.locationLabel, locale));
	const locationCity = $derived(resolveLocale(about.location.city, locale));
	const locationRegion = $derived(resolveLocale(about.location.region, locale));
	const interestsLabel = $derived(resolveLocale(about.interestsLabel, locale));
	const interests = $derived(resolveLocale(about.interests, locale));
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

	<dl class="teaser-facts">
		{#if about.stackItems.length > 0}
			<div class="fact-row">
				<dt class="fact-label">{stackLabel}</dt>
				<dd class="fact-value">
					{#each about.stackItems as item, i}
						<span class="fact-chip">{item}</span>{#if i < about.stackItems.length - 1}<span class="fact-sep" aria-hidden="true">·</span>{/if}
					{/each}
				</dd>
			</div>
		{/if}
		<div class="fact-row">
			<dt class="fact-label">{locationLabel}</dt>
			<dd class="fact-value">{locationCity} · {locationRegion}</dd>
		</div>
		<div class="fact-row">
			<dt class="fact-label">{interestsLabel}</dt>
			<dd class="fact-value">{interests}</dd>
		</div>
	</dl>
</div>

<style>
	.about-teaser {
		display: grid;
		gap: 2rem;
		width: 100%;
		max-width: 72rem;
		margin-inline: auto;
		padding: 3.5rem var(--space-page-x);
	}

	@media (min-width: 768px) {
		.about-teaser {
			grid-template-columns: 3fr 2fr;
			align-items: start;
			gap: 3rem;
		}
	}

	.teaser-name {
		font-family: var(--font-heading);
		font-size: var(--text-title);
		font-weight: 900;
		color: var(--foreground);
	}

	.teaser-dot {
		color: var(--primary);
	}

	.teaser-title {
		margin-top: 0.25rem;
		font-family: var(--font-mono);
		font-size: var(--text-detail-kicker);
		letter-spacing: 1px;
		text-transform: uppercase;
		color: var(--accent-text);
	}

	.teaser-bio {
		margin-top: 1rem;
		max-width: 46ch;
		color: var(--secondary-foreground);
		line-height: 1.7;
	}

	.teaser-more {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.5rem 0.25rem;
		border-radius: var(--radius-md);
		font-family: var(--font-mono);
		font-size: var(--text-control);
		color: var(--primary);
	}

	.teaser-facts {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		border-left: 2px solid var(--border-brand);
		padding-left: 1.5rem;
	}

	.fact-label {
		font-family: var(--font-mono);
		font-size: var(--text-caption);
		letter-spacing: 2px;
		text-transform: uppercase;
		color: var(--primary);
	}

	.fact-value {
		margin-top: 0.25rem;
		font-family: var(--font-mono);
		font-size: var(--text-control);
		color: var(--secondary-foreground);
	}

	.fact-sep {
		margin-inline: 0.375rem;
		color: var(--muted-foreground);
	}
</style>
