<script lang="ts">
	import { onMount } from 'svelte';
	import { get } from 'svelte/store';
	import AnimationPause from '#lib/components/brand/AnimationPause.svelte';
	import StopLabel from '#lib/components/brand/StopLabel.svelte';
	import { animationPaused } from '#lib/state/animation-pause.ts';
	import type { AboutWeatherConfig } from '#lib/types.ts';
	import type { WeatherData } from '#lib/utils/weather.ts';
	import { fetchFreshWeather } from '#lib/utils/weather-refresh.ts';
	import { resolveLocale } from '#lib/utils/locale.ts';
	import { getLocale } from '#lib/utils/locale-context.ts';
	import { Card } from '@yesid/ui/card';
	import WeatherScene from './WeatherScene.svelte';
	import { nextRotation, placeAt, type WeatherPlaceId } from './weather-scene';
	import { sceneState } from './weather/scene-state';
	import { nextSunEvent } from './weather/sky';

	let {
		config,
		weather,
		stop,
		label,
	}: {
		config: AboutWeatherConfig;
		weather?: WeatherData | null;
		stop: string;
		label: string;
	} = $props();

	const locale = getLocale();

	let freshWeather = $state<WeatherData | null>(null);
	const currentWeather = $derived(freshWeather ?? weather ?? null);

	// Prerendered pages cannot know the hour. Until mount the card wears the
	// site theme and the drawing is hidden; the browser then sets the real sky.
	let now = $state<number | null>(null);
	let place = $state<WeatherPlaceId>('skyline');
	let reduced = $state(false);
	let hidden = $state(false);

	onMount(() => {
		const motion = matchMedia('(prefers-reduced-motion: reduce)');
		const readMotion = () => (reduced = motion.matches);
		readMotion();
		motion.addEventListener('change', readMotion);

		// Clock-aligned rotation: every visitor sees the same place in the same
		// minute. Pause holds the place (WCAG 2.2.2); play jumps to the current one.
		// The tick also moves the sky (moonrise and moonset) while paused.
		let timer: ReturnType<typeof setTimeout>;
		let sunTimer: ReturnType<typeof setTimeout>;
		const update = (paused = get(animationPaused)) => {
			now = Date.now();
			if (!paused) place = placeAt(now);
		};
		const arm = () => {
			timer = setTimeout(() => {
				update();
				arm();
			}, nextRotation(Date.now()));
		};
		// Day and night switch exactly at Montréal's sunrise and sunset.
		const armSun = () => {
			const at = Date.now();
			sunTimer = setTimeout(() => {
				now = Date.now();
				armSun();
			}, nextSunEvent(at) - at + 250);
		};
		const unsubscribe = animationPaused.subscribe((paused) => {
			if (!paused) update(false);
		});
		const onVisible = () => {
			hidden = document.visibilityState !== 'visible';
			if (hidden) return;
			clearTimeout(timer);
			clearTimeout(sunTimer);
			update();
			arm();
			armSun();
		};
		update();
		arm();
		armSun();
		document.addEventListener('visibilitychange', onVisible);

		void fetchFreshWeather(locale).then((w) => {
			if (w) freshWeather = w;
		});

		return () => {
			clearTimeout(timer);
			clearTimeout(sunTimer);
			unsubscribe();
			motion.removeEventListener('change', readMotion);
			document.removeEventListener('visibilitychange', onVisible);
		};
	});

	const city = $derived(resolveLocale(config.city, locale));
	// Every visual parameter from the live data and the real sky over Montréal.
	// Before the browser knows the hour the server draws a neutral day frame, hidden.
	const scene = $derived(sceneState(currentWeather, now ?? Date.UTC(2026, 5, 21, 16)));
	const known = $derived(now !== null);
	// The card's own words from Directus; never the API's text, never English in FR/ES.
	const condition = $derived(scene.wordKey ? (config.conditions[scene.wordKey]?.[locale] ?? '') : '');
	const temperature = $derived(
		currentWeather
			? new Intl.NumberFormat(locale, { style: 'unit', unit: 'celsius' }).format(currentWeather.temp)
			: ''
	);
</script>

<!-- A card that does not act does not react: no hover glow. -->
<!-- The card's light follows Montréal's sun (sunrise to sunset), not the site theme. -->
<Card
	class="weather-card relative h-full p-3 {known ? (scene.dark ? 'theme-dark' : 'theme-light') : ''}"
	data-testid="about-weather"
	data-daypart={known ? (scene.dark ? 'night' : 'day') : undefined}
	data-phase={known ? scene.phase : undefined}
>
	<WeatherScene {scene} {place} pending={!known} {reduced} {hidden} />

	<div class="relative flex h-full flex-col">
		<StopLabel {stop} {label} as="h2" />

		<!-- Centred as before, nudged up so the landmark below keeps its skyline. -->
		<div class="weather-text flex flex-1 flex-col items-center justify-center pb-10 text-center">
			<div class="weather-city text-lg font-semibold text-[var(--foreground)]">{city}</div>
			{#if currentWeather}
				<div class="weather-temperature mt-1 text-2xl font-bold tabular-nums text-[var(--foreground)]">
					{temperature}
				</div>
				{#if condition}
					<div class="weather-condition mt-0.5 text-sm">{condition}</div>
				{/if}
			{:else}
				<div class="mt-1 h-8" aria-hidden="true"></div>
				<div class="mt-0.5 h-5" aria-hidden="true"></div>
			{/if}
		</div>

		<AnimationPause />
	</div>
</Card>

<style>
	/* yesid.design declares its derived tokens (surfaces, brand border) on :root only, so
	   they resolve once against the page theme. Re-declare them on the card so they follow
	   the card's own .theme-light or .theme-dark, never the site theme. */
	:global(.weather-card) {
		--surface-1: var(--card);
		--surface-2: var(--card);
		--surface-3: var(--muted);
		--border-hairline: color-mix(in srgb, var(--foreground) 8%, transparent);
	}
	:global(.weather-card.theme-dark) {
		--border-brand: color-mix(in srgb, var(--primary) 45%, transparent);
	}
	:global(.weather-card) {
		transition:
			background-color 0.6s ease,
			color 0.6s ease;
	}
	/* The words sit on the scene itself; a soft halo in the card's colour keeps
	   them legible over any landmark without a panel. */
	.weather-text {
		text-shadow:
			0 0 2px var(--card),
			0 0 10px var(--card),
			0 0 18px color-mix(in srgb, var(--card) 70%, transparent);
	}
	/* Reading ink at 92%: secondary grey alone drops under 4.5:1 over the scene. */
	.weather-condition {
		color: color-mix(in srgb, var(--foreground) 92%, transparent);
	}
	/* The pause icon keeps 3:1 over any scene through a thin halo, no tile. */
	:global(.weather-card .animation-control svg) {
		filter: drop-shadow(0 0 1.5px var(--card)) drop-shadow(0 0 4px var(--card));
	}
	/* Nothing pulses on the card (owner rule): the stop label's lamp holds still here. */
	:global(.weather-card .stop-label::before) {
		animation: none;
	}
	/* The stop label's lamp bezel follows the card's daypart, not the page theme. */
	:global(.weather-card.theme-dark .stop-label::before) {
		outline: none;
	}
	@media (max-width: 639px) {
		:global(.weather-card) {
			min-height: 176px;
		}
	}
	/* Narrow cards (233 px on the home and About grids): keep the words clear of the
	   44 px pause button even when the French stop label wraps to two lines. */
	:global(.weather-card) {
		container-type: inline-size;
	}
	@container (max-width: 260px) {
		.weather-text {
			padding-bottom: 3rem;
		}
		.weather-temperature {
			font-size: 22px;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		:global(.weather-card) {
			transition: none;
		}
	}
	@media (forced-colors: active) {
		.weather-text {
			text-shadow: none;
		}
	}
</style>
