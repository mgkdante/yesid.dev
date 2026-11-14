import { test, expect, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { aboutPageContent } from '../src/lib/content/about-page';
import { resolveLocale } from '../src/lib/utils/locale';

async function geometry(section: Locator) {
	return section.evaluate(node => {
		const box = node.getBoundingClientRect();
		return { height: box.height, width: box.width, next: document.querySelector('[data-testid="about-polaroids-cell"]')!.getBoundingClientRect().top + scrollY, page: document.documentElement.scrollHeight };
	});
}

async function expectExpansion(section: Locator, selected: number, before: Awaited<ReturnType<typeof geometry>>, reduced: boolean) {
	const buttons = section.getByRole('button');
	await expect(buttons.filter({ has: section.page().locator('img') })).toHaveCount(aboutPageContent.interests.length);
	await expect(section.getByRole('button', { expanded: true })).toHaveCount(selected < 0 ? 0 : 1);
	if (selected >= 0) await expect(buttons.nth(selected)).toHaveAttribute('aria-expanded', 'true');
	if (selected >= 0) expect(await buttons.nth(selected).getByText((await buttons.nth(selected).getAttribute('aria-label'))!, { exact: true }).evaluate(node => node.scrollWidth <= node.clientWidth + 1 && node.scrollHeight <= node.clientHeight + 1), 'expanded caption is fully visible').toBe(true);
	if (reduced) {
		expect(await buttons.evaluateAll(nodes => nodes.every(node => getComputedStyle(node).transitionDuration.split(',').every(value => parseFloat(value) === 0) && node.getAnimations().length === 0))).toBe(true);
	} else {
		await expect.poll(() => buttons.evaluateAll(nodes => nodes.every(node => node.getAnimations().every(animation => animation.playState !== 'running')))).toBe(true);
	}
	const boxes = await buttons.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
	const frame = await section.boundingBox();
	for (const [index, box] of boxes.entries()) {
		expect(box.width).toBeGreaterThanOrEqual(44);
		expect(box.height).toBeGreaterThanOrEqual(44);
		expect(box.left).toBeGreaterThanOrEqual(frame!.x - 1);
		expect(box.right).toBeLessThanOrEqual(frame!.x + frame!.width + 1);
		if (selected >= 0 && index !== selected) expect(boxes[selected].width).toBeGreaterThan(box.width + 1);
	}
	const after = await geometry(section);
	expect(await buttons.evaluateAll(nodes => nodes.every(node => {
		const caption = node.querySelector('span')!.getBoundingClientRect();
		const description = node.getAttribute('aria-describedby');
		const credit = description ? document.getElementById(description)?.getBoundingClientRect() : null;
		return !credit || caption.bottom <= credit.top;
	})), 'interest captions do not overlap photo credits').toBe(true);
	for (const key of ['height', 'width', 'next', 'page'] as const) expect(Math.abs(after[key] - before[key]), `${key} stays stable`).toBeLessThanOrEqual(1);
	return after;
}

async function expectOriginalColors(section: Locator) {
	for (const image of await section.locator('img').all()) {
		await expect.poll(() => image.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true);
		expect(await image.evaluate(node => {
			let element: Element | null = node;
			while (element) {
				const style = getComputedStyle(element);
				if (style.filter !== 'none' || style.mixBlendMode !== 'normal') return false;
				if (element.tagName === 'BUTTON') break;
				element = element.parentElement;
			}
			return true;
		})).toBe(true);
	}
}

for (const locale of ['en', 'fr', 'es'] as const) for (const theme of ['dark', 'light']) for (const reduced of [false, true]) {
	test(`${locale} ${theme} ${reduced ? 'instant' : 'animated'} interests keep color, targets and layout`, async ({ page }, testInfo) => {
		await page.route(/web3forms|cal\.com|plausible|\/api\/event/, route => route.abort());
		await page.emulateMedia({ reducedMotion: reduced ? 'reduce' : 'no-preference' });
		await page.addInitScript(theme => localStorage.setItem('theme', theme), theme);
		await page.goto(`${locale === 'en' ? '' : `/${locale}`}/about`);
		const section = page.getByTestId('about-interests');
		await section.scrollIntoViewIfNeeded();
		await page.evaluate(() => document.fonts.ready);
		const buttons = section.getByRole('button');
		for (const interest of aboutPageContent.interests) await expect(section.getByRole('button', { name: resolveLocale(interest.label, locale), exact: true })).toBeVisible();
		const transit = aboutPageContent.interests.find(interest => interest.id === 'transit')!;
		await expect(section.getByRole('button', { name: resolveLocale(transit.label, locale), exact: true })).toHaveAccessibleDescription('Harrison Keely · CC BY 4.0');
		await expectOriginalColors(section);
		const before = await geometry(section);
		const measurements = [before];
		const activate = async (index: number) => testInfo.project.use.hasTouch ? buttons.nth(index).tap() : buttons.nth(index).click();
		if (await page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine)').matches)) {
			await buttons.first().hover();
			measurements.push(await expectExpansion(section, 0, before, reduced));
			await page.mouse.move(0, 0);
			await expectExpansion(section, -1, before, reduced);
		}
		for (const [index, open] of [[0, 0], [1, 1], [1, -1]] as const) {
			await activate(index);
			measurements.push(await expectExpansion(section, open, before, reduced));
		}
		await page.mouse.move(0, 0);
		await buttons.first().focus();
		await page.keyboard.press('Tab'); await page.keyboard.press('Shift+Tab');
		await expect(buttons.first()).toBeFocused();
		expect(await buttons.first().evaluate(node => getComputedStyle(node).outlineStyle)).not.toBe('none');
		for (const [key, open] of [['Enter', 0], ['Space', -1]] as const) {
			await page.keyboard.press(key);
			measurements.push(await expectExpansion(section, open, before, reduced));
		}
		expect((await new AxeBuilder({ page }).include('[data-testid="about-interests"]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
		await expectOriginalColors(section);
		for (const name of ['Harrison Keely · CC BY 4.0', 'NASA']) {
			const credit = section.getByText(name, { exact: true });
			await expect(credit).toBeVisible();
			expect(await credit.evaluate(node => parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(12);
		}
		await activate(2);
		measurements.push(await expectExpansion(section, 2, before, reduced));
		await page.screenshot({ path: testInfo.outputPath('interests-expanded.png') });
		await testInfo.attach('layout-measurements.json', { body: JSON.stringify(measurements), contentType: 'application/json' });
	});
}
