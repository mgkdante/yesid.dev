import { test, expect } from '@playwright/test';
import { expectCardContentInside, expectCardRowsAligned } from './lib/project-card-geometry.js';

test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const locale of ['en', 'fr', 'es']) {
	for (const placement of ['proof', 'listing']) {
		test(`${locale} ${placement} card rows stay aligned after resizing and filtering`, async ({ page }) => {
			const prefix = locale === 'en' ? '' : `/${locale}`;
			await page.goto(`${prefix}${placement === 'proof' ? '/' : '/projects'}`, { waitUntil: 'domcontentloaded' });
			const cards = page.getByTestId(placement === 'proof' ? 'proof-card' : 'project-card');
			await expect(cards.first()).toBeVisible();
			await cards.first().scrollIntoViewIfNeeded();
			await page.evaluate(() => document.fonts.ready);
			await expectCardRowsAligned(cards);
			const original = page.viewportSize()!;
			await page.setViewportSize({ width: original.width < 768 ? 1280 : 390, height: original.height });
			await expectCardRowsAligned(cards);
			if (placement === 'listing') {
				// Removing and restoring cards must trigger alignment with the new tallest row.
				await page.setViewportSize({ width: 1280, height: original.height });
				const search = page.getByTestId('project-search-sidebar');
				await search.fill((await cards.first().getByRole('heading').innerText()).trim());
				await expect(cards).toHaveCount(1);
				await search.fill('');
				await expectCardRowsAligned(cards);
			}
		});
	}
}

test('home project cards share one size and show title, excerpt and links without clipping', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	const section = page.getByTestId('proof-reel-section');
	await expect(section).toBeVisible();
	await section.scrollIntoViewIfNeeded();
	await page.evaluate(() => document.fonts.ready);
	const cards = section.getByTestId('proof-card');
	expect(await cards.count()).toBeGreaterThan(0);
	await expect(section.locator('[data-testid$="metric-item"]')).toHaveCount(0);
	await expect(cards.first().getByTestId('project-card-service').first()).toBeVisible();
	await expect(section.locator('[data-testid="proof-card-links"] li').first()).toBeVisible();
	for (const card of await cards.all()) {
		const link = card.getByRole('link', { name: (await card.getByRole('heading').innerText()).trim(), exact: true });
		await expect(link).toHaveAttribute('href', /^\/(?:fr\/|es\/)?projects\/[^/?#]+\/?$/);
		await expect(link).toHaveAccessibleName((await card.getByTestId('proof-card-title').textContent())!.trim());
		await expect(card.getByTestId('proof-card-title')).toHaveText(/\S/);
		await expect(card.getByTestId('proof-card-title')).toBeVisible();
		await expect(card.getByTestId('proof-excerpt')).toHaveText(/\S/);
		await expect(card.getByTestId('proof-excerpt')).toBeVisible();
		await expectCardContentInside(card);
	}
	const sizes = await cards.evaluateAll(nodes => nodes.map(node => {
		const box = node.getBoundingClientRect();
		const media = node.querySelector('[data-testid="proof-card-image"]')!.getBoundingClientRect();
		return [box.width, box.height, media.height].map(Math.round).join('x');
	}));
	expect(new Set(sizes), 'every home card shares one size and media split').toEqual(new Set([sizes[0]]));
	const viewAll = section.getByTestId('proof-view-all');
	await expect(viewAll).toHaveAttribute('href', /^\/(?:fr\/|es\/)?projects\/?$/);
	await viewAll.scrollIntoViewIfNeeded();
	await expect(viewAll).toBeInViewport();
});

test('project reel controls expose state and visible keyboard focus', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	const section = page.getByTestId('proof-reel-section');
	await section.scrollIntoViewIfNeeded();
	const previous = section.getByTestId('proof-prev');
	const next = section.getByTestId('proof-next');
	for (const control of [previous, next]) {
		await expect(control).toHaveAccessibleName(/\S/);
		expect(await control.evaluate(element => element.tagName)).toBe('BUTTON');
	}
	const counter = section.getByTestId('proof-count');
	await expect(counter).toHaveText(/\d/);
	await expect(counter).toHaveAttribute('aria-live', 'polite');
	const hasOffscreenCards = await section.locator('.embla').evaluate(viewport => {
		const bounds = viewport.getBoundingClientRect();
		return Array.from(viewport.querySelectorAll('[data-testid="proof-card"]')).some(card => {
			const box = card.getBoundingClientRect();
			return box.left < bounds.left - 1 || box.right > bounds.right + 1;
		});
	});
	if (hasOffscreenCards) await expect.poll(async () => await next.isEnabled() || await previous.isEnabled()).toBe(true);
	const focusTarget = await next.isEnabled() ? next : await previous.isEnabled() ? previous : section.getByTestId('proof-view-all');
	const restingShadow = await focusTarget.evaluate(element => getComputedStyle(element).boxShadow);
	await focusTarget.focus();
	await page.keyboard.press('Tab');
	await page.keyboard.press('Shift+Tab');
	await expect(focusTarget).toBeFocused();
	expect(await focusTarget.evaluate((element, restingShadow) => {
		const style = getComputedStyle(element);
		return (style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) > 0) || (style.boxShadow !== 'none' && style.boxShadow !== restingShadow);
	}, restingShadow), 'the focused control has a visible focus indicator').toBe(true);
	if (hasOffscreenCards && (focusTarget === next || focusTarget === previous)) {
		const before = await counter.textContent();
		await expect(async () => {
			if (await counter.textContent() === before) {
				await focusTarget.focus();
				await page.keyboard.press('Enter');
			}
			expect(await counter.textContent(), 'keyboard navigation changes the announced reel position').not.toBe(before);
		}).toPass({ timeout: 10_000 });
	}
});
