/*! SunCalc (c) 2011-2015 Vladimir Agafonkin, BSD 2-Clause License. https://github.com/mourner/suncalc */
// The real sky over Montréal, from suncalc: the sun's and the moon's position,
// sunrise and sunset, the moon's phase. Pure functions of the time, so every
// visitor sees the same sky.
import SunCalc from 'suncalc';

/** Montréal (Place Ville Marie). */
export const MONTREAL = { lat: 45.5017, lng: -73.5673 } as const;

const DEG = 180 / Math.PI;
const DAY_MS = 864e5;

export interface BodyPosition {
	/** Degrees above the horizon (refraction included). */
	altitude: number;
	/** Degrees from south, positive toward the west (suncalc's convention). */
	azimuth: number;
}

export function sunAt(ms: number): BodyPosition {
	const p = SunCalc.getPosition(new Date(ms), MONTREAL.lat, MONTREAL.lng);
	return { altitude: p.altitude * DEG, azimuth: p.azimuth * DEG };
}

export interface MoonState extends BodyPosition {
	/** Lit fraction of the disc, 0 (new) to 1 (full). */
	fraction: number;
	/** 0 new, 0.25 first quarter, 0.5 full, 0.75 last quarter. */
	phase: number;
}

export function moonAt(ms: number): MoonState {
	const date = new Date(ms);
	const p = SunCalc.getMoonPosition(date, MONTREAL.lat, MONTREAL.lng);
	const i = SunCalc.getMoonIllumination(date);
	return { altitude: p.altitude * DEG, azimuth: p.azimuth * DEG, fraction: i.fraction, phase: i.phase };
}

export interface SunTimes {
	sunrise: number;
	sunset: number;
}

/** Sunrise and sunset of the solar day whose noon is nearest to `ms`. */
export function sunTimes(ms: number): SunTimes {
	const t = SunCalc.getTimes(new Date(ms), MONTREAL.lat, MONTREAL.lng);
	return { sunrise: t.sunrise.getTime(), sunset: t.sunset.getTime() };
}

/** The sun's upper edge sets at -0.833 degrees (refraction plus the solar radius). */
export const SUNSET_ALTITUDE = -0.833;

/** Night is from sunset to sunrise: the card turns dark. */
export function isNightAt(ms: number): boolean {
	return sunAt(ms).altitude < SUNSET_ALTITUDE;
}

/** The next sunrise or sunset after `ms`, when the card's light changes. */
export function nextSunEvent(ms: number): number {
	const { sunrise, sunset } = sunTimes(ms);
	if (ms < sunrise) return sunrise;
	if (ms < sunset) return sunset;
	return sunTimes(ms + DAY_MS / 2).sunrise;
}

/** The moon counts as up once its centre clears the horizon (refraction included). */
export const MOONRISE_ALTITUDE = 0.125;
/** Around new moon the sliver is too thin to see. */
export const MOON_MIN_FRACTION = 0.03;

export function moonAltitude(ms: number): number {
	return moonAt(ms).altitude;
}

/**
 * The lit part of the moon for a disc of radius r centred on 0,0, with the
 * bright limb toward +x. Rotate it toward the sun to orient it. A true
 * terminator: the limb is a half circle and the terminator a half ellipse whose
 * width follows the lit fraction.
 */
export function moonLitPath(fraction: number, r = 10): string {
	const k = Math.min(Math.max(fraction, 0), 1);
	const rx = Math.abs(1 - 2 * k) * r;
	const sweep = k < 0.5 ? 0 : 1;
	const f = (n: number) => +n.toFixed(2);
	return `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${f(rx)} ${r} 0 0 ${sweep} 0 ${-r}Z`;
}
