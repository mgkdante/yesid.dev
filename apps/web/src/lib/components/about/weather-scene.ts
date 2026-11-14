// The Montréal places and their clock-aligned rotation. Everything about the sky
// and the weather lives in weather/scene-state.ts.

/**
 * The owner's Montréal places, in rotation order. The two on Île Sainte-Hélène
 * (La Ronde and the Biosphère) are kept apart.
 */
export const PLACES = [
	'skyline',
	'montroyal',
	'oldport',
	'oratoire',
	'ring',
	'laronde',
	'metro',
	'olympic',
	'biosphere',
	'bellcentre',
] as const;
export type WeatherPlaceId = (typeof PLACES)[number];

/** The place changes on every clock minute, the same for every visitor. */
export const ROTATION_MS = 60_000;

export function placeAt(ms: number): WeatherPlaceId {
	const slot = Math.floor(ms / ROTATION_MS);
	return PLACES[((slot % PLACES.length) + PLACES.length) % PLACES.length];
}

/** Milliseconds until the next rotation boundary (1 to ROTATION_MS). */
export function nextRotation(ms: number): number {
	return ROTATION_MS - (((ms % ROTATION_MS) + ROTATION_MS) % ROTATION_MS);
}
