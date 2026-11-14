import { readRunningAnimations, shared, weather, unexpectedLoops, unexpectedFinite } from './_support/motion-inventory';
import { writeFileSync } from 'node:fs';
import { test, expect } from '@playwright/test';
import { fixturePostPath, fixtureProject, fixtureService } from './_support/content-fixtures';
import { sitePages } from '../src/lib/content/site-pages';

const paths = ['/', '/about', '/services', `/services/${fixtureService.id}`, '/projects', `/projects/${fixtureProject.slug}`, '/blog', '/blog/personal', fixturePostPath('en'), '/contact', ...sitePages.filter(p => p.path.startsWith('/legal/')).map(p => p.path), '/dev-27-missing'];
const routes = [...paths, ...(['fr', 'es'] as const).flatMap(locale => [`/${locale}`, `/${locale}/about`, `/${locale}/contact`, fixturePostPath(locale)])];
// Pending Y-30: ErrorIllustration, StopLabel, TerminalCursor, MetroStation,
// gradient Separator and StatusDot. No product overrides of shared internals.
const normalize = (name: string) => name.replace(/^svelte-[^-]+-/, '');

for (const width of [390, 1440]) for (const path of routes) {
 test(`${path} motion inventory ${width}`, async ({ page }, info) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.route(/plausible|google-analytics|calendly|web3forms|\/api\/contact/, route => route.abort());
  const response = await page.goto(path);
  expect(response?.status()).toBe(path.includes('dev-27-missing') ? 404 : 200);
  await expect(page.locator('main')).toBeVisible();
  const samples = [];
  for (const fraction of [0, 0.35, 0.7, 1]) {
   await page.evaluate(f => window.scrollTo(0, (document.documentElement.scrollHeight - innerHeight) * f), fraction);
   await page.waitForTimeout(750);
   const animations = await page.evaluate(readRunningAnimations);
   samples.push({ animations, ...await page.evaluate(() => {
    const describe = (el: Element | null) => el ? `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.getAttribute('data-slot') ? '[data-slot=' + el.getAttribute('data-slot') + ']' : ''}.${el.getAttribute('class') ?? ''}` : 'unknown';
    return {
     css: [...document.querySelectorAll('*')].flatMap(el => ['', '::before', '::after'].flatMap(pseudo => { const s = getComputedStyle(el, pseudo || null); return s.animationName === 'none' ? [] : [{ target: describe(el) + pseudo, name: s.animationName, iterations: s.animationIterationCount, state: s.animationPlayState }]; })),
     dots: [...document.querySelectorAll('[data-slot="status-dot"], [data-slot="stop-label"], [class*="cursor"], [class*="dot"], [class*="signal"], [class*="light-"], [data-construction-prop]')].map(describe),
    };
   }) });
  }
  writeFileSync(info.outputPath('inventory.json'), JSON.stringify({ path, width, samples }, null, 2));
  await info.attach('motion-inventory', { body: JSON.stringify({ path, width, samples }, null, 2), contentType: 'application/json' });
  await page.screenshot({ path: info.outputPath('page.png'), fullPage: true });
  if (!process.env.DEV27_AUDIT_ONLY) {
   const unexpected = unexpectedLoops(samples.flatMap(s => s.animations));
   expect(unexpected).toEqual([]);
   await expect(page.locator('.manifesto__flow-line, .manifesto__flow-line-v')).toHaveCount(0);
   const cssLoops = samples.flatMap(s => s.css).filter(a => a.iterations.split(',').some(n => n.trim() === 'infinite'));
   expect(cssLoops.filter(a => !(weather.test(normalize(a.name)) && /weather-/.test(a.target))
    && !(shared.test(normalize(a.name)) && /stop-label|terminal-signal|status-dot|light-a|light-b|terminal-cursor|metro-station|separator/.test(a.target)))).toEqual([]);
   const finite = unexpectedFinite(samples.flatMap(s => s.animations));
   expect(finite).toEqual([]);
   expect(samples.flatMap(s => s.animations).some(a => /train-bob/.test(a.name))).toBe(false);
   expect(await page.locator('main .terminal-cursor').count()).toBe(path.includes('dev-27-missing') ? 1 : 0);
  }
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await page.screenshot({ path: info.outputPath('light.png'), fullPage: true });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).map(a => (a as CSSAnimation).animationName))).toEqual([]);
 });
}
