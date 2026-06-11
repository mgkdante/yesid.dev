// slice-29 — Tech Stack Engine e2e. Runs on desktop-chrome AND the mobile
// projects (no desktop-only selectors; everything is tap-sized buttons).
//
// Goal path:    archetype card → living blueprint → preview morph → blueprint
//               CTA hands off to /contact?bp=<archetype>~…
// Compose path: mode switch → tech chips light match cards; an absurd pick
//               (dax — committed tech, member of no launch archetype) shows
//               the zero-match CTA instead of a blank state.

import { test, expect } from '@playwright/test';

test('goal path: card → blueprint → preview → blueprint-prefilled contact', async ({
	page,
}) => {
	await page.goto('/tech-stack');

	// Engine mounts below the hero from its own async chunk.
	const engine = page.locator('[data-testid="stack-engine"]');
	await expect(engine).toBeVisible();

	await page.locator('[data-testid="archetype-card-data-dashboard"]').click();
	await expect(page.locator('[data-testid="blueprint-canvas"]')).toBeVisible();

	await page.locator('[data-testid="view-toggle"]').click();
	await expect(page.locator('[data-testid="product-preview"]')).toBeVisible();

	await page.locator('[data-testid="cta-blueprint"]').click();
	await page.waitForURL('**/contact?bp=data-dashboard~**');
	expect(page.url()).toContain('/contact?bp=data-dashboard~');
});

test('compose path: chips rank archetypes into match cards', async ({ page }) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="mode-toggle-compose"]').click();
	await page.locator('[data-testid="tech-chip-postgresql"]').click();
	await page.locator('[data-testid="tech-chip-docker"]').click();

	// postgresql+docker covers data-pipeline best — a match card lights up.
	await expect(page.locator('[data-testid^="match-card-"]').first()).toBeVisible();
	await expect(page.locator('[data-testid="match-card-data-pipeline"]')).toBeVisible();
});

test('compose path: an absurd single pick shows the zero-match CTA (never blank)', async ({
	page,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	await page.locator('[data-testid="mode-toggle-compose"]').click();
	// 'dax' is a committed tech that belongs to no launch archetype — the
	// guaranteed zero-match pick (verified against the seed in unit tests).
	await page.locator('[data-testid="tech-chip-dax"]').click();

	const zeroMatch = page.locator('[data-testid="zero-match-cta"]');
	await expect(zeroMatch).toBeVisible();
	await expect(zeroMatch.locator('a')).toHaveAttribute('href', '/contact?bp=custom~dax');
});

test('engine band is full-bleed with hazard frame; hero + CTA stay constrained (GO-w2t5 addendum)', async ({
	page,
	isMobile,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();

	// clientWidth excludes any classic scrollbar — the honest "edge to edge".
	const pageWidth = await page.evaluate(() => document.documentElement.clientWidth);

	const band = await page.locator('[data-testid="engine-band"]').boundingBox();
	expect(band).not.toBeNull();
	expect(Math.round(band!.width)).toBe(pageWidth);
	expect(Math.round(band!.x)).toBe(0);

	// The hazard frame (shared /projects divider) spans the full bleed too.
	for (const tid of ['engine-band-hazard-top', 'engine-band-hazard-bottom']) {
		const strip = await page.locator(`[data-testid="${tid}"]`).boundingBox();
		expect(strip, `${tid} must render`).not.toBeNull();
		expect(Math.round(strip!.width)).toBe(pageWidth);
		expect(Math.round(strip!.x)).toBe(0);
	}

	// Desktop only: hero above + CTA below keep their constrained width
	// EXACTLY ("perfect that way") — container-wide cap < page width. On
	// mobile every section is naturally edge-to-edge, so "constrained" is
	// not observable (current width behavior, unchanged).
	if (!isMobile) {
		const hero = await page.locator('[data-testid="tech-stack-hero"]').boundingBox();
		const cta = await page.locator('[data-testid="tech-stack-cta"]').boundingBox();
		expect(hero!.width).toBeLessThan(pageWidth);
		expect(cta!.width).toBeLessThan(pageWidth);
		expect(Math.round(band!.width)).toBeGreaterThan(Math.round(hero!.width));
	}
});

test('blueprint fits the viewport — whole drawing at a glance (GO-w2t5 operator playtest)', async ({
	page,
}) => {
	await page.goto('/tech-stack');
	await expect(page.locator('[data-testid="stack-engine"]')).toBeVisible();
	await page.locator('[data-testid="archetype-card-data-dashboard"]').click();

	const canvas = page.locator('[data-testid="blueprint-canvas"]');
	await expect(canvas).toBeVisible();

	const box = await canvas.boundingBox();
	const viewport = page.viewportSize();
	expect(box).not.toBeNull();
	expect(viewport).not.toBeNull();
	// Runs on desktop-chrome AND all three mobile projects.
	expect(box!.height).toBeLessThanOrEqual(viewport!.height * 0.85);
	expect(box!.width).toBeLessThanOrEqual(viewport!.width);
});
