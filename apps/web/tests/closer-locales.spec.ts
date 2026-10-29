import { expect, test } from '@playwright/test';
import { DEFAULT_LOCALE } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';
import { THE_END } from '../src/lib/components/home/annotation-lettering';
import { closerContent } from '../src/lib/content/site-content';
import { resolveLocale } from '../src/lib/utils/locale';

for (const locale of PUBLISHED_LOCALES) {
	test(`${locale} closer is readable without JavaScript in normal motion`, async ({ browser, baseURL }) => {
		const context = await browser.newContext({ baseURL, javaScriptEnabled: false, reducedMotion: 'no-preference' });
		const page = await context.newPage();
		try {
			await page.goto(locale === DEFAULT_LOCALE ? '/' : '/' + locale);
			const note = page.getByRole('img', { name: THE_END[locale], exact: true });
			await note.scrollIntoViewIfNeeded();
			expect(await note.locator('path').evaluateAll(paths => paths.every(path => getComputedStyle(path).visibility === 'visible' && getComputedStyle(path).strokeDashoffset === '0px'))).toBe(true);
		} finally { await context.close(); }
	});

	test(locale + ' closer lettering and navigation survive failed decorative requests', async ({ page }) => {
		const requests: string[] = [];
		page.on('request', request => { if (request.url().includes('/svg/graffiti/')) requests.push(request.url()); });
		await page.route('**/svg/**', route => route.abort());
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(locale === DEFAULT_LOCALE ? '/' : '/' + locale);
		const note = page.getByRole('img', { name: THE_END[locale], exact: true });
		await note.scrollIntoViewIfNeeded();
		await expect(note).toBeVisible();
		expect(await note.locator('path').evaluateAll(paths => paths.every(path => getComputedStyle(path).strokeDashoffset === '0px' && getComputedStyle(path).animationName === 'none'))).toBe(true);
		await expect(page.getByRole('link', { name: resolveLocale(closerContent.cta.label, locale) })).toHaveAttribute('href', closerContent.cta.href);
		expect(requests).toEqual([]);
	});
}
