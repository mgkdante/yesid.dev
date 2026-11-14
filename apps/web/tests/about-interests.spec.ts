import { test, expect, type Locator, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { aboutPageContent } from '../src/lib/content/about-page';
import { resolveLocale } from '../src/lib/utils/locale';
import { siteLabels } from '../src/lib/content/site-labels';

async function geometry(section: Locator) {
 return section.evaluate(node => {
  const box = node.getBoundingClientRect();
  return { height: box.height, width: box.width, next: document.querySelector('footer')!.getBoundingClientRect().top + scrollY, page: document.documentElement.scrollHeight };
 });
}

async function stableSelection(section: Locator, selected: number, before: Awaited<ReturnType<typeof geometry>>, reduced: boolean) {
 const photos = section.locator('button[aria-pressed]');
 await expect(section.getByRole('button', { pressed: true })).toHaveCount(1);
 await expect(photos.nth(selected)).toHaveAttribute('aria-pressed', 'true');
 await expect.poll(() => photos.evaluateAll(nodes => nodes.every(node => node.parentElement!.getAnimations().every(animation => animation.playState !== 'running')))).toBe(true);
 const boxes = await photos.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
 for (const [index, box] of boxes.entries()) {
  expect(box.width).toBeGreaterThanOrEqual(44); expect(box.height).toBeGreaterThanOrEqual(44);
  if (index !== selected) expect(boxes[selected].width).toBeGreaterThan(box.width + 1);
 }
 if (reduced) expect(await photos.evaluateAll(nodes => nodes.every(node => [node, node.parentElement!, ...node.querySelectorAll('*')].every(element => getComputedStyle(element).transitionDuration.split(',').every(value => parseFloat(value) === 0))))).toBe(true);
 const after = await geometry(section);
 for (const key of ['height', 'width', 'next', 'page'] as const) expect(Math.abs(after[key] - before[key]), `${key} stays stable`).toBeLessThanOrEqual(1);
 return after;
}

async function creditInteractions(page: Page, section: Locator, credit: string, touch: boolean, before: Awaited<ReturnType<typeof geometry>>) {
 const info = section.getByTestId('interest-credit-trigger');
 await expect(info).toHaveCount(1);
 expect(await info.evaluate(node => node.closest('[aria-pressed]'))).toBeNull();
 const box = await info.boundingBox(); expect(box!.width).toBeGreaterThanOrEqual(44); expect(box!.height).toBeGreaterThanOrEqual(44);
 const activate = async () => touch ? info.tap() : info.click();
 await info.focus(); await page.keyboard.press('Enter');
 const dialog = page.getByRole('dialog');
 await expect(dialog).toBeVisible(); await expect(dialog).toBeFocused();
 await expect(dialog).toHaveText(credit);
 expect(await dialog.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
 await expect(section.getByText(credit, { exact: true })).toHaveCount(0);
 expect((await new AxeBuilder({ page }).include('[data-testid="about-interests"]').include('[data-testid="interest-credit-box"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
 expect(await geometry(section)).toEqual(before);
 await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(info).toBeFocused();
 await activate(); await expect(dialog).toBeVisible(); await expect(dialog).toBeFocused();
 await activate(); await expect(dialog).toHaveCount(0); await expect(info).toBeFocused();
 await activate(); await expect(dialog).toBeVisible();
 if (touch) await section.getByRole('heading').tap(); else await section.getByRole('heading').click();
 await expect(dialog).toHaveCount(0); await expect(info).toBeFocused();
 expect(await geometry(section)).toEqual(before);
}

for (const locale of ['en', 'fr', 'es'] as const) for (const theme of ['dark', 'light']) for (const reduced of [false, true]) {
 test(`${locale} ${theme} ${reduced ? 'instant' : 'animated'} click selection and credit popover`, async ({ page }, testInfo) => {
  await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
  await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
  await page.goto(`${locale === 'en' ? '' : `/${locale}`}/about`);
  const section = page.getByTestId('about-interests'); await section.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  const photos = section.locator('button[aria-pressed]');
  for (const item of aboutPageContent.interests) await expect(section.getByRole('button', { name: resolveLocale(item.label, locale), exact: true })).toBeVisible();
  expect(await photos.evaluateAll(nodes => nodes.every(node => !node.hasAttribute('aria-label') && node.querySelectorAll('button').length === 0))).toBe(true);
  const before = await geometry(section); const measurements = [before];
  const transit = aboutPageContent.interests.findIndex(item => item.id === 'transit');
  const space = aboutPageContent.interests.findIndex(item => item.id === 'space');
  const food = aboutPageContent.interests.findIndex(item => item.id === 'food');
  measurements.push(await stableSelection(section, transit, before, reduced));
  await expect(page.getByText('Harrison Keely · CC BY 4.0', { exact: true })).toHaveCount(0);
  if (await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)) {
   await photos.first().hover(); measurements.push(await stableSelection(section, transit, before, reduced));
   await page.mouse.move(0, 0);
  }
  const activate = async (index: number) => testInfo.project.use.hasTouch ? photos.nth(index).tap() : photos.nth(index).click();
  for (const index of [0, 0, food, space, transit]) {
   await activate(index); measurements.push(await stableSelection(section, index, before, reduced));
   await expect(section.getByTestId('interest-credit-trigger')).toHaveCount(['transit', 'space'].includes(aboutPageContent.interests[index].id) ? 1 : 0);
  }
  await photos.first().focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
  await expect(photos.first()).toBeFocused(); expect(await photos.first().evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
  await page.keyboard.press('Enter'); measurements.push(await stableSelection(section, 0, before, reduced));
  await page.keyboard.press('Space'); measurements.push(await stableSelection(section, 0, before, reduced));
  await activate(transit); await stableSelection(section, transit, before, reduced);
  await expect(section.getByTestId('interest-credit-trigger')).toHaveAccessibleName(resolveLocale(siteLabels.a11y.photoCredit!, locale));
  await creditInteractions(page, section, 'Harrison Keely · CC BY 4.0', Boolean(testInfo.project.use.hasTouch), before);
  await activate(space); await stableSelection(section, space, before, reduced);
  await creditInteractions(page, section, 'NASA', Boolean(testInfo.project.use.hasTouch), before);
  await page.screenshot({ path: testInfo.outputPath('interests-restored.png') });
  await testInfo.attach('layout-measurements.json', { body: JSON.stringify(measurements), contentType: 'application/json' });
 });
}

for (const locale of ['en', 'fr', 'es'] as const) {
 test(`${locale} home teaser shares Transit selection and the sibling credit control`, async ({ page }, testInfo) => {
  await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(locale === 'en' ? '/' : `/${locale}`);
  const section = page.getByTestId('home-about-teaser').getByTestId('about-interests');
  await section.scrollIntoViewIfNeeded(); await page.evaluate(() => document.fonts.ready);
  const before = await geometry(section); const transit = aboutPageContent.interests.findIndex(item => item.id === 'transit');
  await stableSelection(section, transit, before, true);
  await creditInteractions(page, section, 'Harrison Keely · CC BY 4.0', Boolean(testInfo.project.use.hasTouch), before);
 });
}
