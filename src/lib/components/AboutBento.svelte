<!--
  About bento grid: mini personality teaser linking to /about.
  4 widgets: photo+intro, tech stack, location, interests.
  All text from data layer (content.ts) for i18n support.
-->
<script lang="ts">
	import { aboutContent } from '$lib/data';
	import { resolveLocale } from '$lib/data/locale.js';
	import { reveal } from '$lib/motion/actions/reveal.js';
	import { stagger } from '$lib/motion/utils/stagger.js';
	import { tilt } from '$lib/motion/actions/tilt.js';

	const name = resolveLocale(aboutContent.name, 'en');
	const title = resolveLocale(aboutContent.title, 'en');
	const bio = resolveLocale(aboutContent.bio, 'en');
	const moreLink = resolveLocale(aboutContent.moreLink, 'en');
	const stackLabel = resolveLocale(aboutContent.stackLabel, 'en');
	const locationLabel = resolveLocale(aboutContent.locationLabel, 'en');
	const city = resolveLocale(aboutContent.location.city, 'en');
	const region = resolveLocale(aboutContent.location.region, 'en');
	const interestsLabel = resolveLocale(aboutContent.interestsLabel, 'en');
	const interests = resolveLocale(aboutContent.interests, 'en');
</script>

<section
	class="relative mx-auto flex max-w-5xl flex-col px-6 py-24 pr-10 md:pr-[72px]"
	data-testid="section-about-bento"
	use:reveal
>
	<div class="grid grid-cols-1 gap-3 md:grid-cols-3 md:grid-rows-2">
		<!-- Photo + intro (spans 2 rows on desktop) -->
		<div
			class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-6 md:row-span-2"
			data-testid="bento-intro"
			use:tilt={{ maxDeg: 1.5, perspective: 800 }}
			use:reveal={{ delay: stagger(0, 100) }}
		>
			<!-- Avatar placeholder -->
			<div class="mb-4 h-16 w-16 rounded-full bg-[#2a2a2a]"></div>
			<h3 class="font-heading text-lg font-bold text-[var(--text-primary)]">{name}</h3>
			<p class="mt-1 text-sm font-medium text-[#E07800]">{title}</p>
			<p class="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
				{bio}
			</p>
			<a
				href="/about"
				class="mt-4 inline-block text-sm text-[var(--text-secondary)] transition-colors hover:text-[#E07800]"
			>
				{moreLink}
			</a>
		</div>

		<!-- Tech stack -->
		<div
			class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4"
			data-testid="bento-stack"
			use:reveal={{ delay: stagger(1, 100) }}
		>
			<div class="mb-3 font-mono text-caption tracking-widest text-[var(--text-muted)]">{stackLabel}</div>
			<div class="flex flex-wrap gap-2">
				{#each aboutContent.stackItems as tech}
					<span class="rounded bg-[#222] px-2 py-1 text-xs text-[var(--text-secondary)]">{tech}</span>
				{/each}
			</div>
		</div>

		<!-- Location -->
		<div
			class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4"
			data-testid="bento-location"
			use:reveal={{ delay: stagger(2, 100) }}
		>
			<div class="mb-2 font-mono text-caption tracking-widest text-[var(--text-muted)]">{locationLabel}</div>
			<div class="text-base font-semibold text-[var(--text-primary)]">{city}</div>
			<div class="text-sm text-[var(--text-secondary)]">{region}</div>
		</div>

		<!-- Interests -->
		<div
			class="rounded-lg border border-[#2a2a2a] bg-[#1a1a1a] p-4 md:col-span-2"
			data-testid="bento-interests"
			use:reveal={{ delay: stagger(3, 100) }}
		>
			<div class="mb-2 font-mono text-caption tracking-widest text-[var(--text-muted)]">{interestsLabel}</div>
			<div class="text-sm text-[var(--text-secondary)]">
				{interests}
			</div>
		</div>
	</div>
</section>
