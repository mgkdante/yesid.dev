import { devices, expect, test, type Locator } from '@playwright/test';
import { expectCardContentInside } from './lib/project-card-geometry.js';

async function cardPositions(reel: Locator) {
	return reel.evaluate(section => {
		const frame = section.querySelector('.embla')!.getBoundingClientRect();
		return [...section.querySelectorAll<HTMLElement>('[data-testid="proof-card"]')].map((card, index) => {
			const box = card.getBoundingClientRect();
			const visible = Math.max(0, Math.min(frame.right, box.right) - Math.max(frame.left, box.left));
			return { index, left: box.left, width: box.width, visible, complete: visible >= box.width - 1 };
		});
	});
}

async function expectWholeCards(reel: Locator) {
	let lastPosition = '';
	let stableSince = 0;
	await expect.poll(async () => {
		const cards = await cardPositions(reel);
		const position = cards.map(card => card.left.toFixed(2)).join(',');
		if (position !== lastPosition) { lastPosition = position; stableSince = Date.now(); }
		return {
			hasVisibleCard: cards.some(card => card.visible > 1),
			partial: cards.filter(card => card.visible > 1 && !card.complete),
			settled: Date.now() - stableSince >= 120,
		};
	}, { message: `the settled carousel at ${reel.page().viewportSize()?.width}px must contain only complete cards` }).toEqual({ hasVisibleCard: true, partial: [], settled: true });
	const visible = (await cardPositions(reel)).filter(card => card.visible > 1);
	expect(visible.length).toBeLessThanOrEqual(4);
	return visible;
}

async function expectImagesInside(card: Locator) {
	for (const image of await card.getByTestId('project-hero-preview-image').all()) {
		await image.scrollIntoViewIfNeeded();
		const loadingContext = await image.evaluate((img: HTMLImageElement) => ({ source: img.currentSrc || img.src, card: img.closest('a')?.getAttribute('href'), box: img.getBoundingClientRect().toJSON(), pane: img.parentElement!.getBoundingClientRect().toJSON(), viewport: { width: innerWidth, height: innerHeight }, scroll: scrollY }));
		await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: `Project image must load: ${JSON.stringify(loadingContext)}` }).toBe(true);
		await expect.poll(() => image.evaluate(img => img.getAnimations().every(animation => animation.playState !== 'running'))).toBe(true);
		const paint = await image.evaluate((img: HTMLImageElement) => {
			const box = img.getBoundingClientRect();
			const pane = img.parentElement!.getBoundingClientRect();
			const fit = getComputedStyle(img).objectFit;
			let width = box.width;
			let height = box.height;
			if (fit === 'contain' || fit === 'cover') {
				const scale = (fit === 'contain' ? Math.min : Math.max)(box.width / img.naturalWidth, box.height / img.naturalHeight);
				width = img.naturalWidth * scale;
				height = img.naturalHeight * scale;
			}
			const left = box.left + (box.width - width) / 2;
			const top = box.top + (box.height - height) / 2;
			return {
				clipped: left < pane.left - 1 || left + width > pane.right + 1 || top < pane.top - 1 || top + height > pane.bottom + 1,
				distortion: (width / height) / (img.naturalWidth / img.naturalHeight),
				content: { left, top, width, height },
				pane: { left: pane.left, top: pane.top, width: pane.width, height: pane.height },
			};
		});
		expect(paint.clipped, `the complete source image fits its pane: ${JSON.stringify(paint)}`).toBe(false);
		expect(paint.distortion).toBeCloseTo(1, 2);
	}
}

const screens = [
	[360, 740, 'en'], [412, 744, 'en'], [540, 720, 'en'], [768, 700, 'en'],
	[820, 740, 'en'], [1024, 640, 'en'], [1280, 720, 'en'], [1600, 900, 'en'],
	[1920, 1080, 'en'], [820, 740, 'fr'], [412, 744, 'es'],
] as const;

for (const [width, height, locale] of screens) {
	test(`${width}x${height} ${locale}: whole project cards keep images and supplied content readable`, async ({ browser, baseURL }, testInfo) => {
		const context = await browser.newContext({ ...(width <= 540 ? devices['Pixel 7'] : {}), baseURL, viewport: { width, height }, reducedMotion: 'reduce', colorScheme: locale === 'fr' ? 'light' : 'dark' });
		try {
			const page = await context.newPage();
			await page.goto(locale === 'en' ? '/' : `/${locale}`);
			await page.evaluate(() => document.fonts.ready);
			const reel = page.getByTestId('proof-reel-section');
			await reel.scrollIntoViewIfNeeded();
			const visible = await expectWholeCards(reel);
			for (const card of await reel.getByTestId('proof-card').all()) await expectCardContentInside(card);
			const scales = await reel.locator('.df-node text').evaluateAll(labels => labels.map(label => label.getBoundingClientRect().height).filter(Boolean));
			expect(scales.length).toBeGreaterThan(0);
			expect(Math.max(...scales) / Math.min(...scales), 'short and long stacks retain the same type scale').toBeLessThan(1.25);
			for (const card of visible) await expectImagesInside(reel.getByTestId('proof-card').nth(card.index));
			const frames = await reel.getByTestId('proof-card-image').evaluateAll(images => images.map(image => image.getBoundingClientRect().height));
			expect(Math.max(...frames) / Math.min(...frames), 'every project keeps the same image frame').toBeLessThan(1.1);
			await reel.screenshot({ path: testInfo.outputPath('projects.png'), animations: 'disabled' });
		} finally { await context.close(); }
	});
}

test('navigation and resizing settle on whole cards and keep every project reachable', async ({ page }) => {
	test.setTimeout(60_000);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/');
	const reel = page.getByTestId('proof-reel-section');
	const total = await reel.getByTestId('proof-card').count();
	const seen = new Set<number>();
	const counts: number[] = [];
	for (const width of [390, 1080, 1500, 2200, 820, 1280, 390]) {
		await page.setViewportSize({ width, height: 800 });
		await reel.scrollIntoViewIfNeeded();
		const steps = counts.length === 0 ? total : 1;
		for (let step = 0; step < steps; step++) {
			const visible = await expectWholeCards(reel);
			counts.push(visible.length);
			visible.forEach(card => seen.add(card.index));
			const next = reel.getByTestId('proof-next');
			if (visible.length === total) {
				await expect(next).toBeDisabled();
				await expect(reel.getByTestId('proof-prev')).toBeDisabled();
			}
			if (await next.isDisabled()) break;
			const before = await reel.getByTestId('proof-count').getAttribute('aria-label');
			await next.click();
			await expect(reel.getByTestId('proof-count')).not.toHaveAttribute('aria-label', before!);
			await expectWholeCards(reel);
		}
	}
	expect(seen.size).toBe(total);
	expect(Math.max(...counts)).toBe(Math.min(total, 4));
	expect(Math.min(...counts)).toBe(1);
	const previous = reel.getByTestId('proof-prev');
	if (await previous.isEnabled()) { await previous.click(); await expectWholeCards(reel); }
});

test('hover keeps both project image panes complete', async ({ page }) => {
	await page.setViewportSize({ width: 1280, height: 900 });
	await page.goto('/');
	const reel = page.getByTestId('proof-reel-section');
	await reel.scrollIntoViewIfNeeded();
	const total = await reel.getByTestId('proof-card').count();
	const seen = new Set<number>();
	for (let step = 0; step < total; step++) {
		for (const visible of await expectWholeCards(reel)) {
			if (seen.has(visible.index)) continue;
			const card = reel.getByTestId('proof-card').nth(visible.index);
			await expectImagesInside(card);
			await card.getByTestId('proof-card-image').hover();
			await expectImagesInside(card);
			seen.add(visible.index);
		}
		if (await reel.getByTestId('proof-next').isDisabled()) break;
		await reel.getByTestId('proof-next').click();
	}
	expect(seen.size).toBe(total);
});

for (const width of [390, 1440]) {
	test(`shared project listing remains readable at ${width}px`, async ({ page }) => {
		await page.setViewportSize({ width, height: 900 });
		await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
		await page.goto('/projects');
		const cards = page.getByTestId('project-card');
		await expect(cards.first()).toBeVisible();
		for (const card of await cards.all()) {
			await expect(card).toHaveAccessibleName(/\S/);
			await expectImagesInside(card);
			expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'listing content stays inside its card').toBe(true);
		}
	});
}
