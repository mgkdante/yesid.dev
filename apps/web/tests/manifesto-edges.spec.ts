import { test, expect } from '@playwright/test';
import { expectDecorativeEdges } from './_support/accessibility';

// Explicit viewport/locale/theme matrix, run once in the desktop project.
test.skip(({ viewport }) => viewport?.width !== 1440, 'Explicit edge geometry matrix runs in desktop.');
for (const locale of ['', 'fr', 'es']) for (const width of [320, 360, 390, 820, 1024, 1440, 1920]) for (const theme of ['dark', 'light']) {
 test(`${locale || 'en'} ${width} ${theme}: decorative edges stay noninteractive and clear of content`, async ({ page }, info) => {
  await page.route(/web3forms|cal\.com|plausible|\/api\/event/, r => r.abort());
  await page.addInitScript(t => localStorage.setItem('theme', t), theme);
  await page.setViewportSize({ width, height: 900 });
  await page.goto('/' + locale);
  await page.evaluate(() => document.fonts.ready);
  const edge = page.getByTestId('manifesto-edge-right');
  await expect(edge).toHaveAttribute('data-placed', 'true');
  await expect(page.locator('[data-decorative-edge]')).not.toHaveCount(0);
  await expectDecorativeEdges(page);
  const samples = [];
  for (const height of [640, 900]) for (const reducedMotion of ['reduce', 'no-preference'] as const) {
   await page.setViewportSize({ width, height });
   await page.emulateMedia({ reducedMotion });
   await page.getByTestId('manifesto-section').scrollIntoViewIfNeeded();
   await expect.poll(async () => edge.evaluate(node => {
    const box = node.getBoundingClientRect();
    const overlaps = (other: DOMRect) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top;
    const obstacles = [...document.querySelectorAll('[data-testid="manifesto-prompt"], .manifesto__statement, [data-testid="manifesto-line-huge"], [data-testid="manifesto-pill"], [data-testid="manifesto-edge-bottom"]')];
    const section = node.parentElement!.getBoundingClientRect();
    return getComputedStyle(node).visibility === 'visible' && box.width > 0 && box.left >= section.left && box.right <= section.right && box.top >= section.top && box.bottom <= section.bottom && obstacles.every(el => !overlaps(el.getBoundingClientRect()));
   })).toBe(true);
   samples.push(await edge.evaluate(node => ({ box: node.getBoundingClientRect().toJSON(), text: node.textContent })));
  }
  await info.attach('edge-geometry', { body: JSON.stringify(samples), contentType: 'application/json' });
 });
}
