import { expect, test } from '@playwright/test';
import { DEFAULT_LOCALE } from '../src/lib/utils/locale';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';

const sections = [
	'hero-banner', 'services-section', 'manifesto-section', 'proof-reel-section',
	'home-about-teaser', 'home-cta-band', 'closer-section',
];

for (const locale of PUBLISHED_LOCALES) {
	test(`${locale} homepage follows the owner's section and keyboard order`, async ({ page }) => {
		await page.goto(locale === DEFAULT_LOCALE ? '/' : `/${locale}`);
		const content = page.locator(sections.map(id => `[data-testid="${id}"]`).join(', '));
		await expect(content).toHaveCount(7);
		expect(await content.evaluateAll(nodes => nodes.map(node => node.getAttribute('data-testid')))).toEqual(sections);
		const bounds = await content.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
		for (let i = 1; i < bounds.length; i++) {
			expect(bounds[i].top, `${sections[i]} follows ${sections[i - 1]} visually`).toBeGreaterThanOrEqual(bounds[i - 1].bottom - 1);
		}
		const titles = page.locator('.rotated-title');
		expect(await titles.evaluateAll(nodes => nodes.map(node => node.classList.contains('rotated-title--right') ? 'right' : 'left'))).toEqual(['right', 'left', 'right', 'left']);
		await expect(page.getByTestId('closer-section').locator('[data-construction-prop]')).toHaveCount(4);
		// Check real sequential focus across each moved boundary, including the CTA after About.
		for (let i = 1; i < sections.length; i++) {
			const previous = page.getByTestId(sections[i - 1]).locator('a[href], button:not([disabled]), [tabindex="0"]').filter({ visible: true }).last();
			const next = page.getByTestId(sections[i]).locator('a[href], button:not([disabled]), [tabindex="0"]').filter({ visible: true }).first();
			await previous.focus();
			await page.keyboard.press('Tab');
			await expect(next).toBeFocused();
		}
		expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
	});
}

test('manifesto scrub follows its new position down, up and after a mid-page reload', async ({ page }) => {
	await page.goto('/');
	const statement = page.getByTestId('manifesto-text');
	const scaleAt = async (progress: number) => {
		await page.getByTestId('manifesto-section').evaluate((section, progress) => {
			const box = section.getBoundingClientRect();
			window.scrollTo({ top: scrollY + box.top - innerHeight + progress * (box.height + innerHeight), behavior: 'instant' });
		}, progress);
		const expected = 0.85 + Math.sin(progress * Math.PI) * 0.15;
		await expect.poll(() => statement.evaluate(node => Number(getComputedStyle(node).scale))).toBeCloseTo(expected, 2);
	};
	for (const progress of [0.1, 0.5, 0.9, 0.5, 0.1, 0.5]) await scaleAt(progress);
	const scrollBeforeReload = await page.evaluate(() => scrollY);
	expect(scrollBeforeReload).toBeGreaterThan(0);
	await page.reload();
	await expect.poll(() => page.evaluate(before => Math.abs(scrollY - before), scrollBeforeReload)).toBeLessThanOrEqual(2);
	await expect.poll(() => statement.evaluate(node => {
		const section = node.closest('section')!;
		const box = section.getBoundingClientRect();
		const progress = Math.min(1, Math.max(0, (innerHeight - box.top) / (box.height + innerHeight)));
		return Math.abs(Number(getComputedStyle(node).scale) - (0.85 + Math.sin(progress * Math.PI) * 0.15));
	})).toBeLessThan(0.01);
});

test('reduced motion keeps the new homepage order and manifesto readable @motion', async ({ page }) => {
	await page.goto('/');
	expect(await page.locator(sections.map(id => `[data-testid="${id}"]`).join(', ')).evaluateAll(nodes => nodes.map(node => node.getAttribute('data-testid')))).toEqual(sections);
	await page.getByTestId('manifesto-section').scrollIntoViewIfNeeded();
	await expect(page.getByTestId('manifesto-text')).toHaveCSS('scale', '1');
	await page.getByTestId('closer-section').scrollIntoViewIfNeeded();
	await expect(page.getByTestId('closer-cta')).toBeVisible();
	expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(1);
});
