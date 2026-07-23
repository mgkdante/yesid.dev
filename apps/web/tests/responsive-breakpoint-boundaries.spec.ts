import { expect, test, type Page } from '@playwright/test';

test.use({ colorScheme: 'dark' });

async function settleLayout(page: Page) {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) =>
				requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
			),
	);
}

async function responsiveState(page: Page) {
	return page.evaluate(() => {
		const nav = document.querySelector<HTMLElement>('[data-testid="nav-pill"]')!;
		const reel = document.querySelector<HTMLElement>('.embla')!;
		const slide = document.querySelector<HTMLElement>('.embla__slide')!;
		const rotatedTitle = document.querySelector<HTMLElement>('.rotated-title')!;
		const section = document.querySelector<HTMLElement>('.home-section--left')!;
		return {
			navPaddingInline: getComputedStyle(nav).paddingInline,
			slideRatio: slide.getBoundingClientRect().width / reel.getBoundingClientRect().width,
			rotatedTitleDisplay: getComputedStyle(rotatedTitle).display,
			gridTracks: getComputedStyle(section).gridTemplateColumns.split(' ').length,
		};
	});
}

test('canonical aliases preserve the 767/768 and 1023/1024 layout boundaries', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.addInitScript(() => {
		const today = new Date();
		localStorage.setItem(
			'yesid:hero-intro-day',
			`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`,
		);
	});
	await page.setViewportSize({ width: 767, height: 900 });
	await page.goto('/');
	await expect(page.getByTestId('proof-reel-section')).toBeVisible();
	await page.addStyleTag({
		content: '*,*::before,*::after{animation:none!important;transition:none!important}',
	});
	await settleLayout(page);

	const at767 = await responsiveState(page);
	expect(at767.navPaddingInline).toBe('16px');
	expect(at767.slideRatio).toBeGreaterThan(0.9);

	await page.setViewportSize({ width: 768, height: 900 });
	await settleLayout(page);
	const at768 = await responsiveState(page);
	expect(at768.navPaddingInline).toBe('28px');
	expect(at768.slideRatio).toBeLessThan(0.65);

	await page.setViewportSize({ width: 1023, height: 900 });
	await settleLayout(page);
	const at1023 = await responsiveState(page);
	expect(at1023.rotatedTitleDisplay).toBe('none');
	expect(at1023.gridTracks).toBe(1);

	await page.setViewportSize({ width: 1024, height: 900 });
	await settleLayout(page);
	const at1024 = await responsiveState(page);
	expect(at1024.rotatedTitleDisplay).toBe('flex');
	expect(at1024.gridTracks).toBe(2);
});
