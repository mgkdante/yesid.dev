import { test, expect, type Locator } from '@playwright/test';
import { aboutPageContent } from '../src/lib/content/about-page';
import { resolveLocale } from '../src/lib/utils/locale';

async function renderedWords(label: Locator) {
	return label.evaluate(element => {
		const words: { word: string; lines: number; rects: { left: number; right: number; top: number; bottom: number }[] }[] = [];
		const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
		while (walker.nextNode()) {
			const node = walker.currentNode;
			for (const match of (node.textContent ?? '').matchAll(/\S+/gu)) {
				const range = document.createRange();
				range.setStart(node, match.index!);
				range.setEnd(node, match.index! + match[0].length);
				const rects = [...range.getClientRects()].filter(rect => rect.width > 0 && rect.height > 0);
				words.push({ word: match[0], lines: new Set(rects.map(rect => Math.round(rect.top * 2))).size,
					rects: rects.map(({ left, right, top, bottom }) => ({ left, right, top, bottom })) });
			}
		}
		return { words, fontSize: parseFloat(getComputedStyle(element).fontSize) };
	});
}

async function expectWholeLabels(section: Locator, locale: 'en' | 'fr' | 'es') {
	const frame = await section.boundingBox();
	for (const item of aboutPageContent.interests) {
		const name = resolveLocale(item.label, locale);
		const button = section.getByRole('button', { name, exact: true });
		const label = button.getByText(name, { exact: true });
		await expect(label).toBeVisible();
		const box = await button.boundingBox();
		expect(box!.x, `${name}: strip stays inside the card`).toBeGreaterThanOrEqual(frame!.x - 1);
		expect(box!.x + box!.width, `${name}: strip stays inside the card`).toBeLessThanOrEqual(frame!.x + frame!.width + 1);
		const { words, fontSize } = await renderedWords(label);
		expect(fontSize, `${name}: readable label size`).toBeGreaterThanOrEqual(12);
		expect(words.length).toBeGreaterThan(0);
		for (const word of words) {
			expect(word.lines, `${name}: "${word.word}" must not break inside the word`).toBe(1);
			for (const rect of word.rects) {
				expect(rect.left, `${name}: no left clipping`).toBeGreaterThanOrEqual(box!.x - 1);
				expect(rect.right, `${name}: no right clipping`).toBeLessThanOrEqual(box!.x + box!.width + 1);
				expect(rect.top, `${name}: no top clipping`).toBeGreaterThanOrEqual(box!.y - 1);
				expect(rect.bottom, `${name}: no bottom clipping`).toBeLessThanOrEqual(box!.y + box!.height + 1);
			}
		}
		expect(box!.width).toBeGreaterThanOrEqual(44);
		expect(box!.height).toBeGreaterThanOrEqual(44);
	}
}

test.describe('interests labels wrap only at spaces', { tag: '@theme' }, () => {
	for (const locale of ['en', 'fr', 'es'] as const) for (const width of [320, 360, 390, 820, 1440]) for (const placement of ['about', 'home']) {
		test(`${locale} ${width}px ${placement}: every complete label fits every selection`, async ({ page }, testInfo) => {
			await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
			await page.setViewportSize({ width, height: 900 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.addInitScript(() => document.addEventListener('themechange', () => performance.mark('label-wrap-mounted'), { once: true }));
			const prefix = locale === 'en' ? '' : `/${locale}`;
			await page.goto(placement === 'about' ? `${prefix}/about` : `${prefix}/`);
			await expect.poll(() => page.evaluate(() => performance.getEntriesByName('label-wrap-mounted').length)).toBe(1);
			const section = page.getByTestId('about-interests');
			await section.scrollIntoViewIfNeeded();
			await page.evaluate(() => document.fonts.ready);
			for (const image of await section.locator('img').all()) {
				await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
			}
			await section.screenshot({ path: testInfo.outputPath(`${process.env.LABEL_WRAP_CAPTURE ?? 'after'}-default-strip.png`) });
			try {
				await expectWholeLabels(section, locale);
				for (const item of aboutPageContent.interests) {
					await section.getByRole('button', { name: resolveLocale(item.label, locale), exact: true }).click();
					await expectWholeLabels(section, locale);
				}
			} finally {
				await section.screenshot({ path: testInfo.outputPath(`${process.env.LABEL_WRAP_CAPTURE ?? 'after'}-strip.png`) });
			}
		});
	}
});
