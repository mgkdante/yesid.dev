<!--
  WeatherGlyph — crafted inline condition pictogram (GO Wave 4).

  Replaces the hotlinked OpenWeather bitmap (openweathermap.org PNG) with a
  brand-drawn SVG in the exact same 32px slot: currentColor silhouettes with
  --accent sun/bolt details, so it follows the theme like every other glyph
  on the site. Static by design (safe-always tier — no animation at all).
-->
<script lang="ts">
	import type { WeatherSceneId } from './weather-scene';

	let {
		scene,
		night = false,
		label,
	}: {
		scene: WeatherSceneId;
		night?: boolean;
		label: string;
	} = $props();

	const cloudy = $derived(
		scene === 'clouds' || scene === 'rain' || scene === 'storm' || scene === 'snow'
	);
</script>

<svg
	class="h-8 w-8 text-[var(--secondary-foreground)]"
	viewBox="0 0 32 32"
	role="img"
	aria-label={label}
	data-testid="weather-glyph"
	data-glyph={scene}
>
	{#if scene === 'clear' && !night}
		<!-- Sun -->
		<circle cx="16" cy="16" r="6.5" fill="var(--accent)" />
		<g stroke="var(--accent)" stroke-width="2" stroke-linecap="round">
			<line x1="16" y1="3.5" x2="16" y2="6.5" />
			<line x1="16" y1="25.5" x2="16" y2="28.5" />
			<line x1="3.5" y1="16" x2="6.5" y2="16" />
			<line x1="25.5" y1="16" x2="28.5" y2="16" />
			<line x1="7.2" y1="7.2" x2="9.3" y2="9.3" />
			<line x1="22.7" y1="22.7" x2="24.8" y2="24.8" />
			<line x1="7.2" y1="24.8" x2="9.3" y2="22.7" />
			<line x1="22.7" y1="9.3" x2="24.8" y2="7.2" />
		</g>
	{:else if scene === 'clear' && night}
		<!-- Moon -->
		<path
			fill="currentColor"
			d="M28 17.05 A12 12 0 1 1 14.95 4 A9.33 9.33 0 0 0 28 17.05 Z"
		/>
	{:else if scene === 'mist'}
		<!-- Fog bars -->
		<g stroke="currentColor" stroke-width="2" stroke-linecap="round">
			<line x1="6" y1="11" x2="26" y2="11" />
			<line x1="4" y1="16" x2="22" y2="16" />
			<line x1="8" y1="21" x2="28" y2="21" />
			<line x1="6" y1="26" x2="20" y2="26" />
		</g>
	{:else if scene === 'offline'}
		<!-- Calm horizon -->
		<line x1="6" y1="22" x2="26" y2="22" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
		<circle cx="16" cy="14" r="4" fill="none" stroke="currentColor" stroke-width="2" />
	{:else}
		<!-- Cloud family: peeking sun/moon, then the deck, then precipitation -->
		{#if scene === 'clouds' && !night}
			<circle cx="23" cy="8.5" r="4" fill="var(--accent)" />
			<g stroke="var(--accent)" stroke-width="1.6" stroke-linecap="round">
				<line x1="23" y1="1.5" x2="23" y2="3" />
				<line x1="29" y1="8.5" x2="30.5" y2="8.5" />
				<line x1="27.4" y1="4.1" x2="28.5" y2="3" />
			</g>
		{:else if scene === 'clouds' && night}
			<path
				fill="currentColor"
				opacity="0.9"
				d="M28.5 9.8 A5.5 5.5 0 1 1 22.52 3.8 A4.28 4.28 0 0 0 28.5 9.8 Z"
			/>
		{/if}
		{#if cloudy}
			<g fill="currentColor" opacity={scene === 'clouds' ? 0.85 : 0.75}>
				<rect x="6" y="14.5" width="20" height="7.5" rx="3.75" />
				<circle cx="11.5" cy="13.5" r="4.5" />
				<circle cx="17.5" cy="11" r="5.5" />
				<circle cx="23" cy="14.5" r="4" />
			</g>
		{/if}
		{#if scene === 'rain'}
			<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" opacity="0.8">
				<line x1="11" y1="25" x2="9.8" y2="29" />
				<line x1="17" y1="25" x2="15.8" y2="29" />
				<line x1="23" y1="25" x2="21.8" y2="29" />
			</g>
		{:else if scene === 'snow'}
			<g fill="currentColor" opacity="0.85">
				<circle cx="10.5" cy="26" r="1.5" />
				<circle cx="16.5" cy="28.5" r="1.5" />
				<circle cx="22.5" cy="26" r="1.5" />
			</g>
		{:else if scene === 'storm'}
			<path
				fill="var(--accent)"
				d="M16.5 16 L11 24.5 H14.5 L13 31 L20.5 21.5 H16.8 L18.8 16 Z"
			/>
		{/if}
	{/if}
</svg>
