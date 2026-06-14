// GO Wave 4 — About weather scene system, e2e tier.
//
// The card SSR-bakes whatever the server fetched, then refreshes from
// /api/weather after hydration (slice-28.1). Stubbing that endpoint is the
// supported seam for forcing every condition family deterministically —
// no CMS, no OpenWeather, no flakiness from live Montréal weather.
//
// Two halves:
//   1. Always-on assertions (cheap): condition → scene mapping through the
//      real page, unknown-code fallback, scene-never-blank.
//   2. WEATHER_SHOTS=1 screenshot rig: captures every scene × both themes
//      (motion frame + a reduced-motion still for the precipitation scenes)
//      into test-results-weather/ for the operator taste-check. Skipped in
//      CI by default.
//
// Run shots locally:
//   WEATHER_SHOTS=1 bunx playwright test weather-scenes --project=desktop-chrome

import { test, expect, type Page } from '@playwright/test';

interface SceneCase {
	name: string;
	icon: string | null;
	scene: string;
	night: boolean;
	temp: number;
	condition: string;
}

const CASES: SceneCase[] = [
	{ name: 'clear-day', icon: '01d', scene: 'clear', night: false, temp: 24, condition: 'clear sky' },
	{ name: 'clear-night', icon: '01n', scene: 'clear', night: true, temp: 16, condition: 'clear sky' },
	{ name: 'clouds-day', icon: '03d', scene: 'clouds', night: false, temp: 19, condition: 'scattered clouds' },
	{ name: 'clouds-night', icon: '04n', scene: 'clouds', night: true, temp: 13, condition: 'broken clouds' },
	{ name: 'rain-day', icon: '10d', scene: 'rain', night: false, temp: 12, condition: 'light rain' },
	{ name: 'rain-night', icon: '09n', scene: 'rain', night: true, temp: 9, condition: 'shower rain' },
	{ name: 'storm-day', icon: '11d', scene: 'storm', night: false, temp: 18, condition: 'thunderstorm' },
	{ name: 'storm-night', icon: '11n', scene: 'storm', night: true, temp: 15, condition: 'thunderstorm' },
	{ name: 'snow-day', icon: '13d', scene: 'snow', night: false, temp: -6, condition: 'light snow' },
	{ name: 'snow-night', icon: '13n', scene: 'snow', night: true, temp: -11, condition: 'snow' },
	{ name: 'mist-day', icon: '50d', scene: 'mist', night: false, temp: 8, condition: 'mist' },
	{ name: 'mist-night', icon: '50n', scene: 'mist', night: true, temp: 5, condition: 'fog' },
	{ name: 'offline', icon: null, scene: 'offline', night: false, temp: 0, condition: '' },
];

const SCENE = '[data-testid="about-weather"] .weather-scene';

async function forceWeather(page: Page, c: SceneCase) {
	await page.route('**/api/weather', (route) =>
		route.fulfill({
			json: c.icon ? { temp: c.temp, condition: c.condition, icon: c.icon } : null,
		})
	);
}

test.describe('weather scene system (GO Wave 4)', () => {
	test('storm night: stubbed /api/weather drives the full composition', async ({ page }) => {
		const c = CASES.find((x) => x.name === 'storm-night')!;
		await forceWeather(page, c);
		await page.goto('/about');
		const scene = page.locator(SCENE);
		await expect(scene).toHaveAttribute('data-scene', 'storm');
		await expect(scene).toHaveAttribute('data-weather-night', 'true');
		await expect(scene.locator('.weather-bolt')).toHaveCount(1);
		await expect(scene.locator('.weather-drop')).toHaveCount(14);
		await expect(scene.locator('.weather-windows')).toHaveCount(1);
		// Night lights the skyline windows (opacity transitions to 0.9).
		await expect
			.poll(async () =>
				scene.locator('.weather-windows').evaluate((el) => getComputedStyle(el).opacity)
			)
			.toBe('0.9');
	});

	test('unknown icon code falls back to the clear scene', async ({ page }) => {
		await page.route('**/api/weather', (route) =>
			route.fulfill({ json: { temp: 21, condition: 'meteor shower', icon: '77d' } })
		);
		await page.goto('/about');
		await expect(page.locator(SCENE)).toHaveAttribute('data-scene', 'clear');
	});

	test('scene is never blank: sky + skyline render for whatever condition is live', async ({
		page,
	}) => {
		await page.goto('/about');
		const scene = page.locator(SCENE);
		await expect(scene).toHaveCount(1);
		await expect(scene.locator('.weather-sky')).toHaveCount(1);
		await expect(scene.locator('.weather-skyline')).toBeVisible();
	});
});

// ─── Screenshot rig (operator taste-check) ────────────────────────────────
test.describe('weather scene screenshots', () => {
	test.skip(!process.env.WEATHER_SHOTS, 'screenshot rig — set WEATHER_SHOTS=1 to capture');

	const OUT = 'test-results-weather';
	const PRECIP = new Set(['rain-day', 'storm-day', 'snow-day', 'mist-day']);

	for (const theme of ['dark', 'light'] as const) {
		for (const c of CASES) {
			test(`${c.name} · ${theme}`, async ({ page }) => {
				await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
				await forceWeather(page, c);
				await page.goto('/about');
				// The scene is pure CSS + inline SVG (no external images), so
				// `load` + a painted, correctly-keyed skyline is the deterministic
				// stability signal — networkidle would race the stubbed
				// /api/weather refresh + DOM clock interval for no extra guarantee.
				await page.waitForLoadState('load');
				const scene = page.locator(SCENE);
				await expect(scene).toHaveAttribute('data-scene', c.scene);
				await expect(scene.locator('.weather-skyline')).toBeVisible();
				// Let loops distribute particles before the motion frame.
				await page.waitForTimeout(2600);
				await page
					.locator('[data-testid="about-weather"]')
					.screenshot({ path: `${OUT}/${c.name}-${theme}.png` });
			});

			if (PRECIP.has(c.name)) {
				test(`${c.name} · ${theme} · reduced-motion still`, async ({ page }) => {
					await page.addInitScript((t) => localStorage.setItem('theme', t), theme);
					await page.emulateMedia({ reducedMotion: 'reduce' });
					await forceWeather(page, c);
					await page.goto('/about');
					// Static still: `load` + the painted skyline is the deterministic
					// guard; reduce-motion parks every loop so there is no settle to wait on.
					await page.waitForLoadState('load');
					const scene = page.locator(SCENE);
					await expect(scene).toHaveAttribute('data-scene', c.scene);
					await expect(scene.locator('.weather-skyline')).toBeVisible();
					await page.waitForTimeout(400);
					await page
						.locator('[data-testid="about-weather"]')
						.screenshot({ path: `${OUT}/${c.name}-${theme}-static.png` });
				});
			}
		}
	}
});
