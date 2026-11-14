import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { siteLabels } from '../src/lib/content/site-labels.ts';
// The card prints its own condition words (CMS, with the approved fallback per language) and an Intl
// temperature, never OpenWeather's text: icon 03d is the "partly" word.
const celsius = (lang: string) => new Intl.NumberFormat(lang, { style: 'unit', unit: 'celsius' }).format(12);
const locales = [
 { path: '', pause: 'Pause animation', play: 'Play animation', scene: 'Montréal metro scene', condition: 'Partly cloudy', temperature: celsius('en') },
 { path: 'fr/', pause: "Mettre l'animation en pause", play: "Relancer l'animation", scene: 'Scène du métro de Montréal', condition: 'Partiellement nuageux', temperature: celsius('fr') },
 { path: 'es/', pause: 'Pausar la animación', play: 'Reanudar la animación', scene: 'Escena del metro de Montreal', condition: 'Parcialmente nublado', temperature: celsius('es') },
];
test.beforeEach(async ({ page }) => {
 await page.route(/plausible|google-analytics|calendly|\/api\/contact/, r => r.abort());
 await page.route('**/api/weather*', r => r.fulfill({ json: { temp: 12, condition: 'Clouds', icon: '03d' } }));
});
for (const locale of locales) for (const width of [390, 1440]) {
 test(`pause and session choice ${locale.path || 'en'} ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto(`/${locale.path}`);
  const weather = page.getByTestId('about-weather');
  const pause = weather.getByRole('button', { name: locale.pause, exact: true });
  await expect(pause).toHaveCount(1);
  await expect(pause).toHaveAccessibleName(locale.pause);
  await expect(pause).toHaveAttribute('title', locale.pause);
  await expect(pause).toHaveText('');
  await expect(pause.getByTestId('animation-pause-icon')).toBeVisible();
  await expect(pause).toHaveCSS('border-top-color', 'rgba(0, 0, 0, 0)');
  await expect(page.getByRole('button', { name: locale.pause, exact: true })).toHaveCount(1);
  const manifesto = page.getByTestId('manifesto-section');
  await expect(manifesto.getByRole('button', { name: locale.pause, exact: true })).toHaveCount(0);
  await expect(manifesto.locator('.manifesto__flow-line, .manifesto__flow-line-v')).toHaveCount(0);
  await pause.scrollIntoViewIfNeeded();
  await expect(weather.getByText(locale.temperature, { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const target = await pause.boundingBox();
  expect(target!.height).toBeGreaterThanOrEqual(44);
  expect(target!.width).toBeGreaterThanOrEqual(44);
  expect(target!.height).toBeCloseTo(44, 0);
  expect(target!.width).toBeCloseTo(44, 0);
  const card = await weather.boundingBox();
  const temperature = await weather.getByText(locale.temperature, { exact: true }).boundingBox();
  const condition = await weather.getByText(locale.condition, { exact: true }).boundingBox();
  for (const text of [temperature!, condition!]) {
   const overlapWidth = Math.min(target!.x + target!.width, text.x + text.width) - Math.max(target!.x, text.x);
   const overlapHeight = Math.min(target!.y + target!.height, text.y + text.height) - Math.max(target!.y, text.y);
   expect(overlapWidth <= 0 || overlapHeight <= 0, 'weather control does not cover text').toBe(true);
  }
  expect(target!.x).toBeGreaterThanOrEqual(card!.x);
  expect(target!.y).toBeGreaterThanOrEqual(card!.y);
  expect(target!.x + target!.width).toBeLessThanOrEqual(card!.x + card!.width);
  expect(target!.y + target!.height).toBeLessThanOrEqual(card!.y + card!.height);
  await weather.screenshot({ path: test.info().outputPath('weather-playing.png') });
  await pause.focus();
  await page.keyboard.press('Enter');
  const play = page.getByRole('button', { name: locale.play, exact: true });
  await expect(play).toHaveAccessibleName(locale.play);
  await expect(play).toHaveAttribute('title', locale.play);
  await expect(play).toHaveText('');
  await expect(play.getByTestId('animation-play-icon')).toBeVisible();
  expect(await play.evaluate(el => {
   const style = getComputedStyle(el);
   return el.matches(':focus-visible') && style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
  })).toBe(true);
  await expect(play).not.toHaveAttribute('aria-pressed');
  const keptRunning = () => page.evaluate(() => document.getAnimations().filter(a =>
   a.playState === 'running' && /weather-/.test((a as CSSAnimation).animationName)).length);
  await expect.poll(keptRunning).toBe(0);
  await weather.screenshot({ path: test.info().outputPath('weather-pause-focused.png') });
  await play.evaluate(el => (el as HTMLButtonElement).blur());
  await weather.screenshot({ path: test.info().outputPath('weather-pause.png') });
  await page.screenshot({ path: test.info().outputPath('paused-home.png') });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.screenshot({ path: test.info().outputPath('paused-home-light.png') });
  await page.goto(`/${locale.path}about`);
  await expect(play).toHaveCount(1);
  await expect(weather.getByRole('button', { name: locale.play, exact: true })).toHaveCount(1);
  await expect.poll(keptRunning).toBe(0);
  await weather.screenshot({ path: test.info().outputPath('about-weather-pause.png') });
  await play.click();
  await expect.poll(keptRunning).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.getByRole('button', { name: locale.pause, exact: true })).toHaveCount(0);
  await expect.poll(keptRunning).toBe(0);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(pause).toBeVisible();
  await page.goto(`/${locale.path}contact`);
  await expect(page.locator('.weather-scene')).toHaveCount(0);
  await expect(page.getByRole('button', { name: locale.pause, exact: true })).toHaveCount(0);
 });
 test(`still metro with live motion preference ${locale.path || 'en'} ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`/${locale.path}`);
  const dot = page.getByTestId('hero-dot-replay');
  await expect(dot).toBeEnabled();
  const targetSize = await dot.evaluate(el => ({ width: el.getBoundingClientRect().width, height: el.getBoundingClientRect().height }));
  expect(targetSize.width).toBeGreaterThanOrEqual(24);
  expect(targetSize.height).toBeGreaterThanOrEqual(24);
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await dot.focus();
  await page.keyboard.press('Enter');
  const scene = page.getByRole('region', { name: locale.scene, exact: true });
  await expect(scene).toBeFocused();
  await expect(scene).toBeInViewport();
  await expect(dot).toHaveAttribute('aria-expanded', 'true');
  await expect(scene.locator('svg path[stroke="#E07800"]').first()).toHaveCSS('opacity', '1');
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThan(height + 900);
  await scene.scrollIntoViewIfNeeded();
  await page.screenshot({ path: test.info().outputPath('metro-still-dark.png') });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.screenshot({ path: test.info().outputPath('metro-still-light.png') });
  await dot.click();
  await expect(scene).toHaveCount(0);
  await expect(dot).toBeFocused();
  await dot.click();
  await expect(scene).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(scene).toHaveCount(0);
  await expect(dot).toBeFocused();
  await dot.click();
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  await dot.click();
  await expect(scene).toBeFocused();
 });
}
for (const width of [390, 1440]) {
 test(`motion-allowed metro replay matches main in EN at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const dot = page.getByTestId('hero-dot-replay');
  const metro = page.getByTestId('metro-network-container');
  const mainReplayName = siteLabels.a11y.replayIntro.en;
  await expect(dot).toBeEnabled();
  await expect(dot).toHaveAccessibleName(mainReplayName);
  await expect(dot).not.toHaveAttribute('aria-expanded');
  await expect(dot).not.toHaveAttribute('aria-controls');
  await expect(page.locator('#metro-still-scene')).toHaveCount(0);
  await expect(metro).toBeHidden();
  await expect(page.locator('.pin-spacer')).toHaveCount(0);
  const settledHeight = await page.evaluate(() => document.documentElement.scrollHeight);
  await dot.click();
  await expect(page.locator('.pin-spacer')).toHaveCount(1);
  await expect(metro).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight)).toBeGreaterThan(settledHeight + 1800);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(8);
  await expect(dot).toHaveAccessibleName(mainReplayName);
  await expect(dot).not.toHaveAttribute('aria-expanded');
  await expect(dot).not.toHaveAttribute('aria-controls');
  await expect(page.locator('#metro-still-scene')).toHaveCount(0);
 });
}

test('storm flash frequency is below three in every rolling second', async ({ page }) => {
 await page.route('**/api/weather*', r => r.fulfill({ json: { temp: 12, condition: 'Storm', icon: '11d' } }));
 await page.goto('/about');
 const scene = page.locator('.weather-scene[data-scene="storm"]');
 await expect(scene).toBeVisible();
 const result = await scene.evaluate(el => {
  const effects = el.getAnimations({ subtree: true }).filter(a => /weather-flash|weather-zap/.test((a as CSSAnimation).animationName));
  effects.forEach(a => a.pause());
  const peaks: number[] = [];
  let previous = false;
  for (let t = 0; t <= 14000; t += 4) {
   effects.forEach(a => { a.currentTime = t; });
   const bright = Number(getComputedStyle(el.querySelector('.weather-lightning')!).opacity) > 0.3;
   if (bright && !previous) peaks.push(t);
   previous = bright;
  }
  return { peaks, maxPerSecond: Math.max(0, ...peaks.map(t => peaks.filter(p => p >= t && p < t + 1000).length)) };
 });
 await writeFile(test.info().outputPath('storm-flash.json'), JSON.stringify(result, null, 2));
 await test.info().attach('storm-flash-measurement', { body: JSON.stringify(result), contentType: 'application/json' });
 expect(result.peaks.length).toBeGreaterThan(0);
 expect(result.maxPerSecond).toBeLessThan(3);
});

for (const width of [390, 820, 1440]) {
 test(`weather control preserves home geometry at ${width}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const weather = page.getByTestId('about-weather');
  await expect(weather.getByText('12°C', { exact: true })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const measure = () => page.evaluate(() => {
   const ids = ['hero-banner','services-section','manifesto-section','proof-reel-section','home-about-teaser','home-cta-band','closer-section'];
   return { card: document.querySelector('[data-testid="about-weather"]')!.getBoundingClientRect().height,
    sections: Object.fromEntries(ids.map(id => {
     const node = document.querySelector(`[data-testid="${id}"]`)!;
     return [id, (node.closest('.home-section') ?? node).getBoundingClientRect().height];
    })), page: document.documentElement.scrollHeight };
  });
  await expect.poll(() => page.locator('.construction-extension').evaluate(el => el.getBoundingClientRect().height)).toBe(0);
  const visible = await measure();
  const control = weather.locator('.animation-control');
  await control.evaluate(el => { (el as HTMLElement).style.display = 'none'; });
  const hidden = await measure();
  expect(visible).toEqual(hidden);
  await control.evaluate(el => { (el as HTMLElement).style.display = ''; });
  expect(await measure()).toEqual(hidden);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(await weather.evaluate(el => el.getBoundingClientRect().height)).toBe(visible.card);
  await writeFile(test.info().outputPath('weather-layout.json'), JSON.stringify({width,visible,hidden}, null, 2));
 });
}
