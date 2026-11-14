// sceneState(weather, now): every visual parameter of the Montréal weather card,
// from the live OpenWeather data and the real sky. Pure and unit-tested; the
// Svelte components only draw what this returns.
//
// Conventions
// - The scene faces south: east is on the left, west on the right. The sun rises
//   on the left and sets on the right; a west wind blows from right to left.
// - Angles in degrees. Wind direction is where it blows FROM (meteorology).
import type { WeatherData } from '#lib/utils/weather.ts';
import { MOON_MIN_FRACTION, MOONRISE_ALTITUDE, SUNSET_ALTITUDE, moonAt, sunAt } from './sky';

export type SkyPhase = 'night' | 'deep-twilight' | 'civil-twilight' | 'golden' | 'day';
export type CloudBand = 'clear' | 'few' | 'scattered' | 'broken' | 'overcast';
export type CloudTint = 'day' | 'golden' | 'twilight' | 'moonlit' | 'night';
export type PrecipKind = 'none' | 'drizzle' | 'rain' | 'freezing' | 'sleet' | 'snow';
export type Intensity = 'light' | 'moderate' | 'heavy';
export type AtmosphereKind = 'clear' | 'mist' | 'fog' | 'haze' | 'smoke' | 'dust' | 'ash';
export type Season = 'winter' | 'spring' | 'summer' | 'autumn';
export type Foliage = 'bare' | 'spring' | 'summer' | 'autumn';
export type WordKey =
	| 'clear'
	| 'partly'
	| 'cloudy'
	| 'showers'
	| 'rain'
	| 'storm'
	| 'snow'
	| 'mist'
	| 'drizzle'
	| 'light_snow'
	| 'freezing_rain'
	| 'fog'
	| 'smoke'
	| 'haze'
	| 'dust'
	| 'sleet';

export interface SkyColours {
	top: string;
	horizon: string;
	/** Warm glow on the horizon (twilight) or city glow at night, with its strength. */
	glow: string;
	glowStrength: number;
}

export interface SceneState {
	/** Sun altitude in degrees (negative below the horizon). */
	sunAltitude: number;
	phase: SkyPhase;
	/** The card's own light: dark from sunset to sunrise, whatever the site theme. */
	dark: boolean;
	sky: SkyColours;
	/** At most one: the sun while up, the moon only at night while it is really up. */
	body: null | { kind: 'sun'; x: number; y: number } | { kind: 'moon'; x: number; y: number; fraction: number; angle: number };
	/** 0 to 1. */
	stars: number;
	/** 0 to 1, the orange city glow on low cloud at night. */
	cityGlow: number;
	clouds: { cover: number; band: CloudBand; layers: 0 | 1 | 2 | 3; deck: number; tint: CloudTint; dark: number; low: boolean };
	wind: { speed: number; /** lateral m/s, + blows to the right */ lateral: number; /** seconds per drift cycle */ drift: number; gust: boolean; /** degrees for smoke and steam */ lean: number };
	precip: { kind: PrecipKind; intensity: Intensity; showers: boolean; /** degrees, + leans right */ slant: number; wet: boolean };
	thunder: boolean;
	atmosphere: { kind: AtmosphereKind; /** 0 to 1 veil over everything */ veil: number; /** 0 to 1 fade of far layers */ farFade: number };
	season: Season;
	foliage: Foliage;
	snowCover: boolean;
	riverIce: boolean;
	steam: boolean;
	/** Which side the sunlit faces turn to; flat under overcast, fog or night. */
	light: 'left' | 'right' | 'flat' | 'night';
	warmLight: boolean;
	wordKey: WordKey | null;
	balise: boolean;
	/** The card's original scene family, kept on data-scene for existing tools. */
	family: 'clear' | 'clouds' | 'rain' | 'storm' | 'snow' | 'mist' | 'offline';
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const DEG = Math.PI / 180;

// ── Sky phase ────────────────────────────────────────────────────────────────
export function skyPhase(sunAltitude: number): SkyPhase {
	if (sunAltitude < -18) return 'night';
	if (sunAltitude < -6) return 'deep-twilight';
	if (sunAltitude < 0) return 'civil-twilight';
	if (sunAltitude < 6) return 'golden';
	return 'day';
}

// Sky colours by sun altitude (clear sky). Day stays pale (the card's original
// look); twilight warms the horizon; night is deep blue. Interpolated between rows.
const SKY_ROWS: ReadonlyArray<readonly [number, string, string]> = [
	[-24, '#0b1428', '#0f182c'],
	[-18, '#0d1730', '#121c34'],
	[-12, '#111c3a', '#1f2a52'],
	[-6, '#172347', '#3b3b6a'],
	[-2, '#1d2c58', '#7a5672'],
	[0, '#8fa6cf', '#f2b98f'],
	[3, '#aec6e6', '#f7d2ab'],
	[6, '#bcd7f0', '#ecebe6'],
	[15, '#bfdcf2', '#e9f3fa'],
];
const OVERCAST_DAY = ['#c5cdd6', '#dfe3e8'] as const;
const OVERCAST_NIGHT = ['#121823', '#1a202c'] as const;

function hex(c: string): [number, number, number] {
	const n = parseInt(c.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
	const [r1, g1, b1] = hex(a);
	const [r2, g2, b2] = hex(b);
	const k = clamp(t, 0, 1);
	const c = (x: number, y: number) => Math.round(x + (y - x) * k).toString(16).padStart(2, '0');
	return `#${c(r1, r2)}${c(g1, g2)}${c(b1, b2)}`;
}

export function skyColours(sunAltitude: number, cover: number, precipDark: number): SkyColours {
	let i = SKY_ROWS.findIndex((row) => sunAltitude < row[0]);
	if (i === -1) i = SKY_ROWS.length - 1;
	if (i === 0) i = 1;
	const [a0, t0, h0] = SKY_ROWS[i - 1];
	const [a1, t1, h1] = SKY_ROWS[i];
	const t = clamp((sunAltitude - a0) / (a1 - a0), 0, 1);
	let top = mix(t0, t1, t);
	let horizon = mix(h0, h1, t);
	// Cloud greys and flattens the sky; overcast is a soft flat grey.
	const flat = clamp((cover - 25) / 75, 0, 1) * 0.9;
	const day = clamp((sunAltitude + 6) / 12, 0, 1);
	const greyTop = mix(OVERCAST_NIGHT[0], OVERCAST_DAY[0], day);
	const greyHorizon = mix(OVERCAST_NIGHT[1], OVERCAST_DAY[1], day);
	top = mix(top, greyTop, flat);
	horizon = mix(horizon, greyHorizon, flat);
	// Rain and storms darken the deck.
	top = mix(top, '#0a0e16', precipDark * 0.45);
	horizon = mix(horizon, '#0a0e16', precipDark * 0.35);
	const twilightGlow = sunAltitude > -8 && sunAltitude < 4 ? 1 - Math.abs(sunAltitude + 2) / 6 : 0;
	return {
		top,
		horizon,
		glow: twilightGlow > 0 ? '#ff9a5c' : '#ff9450',
		glowStrength: +clamp(twilightGlow * (1 - flat), 0, 1).toFixed(3),
	};
}

// ── Where a body sits on the card (percent of the scene box) ──────────────────
/** Facing south: azimuth -90 (east) at the left, +90 (west) at the right. */
export function project(azimuth: number, altitude: number): { x: number; y: number } {
	const x = 50 + (clamp(azimuth, -110, 110) / 110) * 42;
	const y = 76 - (clamp(altitude, -12, 62) / 62) * 64;
	return { x: +x.toFixed(2), y: +y.toFixed(2) };
}

// ── OpenWeather condition ids ────────────────────────────────────────────────
export interface Condition {
	kind: PrecipKind;
	intensity: Intensity;
	showers: boolean;
	thunder: boolean;
	atmosphere: AtmosphereKind;
	/** Cloud cover implied by the id, when clouds.all is missing. */
	cover: number;
	wordKey: WordKey | null;
	family: SceneState['family'];
}

export function classify(id: number | undefined): Condition {
	const base: Condition = { kind: 'none', intensity: 'light', showers: false, thunder: false, atmosphere: 'clear', cover: 0, wordKey: null, family: 'offline' };
	if (id === undefined) return base;
	if (id >= 200 && id < 300) {
		const rainy = !(id >= 210 && id <= 221);
		const level: Intensity = [202, 212, 232].includes(id) ? 'heavy' : [200, 210, 230].includes(id) ? 'light' : 'moderate';
		return { ...base, thunder: true, kind: rainy ? (id >= 230 ? 'drizzle' : 'rain') : 'none', intensity: level, cover: 95, wordKey: 'storm', family: 'storm' };
	}
	if (id >= 300 && id < 400) {
		const level: Intensity = [302, 312, 314].includes(id) ? 'heavy' : [300, 310].includes(id) ? 'light' : 'moderate';
		return { ...base, kind: 'drizzle', intensity: level, showers: [313, 314, 321].includes(id), cover: 85, wordKey: 'drizzle', family: 'rain' };
	}
	if (id >= 500 && id < 600) {
		if (id === 511) return { ...base, kind: 'freezing', intensity: 'moderate', cover: 90, wordKey: 'freezing_rain', family: 'rain' };
		const showers = id >= 520;
		const level: Intensity = id === 500 || id === 520 ? 'light' : id === 501 || id === 521 ? 'moderate' : 'heavy';
		return { ...base, kind: 'rain', intensity: level, showers, cover: showers ? 70 : 90, wordKey: showers ? 'showers' : 'rain', family: 'rain' };
	}
	if (id >= 600 && id < 700) {
		if (id >= 611 && id <= 616) return { ...base, kind: 'sleet', intensity: id === 612 || id === 615 ? 'light' : 'moderate', showers: id === 612 || id === 613, cover: 90, wordKey: 'sleet', family: 'snow' };
		const showers = id >= 620;
		const level: Intensity = id === 600 || id === 620 ? 'light' : id === 602 || id === 622 ? 'heavy' : 'moderate';
		return { ...base, kind: 'snow', intensity: level, showers, cover: showers ? 75 : 92, wordKey: level === 'light' ? 'light_snow' : 'snow', family: 'snow' };
	}
	if (id >= 700 && id < 800) {
		const atm: Record<number, [AtmosphereKind, WordKey]> = {
			701: ['mist', 'mist'],
			711: ['smoke', 'smoke'],
			721: ['haze', 'haze'],
			731: ['dust', 'dust'],
			741: ['fog', 'fog'],
			751: ['dust', 'dust'],
			761: ['dust', 'dust'],
			762: ['ash', 'smoke'],
		};
		if (id === 771) return { ...base, cover: 85, wordKey: 'storm', family: 'storm' }; // squalls
		if (id === 781) return { ...base, thunder: true, kind: 'rain', intensity: 'heavy', cover: 100, wordKey: 'storm', family: 'storm' }; // tornado
		const [atmosphere, wordKey] = atm[id] ?? ['mist', 'mist'];
		return { ...base, atmosphere, cover: 40, wordKey, family: 'mist' };
	}
	if (id === 800) return { ...base, cover: 0, wordKey: 'clear', family: 'clear' };
	if (id >= 801 && id <= 804) {
		const cover = [18, 38, 68, 92][id - 801];
		return { ...base, cover, wordKey: id <= 802 ? 'partly' : 'cloudy', family: 'clouds' };
	}
	return base;
}

/** A representative id for an icon family, for responses that carry only the icon. */
const ICON_ID: Record<string, number> = { '01': 800, '02': 801, '03': 802, '04': 804, '09': 521, '10': 501, '11': 201, '13': 601, '50': 701 };
export function conditionId(weather: Pick<WeatherData, 'id' | 'icon'> | null): number | undefined {
	return weather?.id ?? ICON_ID[weather?.icon?.slice(0, 2) ?? ''];
}

/** OpenWeather's cloud bands: 801 few 11-25 %, 802 scattered 25-50 %, 803 broken 51-84 %, 804 overcast 85-100 %. */
export function cloudBand(cover: number): CloudBand {
	if (cover < 11) return 'clear';
	if (cover <= 25) return 'few';
	if (cover <= 50) return 'scattered';
	if (cover <= 84) return 'broken';
	return 'overcast';
}

/** mm in the last hour: rain light < 2.5, moderate 2.5 to 7.6, heavy > 7.6; snow (water) light < 1, moderate 1 to 2.5. */
export function intensityFromRate(kind: PrecipKind, mm: number | undefined, fallback: Intensity): Intensity {
	if (mm === undefined || kind === 'none') return fallback;
	if (kind === 'snow' || kind === 'sleet') return mm < 1 ? 'light' : mm <= 2.5 ? 'moderate' : 'heavy';
	return mm < 2.5 ? 'light' : mm <= 7.6 ? 'moderate' : 'heavy';
}

const FALL_SPEED: Record<PrecipKind, number> = { none: 9, drizzle: 4, rain: 9, freezing: 8, sleet: 6, snow: 1.2 };

// ── Season (Montréal calendar) ───────────────────────────────────────────────
const MONTREAL_DATE = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Toronto', month: 'numeric', day: 'numeric' });
export function montrealMonthDay(ms: number): { month: number; day: number } {
	const parts = Object.fromEntries(MONTREAL_DATE.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
	return { month: Number(parts.month), day: Number(parts.day) };
}

export function seasonOf(month: number): Season {
	if (month === 12 || month <= 3) return 'winter';
	if (month <= 5) return 'spring';
	if (month <= 8) return 'summer';
	return 'autumn';
}

/** Trees: bare November to April, young green in May, green in summer, red and orange from 21 September to October. */
export function foliageOf(month: number, day: number): Foliage {
	if (month >= 11 || month <= 4) return 'bare';
	if (month === 5) return 'spring';
	if (month < 9 || (month === 9 && day < 21)) return 'summer';
	return 'autumn';
}

// ── The whole scene ──────────────────────────────────────────────────────────
export function sceneState(weather: WeatherData | null, now: number): SceneState {
	const sun = sunAt(now);
	const phase = skyPhase(sun.altitude);
	const dark = sun.altitude < SUNSET_ALTITUDE;
	const cond = classify(conditionId(weather));
	const offline = weather === null;

	// Clouds
	const cover = clamp(weather?.clouds ?? cond.cover, 0, 100);
	const band = cloudBand(cover);
	const precipitating = cond.kind !== 'none' || cond.thunder;
	const layers = (band === 'clear' ? 0 : band === 'few' ? 1 : band === 'scattered' ? 2 : 3) as 0 | 1 | 2 | 3;
	const deck = band === 'overcast' ? 1 : band === 'broken' ? 0.55 : 0;
	const moon = moonAt(now);
	const moonUp = dark && moon.altitude > MOONRISE_ALTITUDE && moon.fraction >= MOON_MIN_FRACTION;
	const tint: CloudTint = phase === 'day' ? 'day' : phase === 'golden' ? 'golden' : phase === 'civil-twilight' ? 'twilight' : moonUp ? 'moonlit' : 'night';
	const precipDark = cond.thunder ? 1 : precipitating ? (cond.intensity === 'heavy' ? 0.8 : cond.intensity === 'moderate' ? 0.6 : 0.4) : 0;

	// Sky
	const sky = skyColours(sun.altitude, cover, precipDark);
	const cityGlow = dark ? clamp(0.25 + cover / 160, 0, 0.85) : 0;

	// Body: the sun while up; at night the moon only while it is really up. Never both.
	let body: SceneState['body'] = null;
	if (!dark) {
		const p = project(sun.azimuth, sun.altitude);
		body = { kind: 'sun', ...p };
	} else if (moonUp) {
		const p = project(moon.azimuth, moon.altitude);
		// The lit limb faces the sun: aim at the sun's (below-horizon) point.
		const s = project(sun.azimuth, sun.altitude);
		const angle = +(Math.atan2(s.y - p.y, s.x - p.x) / DEG).toFixed(1);
		body = { kind: 'moon', ...p, fraction: +moon.fraction.toFixed(3), angle };
	}

	// Stars: only in a dark sky; fewer with moonlight, city glow and cloud.
	const darkness = phase === 'night' ? 1 : phase === 'deep-twilight' ? clamp((-6 - sun.altitude) / 12, 0, 1) : 0;
	const stars = +clamp(darkness * (1 - (moonUp ? moon.fraction * 0.55 : 0)) * Math.pow(1 - cover / 100, 1.5) * 0.85, 0, 1).toFixed(3);

	// Wind
	const speed = clamp(weather?.windSpeed ?? 3, 0, 40);
	const deg = weather?.windDeg ?? 270;
	const lateral = +(speed * Math.sin(deg * DEG)).toFixed(2); // + blows to the right (toward the west)
	const driftSpeed = Math.max(Math.abs(lateral), 0.8);
	const drift = Math.round(clamp(600 / (driftSpeed * 3 + 2), 18, 180));
	const gust = (weather?.windGust ?? 0) - speed >= 4;
	const lean = Math.round(clamp(lateral * 6, -60, 60));

	// Precipitation
	const rate = cond.kind === 'snow' || cond.kind === 'sleet' ? weather?.snow1h : weather?.rain1h;
	const intensity = intensityFromRate(cond.kind, rate, cond.intensity);
	const slant = cond.kind === 'none' ? 0 : Math.round(clamp((Math.atan2(lateral, FALL_SPEED[cond.kind]) / DEG), -35, 35));
	const wet = cond.kind === 'rain' || cond.kind === 'drizzle' || cond.kind === 'freezing' || (cond.thunder && cond.kind !== 'none');

	// Atmosphere: visibility fades distant landmarks; 7xx ids tint the air.
	const visibility = clamp(weather?.visibility ?? 10000, 0, 10000);
	const farFade = +clamp((10000 - visibility) / 9000, 0, 0.9).toFixed(3);
	let atmosphere = cond.atmosphere;
	let veil = 0;
	if (atmosphere === 'fog') veil = visibility < 1000 ? 0.62 : 0.4;
	else if (atmosphere === 'mist') veil = clamp(0.18 + farFade * 0.35, 0.18, 0.45);
	else if (atmosphere === 'haze' || atmosphere === 'smoke') veil = clamp(0.22 + farFade * 0.3, 0.22, 0.5);
	else if (atmosphere === 'dust' || atmosphere === 'ash') veil = clamp(0.24 + farFade * 0.3, 0.24, 0.5);
	else if (farFade > 0.3) {
		atmosphere = 'mist';
		veil = +(farFade * 0.3).toFixed(3);
	}

	// Season, snow, ice, steam. Heuristic without a history API: snow lies when
	// it is snowing, or in winter (December to March) at or below 0 °C.
	const { month, day } = montrealMonthDay(now);
	const temp = weather?.temp;
	const snowing = cond.kind === 'snow' || cond.kind === 'sleet';
	const snowCover = snowing || (temp !== undefined && temp <= 0 && (month === 12 || month <= 3));
	const riverIce = (month === 1 || month === 2) && temp !== undefined && temp <= -10;
	const steam = temp !== undefined && temp <= -5;

	// Light: sunlit faces turn east in the morning, west in the afternoon.
	const flatLight = band === 'overcast' || atmosphere === 'fog' || precipitating;
	const light: SceneState['light'] = dark ? 'night' : flatLight ? 'flat' : sun.azimuth < 0 ? 'left' : 'right';

	return {
		sunAltitude: +sun.altitude.toFixed(2),
		phase,
		dark,
		sky,
		body,
		stars,
		cityGlow: +cityGlow.toFixed(3),
		clouds: { cover, band, layers, deck, tint, dark: precipDark, low: precipitating },
		wind: { speed, lateral, drift, gust, lean },
		precip: { kind: cond.kind, intensity, showers: cond.showers, slant, wet },
		thunder: cond.thunder,
		atmosphere: { kind: atmosphere, veil: +veil.toFixed(3), farFade },
		season: seasonOf(month),
		foliage: foliageOf(month, day),
		snowCover,
		riverIce,
		steam,
		light,
		warmLight: phase === 'golden' && !flatLight,
		wordKey: offline ? null : cond.wordKey,
		balise: month >= 4 && month <= 11,
		family: offline ? 'offline' : cond.family,
	};
}
