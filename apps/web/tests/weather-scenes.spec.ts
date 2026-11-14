import { test, expect, type Locator, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { PLACES, placeAt } from '../src/lib/components/about/weather-scene.ts';

// The Montréal weather card: three runtime layers, the card's own words, the
// text straight on the scene (no plate), and a one-minute place rotation.

test.beforeEach(async ({ page }) => {
	await page.route(/plausible|google-analytics|calendly|web3forms|\/api\/contact/, (r) => r.abort());
});

const fulfillWeather = (page: Page, icon: string, id: number) =>
	page.route('**/api/weather*', (r) => r.fulfill({ json: { temp: 12, condition: 'API TEXT', icon, id } }));

/**
 * Contrast of each text against the pixels actually behind it. The words, the
 * stop label and the icon are hidden (with their halo) for one screenshot, so
 * the background is measured without the help of the halo: a conservative
 * figure. Returns the 5th percentile (worst 5% of pixels excluded) and the
 * absolute minimum for each element.
 */
async function measureContrast(page: Page, card: Locator) {
	const targets = {
		label: card.locator('h2').first(),
		city: card.locator('.weather-city'),
		temperature: card.locator('.weather-temperature'),
		condition: card.locator('.weather-condition'),
		icon: card.locator('.animation-control svg'),
	};
	// Each run of text (an element with its own text, such as the label's "STOP 03" and
	// "LOCATION") is measured over the tight box of its glyphs, in its own colour.
	const boxes: Record<string, { x: number; y: number; width: number; height: number; color: string }> = {};
	const cardBox = (await card.boundingBox())!;
	for (const [name, el] of Object.entries(targets)) {
		const runs = await el.evaluate((node) => {
			const out: Array<{ x: number; y: number; width: number; height: number; color: string }> = [];
			const walk = (n: Element) => {
				const own = [...n.childNodes].filter((c) => c.nodeType === Node.TEXT_NODE && c.textContent!.trim());
				if (own.length) {
					const range = document.createRange();
					range.setStartBefore(own[0]);
					range.setEndAfter(own[own.length - 1]);
					const r = range.getBoundingClientRect();
					if (r.width > 0) out.push({ x: r.x, y: r.y, width: r.width, height: r.height, color: getComputedStyle(n).color });
				}
				[...n.children].forEach(walk);
			};
			walk(node);
			if (!out.length) {
				const r = node.getBoundingClientRect();
				out.push({ x: r.x, y: r.y, width: r.width, height: r.height, color: getComputedStyle(node).color });
			}
			return out;
		});
		runs.forEach((r, i) => {
			boxes[runs.length > 1 ? `${name}#${i}` : name] = { ...r, x: r.x - cardBox.x, y: r.y - cardBox.y };
		});
	}
	await card.evaluate((el) =>
		el.querySelectorAll<HTMLElement>('.weather-text, h2, .animation-control').forEach((n) => (n.style.opacity = '0'))
	);
	const shot = await card.screenshot(); // the scene is paused first; 'disabled' would restart its animations
	await card.evaluate((el) =>
		el.querySelectorAll<HTMLElement>('.weather-text, h2, .animation-control').forEach((n) => (n.style.opacity = ''))
	);
	return page.evaluate(
		async ({ png, boxes }) => {
			const img = new Image();
			img.src = `data:image/png;base64,${png}`;
			await img.decode();
			const canvas = document.createElement('canvas');
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
			ctx.drawImage(img, 0, 0);
			const scale = img.width / document.querySelector('[data-testid="about-weather"]')!.getBoundingClientRect().width;
			const lin = (n: number) => ((n /= 255) <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4);
			const lum = (r: number, g: number, b: number) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
			const parse = (c: string) => {
				// color-mix() computes to color(srgb r g b / a) with channels from 0 to 1.
				const srgb = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)(?: \/ ([\d.]+))?\)/.exec(c);
				if (srgb) return [+srgb[1] * 255, +srgb[2] * 255, +srgb[3] * 255, srgb[4] === undefined ? 1 : +srgb[4]];
				const probe = document.createElement('canvas').getContext('2d')!;
				probe.fillStyle = c;
				const m = /rgba?\(([^)]+)\)/.exec(probe.fillStyle) ?? null;
				if (m) return m[1].split(',').map(Number);
				const hex = probe.fillStyle.slice(1);
				return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(1);
			};
			const out: Record<string, { p5: number; min: number }> = {};
			for (const [name, b] of Object.entries(boxes)) {
				const [tr, tg, tb, ta = 1] = parse(b.color);
				const data = ctx.getImageData(
					Math.max(0, Math.floor(b.x * scale)),
					Math.max(0, Math.floor(b.y * scale)),
					Math.max(1, Math.ceil(b.width * scale)),
					Math.max(1, Math.ceil(b.height * scale))
				).data;
				const ratios: number[] = [];
				for (let i = 0; i < data.length; i += 4) {
					const [br, bg, bb] = [data[i], data[i + 1], data[i + 2]];
					// Text with alpha blends over the pixel behind it.
					const fl = lum(tr * ta + br * (1 - ta), tg * ta + bg * (1 - ta), tb * ta + bb * (1 - ta));
					const bl = lum(br, bg, bb);
					ratios.push((Math.max(fl, bl) + 0.05) / (Math.min(fl, bl) + 0.05));
				}
				ratios.sort((a, c) => a - c);
				out[name] = { p5: +ratios[Math.floor(ratios.length * 0.05)].toFixed(2), min: +ratios[0].toFixed(2) };
			}
			return out;
		},
		{ png: shot.toString('base64'), boxes }
	);
}

/** Pause or play the card by its button, checked by the accessible name rather than by counting clicks. */
async function setPaused(card: Locator, paused: boolean) {
	const button = card.getByRole('button');
	const want = paused ? /play|relancer|reanudar/i : /pause|pausar/i;
	await expect(async () => {
		if (!want.test((await button.getAttribute('aria-label')) ?? '')) await button.click();
		expect(await button.getAttribute('aria-label')).toMatch(want);
	}).toPass({ timeout: 5000 });
}

// Fixed Montréal moments (14 November 2026, EST): 14:00 by day with the moon up
// in the real sky, 18:00 at night with the crescent still up, 22:00 after moonset.
const DAY = new Date('2026-11-14T19:00:00Z');
const NIGHT_MOON = new Date('2026-11-14T23:00:00Z');
const NIGHT_DARK = new Date('2026-11-15T03:00:00Z');

async function openCard(page: Page, path: string, time: Date, icon: string, id: number, siteTheme: string) {
	await page.clock.install({ time });
	await fulfillWeather(page, icon, id);
	await page.goto(path);
	await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), siteTheme);
	const card = page.getByTestId('about-weather');
	await card.scrollIntoViewIfNeeded();
	await expect(card).toHaveAttribute('data-daypart', /day|night/);
	return card;
}

for (const locale of ['', 'fr/', 'es/'])
	for (const route of ['', 'about'])
		for (const width of [390, 820, 1440])
			for (const theme of ['dark', 'light']) {
				test(`weather ${locale || 'en/'}${route} ${width} site ${theme}`, async ({ context }) => {
					const lang = locale.startsWith('fr') ? 'fr' : locale.startsWith('es') ? 'es' : 'en';
					const samples: Record<string, unknown> = {};
					for (const [label, time, icon, id, daypart] of [
						['night-storm', NIGHT_MOON, '11n', 211, 'night'],
						['day-clear', DAY, '01d', 800, 'day'],
						['day-snow', DAY, '13d', 601, 'day'],
					] as const) {
						const page = await context.newPage();
						await page.route(/plausible|google-analytics|calendly|web3forms|\/api\/contact/, (r) => r.abort());
						await page.setViewportSize({ width, height: 900 });
						await page.emulateMedia({ reducedMotion: 'no-preference' });
						const card = await openCard(page, '/' + locale + route, time, icon, id, theme);

						// The card follows Montréal's sun, not the site theme.
						await expect(card).toHaveAttribute('data-daypart', daypart);
						await expect(card).toHaveClass(daypart === 'day' ? /theme-light/ : /theme-dark/);
						await expect(card.locator('[data-body]')).toHaveCount(1);
						await expect(card.locator('[data-body]')).toHaveAttribute('data-body', daypart === 'day' ? 'sun' : 'moon');
						await expect(card).not.toContainText('API TEXT');
						if (icon === '11n')
							await expect(card.locator('.weather-condition')).toHaveText({ en: 'Thunderstorm', fr: 'Orage', es: 'Tormenta' }[lang]);
						await expect(card.locator('.weather-temperature')).toHaveText(new Intl.NumberFormat(lang, { style: 'unit', unit: 'celsius' }).format(12));
						await expect(card.locator('.weather-plate, .tile')).toHaveCount(0);
						expect(await card.evaluate((el) => el.getBoundingClientRect().height)).toBeGreaterThanOrEqual(width < 640 ? 176 : 100);
						expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);

						// Identical in both site themes.
						const look = () => card.evaluate((el) => { const cs = getComputedStyle(el); const t = el.querySelector('.weather-city')!; return [cs.backgroundColor, getComputedStyle(t).color, getComputedStyle(el.querySelector('.wx-sky')!).backgroundImage].join('|'); });
						const before = await look();
						await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t === 'dark' ? 'light' : 'dark'), theme);
						expect(await look()).toBe(before);
						await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);

						// Measure a still frame: pause every loop, let the place crossfade and sky fade settle.
						await setPaused(card, true);
						await page.waitForTimeout(900);
						const c = await measureContrast(page, card);
						await setPaused(card, false);
						samples[label] = c;
						// The worst run of each text (the label has two coloured runs).
						const worst = (name: string) =>
							Math.min(...Object.entries(c).filter(([k]) => k === name || k.startsWith(`${name}#`)).map(([, v]) => v.p5));
						for (const name of ['label', 'city', 'temperature', 'condition'])
							expect(worst(name), `${label} ${name}`).toBeGreaterThanOrEqual(4.5);
						expect(worst('icon'), `${label} icon`).toBeGreaterThanOrEqual(3);
						await card.screenshot({ path: test.info().outputPath(`weather-${label}.png`) });

						// On the card, infinite loops live only inside the weather scene (nothing pulses:
						// the stop label's lamp holds still here); pause stops them all.
						await page.emulateMedia({ reducedMotion: 'no-preference' });
						expect(
							await card.evaluate(
								(el) =>
									el.getAnimations({ subtree: true }).filter(
										(a) =>
											a.effect?.getTiming().iterations === Infinity &&
											a.effect instanceof KeyframeEffect &&
											a.effect.target instanceof Element &&
											!a.effect.target.closest('.weather-scene')
									).length
							)
						).toBe(0);
						if (label === 'night-storm') {
							await setPaused(card, true);
							expect(
								await card.locator('.wx').evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length)
							).toBe(0);
							await setPaused(card, false);
							await page.emulateMedia({ reducedMotion: 'reduce' });
							await expect(card.getByRole('button')).toHaveCount(0);
							expect(await card.locator('.wx').evaluate((el) => el.getAnimations({ subtree: true }).filter((a) => a.effect?.getTiming().iterations === Infinity).length)).toBe(0);
						}
						await page.close();
					}
					await writeFile(test.info().outputPath('contrast.json'), JSON.stringify(samples, null, 1));
				});
			}

test('the real sky: the sun only by day, the moon only while it is up, never both', async ({ page }) => {
	const card = await openCard(page, '/', NIGHT_DARK, '01n', 800, 'dark');
	await expect(card).toHaveAttribute('data-daypart', 'night');
	await expect(card.locator('[data-body]')).toHaveCount(0);
	await expect(card.locator('.wx-stars')).toBeAttached();
});

test('by day the moon is never drawn, even when it is up', async ({ page }) => {
	const card = await openCard(page, '/', DAY, '02d', 801, 'light');
	await expect(card.locator('[data-body]')).toHaveCount(1);
	await expect(card.locator('[data-body="moon"]')).toHaveCount(0);
});

test('an open page switches to the night card at sunset', async ({ page }) => {
	// Sunset on 14 November 2026 is about 16:26 EST (21:26 UTC).
	const card = await openCard(page, '/', new Date('2026-11-14T21:24:00Z'), '01d', 800, 'light');
	await expect(card).toHaveAttribute('data-daypart', 'day');
	await page.clock.fastForward(5 * 60000);
	await expect(card).toHaveAttribute('data-daypart', 'night');
	await expect(card).toHaveClass(/theme-dark/);
});

test('every place draws once, with its windows and a balise in season', async ({ context }) => {
	const start = Date.UTC(2026, 6, 14, 3, 0); // July: the balise is out
	const first = Math.floor(start / 60000);
	const seen = new Set<string>();
	for (let i = 0; i < PLACES.length; i++) {
		const ms = (first + i) * 60000 + 5000;
		const page = await context.newPage();
		await page.route(/plausible|google-analytics|calendly/, (r) => r.abort());
		await fulfillWeather(page, '01n', 800);
		await page.clock.install({ time: new Date(ms) });
		await page.goto('/');
		const scene = page.getByTestId('about-weather').locator('.wx');
		await expect(scene).toHaveAttribute('data-place', placeAt(ms));
		await expect(scene.locator('.weather-skyline .weather-windows')).toHaveCount(1);
		await expect(scene.locator('.weather-skyline .wx-egg')).toBeVisible();
		seen.add(placeAt(ms));
		await page.close();
	}
	expect([...seen].sort()).toEqual([...PLACES].sort());
});

test('minute rotation runs on an open page, pause holds and reduced motion swaps instantly', async ({ page }) => {
	await fulfillWeather(page, '01d', 800);
	const t0 = Date.UTC(2026, 10, 14, 12, 0);
	await page.clock.install({ time: new Date(t0) });
	await page.goto('/');
	const card = page.getByTestId('about-weather');
	await card.scrollIntoViewIfNeeded();
	const scene = card.locator('.wx');
	await expect(scene).toHaveAttribute('data-place', placeAt(t0));
	await page.clock.fastForward(60000);
	await expect(scene).toHaveAttribute('data-place', placeAt(t0 + 60000));
	await card.getByRole('button').click();
	await page.clock.fastForward(120000);
	await expect(scene).toHaveAttribute('data-place', placeAt(t0 + 60000));
	await card.getByRole('button').click();
	await expect(scene).toHaveAttribute('data-place', placeAt(t0 + 180000));
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.clock.fastForward(60000);
	await expect(scene).toHaveAttribute('data-place', placeAt(t0 + 240000));
	expect(await scene.evaluate((el) => el.getAnimations({ subtree: true }).length)).toBe(0);
});
