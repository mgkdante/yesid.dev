import { test, expect } from '@playwright/test';
import { expectCardContentInside } from './lib/project-card-geometry.js';

test.beforeEach(async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
});

test('home project cards retain supplied content, optional metrics and valid links without clipping', async ({ page }) => {
	await page.goto('/');
	const section = page.getByTestId('proof-reel-section');
	await expect(section).toBeVisible();
	await section.scrollIntoViewIfNeeded();
	await page.evaluate(() => document.fonts.ready);
	const cards = section.getByTestId('proof-card');
	expect(await cards.count()).toBeGreaterThan(0);
	expect(await section.locator('.line-bullet').count(), 'the reel retains its related-service roundels').toBeGreaterThan(0);
	for (const card of await cards.all()) {
		await expect(card).toHaveAttribute('href', /^\/(?:fr\/|es\/)?projects\/[^/?#]+\/?$/);
		await expect(card).toHaveAccessibleName(/\S/);
		await expect(card.getByTestId('proof-card-title')).toHaveText(/\S/);
		await expect(card.getByTestId('proof-card-title')).toBeVisible();
		await expect(card.getByTestId('proof-excerpt')).toHaveText(/\S/);
		await expect(card.getByTestId('proof-excerpt')).toBeVisible();
		const metrics = card.getByTestId('proof-metric-item');
		for (const metric of await metrics.all()) {
			await expect(metric.getByTestId('proof-metric-value')).toHaveText(/\S/);
			await expect(metric.getByTestId('proof-metric-value')).toBeVisible();
			await expect(metric.getByTestId('proof-metric-label')).toHaveText(/\S/);
			await expect(metric.getByTestId('proof-metric-label')).toBeVisible();
		}
		for (const roundel of await card.locator('.line-bullet').all()) await expect(roundel).toBeVisible();
		await expectCardContentInside(card);
	}
	const viewAll = section.getByTestId('proof-view-all');
	await expect(viewAll).toHaveAttribute('href', /^\/(?:fr\/|es\/)?projects\/?$/);
	await viewAll.scrollIntoViewIfNeeded();
	await expect(viewAll).toBeInViewport();
});

test('project reel controls expose state and visible keyboard focus', async ({ page }) => {
	await page.goto('/');
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
