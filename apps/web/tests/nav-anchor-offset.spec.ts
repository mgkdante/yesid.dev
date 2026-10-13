import { test, expect, type Page } from '@playwright/test';

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
	test('project TOC navigation centres a [data-section-index] block in the viewport', async ({
		page,
	}) => {
		await page.goto(PROJECT_PATH);
		await expect(page.getByTestId('project-detail-page')).toBeVisible();

		// The desktop TOC lists only non-rail entries, in order: one button per
		// article section (`section-N`), then README when present — and every one of
		// those ids resolves through toc.ts to `[data-section-index="N"]`. Sub-items
		// (README children) are excluded, so button i ⇒ [data-section-index="i"].
		const tocItems = page.locator('.toc-column .toc-nav > button.toc-item:not(.toc-sub-item)');
		const blocks = page.locator('[data-section-index]');
		const blockCount = await blocks.count();
		expect(blockCount, 'project must render section blocks').toBeGreaterThan(1);
		await expect(
			tocItems,
			'desktop TOC buttons must map 1:1 onto [data-section-index] blocks',
		).toHaveCount(blockCount);

		// Target the SECOND block: far enough from both document ends that a
		// block:center scroll is never clamped by the scroll range.
		const targetIndex = 1;
		// The TOC button's onclick attaches on hydration, so the first click can land
		// before it is wired (repo idiom — see mobile/small-device-fit.spec.ts). And
		// the handler runs a SMOOTH scroll, so wait for the scroll to actually START
		// before waiting for it to stop; otherwise "position unchanged" reads as
		// "settled" while the animation has merely not begun (a vacuous pass at 0).
		await expect(async () => {
			const y0 = await page.evaluate(() => window.scrollY);
			await tocItems.nth(targetIndex).click();
			await page.waitForFunction((y) => Math.abs(window.scrollY - y) > 4, y0, {
				timeout: 1500,
			});
		}).toPass({ timeout: 15_000 });
		await settleScroll(page);

		const geometry = await page.evaluate((index) => {
			const el = document.querySelector(`[data-section-index="${index}"]`);
			if (!el) throw new Error(`no [data-section-index="${index}"]`);
			const rect = el.getBoundingClientRect();
			return { centre: rect.top + rect.height / 2, viewport: window.innerHeight };
		}, targetIndex);

		// Central band: proves the block was CENTRED (not start-aligned, not left
		// off-screen) without pinning a pixel — the scroll-margin-top change shifts a
		// block:center landing by only M/2, which stays comfortably inside the band.
		const viewportCentre = geometry.viewport / 2;
		const band = geometry.viewport * 0.15;
		expect(
			Math.abs(geometry.centre - viewportCentre),
			`block centre ${geometry.centre} must sit within ±${band}px of viewport centre ${viewportCentre}`,
		).toBeLessThanOrEqual(band);

		// S5-440 fold-in: the cascade-reach guard. The PR's headline claim is that
		// [data-section-index] blocks move WITH the headings — assert it directly on
		// computed style, against the same independent oracle, so a future selector
		// split (the exact thing the freeze adjudicated against) fails CI instead of
		// slipping past the ±15% band above.
		const clearancePx = 88;
		const gapPx = 16;
		const margins = await page.evaluate(() =>
			[...document.querySelectorAll('[data-section-index]')].map((el) =>
				parseFloat(getComputedStyle(el).scrollMarginTop),
			),
		);
		expect(margins.length).toBeGreaterThan(1);
		for (const margin of margins) {
			expect(margin, 'every [data-section-index] block carries the shell offset').toBeCloseTo(
				clearancePx + gapPx,
				0,
			);
		}
	});
});
