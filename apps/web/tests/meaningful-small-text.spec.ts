import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function contrast(text: Locator, base: Locator) {
	const background = await base.evaluate(node => getComputedStyle(node).backgroundColor);
	return text.evaluate((node, background) => {
		const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1;
		const context = canvas.getContext('2d')!;
		const pixel = () => [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
		context.fillStyle = background; context.fillRect(0, 0, 1, 1);
		context.fillStyle = getComputedStyle(node).backgroundColor; context.fillRect(0, 0, 1, 1);
		const surface = pixel();
		context.fillStyle = getComputedStyle(node).color; context.fillRect(0, 0, 1, 1);
		const ink = pixel();
		const luminance = (rgb: number[]) => rgb.map(n => n / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
		const values = [luminance(surface), luminance(ink)];
		return (Math.max(...values) + .05) / (Math.min(...values) + .05);
	}, background);
}

for (const width of [390, 1440]) for (const theme of ['dark', 'light']) {
	test(`${width}px ${theme}: meaningful text is readable and links stay accessible`, async ({ page }, testInfo) => {
		const measurements: { text: string; size: number; contrast: number }[] = [];
		await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
		await page.goto('/');
		const manifesto = page.getByTestId('manifesto-section');
		await manifesto.scrollIntoViewIfNeeded();
		for (const edge of ['left', 'right', 'top', 'bottom']) await expect(page.getByTestId(`manifesto-edge-${edge}`)).toHaveAttribute('aria-hidden', 'true');
		for (const link of await page.getByTestId('manifesto-pill').all()) {
			const size = await link.evaluate(node => parseFloat(getComputedStyle(node).fontSize));
			const ratio = await contrast(link, manifesto);
			measurements.push({ text: await link.innerText(), size, contrast: ratio });
			expect(size).toBeGreaterThanOrEqual(12);
			expect(ratio).toBeGreaterThanOrEqual(4.5);
			await expect(link).toHaveAccessibleName(/\S/);
			await link.focus(); await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
			await expect(link).toBeFocused();
			expect(await link.evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
		}
		await testInfo.attach('manifesto-accessibility.txt', { body: await manifesto.ariaSnapshot(), contentType: 'text/plain' });
		expect((await new AxeBuilder({ page }).withRules(['aria-hidden-focus']).analyze()).violations).toEqual([]);
		await page.screenshot({ path: testInfo.outputPath('home.png') });
		await page.goto('/about');
		const interests = page.getByTestId('about-interests');
		await interests.scrollIntoViewIfNeeded();
		for (const name of ['Harrison Keely · CC BY 4.0', 'NASA']) {
			const credit = interests.getByText(name, { exact: true });
			await expect(credit).toBeVisible();
			const size = await credit.evaluate(node => parseFloat(getComputedStyle(node).fontSize));
			const ratio = await contrast(credit, page.locator('body'));
			measurements.push({ text: name, size, contrast: ratio });
			expect(size).toBeGreaterThanOrEqual(12);
			expect(ratio).toBeGreaterThanOrEqual(4.5);
		}
		await page.screenshot({ path: testInfo.outputPath('about.png') });
		expect((await new AxeBuilder({ page }).withRules(['aria-hidden-focus']).analyze()).violations).toEqual([]);
		await testInfo.attach('small-text-measurements.json', { body: JSON.stringify(measurements), contentType: 'application/json' });
	});
}
