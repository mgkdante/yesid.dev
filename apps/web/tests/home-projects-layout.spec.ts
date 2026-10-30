import { expect, test, type Locator } from '@playwright/test';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';
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
	expect(visible.length).toBeLessThanOrEqual(2);
	return visible;
}

async function expectMediaAboveInfo(card: Locator) {
	const split = await card.evaluate(element => ({
		card: element.getBoundingClientRect().toJSON(),
		media: element.querySelector('[data-testid$="card-image"]')!.getBoundingClientRect().toJSON(),
		info: element.querySelector('[data-testid="project-card-info"]')!.getBoundingClientRect().toJSON(),
	}));
	expect(split.media.height, `the media never takes more room than the info: ${JSON.stringify(split)}`).toBeLessThanOrEqual(split.info.height + 2);
	expect(split.media.top).toBeGreaterThanOrEqual(split.card.top - 1);
	expect(split.media.bottom).toBeLessThanOrEqual(split.info.top + 1);
	expect(split.info.bottom).toBeLessThanOrEqual(split.card.bottom + 1);
}

async function expectPanesSideBySide(card: Locator) {
	const panes = await card.locator('[data-testid="project-hero-preview"] > *').evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()));
	if (panes.length < 2) return;
	const [desktop, phone] = panes;
	expect(Math.abs(desktop.top - phone.top)).toBeLessThanOrEqual(1);
	expect(Math.abs(desktop.height - phone.height)).toBeLessThanOrEqual(1);
	expect(phone.left).toBeGreaterThanOrEqual(desktop.right - 1);
	expect(phone.width, 'the phone pane stays narrower than the desktop pane').toBeLessThan(desktop.width);
}

async function expectImagesFillPanes(card: Locator) {
	for (const image of await card.getByTestId('project-hero-preview-image').all()) {
		await image.scrollIntoViewIfNeeded();
		const loadingContext = await image.evaluate((img: HTMLImageElement) => ({ source: img.currentSrc || img.src, card: img.closest('article')?.querySelector('a')?.getAttribute('href'), box: img.getBoundingClientRect().toJSON(), pane: img.parentElement!.getBoundingClientRect().toJSON(), viewport: { width: innerWidth, height: innerHeight }, scroll: scrollY }));
		await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0), { message: `Project image must load: ${JSON.stringify(loadingContext)}` }).toBe(true);
		await expect.poll(() => image.evaluate(img => img.getAnimations().every(animation => animation.playState !== 'running'))).toBe(true);
		const paint = await image.evaluate((img: HTMLImageElement) => {
			const box = img.getBoundingClientRect();
			const frame = img.parentElement!;
			const outer = frame.getBoundingClientRect();
			// Inside the pane's border: the divider between screenshots is not a gap.
			const pane = { left: outer.left + frame.clientLeft, top: outer.top + frame.clientTop, width: frame.clientWidth, height: frame.clientHeight, right: outer.left + frame.clientLeft + frame.clientWidth, bottom: outer.top + frame.clientTop + frame.clientHeight };
			const fit = getComputedStyle(img).objectFit;
			let width = box.width;
			let height = box.height;
			if (fit === 'contain' || fit === 'cover') {
				const scale = (fit === 'contain' ? Math.min : Math.max)(box.width / img.naturalWidth, box.height / img.naturalHeight);
				width = img.naturalWidth * scale;
				height = img.naturalHeight * scale;
			}
			const covers = box.left <= pane.left + 1 && box.right >= pane.right - 1 && box.top <= pane.top + 1 && box.bottom >= pane.bottom - 1
				&& width >= box.width - 1 && height >= box.height - 1;
			return {
				covers,
				distortion: (width / height) / (img.naturalWidth / img.naturalHeight),
				content: { width, height },
				pane: { left: pane.left, top: pane.top, width: pane.width, height: pane.height },
			};
		});
		expect(paint.covers, `the image paints its whole pane with no empty bands: ${JSON.stringify(paint)}`).toBe(true);
		expect(paint.distortion).toBeCloseTo(1, 2);
	}
}

for (const locale of PUBLISHED_LOCALES) {
	test(`${locale}: whole project cards keep images and supplied content readable`, async ({ page }) => {

		await page.emulateMedia({ reducedMotion: 'reduce' });
			await page.goto(locale === 'en' ? '/' : `/${locale}`);
			await page.evaluate(() => document.fonts.ready);
			const reel = page.getByTestId('proof-reel-section');
			await reel.scrollIntoViewIfNeeded();
			const visible = await expectWholeCards(reel);
			for (const card of await reel.getByTestId('proof-card').all()) { await expectCardContentInside(card); await expectMediaAboveInfo(card); await expectPanesSideBySide(card); }
			const scales = await reel.locator('.df-node text').evaluateAll(labels => labels.map(label => label.getBoundingClientRect().height).filter(Boolean));
			expect(scales.length).toBeGreaterThan(0);
			expect(Math.max(...scales) / Math.min(...scales), 'short and long stacks retain the same type scale').toBeLessThan(1.25);
			for (const card of visible) await expectImagesFillPanes(reel.getByTestId('proof-card').nth(card.index));
			const frames = await reel.getByTestId('proof-card-image').evaluateAll(images => images.map(image => image.getBoundingClientRect().height));
			expect(Math.max(...frames) / Math.min(...frames), 'every project keeps the same image frame').toBeLessThan(1.1);
	});
}

test('navigation and resizing settle on whole cards and keep every project reachable', async ({ page }) => {
	test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
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
	expect(Math.max(...counts)).toBe(Math.min(total, 2));
	expect(Math.min(...counts)).toBe(1);
	const previous = reel.getByTestId('proof-prev');
	if (await previous.isEnabled()) { await previous.click(); await expectWholeCards(reel); }
});

test('hover keeps project image panes filled', async ({ page }) => {
	test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
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
			await expectImagesFillPanes(card);
			await card.getByTestId('proof-card-image').hover({ force: true });
			await expectImagesFillPanes(card);
			seen.add(visible.index);
		}
		if (await reel.getByTestId('proof-next').isDisabled()) break;
		await reel.getByTestId('proof-next').click();
	}
	expect(seen.size).toBe(total);
});

test('the shared project listing stays readable', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/projects');
	const cards = page.getByTestId('project-card');
	await expect(cards.first()).toBeVisible();
	for (const card of await cards.all()) {
		await expect(card.getByRole('link')).toHaveAccessibleName((await card.getByRole('heading').textContent())!.trim());
		await expectImagesFillPanes(card);
		await expectMediaAboveInfo(card);
		await expectPanesSideBySide(card);
		expect(await card.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'listing content stays inside its card').toBe(true);
	}
	expect(await page.locator('[data-testid="project-hero-preview"][data-split="true"]').count(), 'some project supplies a phone screenshot').toBeGreaterThan(0);
});

test('a project card opens from its link and its tags, and its overflowing stack diagram is its own keyboard stop', async ({ page }) => {
	test.skip(page.viewportSize()!.width >= 768, 'Stack diagrams overflow on narrow cards.');
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await page.goto('/projects');
	const card = page.getByTestId('project-card')
		.filter({ has: page.locator('[tabindex="0"]') })
		.filter({ has: page.locator('.project-card-tag') })
		.first();
	const link = card.getByRole('link');
	const href = await link.getAttribute('href');
	await card.locator('.project-card-tag').first().click({ force: true });
	await expect(page.getByTestId('project-detail-page')).toBeVisible();
	expect(new URL(page.url()).pathname).toBe(href);
	await page.goto('/projects');
	await link.focus();
	await page.keyboard.press('Tab');
	const diagram = page.locator(':focus');
	await expect(diagram.getByRole('img')).toHaveAccessibleName(/\S/);
	await page.keyboard.press('ArrowRight');
	await expect.poll(() => diagram.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);
	await expect(page).toHaveURL(/\/projects\/?$/);
	await page.keyboard.press('Shift+Tab');
	await expect(link).toBeFocused();
	await page.keyboard.press('Enter');
	await expect(page.getByTestId('project-detail-page')).toBeVisible();
});

test('card tags lean toward the pointer from under the card link', async ({ page }) => {
	test.skip(page.viewportSize()!.width < 1024, 'Pointer hover is a desktop behavior.');
	await page.goto('/projects');
	const tag = page.getByTestId('project-card').locator('.project-card-tag').first();
	await tag.scrollIntoViewIfNeeded();
	const rest = (await tag.boundingBox())!;
	await page.mouse.move(rest.x + rest.width / 2 + 15, rest.y + rest.height / 2);
	await expect.poll(async () => (await tag.boundingBox())!.x).toBeGreaterThan(rest.x);
});

test('a light first load shows the same project screenshots as switching to light', async ({ page }) => {
	test.skip(page.viewportSize()!.width < 1024, 'Desktop only.');
	await page.addInitScript(() => localStorage.setItem('theme', 'light'));
	await page.goto('/projects');
	const images = page.getByTestId('project-hero-preview-image');
	await expect(images.first()).toBeVisible();
	// The server renders dark screenshots and the mounted preview swaps in light ones,
	// so read the first load only once the page has hydrated (Lenis is on for desktop).
	await expect.poll(() => page.evaluate(() => document.documentElement.classList.contains('lenis'))).toBe(true);
	const sources = () => images.evaluateAll(nodes => nodes.map(node => node.getAttribute('src')));
	const firstLoad = await sources();
	await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
	await expect.poll(sources).not.toEqual(firstLoad);
	await page.evaluate(() => { document.documentElement.dataset.theme = 'light'; });
	await expect.poll(sources).toEqual(firstLoad);
});

test('project images hold still under reduced motion', { tag: '@motion' }, async ({ page }) => {
	await page.goto('/projects');
	const image = page.getByTestId('project-hero-preview-image').first();
	await expect(image).toBeVisible();
	await image.hover({ force: true });
	expect(await image.evaluate((element) => element.getAnimations().length)).toBe(0);
});
