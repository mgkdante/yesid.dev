import { test, expect, type Page } from '@playwright/test';

test.skip(({ viewport }) => viewport!.width < 1024, 'Desktop composition or viewport-independent.');

const PROJECT_PATH = '/projects/yesid-dev';
const TOLERANCE_PX = 2;

async function settleScroll(page: Page) {
	let last = -1;
	await expect
		.poll(
			async () => {
				const current = await page.evaluate(() => window.scrollY);
				const difference = Math.abs(current - last);
				last = current;
				return difference;
			},
			{ intervals: [100, 100, 100] },
		)
		.toBeLessThan(0.5);
}

test.describe('native fragment clearance', () => {
	test.use({ javaScriptEnabled: false });
	for (const [width, height, pillBottom, landing] of [
		[320, 568, 76, 92],
		[480, 667, 80, 96],
		[1280, 600, 88, 104],
	]) {
		test(`fixture heading lands below the ${width}px pill`, async ({ page }) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
			await page.setViewportSize({ width, height });
			await page.route('**/legal/privacy', async (route) => {
				const response = await route.fetch();
				const html = (await response.text()).replace(
					/<main\b([^>]*)>[\s\S]*?<\/main>/,
					'<main$1><div style="height:1200px"></div><h2 id="fixture-anchor">A controlled heading</h2><div style="height:2000px"></div></main>',
				);
				await route.fulfill({ response, body: html });
			});
			await page.goto('/legal/privacy#fixture-anchor');
			await page.evaluate(() => document.fonts.ready);
			await expect
				.poll(async () => (await page.locator('#fixture-anchor').boundingBox())!.y)
				.toBeLessThanOrEqual(landing + TOLERANCE_PX);
			const heading = await page.locator('#fixture-anchor').boundingBox();
			const pill = await page.getByTestId('nav-pill').boundingBox();
			expect(pill!.y + pill!.height).toBeCloseTo(pillBottom, 0);
			expect(heading!.y).toBeGreaterThanOrEqual(landing - TOLERANCE_PX);
			expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
		});
	}
});

test.describe('desktop table of contents', () => {
	for (const expanded of [true, false])
		test(`TOC opens and lands a tall card's heading, initially expanded=${expanded}`, async ({ page }) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
			await page.setViewportSize({ width: 1366, height: 600 });
			await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(PROJECT_PATH);
			const target = page.locator('[data-section-index]').nth(1);
			const heading = target.locator('.section-header').first();
			await expect(heading).toBeVisible();
			await target
				.locator('.section-body:not([data-slot="collapsible-content"])')
				.first()
				.evaluate((el) => {
					const text = document.createElement('p');
					text.textContent = 'Long fixture paragraph. '.repeat(500);
					el.append(text);
				});
			{
				await expect(async () => {
					if ((await heading.getAttribute('aria-expanded')) !== String(expanded))
						await heading.click();
					await expect(heading).toHaveAttribute('aria-expanded', String(expanded));
				}).toPass();
			}
			await page.evaluate(() => window.scrollTo(0, 0));
			const toc = page.locator('.toc-column .toc-nav > button.toc-item:not(.toc-sub-item)').nth(1);
			await expect(async () => {
				await toc.click();
				await settleScroll(page);
				expect((await target.boundingBox())!.y).toBeCloseTo(600 * 0.25, 0);
				const box = await heading.boundingBox();
				expect(box!.y).toBeGreaterThanOrEqual(88);
				expect(box!.y + box!.height).toBeLessThan(600);
			}).toPass();
			await expect(heading).toHaveAttribute('aria-expanded', 'true');
		});
});

test('a fragment opens its owning content and lands the nested heading', async ({
	page,
}) => {
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
	await page.setViewportSize({ width: 1366, height: 600 });
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(PROJECT_PATH);
	const target = page.locator('[data-section-index]').nth(1);
	const trigger = target.locator('.section-header').first();
	await expect(async () => {
		if ((await trigger.getAttribute('aria-expanded')) === 'false') await trigger.press('Enter');
		await expect(trigger).toHaveAttribute('aria-expanded', 'true', {
			timeout: 1000,
		});
	}).toPass();
	await trigger.press('Space');
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await target
		.locator('.section-body:not([data-slot="collapsible-content"])')
		.first()
		.evaluate((el) => {
			const heading = document.createElement('h3');
			heading.id = 'fixture-fragment';
			heading.textContent = 'Nested fixture heading';
			el.append(heading);
			const link = document.createElement('a');
			link.href = '#fixture-fragment';
			link.textContent = 'Open fixture fragment';
			link.style.cssText = 'position:fixed;bottom:100px;right:30px;z-index:200';
			el.closest('[data-slot="detail-shell"]')!.prepend(link);
		});
	await page.getByRole('link', { name: 'Open fixture fragment' }).click();
	await expect(page).toHaveURL(/#fixture-fragment$/);
	await settleScroll(page);
	await expect.poll(async () => (await page.locator('#fixture-fragment').boundingBox())!.y).toBeCloseTo(600 * 0.25, 0);
	await expect(trigger).toHaveAttribute('aria-expanded', 'true');
	await page.evaluate(() => {
		window.scrollBy(0, 240);
		const link = document.createElement('a');
		link.href = '/projects';
		link.textContent = 'Fixture return to listing';
		link.style.cssText = 'position:fixed;bottom:100px;right:30px;z-index:200';
		document.body.append(link);
	});
	await page.getByRole('link', { name: 'Fixture return to listing' }).click();
	await expect(page).toHaveURL(/\/projects$/);
	await page.goBack();
	await expect(page).toHaveURL(/#fixture-fragment$/);
	// Back remounts the page at its declared disclosure default. The injected heading is gone.
	await expect(trigger).toHaveAttribute('aria-expanded', 'false');
	await page.goForward();
	await expect(page).toHaveURL(/\/projects$/);
});

test('Back restores the project reading position after visiting the listing', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto(PROJECT_PATH);
	await expect(page.locator('.section-header').first()).toHaveAttribute('aria-expanded', 'true');
	await page.evaluate(() => document.fonts.ready);
	await page.evaluate(() => {
		window.scrollTo(0, 1400);
		const link = document.createElement('a');
		link.href = '/projects';
		link.textContent = 'Fixture visit listing';
		link.style.cssText = 'position:fixed;bottom:100px;right:30px;z-index:200';
		document.body.append(link);
	});
	await settleScroll(page);
	// Capture in the same task as navigation, after any focus/scroll settling.
	const beforeLeaving = await page.getByRole('link', { name: 'Fixture visit listing' }).evaluate((link) => {
		const y = window.scrollY;
		(link as HTMLAnchorElement).click();
		return y;
	});
	expect(beforeLeaving).toBeGreaterThan(0);
	await expect(page).toHaveURL(/\/projects$/);
	await page.goBack();
	await expect(page).toHaveURL(/\/projects\/yesid-dev$/);
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBeCloseTo(beforeLeaving, 0);
});
