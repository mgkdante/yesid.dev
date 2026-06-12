// AboutWeather scene system — GO Wave 4.
// Covers: condition→scene mapping (pure resolver), graceful data states
// (unknown code → clear, missing data → offline, never blank), day/night
// derivation from the icon suffix, per-scene composition (clouds, bolt,
// fog banks, precipitation), and the crafted glyph that replaced the
// hotlinked OpenWeather PNG. The reduced-motion STATIC contract is locked
// at the CSS-source tier in src/lib/styles/__tests__/motion-policy-css.test.ts
// and at runtime in tests/reduced-motion.spec.ts (Playwright).

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import AboutWeather from './AboutWeather.svelte';
import { resolveWeatherScene, isNightHour, WEATHER_SCENES } from './weather-scene';
import { aboutPageContent } from '$lib/content/about-page';

const config = aboutPageContent.weather;

function renderWeather(weather: { temp: number; condition: string; icon: string } | null) {
	return render(AboutWeather, {
		props: { config, weather, stop: '06', label: 'LOCATION' },
	});
}

function sceneEl(): HTMLElement {
	const el = screen.getByTestId('about-weather').querySelector<HTMLElement>('.weather-scene');
	expect(el, 'scene root must render').not.toBeNull();
	return el!;
}

describe('weather-scene resolver (condition → scene mapping)', () => {
	it.each([
		['01d', 'clear', false],
		['01n', 'clear', true],
		['02d', 'clouds', false],
		['02n', 'clouds', true],
		['03d', 'clouds', false],
		['04n', 'clouds', true],
		['09d', 'rain', false],
		['10n', 'rain', true],
		['11d', 'storm', false],
		['11n', 'storm', true],
		['13d', 'snow', false],
		['13n', 'snow', true],
		['50d', 'mist', false],
		['50n', 'mist', true],
	] as const)('maps icon %s → %s (night=%s)', (icon, scene, night) => {
		expect(resolveWeatherScene(icon)).toEqual({ scene, night });
	});

	it('falls back to clear for unknown codes (never an empty box)', () => {
		expect(resolveWeatherScene('99d').scene).toBe('clear');
		expect(resolveWeatherScene('42n')).toEqual({ scene: 'clear', night: true });
	});

	it('resolves missing data to the offline scene', () => {
		expect(resolveWeatherScene(null)).toEqual({ scene: 'offline', night: false });
		expect(resolveWeatherScene(undefined)).toEqual({ scene: 'offline', night: false });
		expect(resolveWeatherScene('')).toEqual({ scene: 'offline', night: false });
	});

	it('exports every renderable scene family', () => {
		expect(WEATHER_SCENES).toEqual([
			'clear',
			'clouds',
			'rain',
			'snow',
			'storm',
			'mist',
			'offline',
		]);
	});

	it('isNightHour: night spans 19:00–06:59 local', () => {
		expect(isNightHour(6)).toBe(true);
		expect(isNightHour(7)).toBe(false);
		expect(isNightHour(12)).toBe(false);
		expect(isNightHour(18)).toBe(false);
		expect(isNightHour(19)).toBe(true);
		expect(isNightHour(23)).toBe(true);
		expect(isNightHour(0)).toBe(true);
	});
});

describe('AboutWeather scene rendering', () => {
	it('renders the matching scene + skyline for live data', () => {
		renderWeather({ temp: -3, condition: 'light snow', icon: '13d' });
		const scene = sceneEl();
		expect(scene.dataset.scene).toBe('snow');
		expect(scene.dataset.weatherNight).toBe('false');
		expect(scene.querySelector('.weather-skyline')).not.toBeNull();
		expect(scene.querySelectorAll('.weather-flake').length).toBe(14);
		const widget = screen.getByTestId('about-weather');
		expect(widget.textContent).toContain('-3°C');
		expect(widget.textContent).toContain('light snow');
	});

	it('night icon suffix drives the night composition (moon, stars, lit windows)', () => {
		renderWeather({ temp: 8, condition: 'clear sky', icon: '01n' });
		const scene = sceneEl();
		expect(scene.dataset.scene).toBe('clear');
		expect(scene.dataset.weatherNight).toBe('true');
		expect(scene.classList.contains('night')).toBe(true);
		expect(scene.querySelector('.weather-moon')).not.toBeNull();
		expect(scene.querySelectorAll('.weather-star').length).toBeGreaterThan(0);
		expect(scene.querySelector('.weather-windows')).not.toBeNull();
		expect(scene.querySelector('.weather-sun')).toBeNull();
	});

	it('day clear scene carries the sun, no moon', () => {
		renderWeather({ temp: 24, condition: 'clear sky', icon: '01d' });
		const scene = sceneEl();
		expect(scene.querySelector('.weather-sun')).not.toBeNull();
		expect(scene.querySelector('.weather-moon')).toBeNull();
		expect(scene.querySelectorAll('.weather-star').length).toBe(0);
	});

	it('storm scene composes rain + bolt + flash veil', () => {
		renderWeather({ temp: 17, condition: 'thunderstorm', icon: '11d' });
		const scene = sceneEl();
		expect(scene.dataset.scene).toBe('storm');
		expect(scene.querySelectorAll('.weather-drop').length).toBe(14);
		expect(scene.querySelector('.weather-bolt')).not.toBeNull();
		expect(scene.querySelector('.weather-lightning')).not.toBeNull();
	});

	it('mist scene layers three fog banks over the skyline', () => {
		renderWeather({ temp: 11, condition: 'mist', icon: '50d' });
		const scene = sceneEl();
		expect(scene.dataset.scene).toBe('mist');
		expect(scene.querySelectorAll('.weather-mist').length).toBe(3);
		expect(scene.querySelector('.weather-skyline')).not.toBeNull();
	});

	it('unknown icon code falls back to the clear scene', () => {
		renderWeather({ temp: 20, condition: 'meteor shower', icon: '99d' });
		expect(sceneEl().dataset.scene).toBe('clear');
	});

	it('missing weather renders the calm offline sky — card never empty', () => {
		renderWeather(null);
		const scene = sceneEl();
		expect(scene.dataset.scene).toBe('offline');
		expect(scene.querySelector('.weather-sky')).not.toBeNull();
		expect(scene.querySelector('.weather-skyline')).not.toBeNull();
		const widget = screen.getByTestId('about-weather');
		expect(widget.textContent).toContain('Montreal');
		expect(widget.textContent).toContain('—');
	});

	it('scene layer is decorative: aria-hidden and pointer-transparent', () => {
		renderWeather({ temp: 5, condition: 'light rain', icon: '10d' });
		const scene = sceneEl();
		expect(scene.getAttribute('aria-hidden')).toBe('true');
	});
});

describe('AboutWeather glyph (crafted inline SVG, replaces the OpenWeather PNG)', () => {
	it('renders the glyph with the condition as its accessible label', () => {
		renderWeather({ temp: -8, condition: 'heavy snow', icon: '13n' });
		const glyph = screen.getByTestId('weather-glyph');
		expect(glyph.getAttribute('role')).toBe('img');
		expect(glyph.getAttribute('aria-label')).toBe('heavy snow');
		expect(glyph.dataset.glyph).toBe('snow');
	});

	it('does not hotlink the OpenWeather bitmap anymore', () => {
		renderWeather({ temp: 15, condition: 'clear sky', icon: '01d' });
		const widget = screen.getByTestId('about-weather');
		expect(widget.querySelector('img')).toBeNull();
	});

	it('omits the glyph in the no-data fallback', () => {
		renderWeather(null);
		expect(screen.queryByTestId('weather-glyph')).toBeNull();
	});
});
