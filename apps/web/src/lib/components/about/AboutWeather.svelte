<!--
  Weather + Location-reveal widget.
  Wordplay hook ("Guess where I am?") leads the visitor to discover Montreal.
  Condition-based gradient tint. Feels-like temp.
  Stop number computed from prop.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import type { AboutWeatherConfig } from '$lib/types';
	import type { WeatherData } from '$lib/utils/weather';
	import { resolveLocale } from '$lib/utils/locale';
	import { cursorGlow } from '$lib/motion/actions/cursorGlow.js';
	import { StopLabel } from '$lib/components/brand';
	import { Card } from '$lib/components/ui/card';

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
	// hydration. Any failure is a graceful no-op — the baked value stays.
	let freshWeather = $state<WeatherData | null>(null);
	const currentWeather = $derived(freshWeather ?? weather ?? null);

	onMount(() => {
		void refreshWeather();
	});

	async function refreshWeather() {
		try {
			const res = await fetch('/api/weather');
			if (!res.ok) return;
			const data = (await res.json()) as WeatherData | null;
			if (data && typeof data.temp === 'number') freshWeather = data;
		} catch {
			// Keep the SSR-baked value.
		}
	}

	const city = $derived(resolveLocale(config.city, 'en'));
	const hook = $derived(resolveLocale(config.hook, 'en'));
	const hasWeather = $derived(currentWeather != null);
	const iconUrl = $derived(
		currentWeather ? `https://openweathermap.org/img/wn/${currentWeather.icon}@2x.png` : null
	);

	// Derive weather animation type from icon code
	type WeatherAnim = 'clear' | 'clouds' | 'rain' | 'storm' | 'snow' | 'mist' | 'none';
	const weatherAnim: WeatherAnim = $derived.by(() => {
		if (!currentWeather) return 'none';
		const code = currentWeather.icon.replace(/[dn]$/, ''); // strip day/night suffix
		if (code === '01') return 'clear';
		if (code === '02' || code === '03' || code === '04') return 'clouds';
		if (code === '09' || code === '10') return 'rain';
		if (code === '11') return 'storm';
		if (code === '13') return 'snow';
		if (code === '50') return 'mist';
		return 'none';
	});

	// Condition-based gradient tint
	const gradientTint = $derived.by(() => {
		if (!currentWeather) return 'transparent';
		const temp = currentWeather.temp;
		if (temp <= -10) return 'rgba(100, 150, 255, 0.06)'; // icy blue
		if (temp <= 0) return 'rgba(130, 170, 255, 0.05)';   // cold blue
		if (temp <= 15) return 'rgba(180, 200, 255, 0.04)';  // cool
		if (temp <= 25) return 'rgba(255, 182, 39, 0.05)';   // warm amber
		return 'rgba(255, 120, 50, 0.06)';                    // hot orange
	});
</script>

<div
	class="group h-full"
	use:cursorGlow
>
<Card class="relative h-full p-3" data-testid="about-weather">
	<!-- Condition gradient tint -->
	<div
		class="pointer-events-none absolute inset-0 rounded-[inherit]"
		style="background: linear-gradient(135deg, var(--muted), {gradientTint});"
		aria-hidden="true"
	></div>

	<!-- Weather animation layer -->
	{#if weatherAnim !== 'none'}
		<div class="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]" aria-hidden="true">
			{#if weatherAnim === 'rain'}
				{#each { length: 12 } as _, i}
					<div
						class="weather-drop absolute"
						style="left: {8 + (i * 7.5)}%; animation-delay: {(i * 0.18)}s; animation-duration: {0.6 + (i % 3) * 0.15}s;"
					></div>
				{/each}
			{:else if weatherAnim === 'storm'}
				{#each { length: 10 } as _, i}
					<div
						class="weather-drop absolute"
						style="left: {5 + (i * 9)}%; animation-delay: {(i * 0.15)}s; animation-duration: {0.5 + (i % 3) * 0.1}s;"
					></div>
				{/each}
				<div class="weather-lightning absolute inset-0"></div>
			{:else if weatherAnim === 'snow'}
				{#each { length: 14 } as _, i}
					<div
						class="weather-flake absolute"
						style="left: {3 + (i * 6.8)}%; animation-delay: {(i * 0.3)}s; animation-duration: {2.5 + (i % 4) * 0.5}s; font-size: {2 + (i % 3)}px;"
					></div>
				{/each}
			{:else if weatherAnim === 'clear'}
				<div class="weather-sun absolute"></div>
			{:else if weatherAnim === 'clouds'}
				<div class="weather-cloud weather-cloud-1 absolute"></div>
				<div class="weather-cloud weather-cloud-2 absolute"></div>
			{:else if weatherAnim === 'mist'}
				<div class="weather-mist absolute inset-0"></div>
			{/if}
		</div>
	{/if}

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
				<!-- Temperature + icon -->
				<div class="mt-1 flex items-center justify-center gap-2">
					<span class="font-mono text-2xl font-bold text-[var(--accent)]">
						{currentWeather.temp}°C
					</span>
					{#if iconUrl}
						<img
							src={iconUrl}
							alt={currentWeather.condition}
							class="h-8 w-8 opacity-80"
							loading="lazy"
						/>
					{/if}
				</div>

				<!-- Condition -->
				<div class="mt-0.5 text-sm capitalize text-[var(--secondary-foreground)]">
					{currentWeather.condition}
				</div>
			{:else}
				<!-- Fallback -->
				<div class="mt-1 font-mono text-sm text-[var(--muted-foreground)]">—</div>
			{/if}
		</div>
	</div>
</Card>
</div>

<style>
	/* ═══ RAIN DROPS ═══ */
	.weather-drop {
		top: -6px;
		width: 1.5px;
		height: 8px;
		background: linear-gradient(180deg, transparent, rgba(130, 170, 255, 0.5));
		border-radius: 0 0 2px 2px;
		animation: weather-fall linear infinite;
	}
	@keyframes weather-fall {
		0%   { transform: translateY(-8px); opacity: 0; }
		15%  { opacity: 1; }
		85%  { opacity: 0.6; }
		100% { transform: translateY(calc(100cqh + 8px)); opacity: 0; }
	}
	/* fallback if cqh not supported */
	@supports not (height: 1cqh) {
		@keyframes weather-fall {
			0%   { transform: translateY(-8px); opacity: 0; }
			15%  { opacity: 1; }
			85%  { opacity: 0.6; }
			100% { transform: translateY(200px); opacity: 0; }
		}
	}

	/* ═══ SNOWFLAKES ═══ */
	.weather-flake {
		top: -4px;
		width: 4px;
		height: 4px;
		background: rgba(220, 230, 255, 0.6);
		border-radius: 50%;
		animation: weather-snow linear infinite;
	}
	@keyframes weather-snow {
		0%   { transform: translateY(-4px) translateX(0) rotate(0deg); opacity: 0; }
		10%  { opacity: 0.8; }
		50%  { transform: translateY(100px) translateX(8px) rotate(180deg); opacity: 0.6; }
		100% { transform: translateY(200px) translateX(-4px) rotate(360deg); opacity: 0; }
	}

	/* ═══ LIGHTNING FLASH ═══ */
	.weather-lightning {
		background: transparent;
		animation: weather-flash 4s ease-in-out infinite;
	}
	@keyframes weather-flash {
		0%, 89%, 91%, 93%, 100% { background: transparent; }
		90%  { background: rgba(255, 255, 255, 0.08); }
		92%  { background: rgba(255, 255, 255, 0.04); }
	}

	/* ═══ SUN GLOW ═══ */
	.weather-sun {
		top: -20%;
		right: -15%;
		width: 70%;
		height: 70%;
		border-radius: 50%;
		background: radial-gradient(circle, rgba(255, 182, 39, 0.12) 0%, transparent 70%);
		animation: weather-glow 3s ease-in-out infinite alternate;
	}
	@keyframes weather-glow {
		0%   { transform: scale(0.9); opacity: 0.6; }
		100% { transform: scale(1.15); opacity: 1; }
	}

	/* ═══ CLOUDS ═══ */
	.weather-cloud {
		border-radius: 20px;
		background: rgba(160, 170, 190, 0.08);
		animation: weather-drift linear infinite;
	}
	.weather-cloud-1 {
		top: 20%;
		left: -30%;
		width: 60%;
		height: 20px;
		animation-duration: 18s;
	}
	.weather-cloud-2 {
		top: 55%;
		left: -40%;
		width: 45%;
		height: 14px;
		animation-duration: 24s;
		animation-delay: 6s;
	}
	@keyframes weather-drift {
		0%   { transform: translateX(0); }
		100% { transform: translateX(calc(100% + 200px)); }
	}

	/* ═══ MIST / FOG ═══ */
	.weather-mist {
		background:
			repeating-linear-gradient(
				0deg,
				transparent,
				rgba(160, 170, 190, 0.04) 30%,
				transparent 60%
			);
		animation: weather-haze 6s ease-in-out infinite alternate;
	}
	@keyframes weather-haze {
		0%   { opacity: 0.3; transform: translateY(0); }
		100% { opacity: 0.7; transform: translateY(-6px); }
	}

	/* GO-w2t5 retier: ambient/infinite particle translation is MOTION-GATED.
	   Under reduce the card keeps a STATIC weather scene — sun glow and
	   clouds/mist rest at their base styles; drops & flakes park off-canvas
	   (top: -6px/-4px, clipped by the overflow-hidden layer). */
	@media (prefers-reduced-motion: reduce) {
		.weather-drop,
		.weather-flake,
		.weather-lightning,
		.weather-sun,
		.weather-cloud,
		.weather-mist {
			animation: none;
		}
	}
</style>
