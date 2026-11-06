import { expect, test, type Locator, type Page } from '@playwright/test';

// Real GSAP timing: unit tests mock the tween, so only a browser can prove a morph runs to the end.
test.skip(({ viewport }) => viewport!.width < 1024, 'Hover timing is viewport-independent; desktop covers it.');

// One morph is 0.4s plus stagger. An interrupted round trip used to be much shorter than two of them.
const MIN_MORPH_ROUND_TRIP_MS = 700;
// The train tween is 0.7s each way.
const MIN_TRAIN_ROUND_TRIP_MS = 1200;

const AWAY = { x: 2, y: 2 };

const pathData = (path: Locator) => path.evaluate((el) => el.getAttribute('d') ?? '');

/** Wait until this path sits unchanged, so its entrance or any earlier morph has ended. */
async function settledPathData(path: Locator): Promise<string> {
	let last = await pathData(path);
	let stableSince = Date.now();
	await expect
		.poll(
			async () => {
				const current = await pathData(path);
				if (current !== last) {
					last = current;
					stableSince = Date.now();
				}
				return Date.now() - stableSince;
			},
			{ timeout: 15_000 },
		)
		.toBeGreaterThan(400);
	return last;
}

/** Sample the path every frame and report how long it spent away from its resting shape. */
async function recordTimeAwayFromRest(path: Locator, rest: string): Promise<() => Promise<number>> {
	await path.evaluate((el, resting) => {
		const samples: number[] = [];
		const state = { samples, stop: false };
		(window as unknown as { __morphRecorder: typeof state }).__morphRecorder = state;
		const tick = () => {
			if (state.stop) return;
			if (el.getAttribute('d') !== resting) samples.push(performance.now());
			requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}, rest);

	return () =>
		path.evaluate(() => {
			const state = (window as unknown as { __morphRecorder: { samples: number[]; stop: boolean } }).__morphRecorder;
			state.stop = true;
			const { samples } = state;
			return samples.length === 0 ? 0 : samples[samples.length - 1]! - samples[0]!;
		});
}

async function moveAway(page: Page) {
	await page.mouse.move(AWAY.x, AWAY.y);
}

test.describe('SVG morphs always finish', () => {
	test('a blog card hovered during its entrance morphs once the entrance ends', async ({ page }) => {
		await page.goto('/blog');
		const row = page.getByTestId('blog-row').first();
		const path = row.locator('[data-slot="svg-icon"] svg path').first();
		// The hidden draw state proves the entrance has started, so hydration is done.
		await expect.poll(() => path.evaluate((el) => (el as SVGPathElement).style.strokeDashoffset !== ''), { timeout: 10_000 }).toBe(true);
		const rest = await pathData(path);

		await row.hover();

		await expect.poll(() => pathData(path), { timeout: 15_000 }).not.toBe(rest);
	});

	test('leaving a blog card mid-morph finishes the morph before returning', async ({ page }) => {
		await page.goto('/blog');
		const row = page.getByTestId('blog-row').first();
		const path = row.locator('[data-slot="svg-icon"] svg path').first();
		const rest = await settledPathData(path);
		const timeAway = await recordTimeAwayFromRest(path, rest);

		await row.hover();
		await expect.poll(() => pathData(path), { intervals: [10] }).not.toBe(rest);
		await moveAway(page);

		await expect.poll(() => pathData(path), { timeout: 5_000 }).toBe(rest);
		expect(await timeAway()).toBeGreaterThan(MIN_MORPH_ROUND_TRIP_MS);
	});

	test('re-entering during the return keeps the running morph and then morphs again', async ({ page }) => {
		await page.goto('/blog');
		const row = page.getByTestId('blog-row').first();
		const path = row.locator('[data-slot="svg-icon"] svg path').first();
		const rest = await settledPathData(path);

		await row.hover();
		await expect.poll(() => pathData(path)).not.toBe(rest);
		const morphed = await settledPathData(path);
		await moveAway(page);
		await expect.poll(() => pathData(path), { intervals: [10] }).not.toBe(morphed);
		await row.hover();

		// The return finishes at the resting shape before the next morph can start.
		await expect.poll(() => pathData(path), { timeout: 5_000, intervals: [10] }).toBe(rest);
		await expect.poll(() => pathData(path), { timeout: 5_000 }).not.toBe(rest);
	});

	test('a home service morphs on hover and returns after the pointer leaves', async ({ page }) => {
		await page.goto('/');
		const card = page.getByTestId('services-card').first();
		await card.scrollIntoViewIfNeeded();
		const icon = card.locator('.svg-inline-wrapper svg');
		await expect(icon).toBeVisible({ timeout: 10_000 });
		// A finished morph gives every path the same target shape; the art's own paths all differ.
		const distinctShapes = () =>
			icon.evaluate((svg) => new Set(Array.from(svg.querySelectorAll('path'), (path) => path.getAttribute('d'))).size);

		await card.hover();
		await expect.poll(distinctShapes, { timeout: 8_000 }).toBe(1);

		await moveAway(page);
		await expect.poll(distinctShapes, { timeout: 5_000 }).toBeGreaterThan(1);
	});

	test('the about train finishes launching before it lands', async ({ page }) => {
		await page.goto('/about');
		const button = page.getByTestId('about-train-button');
		// The idle bob never stops, so Playwright's stability checks would wait forever.
		await button.evaluate((el) => el.scrollIntoView({ block: 'center' }));
		const path = button.locator('svg path').first();
		const rest = await settledPathData(path);
		const timeAway = await recordTimeAwayFromRest(path, rest);

		await button.hover({ force: true });
		await expect.poll(() => pathData(path), { intervals: [10] }).not.toBe(rest);
		await moveAway(page);

		await expect.poll(() => pathData(path), { timeout: 5_000 }).toBe(rest);
		expect(await timeAway()).toBeGreaterThan(MIN_TRAIN_ROUND_TRIP_MS);
	});
});
