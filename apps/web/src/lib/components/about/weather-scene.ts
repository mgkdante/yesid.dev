// Weather scene resolver — GO Wave 4 (About weather rebuild).
//
// Maps an OpenWeather icon code (e.g. "10n") to one of the crafted scene
// families rendered by WeatherScene.svelte, plus a day/night flag.
//
// Why the icon code and not the condition string: the code is a closed,
// documented enum (https://openweathermap.org/weather-conditions) while the
// description is free-form localized text. The trailing d/n suffix is
// OpenWeather's own sunrise/sunset calc for Montreal — using it keeps the
// SSR HTML deterministic for a given payload (no Date() at render time).
//
// Graceful-data rules (operator spec):
//   - unknown/unmapped code  → 'clear' (never an empty box)
//   - missing weather payload → 'offline' (calm sky, skyline still drawn)

export type WeatherSceneId =
	| 'clear'
	| 'clouds'
	| 'rain'
	| 'snow'
	| 'storm'
	| 'mist'
	| 'offline';

export interface WeatherSceneState {
	scene: WeatherSceneId;
	night: boolean;
}

/** Every renderable scene family, exported for tests + the screenshot rig. */
export const WEATHER_SCENES: readonly WeatherSceneId[] = [
	'clear',
	'clouds',
	'rain',
	'snow',
	'storm',
	'mist',
	'offline',
] as const;

const CODE_TO_SCENE: Record<string, WeatherSceneId> = {
	'01': 'clear', // clear sky
	'02': 'clouds', // few clouds
	'03': 'clouds', // scattered clouds
	'04': 'clouds', // broken / overcast
	'09': 'rain', // shower rain / drizzle
	'10': 'rain', // rain
	'11': 'storm', // thunderstorm
	'13': 'snow', // snow
	'50': 'mist', // mist / fog / haze
};

/**
 * Resolve the scene family + day/night flag from an OpenWeather icon code.
 * Falsy icon → offline (the card still renders a calm sky, never blank).
 */
export function resolveWeatherScene(icon: string | null | undefined): WeatherSceneState {
	if (!icon) return { scene: 'offline', night: false };
	const night = /n$/i.test(icon);
	const code = icon.replace(/[dn]$/i, '');
	return { scene: CODE_TO_SCENE[code] ?? 'clear', night };
}

/**
 * Local-hour fallback for the offline scene only (no icon to read a daypart
 * from). Callers must invoke this client-side (onMount) so SSR output stays
 * deterministic — the server always renders the offline scene as day.
 */
export function isNightHour(hour: number): boolean {
	return hour < 7 || hour >= 19;
}
