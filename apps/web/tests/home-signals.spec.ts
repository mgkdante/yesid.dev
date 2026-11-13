import { test, expect } from '@playwright/test';
import contract from '../../../contracts/kpis-v1.examples.json' with { type: 'json' };

test.beforeEach(async ({ page }) => {
 await page.route(/plausible|google-analytics|calendly|\/api\/contact/, route => route.abort());
});

for (const locale of ['', 'fr/', 'es/']) {
 test(`honest home states ${locale || 'en'}`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addInitScript(() => Object.defineProperty(navigator, 'webdriver', { get: () => sessionStorage.getItem('forceDemo') === 'true' }));
  let failing = false;
  await page.route('https://transit.yesid.dev/api/v1/kpis', route => failing
   ? route.fulfill({ status: 503, body: '' })
   : route.fulfill({ json: contract.examples[1].body }));
  await page.goto(`/${locale}`);
  const panel = page.getByTestId('sql-panel').filter({ visible: true });
  await expect(panel).toHaveAttribute('data-state', 'live');
  await page.screenshot({ path: test.info().outputPath('live-after.png') });
  failing = true;
  await page.getByTestId('hero-refresh').click();
  await expect(panel).toHaveAttribute('data-state', 'held');
  await page.getByTestId('hero-refresh').click();
  await expect(panel).toHaveAttribute('data-state', 'failure');
  await expect(panel.locator('[data-testid="status-dot"]')).toHaveCount(0);
  await page.evaluate(() => sessionStorage.setItem('forceDemo', 'true'));
  await page.reload();
  await expect(panel).toHaveAttribute('data-state', 'demo');
  await page.screenshot({ path: test.info().outputPath('demo-after.png') });
  await expect(panel.locator('[data-testid="status-dot"]')).toHaveCount(0);
 });
}

test('home animation inventory respects the removal boundary', async ({ page }) => {
 await page.goto('/');
 const inventory = await page.evaluate(() => document.getAnimations().filter(a =>
  a.effect?.getTiming().iterations === Infinity).map(a => ({
   name: (a as CSSAnimation).animationName,
   target: ((a.effect as KeyframeEffect).target as Element)?.outerHTML.slice(0, 180)
  })));
 await test.info().attach('animation-inventory', { body: JSON.stringify(inventory, null, 2), contentType: 'application/json' });
 // TerminalPanel's shared lamp is explicitly reserved for DEV-7's package upgrade.
 expect(inventory.filter(a => /hero-dot|blink|typewriter/.test(a.name))).toEqual([]);
 await page.emulateMedia({ reducedMotion: 'reduce' });
 await expect.poll(() => page.evaluate(() => document.getAnimations().filter(a =>
  a.playState === 'running' && a.effect?.getTiming().iterations === Infinity).length)).toBe(0);
});
