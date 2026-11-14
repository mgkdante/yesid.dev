import { it, expect, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import { tick } from 'svelte';
import AboutWeather from './AboutWeather.svelte';
import WeatherScene from './WeatherScene.svelte';
import { aboutPageContent } from '#lib/content/about-page.ts';
import { setAnimationPaused } from '#lib/state/animation-pause.ts';
import { PLACES, nextRotation, placeAt } from './weather-scene';
import { sceneState } from './weather/scene-state';
import { loadPlace } from './weather/places';

const config = aboutPageContent.weather;
const localeContext = (locale: string) => new Map([[Symbol.for('@yesid/ui/locale'), () => locale]]);
// 14 November 2026, Montréal: 12:00 by day, 18:00 with the crescent up, 22:00 after moonset.
const NOON = Date.UTC(2026, 10, 14, 17);
const EVENING_MOON = Date.UTC(2026, 10, 14, 23);
const LATE_DARK = Date.UTC(2026, 10, 15, 3);

it.each(['en', 'fr', 'es'] as const)('%s prints the card own words and an Intl temperature', (locale) => {
	const { container, unmount } = render(AboutWeather, {
		props: { config, weather: { temp: 12, condition: 'API MUST NOT APPEAR', icon: '01d', id: 800 }, stop: '06', label: 'LOCATION' },
		context: localeContext(locale),
	});
	const temperature = new Intl.NumberFormat(locale, { style: 'unit', unit: 'celsius' }).format(12);
	expect(screen.getByText(temperature, { normalizer: (s) => s })).toBeInTheDocument();
	expect(screen.getByText(config.conditions.clear[locale]!)).toBeInTheDocument();
	expect(screen.queryByText('API MUST NOT APPEAR')).toBeNull();
	expect(screen.queryByTestId('weather-glyph')).toBeNull();
	// The words sit on the scene: no plate, no tile.
	expect(container.querySelector('.weather-plate, .tile')).toBeNull();
	unmount();
});

it.each([
	[721, 'haze'],
	[761, 'dust'],
	[613, 'sleet'],
] as const)('prints the new %i word from the CMS fallback table', (id, key) => {
	const { unmount } = render(AboutWeather, {
		props: { config, weather: { temp: 3, condition: 'x', icon: '50d', id }, stop: '06', label: 'LOCATION' },
		context: localeContext('fr'),
	});
	expect(screen.getByText(config.conditions[key]!.fr!)).toBeInTheDocument();
	unmount();
});

it('offline shows the city alone', () => {
	const { container, unmount } = render(AboutWeather, {
		props: { config, weather: null, stop: '06', label: 'LOCATION' },
		context: localeContext('fr'),
	});
	expect(container.querySelector('.weather-city')?.textContent).toBe(config.city.fr ?? config.city.en);
	expect(container.querySelector('.weather-temperature')).toBeNull();
	expect(container.querySelector('.weather-condition')).toBeNull();
	unmount();
});

it('wears light tokens from sunrise to sunset and dark ones after, whatever the site theme', async () => {
	vi.useFakeTimers();
	for (const [time, theme, daypart] of [
		[NOON, 'theme-light', 'day'],
		[LATE_DARK, 'theme-dark', 'night'],
	] as const) {
		vi.setSystemTime(time);
		const { container, unmount } = render(AboutWeather, { props: { config, weather: null, stop: '06', label: 'LOCATION' } });
		await tick();
		const card = container.querySelector('[data-testid="about-weather"]')!;
		expect(card.classList.contains(theme)).toBe(true);
		expect(card.getAttribute('data-daypart')).toBe(daypart);
		unmount();
	}
	vi.useRealTimers();
});

it('composes every place with every sky and condition: at most one sky body, its drawing and windows', async () => {
	await Promise.all(PLACES.map(loadPlace));
	const weathers = [800, 802, 804, 300, 501, 202, 601, 611, 741, 711, 761].map((id) => ({ temp: 2, condition: '', icon: '', id }));
	// Every weather meets several places at every time of day (120 renders, not 360).
	for (const [pi, place] of PLACES.entries())
		for (const time of [NOON, EVENING_MOON, LATE_DARK])
			for (const weather of [null, ...weathers].filter((_, wi) => (wi + pi) % 3 === 0)) {
				const state = sceneState(weather, time);
				const { container, unmount } = render(WeatherScene, { props: { scene: state, place } });
				await tick();
				expect(container.querySelector('.wx')?.getAttribute('data-place')).toBe(place);
				const bodies = container.querySelectorAll('[data-body]');
				expect(bodies.length).toBe(state.body ? 1 : 0);
				if (state.body) expect(bodies[0].getAttribute('data-body')).toBe(state.body.kind);
				expect(container.querySelector('.wx')?.getAttribute('data-time')).toBe(state.dark ? 'night' : 'day');
				expect(container.querySelectorAll('.weather-skyline .weather-windows')).toHaveLength(1);
				expect(container.querySelectorAll('.wx-precip').length).toBe(state.precip.kind === 'none' ? 0 : 2);
				expect(container.querySelectorAll('.wx-cloud-layer').length).toBe(state.clouds.layers);
				unmount();
			}
}, 30_000);

it('puts a downwind plume on each roof vent only on cold days', async () => {
	await Promise.all(PLACES.map(loadPlace));
	for (const place of PLACES) {
		const cold = render(WeatherScene, { props: { scene: sceneState({ temp: -12, condition: '', icon: '', id: 800, windSpeed: 6, windDeg: 270 }, NOON), place } });
		await tick();
		const vents = cold.container.querySelectorAll('.wx-steam');
		vents.forEach((v) => expect(v.querySelector('.wx-plume')).not.toBeNull());
		cold.unmount();
		const mild = render(WeatherScene, { props: { scene: sceneState({ temp: 6, condition: '', icon: '', id: 800 }, NOON), place } });
		expect(mild.container.querySelectorAll('.wx-plume')).toHaveLength(0);
		mild.unmount();
	}
});

it('aligns every visitor to minute boundaries', () => {
	expect(placeAt(59999)).toBe(PLACES[0]);
	expect(placeAt(60000)).toBe(PLACES[1]);
	expect(placeAt(PLACES.length * 60000)).toBe(PLACES[0]);
	expect(placeAt(-1)).toBe(PLACES[PLACES.length - 1]);
	expect(nextRotation(59999)).toBe(1);
	expect(nextRotation(60000)).toBe(60000);
});

it('rotates on an open page, holds while paused, resumes to the current minute', async () => {
	vi.useFakeTimers();
	vi.setSystemTime(new Date('2026-11-14T17:00:00Z'));
	const { container, unmount } = render(AboutWeather, { props: { config, weather: null, stop: '06', label: 'LOCATION' } });
	await tick();
	const scene = () => container.querySelector('.wx') as HTMLElement;
	const first = scene().dataset.place;
	await vi.advanceTimersByTimeAsync(60000);
	await tick();
	expect(scene().dataset.place).not.toBe(first);
	setAnimationPaused(true);
	await tick();
	const held = scene().dataset.place;
	await vi.advanceTimersByTimeAsync(120000);
	await tick();
	expect(scene().dataset.place).toBe(held);
	setAnimationPaused(false);
	await tick();
	expect(scene().dataset.place).toBe(placeAt(Date.now()));
	unmount();
	cleanup();
	vi.useRealTimers();
});

it('draws the ten owner-chosen Montreal places, each once', () => {
	expect([...PLACES]).toEqual(['skyline', 'montroyal', 'oldport', 'oratoire', 'ring', 'laronde', 'metro', 'olympic', 'biosphere', 'bellcentre']);
	const drawings = import.meta.glob<string>('./weather/places/*.svg', { query: '?raw', import: 'default', eager: true });
	const names = Object.keys(drawings).map((path) => path.split('/').pop()!.replace('.svg', ''));
	expect(names.sort()).toEqual([...PLACES].sort());
	for (const [path, svg] of Object.entries(drawings)) {
		// Shapes only: no text, scripts, links, images, inline colour or ids (several cards can share a page).
		expect(svg, path).not.toMatch(/<text|<script|<image|href=|\sid=|\sstyle=|\sfill="#|\sstroke="#/);
		expect(svg.match(/weather-windows/g), path).toHaveLength(1);
		expect(new Blob([svg]).size, path).toBeLessThanOrEqual(12 * 1024);
	}
});
