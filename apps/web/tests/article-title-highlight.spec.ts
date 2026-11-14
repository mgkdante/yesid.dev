import { test, expect } from '@playwright/test';
import { blogPosts } from '../src/lib/content/blog';

test('article titles keep their text and one ink colour in both themes and sizes', async ({ page }, testInfo) => {
	await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
	await page.emulateMedia({ reducedMotion: 'reduce' });
	const tools = blogPosts.find(post => post.lang === 'en' && /brain.*tools/i.test(post.title))!;
	await page.goto(`/blog/${tools.slug}`);
	const alternates = await page.locator('link[rel="alternate"][hreflang]').evaluateAll(nodes =>
		nodes.map(node => ({ lang: node.getAttribute('hreflang'), path: new URL((node as HTMLLinkElement).href).pathname })));
	for (const lang of ['en', 'fr', 'es']) {
		const alternate = alternates.find(item => item.lang === lang)!;
		expect(alternate).toBeDefined();
		const post = blogPosts.find(item => item.translationKey === tools.translationKey && item.lang === lang)!;
		for (const width of [390, 1440]) for (const theme of ['dark', 'light']) {
			await page.setViewportSize({ width, height: 900 });
			await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
			await page.goto(alternate.path);
			const heading = page.getByRole('heading', { level: 1 });
			await expect(heading).toHaveText(post.title);
			await page.evaluate(() => document.fonts.ready);
			await page.screenshot({ path: testInfo.outputPath(`${lang}-${width}-${theme}.png`) });
			const colours = await heading.evaluate(element => [...element.querySelectorAll('*')].map(child => getComputedStyle(child).color).concat(getComputedStyle(element).color));
			expect(new Set(colours).size).toBe(1);
		}
	}
	const other = blogPosts.find(post => post.lang === 'en' && post.translationKey !== tools.translationKey)!;
	await page.goto(`/blog/${other.slug}`);
	await expect(page.getByRole('heading', { level: 1 })).toHaveText(other.title);
});
