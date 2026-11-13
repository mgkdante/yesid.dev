import { test, expect } from '@playwright/test';
import { visibleContactTerminal } from './_support/helpers';

for (const locale of ['', '/fr', '/es']) {
  for (const width of [390, 1440]) {
    test(`contact accessible outcomes ${locale || 'en'} ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.route('**/*', route => {
        const url = new URL(route.request().url());
        return url.hostname === 'localhost' || url.hostname === '127.0.0.1'
          ? route.continue() : route.abort();
      });
      let finish: (() => void) | undefined;
      await page.route('https://api.web3forms.com/submit', async route => {
        await new Promise<void>(resolve => { finish = resolve; });
        await route.fulfill({ json: { success: true } });
      });
      await page.goto(`${locale}/contact`);
      const terminal = visibleContactTerminal(page);
      const submit = terminal.getByTestId('contact-submit');
      await expect(submit).toBeEnabled();
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
      const inputs = terminal.getByRole('textbox');
      await expect(inputs.nth(0)).toHaveAttribute('autocomplete', 'name');
      await expect(inputs.nth(1)).toHaveAttribute('autocomplete', 'email');
      await page.getByRole('status').evaluate(el => {
        const messages: string[] = [];
        new MutationObserver(() => {
          if (el.textContent?.trim()) messages.push(el.textContent.trim());
          el.setAttribute('data-announcements', JSON.stringify(messages));
        }).observe(el, { childList: true, characterData: true, subtree: true });
      });
      await submit.focus();
      await page.keyboard.press('Enter');
      const summary = terminal.getByTestId('contact-error-summary');
      await expect(summary).toBeFocused();
      await expect(terminal.locator('[aria-invalid="true"]')).toHaveCount(3);
      for (const link of await summary.getByRole('link').all()) {
        const box = await link.boundingBox();
        expect(box!.height).toBeGreaterThanOrEqual(44);
        expect(box!.width).toBeGreaterThanOrEqual(44);
      }
      await summary.getByRole('link').first().press('Enter');
      await expect(inputs.nth(0)).toBeFocused();
      await page.keyboard.type('Fixture Reader');
      await page.keyboard.press('Tab');
      await page.keyboard.type('bad-address');
      await page.keyboard.press('Tab');
      await page.keyboard.type('A fixture message.');
      await submit.press('Enter');
      await expect(summary).toBeFocused();
      await expect(inputs.nth(1)).toHaveAttribute('aria-invalid', 'true');
      await inputs.nth(1).fill('reader@example.test');
      await submit.press('Enter');
      await expect(page.getByRole('status')).toContainText(/\S/);
      const sending = await page.getByRole('status').innerText();
      await expect.poll(() => Boolean(finish)).toBe(true);
      finish!();
      await expect(terminal.getByTestId('contact-success')).toBeVisible();
      await expect(page.getByRole('status')).not.toHaveText(sending);
      await expect(page.getByRole('status')).toHaveAttribute('data-announcements', JSON.stringify([sending, (await page.getByRole('status').innerText()).trim()]));
      await terminal.getByTestId('contact-reset').click();
      await inputs.nth(0).fill('Fixture Reader');
      await inputs.nth(1).fill('reader@example.test');
      await inputs.nth(2).fill('Draft retained on network failure');
      await page.route('https://api.web3forms.com/submit', route => route.abort());
      await submit.press('Enter');
      await expect(summary).toBeFocused();
      await expect(summary).toContainText(/\S/);
      await expect(inputs.nth(2)).toHaveValue('Draft retained on network failure');
      await expect(page.getByRole('status')).toBeEmpty();
    });
  }
}

for (const theme of ['dark', 'light']) {
  test(`contact field contrast and focus ${theme}`, async ({ page }) => {
    await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
    await page.route('https://**/*', route => route.abort());
    await page.goto('/contact');
    const terminal = visibleContactTerminal(page);
    await expect(terminal.getByTestId('contact-submit')).toBeEnabled();
    const input = terminal.getByRole('textbox').first();
    await input.focus();
    const colors = await input.evaluate(el => {
      const style = getComputedStyle(el);
      return { border: style.borderTopColor, background: style.backgroundColor, outline: style.outlineStyle, width: style.outlineWidth };
    });
    const luminance = (rgb: string) => {
      const channels = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map(v => {
        const c = v / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const a = luminance(colors.border), b = luminance(colors.background);
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(3);
    expect(colors.outline).toBe('solid');
    expect(parseFloat(colors.width)).toBeGreaterThanOrEqual(2);
  });
}

test('contact without JavaScript offers direct email', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route('https://**/*', route => route.abort());
  await page.goto(`${baseURL}/fr/contact`);
  await expect(visibleContactTerminal(page).getByRole('link', { name: 'contact@yesid.dev', exact: true })).toBeVisible();
  expect(await visibleContactTerminal(page).getByRole('link', { name: 'contact@yesid.dev', exact: true }).evaluate(el => el.parentElement?.textContent)).toContain('Ce formulaire nécessite JavaScript.');
  await expect(visibleContactTerminal(page).getByTestId('contact-submit')).toBeDisabled();
  await context.close();
});
