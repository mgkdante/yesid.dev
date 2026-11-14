import { describe, it, expect } from 'vitest';
import { toWeatherData, type WeatherData } from '#lib/utils/weather.ts';
import { classify, cloudBand, intensityFromRate, sceneState, skyPhase, foliageOf, seasonOf, conditionId, project } from './scene-state';
import { moonAt, moonLitPath, nextSunEvent, sunAt, sunTimes, MOONRISE_ALTITUDE, SUNSET_ALTITUDE } from './sky';

const w = (over: Partial<WeatherData> = {}): WeatherData => ({ temp: 5, condition: 'API', icon: '01d', id: 800, ...over });
// 14 November 2026, Montréal (EST = UTC-5)
const NOON = Date.UTC(2026, 10, 14, 17);
const EVENING_MOON = Date.UTC(2026, 10, 14, 23); // 18:00, crescent still up
const LATE_DARK = Date.UTC(2026, 10, 15, 3); // 22:00, moon set at 20:32

describe('OpenWeather condition ids', () => {
	it.each([
		[200, { thunder: true, kind: 'rain', intensity: 'light', wordKey: 'storm' }],
		[201, { thunder: true, kind: 'rain', intensity: 'moderate' }],
		[202, { thunder: true, kind: 'rain', intensity: 'heavy' }],
		[211, { thunder: true, kind: 'none' }],
		[221, { thunder: true, kind: 'none' }],
		[231, { thunder: true, kind: 'drizzle' }],
		[300, { kind: 'drizzle', intensity: 'light', wordKey: 'drizzle' }],
		[302, { kind: 'drizzle', intensity: 'heavy' }],
		[321, { kind: 'drizzle', showers: true }],
		[500, { kind: 'rain', intensity: 'light', wordKey: 'rain', showers: false }],
		[501, { kind: 'rain', intensity: 'moderate' }],
		[504, { kind: 'rain', intensity: 'heavy' }],
		[511, { kind: 'freezing', wordKey: 'freezing_rain' }],
		[520, { kind: 'rain', showers: true, intensity: 'light', wordKey: 'showers' }],
		[522, { kind: 'rain', showers: true, intensity: 'heavy' }],
		[531, { kind: 'rain', showers: true }],
		[600, { kind: 'snow', intensity: 'light', wordKey: 'light_snow' }],
		[601, { kind: 'snow', intensity: 'moderate', wordKey: 'snow' }],
		[602, { kind: 'snow', intensity: 'heavy', wordKey: 'snow' }],
		[611, { kind: 'sleet', wordKey: 'sleet' }],
		[616, { kind: 'sleet' }],
		[620, { kind: 'snow', showers: true, intensity: 'light' }],
		[622, { kind: 'snow', showers: true, intensity: 'heavy' }],
		[701, { atmosphere: 'mist', wordKey: 'mist' }],
		[711, { atmosphere: 'smoke', wordKey: 'smoke' }],
		[721, { atmosphere: 'haze', wordKey: 'haze' }],
		[731, { atmosphere: 'dust', wordKey: 'dust' }],
		[741, { atmosphere: 'fog', wordKey: 'fog' }],
		[751, { atmosphere: 'dust' }],
		[761, { atmosphere: 'dust' }],
		[762, { atmosphere: 'ash', wordKey: 'smoke' }],
		[771, { wordKey: 'storm', thunder: false }],
		[781, { thunder: true, kind: 'rain', intensity: 'heavy' }],
		[800, { kind: 'none', cover: 0, wordKey: 'clear' }],
		[801, { cover: 18, wordKey: 'partly' }],
		[802, { cover: 38, wordKey: 'partly' }],
		[803, { cover: 68, wordKey: 'cloudy' }],
		[804, { cover: 92, wordKey: 'cloudy' }],
	] as const)('%i', (id, expected) => {
		expect(classify(id)).toMatchObject(expected);
	});

	it('an unknown or missing id draws no weather and prints no word', () => {
		expect(classify(999)).toMatchObject({ kind: 'none', wordKey: null });
		expect(classify(undefined)).toMatchObject({ kind: 'none', wordKey: null });
	});

	it('reads the id from the icon when a response has only the icon', () => {
		expect(conditionId({ icon: '03d' })).toBe(802);
		expect(conditionId({ icon: '13n' })).toBe(601);
		expect(conditionId({ id: 741, icon: '50d' })).toBe(741);
		expect(conditionId(null)).toBeUndefined();
	});
});

describe('bands and thresholds', () => {
	it('matches OpenWeather cloud bands', () => {
		expect([0, 10, 11, 25, 26, 50, 51, 84, 85, 100].map(cloudBand)).toEqual([
			'clear', 'clear', 'few', 'few', 'scattered', 'scattered', 'broken', 'broken', 'overcast', 'overcast',
		]);
	});

	it('grades precipitation by mm in the last hour', () => {
		expect(['rain', 'rain', 'rain', 'rain'].map((k, i) => intensityFromRate(k as 'rain', [1, 2.5, 7.6, 8][i], 'light'))).toEqual(['light', 'moderate', 'moderate', 'heavy']);
		expect([0.5, 1, 2.5, 3].map((mm) => intensityFromRate('snow', mm, 'light'))).toEqual(['light', 'moderate', 'moderate', 'heavy']);
		expect(intensityFromRate('rain', undefined, 'heavy')).toBe('heavy');
	});

	it('names every sky phase by the sun altitude', () => {
		expect([-30, -18.1, -18, -12, -6.1, -6, -1, 0, 5.9, 6, 40].map(skyPhase)).toEqual([
			'night', 'night', 'deep-twilight', 'deep-twilight', 'deep-twilight', 'civil-twilight', 'civil-twilight', 'golden', 'golden', 'day', 'day',
		]);
	});

	it('places the sun on an arc facing south: east on the left, west on the right', () => {
		expect(project(-90, 10).x).toBeLessThan(20);
		expect(project(90, 10).x).toBeGreaterThan(80);
		expect(project(0, 40).y).toBeLessThan(project(0, 5).y);
	});
});

describe('a real day over Montréal', () => {
	it('walks every phase, and the card turns dark exactly at sunset', () => {
		const seen = new Set<string>();
		for (let t = Date.UTC(2026, 10, 14, 5); t < Date.UTC(2026, 10, 15, 5); t += 5 * 60000) {
			const s = sceneState(w(), t);
			seen.add(s.phase);
			expect(s.dark).toBe(sunAt(t).altitude < SUNSET_ALTITUDE);
			if (s.phase === 'day' || s.phase === 'golden') expect(s.dark).toBe(false);
			if (s.phase === 'night' || s.phase === 'deep-twilight') expect(s.dark).toBe(true);
		}
		expect([...seen].sort()).toEqual(['civil-twilight', 'day', 'deep-twilight', 'golden', 'night']);
	});

	it('draws the sun only by day, the moon only at night while it is up, never both', () => {
		expect(sceneState(w(), NOON).body?.kind).toBe('sun'); // the crescent is up at noon too, but never drawn by day
		expect(moonAt(NOON).altitude).toBeGreaterThan(0);
		const evening = sceneState(w(), EVENING_MOON);
		expect(evening.body?.kind).toBe('moon');
		expect(evening.body && 'fraction' in evening.body ? evening.body.fraction : 0).toBeGreaterThan(0.1);
		expect(sceneState(w(), LATE_DARK).body).toBeNull();
		// Around new moon (9 November 2026, 02:02 EST) the sliver is not drawn.
		expect(sceneState(w(), Date.UTC(2026, 10, 9, 18, 0)).body?.kind).toBe('sun');
		for (let t = NOON; t < NOON + 864e5; t += 15 * 60000) {
			const s = sceneState(w(), t);
			if (s.body?.kind === 'sun') expect(s.dark).toBe(false);
			if (s.body?.kind === 'moon') expect(s.dark).toBe(true);
		}
	});

	it('hides stars by day and dims them under the moon and cloud', () => {
		expect(sceneState(w(), NOON).stars).toBe(0);
		const clearDark = sceneState(w(), LATE_DARK).stars;
		expect(clearDark).toBeGreaterThan(0.5);
		expect(sceneState(w({ clouds: 80, id: 803 }), LATE_DARK).stars).toBeLessThan(clearDark / 4);
	});

	it('greys and flattens the sky under overcast', () => {
		const clear = sceneState(w(), NOON).sky;
		const overcast = sceneState(w({ id: 804, clouds: 100 }), NOON).sky;
		expect(clear.top).not.toBe(overcast.top);
		const spread = (s: { top: string; horizon: string }) => Math.abs(parseInt(s.top.slice(1, 3), 16) - parseInt(s.horizon.slice(1, 3), 16));
		expect(spread(overcast)).toBeLessThan(spread(clear));
	});
});

describe('wind', () => {
	it('blows a west wind from right to left, an east wind left to right', () => {
		expect(sceneState(w({ windSpeed: 8, windDeg: 270 }), NOON).wind.lateral).toBeLessThan(0);
		expect(sceneState(w({ windSpeed: 8, windDeg: 90 }), NOON).wind.lateral).toBeGreaterThan(0);
		expect(Math.abs(sceneState(w({ windSpeed: 8, windDeg: 0 }), NOON).wind.lateral)).toBeLessThan(0.01);
	});

	it('clamps drift, slant and lean at the extremes', () => {
		const calm = sceneState(w({ windSpeed: 0, windDeg: 0 }), NOON).wind;
		const gale = sceneState(w({ id: 502, windSpeed: 40, windDeg: 270, windGust: 50 }), NOON);
		expect(calm.drift).toBeLessThanOrEqual(180);
		expect(gale.wind.drift).toBe(18);
		expect(gale.precip.slant).toBe(-35);
		expect(Math.abs(gale.wind.lean)).toBeLessThanOrEqual(60);
		expect(gale.wind.gust).toBe(true);
		expect(sceneState(w({ id: 601, windSpeed: 3, windDeg: 90 }), NOON).precip.slant).toBeGreaterThan(30);
	});
});

describe('precipitation, thunder and wet ground', () => {
	it('uses the rate over the id when OpenWeather sends it', () => {
		expect(sceneState(w({ id: 500, rain1h: 9 }), NOON).precip.intensity).toBe('heavy');
		expect(sceneState(w({ id: 601, snow1h: 0.3 }), NOON).precip.intensity).toBe('light');
	});

	it('wets the ground in rain and darkens the deck in a storm', () => {
		expect(sceneState(w({ id: 501 }), NOON).precip.wet).toBe(true);
		expect(sceneState(w({ id: 601 }), NOON).precip.wet).toBe(false);
		const storm = sceneState(w({ id: 202 }), NOON);
		expect(storm.thunder).toBe(true);
		expect(storm.clouds.dark).toBe(1);
		expect(storm.clouds.low).toBe(true);
		expect(storm.light).toBe('flat');
	});
});

describe('atmosphere', () => {
	it('fades distant landmarks as visibility drops', () => {
		expect(sceneState(w({ visibility: 10000 }), NOON).atmosphere).toMatchObject({ kind: 'clear', veil: 0, farFade: 0 });
		const hazy = sceneState(w({ visibility: 5000 }), NOON).atmosphere;
		expect(hazy.farFade).toBeGreaterThan(0.5);
		expect(hazy.kind).toBe('mist');
	});

	it('veils fog heavily under a kilometre, tints smoke, haze and dust', () => {
		expect(sceneState(w({ id: 741, visibility: 600 }), NOON).atmosphere.veil).toBeGreaterThanOrEqual(0.6);
		expect(sceneState(w({ id: 741, visibility: 3000 }), NOON).atmosphere.veil).toBeLessThan(0.6);
		expect(sceneState(w({ id: 711, visibility: 4000 }), NOON).atmosphere.kind).toBe('smoke');
		expect(sceneState(w({ id: 721 }), NOON).atmosphere.kind).toBe('haze');
		expect(sceneState(w({ id: 761 }), NOON).atmosphere.kind).toBe('dust');
	});
});

describe('the four seasons', () => {
	const at = (m: number, d: number) => Date.UTC(2026, m - 1, d, 17);
	it.each([
		[1, 15, -15, { season: 'winter', foliage: 'bare', snowCover: true, riverIce: true, steam: true }],
		[1, 15, -3, { season: 'winter', snowCover: true, riverIce: false, steam: false }],
		[3, 10, 4, { season: 'winter', snowCover: false }],
		[4, 15, 8, { season: 'spring', foliage: 'bare', balise: true }],
		[5, 20, 18, { season: 'spring', foliage: 'spring' }],
		[7, 10, 28, { season: 'summer', foliage: 'summer' }],
		[9, 25, 14, { season: 'autumn', foliage: 'autumn' }],
		[10, 20, 9, { foliage: 'autumn', balise: true }],
		[11, 14, 3, { foliage: 'bare', snowCover: false, balise: true }],
		[12, 5, -2, { season: 'winter', snowCover: true, balise: false }],
	] as const)('%i/%i at %i °C', (m, d, temp, expected) => {
		expect(sceneState(w({ temp }), at(m, d))).toMatchObject(expected);
	});

	it('lays snow whenever it is snowing', () => {
		expect(sceneState(w({ id: 600, temp: 2 }), at(11, 14)).snowCover).toBe(true);
	});

	it('maps months to seasons and foliage', () => {
		expect([1, 4, 6, 9, 12].map(seasonOf)).toEqual(['winter', 'spring', 'summer', 'autumn', 'winter']);
		expect(foliageOf(9, 20)).toBe('summer');
		expect(foliageOf(9, 21)).toBe('autumn');
	});

	it('lights faces from the sun side: east in the morning, west in the afternoon', () => {
		expect(sceneState(w(), Date.UTC(2026, 10, 14, 14)).light).toBe('left');
		expect(sceneState(w(), Date.UTC(2026, 10, 14, 20)).light).toBe('right');
		expect(sceneState(w({ id: 804, clouds: 100 }), NOON).light).toBe('flat');
		expect(sceneState(w(), LATE_DARK).light).toBe('night');
	});
});

describe('fallback', () => {
	it('without data: the real sun or moon, a neutral clear sky, no word, no broken layer', () => {
		const s = sceneState(null, NOON);
		expect(s).toMatchObject({ wordKey: null, family: 'offline', thunder: false });
		expect(s.precip.kind).toBe('none');
		expect(s.clouds.band).toBe('clear');
		expect(s.body?.kind).toBe('sun');
		expect(sceneState(null, EVENING_MOON).body?.kind).toBe('moon');
	});
});

describe('sun and moon against published tables', () => {
	// Montréal sunrise and sunset on the 15th of each month, local minutes (NOAA, 2026).
	const NOAA = [[450, 996], [416, 1040], [427, 1139], [368, 1179], [323, 1217], [304, 1244], [319, 1240], [354, 1202], [392, 1146], [430, 1089], [413, 984], [447, 971]];
	const local = (ms: number) => {
		const [h, m] = new Date(ms).toLocaleTimeString('en-CA', { timeZone: 'America/Toronto', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).split(':').map(Number);
		return h * 60 + m;
	};

	it('sunrise and sunset within three minutes of NOAA every month', () => {
		NOAA.forEach(([rise, set], month) => {
			const t = sunTimes(Date.UTC(2026, month, 15, 17));
			expect(Math.abs(local(t.sunrise) - rise)).toBeLessThanOrEqual(3);
			expect(Math.abs(local(t.sunset) - set)).toBeLessThanOrEqual(3);
		});
	});

	it('switches at the next sunrise or sunset', () => {
		const { sunrise, sunset } = sunTimes(NOON);
		expect(nextSunEvent(NOON)).toBe(sunset);
		expect(nextSunEvent(sunrise - 1000)).toBe(sunrise);
		const tomorrow = nextSunEvent(sunset + 1000);
		expect(tomorrow - sunrise).toBeGreaterThan(23 * 36e5);
		expect(tomorrow - sunrise).toBeLessThan(25 * 36e5);
	});

	it('moonrise and moonset within six minutes of the published Montréal table', () => {
		// mooninfo.org, Mont-Royal, 14 November 2026: moonrise 11:49, moonset 20:32 (EST).
		const events: Array<[string, number]> = [];
		let up = moonAt(Date.UTC(2026, 10, 14, 5)).altitude > MOONRISE_ALTITUDE;
		for (let t = Date.UTC(2026, 10, 14, 5); t < Date.UTC(2026, 10, 15, 5); t += 60000) {
			const now = moonAt(t).altitude > MOONRISE_ALTITUDE;
			if (now !== up) events.push([now ? 'rise' : 'set', local(t)]);
			up = now;
		}
		expect(events.map((e) => e[0])).toEqual(['rise', 'set']);
		expect(Math.abs(events[0][1] - (11 * 60 + 49))).toBeLessThanOrEqual(6);
		expect(Math.abs(events[1][1] - (20 * 60 + 32))).toBeLessThanOrEqual(6);
	});

	it('draws a true terminator: crescent, half and gibbous', () => {
		expect(moonLitPath(0.5)).toContain('A0 10');
		expect(moonLitPath(0.2)).toMatch(/A6 10 0 0 0/);
		expect(moonLitPath(0.8)).toMatch(/A6 10 0 0 1/);
		for (const f of [0, 0.03, 0.25, 0.5, 0.75, 1]) expect(moonLitPath(f)).not.toContain('NaN');
	});
});

describe('OpenWeather response mapping', () => {
	it('keeps every scene input from the /weather response', () => {
		expect(
			toWeatherData({
				main: { temp: -4.6, feels_like: -11.2, humidity: 81 },
				weather: [{ id: 601, description: 'snow', icon: '13n' }],
				clouds: { all: 100 },
				wind: { speed: 7.2, deg: 250, gust: 12.4 },
				snow: { '1h': 1.3 },
				visibility: 2400,
				sys: { sunrise: 1794657000, sunset: 1794691800 },
				dt: 1794700000,
			})
		).toEqual({
			temp: -5,
			condition: 'snow',
			icon: '13n',
			id: 601,
			clouds: 100,
			windSpeed: 7.2,
			windDeg: 250,
			windGust: 12.4,
			rain1h: undefined,
			snow1h: 1.3,
			visibility: 2400,
			feelsLike: -11.2,
			humidity: 81,
			sunrise: 1794657000,
			sunset: 1794691800,
			dt: 1794700000,
		});
	});
});
