// slice-34.2 (Stack-engine) — the composed build survives a language switch, and
// an inbound deep-link seeds the engine. The /tech-stack engine REMOUNTS on a
// switch (the {#key $page.url.pathname} subtree is destroyed) AND mounts via async
// dynamic import(), so the only bridge is the locale-handoff orchestrator:
// beforeNavigate snapshots the live build via registerSession('stack-engine'),
// and the remounted EngineState constructor re-seeds itself from pendingRestore
// (mirroring how FeaturedProjects reads pendingRestore in onEmblaInit).
//
// Lives in its OWN spec file (not the shared state-across-languages.spec.ts) per
// the slice-34 family convention. Runs on desktop AND the mobile projects — the
// engine is all tap-sized buttons (same cross-viewport contract as
// stack-engine.spec.ts); the language-toggle is a persistent nav control.

import { test, expect } from '@playwright/test';

test.describe('State across languages — stack-engine (composed build survives the switch)', () => {
	test('compose-mode picks survive EN→FR', async ({ page }) => {
		await page.goto('/tech-stack');
		await expect(page.getByTestId('stack-engine')).toBeVisible();

		// Enter compose mode and pick a few tech chips — the locale-free build.
		await page.getByTestId('mode-toggle-compose').click();
		await page.getByTestId('tech-chip-postgresql').click();
		await page.getByTestId('tech-chip-docker').click();

		// Both picks are now pressed and the build-shape card is live.
		await expect(page.getByTestId('tech-chip-postgresql')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('tech-chip-docker')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('build-shape')).toBeVisible();

		// Toggle the language — the page subtree remounts; the orchestrator carries
		// the build across and the constructor re-seeds the remounted engine.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/tech-stack');
		await expect(page.getByTestId('stack-engine')).toBeVisible();

		// The picked build is still present on /fr/tech-stack: same mode, same picks.
		await expect(page.getByTestId('mode-toggle-compose')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('tech-chip-postgresql')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('tech-chip-docker')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('build-shape')).toBeVisible();
	});

	test('the build survives FR→EN too', async ({ page }) => {
		await page.goto('/fr/tech-stack');
		await expect(page.getByTestId('stack-engine')).toBeVisible();

		await page.getByTestId('mode-toggle-compose').click();
		await page.getByTestId('tech-chip-postgresql').click();
		await expect(page.getByTestId('tech-chip-postgresql')).toHaveAttribute('aria-pressed', 'true');

		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => url.pathname === '/tech-stack');
		await expect(page.getByTestId('stack-engine')).toBeVisible();

		await expect(page.getByTestId('mode-toggle-compose')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('tech-chip-postgresql')).toHaveAttribute('aria-pressed', 'true');
	});

	test('a goal-mode blueprint (active archetype) survives the switch', async ({ page }) => {
		await page.goto('/tech-stack');
		await expect(page.getByTestId('stack-engine')).toBeVisible();

		// Open an archetype → the engine is in goal mode, blueprint view.
		await page.getByTestId('archetype-card-data-dashboard').click();
		await expect(page.getByTestId('blueprint-canvas')).toBeVisible();

		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/tech-stack');
		await expect(page.getByTestId('stack-engine')).toBeVisible();

		// The remounted engine re-seeds straight back into the blueprint view for
		// the same archetype — no need to re-open the card.
		await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
	});

	test('an inbound deep-link seeds the engine (?mode=compose&techs=…)', async ({ page }) => {
		// No prior interaction — the URL alone seeds compose mode + the picks.
		await page.goto('/tech-stack?mode=compose&techs=postgresql.docker');
		await expect(page.getByTestId('stack-engine')).toBeVisible();

		await expect(page.getByTestId('mode-toggle-compose')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('tech-chip-postgresql')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('tech-chip-docker')).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByTestId('build-shape')).toBeVisible();
	});

	test('an inbound archetype deep-link seeds straight into the blueprint', async ({ page }) => {
		await page.goto('/tech-stack?archetype=data-dashboard');
		await expect(page.getByTestId('stack-engine')).toBeVisible();
		// Goal mode (default) + a known archetype → the blueprint draws on arrival.
		await expect(page.getByTestId('blueprint-canvas')).toBeVisible();
	});
});
