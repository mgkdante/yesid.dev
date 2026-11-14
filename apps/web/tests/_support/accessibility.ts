import AxeBuilder from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

const decorative = '[data-decorative-edge]';
const focusable = 'a, button, input, select, textarea, summary, iframe, object, embed, [tabindex], [contenteditable]:not([contenteditable="false"]), audio[controls], video[controls], [role="button"], [role="link"]';

export async function expectDecorativeEdges(page: Page) {
 for (const edge of await page.locator(decorative).all()) {
  await expect(edge).toHaveAttribute('aria-hidden', 'true');
  expect(await edge.evaluate((node, selector) => node.matches(selector), focusable)).toBe(false);
  await expect(edge.locator(focusable)).toHaveCount(0);
 }
}

// WCAG 1.4.3 exempts pure decoration. Owner decision, 14 Nov 2026:
// quiet, aria-hidden manifesto edges are omitted from color-contrast only.
// Every other rule still checks them; meaningful text is never excluded.
export async function expectAccessible(page: Page, { include, exclude = [] }: { include?: string; exclude?: readonly string[] } = {}) {
 await expectDecorativeEdges(page);
 const scoped = () => {
  const builder = new AxeBuilder({ page });
  if (include) builder.include(include);
  for (const selector of exclude) builder.exclude(selector);
  return builder;
 };
 const main = await scoped().options({ rules: { 'color-contrast': { enabled: false }, 'label-content-name-mismatch': { enabled: true } } })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
 // Preserve the shared helper's existing blueprint-art exception.
 const contrast = await scoped().withRules(['color-contrast']).exclude('.blueprint-bg').exclude(decorative).analyze();
 const blocking = [...main.violations, ...contrast.violations].filter(v => v.impact === 'serious' || v.impact === 'critical');
 expect(blocking.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) }))).toEqual([]);
}
