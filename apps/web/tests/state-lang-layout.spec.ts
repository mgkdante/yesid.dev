import { test, expect, type Page, type Locator } from '@playwright/test';

// slice-34.6 (Reading layout) — the open/closed state of CollapsibleSection cards
// survives a language switch. The detail page subtree remounts under
// {#key $page.url.pathname}; each keyed section registers a locale-free boolean
// with the locale-handoff orchestrator (CollapsibleSection `sectionKey`), so a
// section the reader collapsed stays collapsed after toggling EN⇄FR.
//
// Viewport-agnostic: the desktop center sections (`.sections-column`) are hidden
// below lg, while the mobile "Project Info" glance panel (`glance-mobile`) is
// hidden at lg+. We collapse whichever CollapsibleSection trigger is VISIBLE at
// the running viewport, so the test is meaningful on both the desktop and phone
// matrices without editing playwright.config.ts.

/** Navigate /projects → first project card → its detail page. */
async function openFirstProject(page: Page): Promise<void> {
	await page.goto('/projects');
	const firstCard = page.getByTestId('project-card').first();
	await expect(firstCard).toBeVisible();
	await firstCard.click();
	await expect(page.getByTestId('project-detail-page')).toBeVisible();
}

/** The first VISIBLE collapsible-section header button (a `[data-slot="card"]`
 *  with an aria-expanded trigger), regardless of viewport. */
function firstVisibleSectionTrigger(page: Page): Locator {
	return page
		.locator('[data-slot="card"].section-card button[aria-expanded]')
		.filter({ visible: true })
		.first();
}

test.describe('State across languages — reading layout (collapsible state survives the switch)', () => {
	test('a collapsed section stays collapsed EN→FR', async ({ page }) => {
		await openFirstProject(page);

		const trigger = firstVisibleSectionTrigger(page);
		await expect(trigger).toBeVisible();
		// Sections default open; collapse it.
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		// Toggle language — the page remounts on the FR URL.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/fr/projects/**');
		await expect(page.getByTestId('project-detail-page')).toBeVisible();

		// The same-positioned section is still collapsed on the FR page.
		const frTrigger = firstVisibleSectionTrigger(page);
		await expect(frTrigger).toBeVisible();
		await expect(frTrigger).toHaveAttribute('aria-expanded', 'false');
	});

	test('the collapse survives FR→ES→EN (click-twice cycle)', async ({ page }) => {
		await page.goto('/fr/projects');
		const firstCard = page.getByTestId('project-card').first();
		await expect(firstCard).toBeVisible();
		await firstCard.click();
		await expect(page.getByTestId('project-detail-page')).toBeVisible();

		const trigger = firstVisibleSectionTrigger(page);
		await expect(trigger).toBeVisible();
		await expect(trigger).toHaveAttribute('aria-expanded', 'true');
		await trigger.click();
		await expect(trigger).toHaveAttribute('aria-expanded', 'false');

		// Click 1: FR → ES — the collapse survives the first remount.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL('**/es/projects/**');
		await expect(page.getByTestId('project-detail-page')).toBeVisible();
		const esTrigger = firstVisibleSectionTrigger(page);
		await expect(esTrigger).toBeVisible();
		await expect(esTrigger).toHaveAttribute('aria-expanded', 'false');

		// Click 2: ES → EN — and the second one.
		await page.getByTestId('language-toggle').click();
		await page.waitForURL((url) => /^\/projects\//.test(url.pathname));
		await expect(page.getByTestId('project-detail-page')).toBeVisible();

		const enTrigger = firstVisibleSectionTrigger(page);
		await expect(enTrigger).toBeVisible();
		await expect(enTrigger).toHaveAttribute('aria-expanded', 'false');
	});
});
