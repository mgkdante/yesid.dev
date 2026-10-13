import { test, expect } from '@playwright/test';
import { mockWeb3Forms, visibleContactTerminal } from './_support/helpers';

for (const locale of ['', '/fr', '/es'])
	for (const theme of ['light', 'dark']) {
		test(`contact content grows with the document: ${locale || 'en'} ${theme}`, async ({
			page,
		}) => {
			await page.setViewportSize({ width: 1280, height: 600 });
			await page.emulateMedia({
				reducedMotion: 'reduce',
				colorScheme: theme as 'light' | 'dark',
			});
			await page.goto(`${locale}/contact`);
			const terminal = visibleContactTerminal(page);
			await expect(terminal.getByTestId('contact-submit')).toBeEnabled();
			await page
				.getByTestId('contact-info-terminal')
				.filter({ visible: true })
				.locator('.terminal-body')
				.evaluate((body) => {
					const paragraph = document.createElement('p');
					paragraph.textContent =
						'Long translated information, with optional details and scheduling constraints. '.repeat(
							35,
						);
					body.append(paragraph);
				});
			for (const id of ['contact-info-terminal', 'contact-form-terminal']) {
				const body = page.getByTestId(id).filter({ visible: true }).locator('.terminal-body');
				expect(
					await body.evaluate((el) => el.scrollHeight - el.clientHeight),
					`${id} must not compress its content`,
				).toBeLessThanOrEqual(1);
			}
			for (const id of ['contact-submit', 'contact-booking-link']) {
				const control = terminal.getByTestId(id);
				await control.focus();
				await expect(control).toBeInViewport();
				const bounds = await control.boundingBox();
				expect(bounds!.y).toBeGreaterThanOrEqual(88);
				expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(600);
			}
			expect(await page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
			expect(
				await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
			).toBeLessThanOrEqual(1);
		});
	}

for (const theme of ['light', 'dark'])
	test(`desktop resizing preserves drafts, errors and intrinsic success: ${theme}`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 1366, height: 600 });
		await page.emulateMedia({
			reducedMotion: 'reduce',
			colorScheme: theme as 'light' | 'dark',
		});
		await mockWeb3Forms(page);
		await page.goto('/fr/contact');
		const terminal = visibleContactTerminal(page);
		const message = terminal.locator('textarea');
		await expect(terminal.getByTestId('contact-submit')).toBeEnabled();
		await message.fill('Un message conservé pendant le redimensionnement. '.repeat(12));
		await terminal.getByTestId('contact-submit').click();
		await expect(terminal.locator('[aria-invalid="true"]')).toHaveCount(2);
		const info = page.getByTestId('contact-info-terminal').filter({ visible: true });
		const before = (await info.boundingBox())!.width;
		const handle = page.locator('.contact-resize-handle');
		await handle.scrollIntoViewIfNeeded();
		const box = (await handle.boundingBox())!;
		await page.mouse.move(
			box.x + box.width / 2,
			Math.max(100, Math.min(350, box.y + box.height / 2)),
		);
		await page.mouse.down();
		await page.mouse.move(box.x - 120, Math.max(100, Math.min(350, box.y + box.height / 2)), {
			steps: 6,
		});
		await page.mouse.up();
		expect((await info.boundingBox())!.width).toBeLessThan(before - 50);
		await expect(message).toHaveValue(
			'Un message conservé pendant le redimensionnement. '.repeat(12),
		);
		await expect(terminal.locator('[aria-invalid="true"]')).toHaveCount(2);
		await terminal.locator('input[name="name"]').fill('Fixture Reader');
		await terminal.locator('input[name="email"]').fill('fixture@example.test');
		await terminal.getByTestId('contact-submit').click();
		await expect(terminal.getByTestId('contact-success')).toBeVisible();
		expect(
			await terminal.locator('.terminal-body').evaluate((el) => el.scrollHeight - el.clientHeight),
		).toBeLessThanOrEqual(1);
	});
