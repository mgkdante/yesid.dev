<!--
  Weather + Location-reveal widget.
  Wordplay hook ("Guess where I am?") leads the visitor to discover Montreal.
  GO Wave 4: full animated scene system, one crafted Montréal vignette per
  condition family (WeatherScene.svelte), day/night from the data's icon
  suffix, theme-aware palettes, crafted inline glyph (WeatherGlyph.svelte).
  Stop number computed from prop. Card dimensions/placement unchanged.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { AboutWeatherConfig } from '$lib/types';
	import type { WeatherData } from '$lib/utils/weather';
	import { resolveLocale, DEFAULT_LOCALE } from '$lib/utils/locale';
	import { getLocale } from '$lib/utils/locale-context';

	const locale = getLocale();
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';
	import WeatherScene from './WeatherScene.svelte';
	import WeatherGlyph from './WeatherGlyph.svelte';
	import { resolveWeatherScene, isNightHour } from './weather-scene';

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

	// --- Weather freshness (slice-28.1, audit #20/#122) ---
	// The `weather` prop is SSR-baked and CDN-cached with the page (up to a
	// day old). Render it immediately, then refresh from /api/weather after
	// hydration. Any failure is a graceful no-op; the baked value stays.
	let freshWeather = $state<WeatherData | null>(null);
	const currentWeather = $derived(freshWeather ?? weather ?? null);

	// Offline-scene daypart: with no icon to read d/n from, fall back to the
	// visitor's local clock, client-side only (onMount) so SSR output stays
	// deterministic (server always renders the offline scene as day).
	let clientNight = $state(false);

	onMount(() => {
		clientNight = isNightHour(new Date().getHours());
		void refreshWeather();
	});

	async function refreshWeather() {
		try {
			// Pass the active locale so OpenWeather localizes `condition`
			// (fr/es). EN omits the param, so its /api/weather URL (and CDN key)
			// stays byte-identical to before.
			const url = locale === DEFAULT_LOCALE ? '/api/weather' : `/api/weather?lang=${locale}`;
			const res = await fetch(url);
			if (!res.ok) return;
			const data = (await res.json()) as WeatherData | null;
			if (data && typeof data.temp === 'number') freshWeather = data;
		} catch {
			// Keep the SSR-baked value.
		}
	}

	const city = $derived(resolveLocale(config.city, locale));
	const hook = $derived(resolveLocale(config.hook, locale));
	const hasWeather = $derived(currentWeather != null);

	// Scene + daypart. The icon's d/n suffix is OpenWeather's own
	// sunrise/sunset calc for Montreal, data-driven and SSR-deterministic.
	// Unknown codes map to clear; missing data maps to calm offline sky.
	const sceneState = $derived(resolveWeatherScene(currentWeather?.icon));
	const night = $derived(currentWeather ? sceneState.night : clientNight);
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full p-3" data-testid="about-weather">
	<!-- Animated Montréal scene (full-bleed backdrop, purely decorative) -->
	<WeatherScene scene={sceneState.scene} {night} />

	<div class="relative flex h-full flex-col">
		<!-- Stop label: ALWAYS top-left, normal flow -->
		<StopLabel {stop} {label} />

		<!-- Centered content fills remaining space -->
		<div class="flex flex-1 flex-col items-center justify-center text-center">
			<!-- Hook: wordplay question -->
			<div class="font-mono text-caption tracking-[2px] text-[var(--secondary-foreground)]">
				{hook}
			</div>

			<!-- City reveal -->
			<div class="mt-2 text-lg font-semibold text-[var(--foreground)]">
				{city}
			</div>

			{#if hasWeather && currentWeather}
				<!-- Temperature + crafted glyph -->
				<div class="mt-1 flex items-center justify-center gap-2">
					<span class="font-mono text-2xl font-bold text-[var(--accent-text)]">
						{currentWeather.temp}°C
					</span>
					<WeatherGlyph scene={sceneState.scene} {night} label={currentWeather.condition} />
				</div>

				<!-- Condition -->
				<div class="mt-0.5 text-sm capitalize text-[var(--secondary-foreground)]">
					{currentWeather.condition}
				</div>
			{:else}
				<!-- Fallback -->
				<div class="mt-1 font-mono text-sm text-[var(--muted-foreground)]">-</div>
			{/if}
		</div>
	</div>
</Card>
</div>
