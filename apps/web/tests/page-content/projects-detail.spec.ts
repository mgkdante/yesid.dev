import { test, expect } from '@playwright/test';
import { gotoFirstDetail, projectDetailLinks } from '../_support/helpers';

// Open the first real /projects/[slug] detail page. The shared helper asserts a
// link exists, navigates, and waits on the project-detail-page landmark (no
// networkidle) — replacing the hand-rolled open-first-project boilerplate.
const gotoFirstProject = (page: import('@playwright/test').Page): Promise<string> =>
	gotoFirstDetail(page, '/projects', projectDetailLinks, 'project-detail-page');

test.describe('/projects/[slug] detail page content', () => {
	test('project detail page renders with header + sections', async ({ page }) => {
		await gotoFirstProject(page);

		// The detail page article wrapper is always present.
		await expect(page.locator('[data-testid="project-detail-page"]')).toBeVisible();

		// The manifesto-style header is always rendered (single element, not conditional).
		const header = page.locator('[data-testid="project-detail-header"]');
		await expect(header).toBeVisible();
		// Header carries the project title as an h1.
		await expect(header.locator('h1.header-title')).toHaveText(/.+/);
	});

	test('project sections render as h2 headings with data-section-index', async ({ page }) => {
		await gotoFirstProject(page);

		// Each center content section is a div carrying data-section-index, wrapping an h2 title.
		const sectionBlocks = page.locator('[data-section-index]');
		const count = await sectionBlocks.count();
		expect(count).toBeGreaterThan(0);

		// Every section block must contain a non-empty h2 heading.
		for (let i = 0; i < count; i++) {
			const heading = sectionBlocks.nth(i).locator('h2.section-title');
			await expect(heading).toBeVisible();
			const text = await heading.textContent();
			expect(text?.trim().length).toBeGreaterThan(0);
		}
	});

	test('project detail renders TOC (table of contents) on desktop', async ({ page }) => {
		test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only TOC');

		await gotoFirstProject(page);

		// Desktop TOC lives in the left .toc-column aside (display:block at lg+).
		const tocColumn = page.locator('.toc-column');
		await expect(tocColumn).toBeVisible();

		// It holds an "On this page" nav with one tap-press button per section.
		const tocItems = tocColumn.locator('nav.toc-nav button.toc-item');
		expect(await tocItems.count()).toBeGreaterThan(0);
		await expect(tocItems.first()).toBeVisible();
		await expect(tocItems.first()).toHaveText(/.+/);
	});

	test('project detail renders TOC pill on mobile', async ({ page }) => {
		test.skip(test.info().project.name === 'desktop-chrome', 'mobile-only TOC pill');

		await gotoFirstProject(page);

		// The floating pill only mounts ({#if visible}) once the header scrolls out of view.
		// Scroll well past the header to trigger the hero IntersectionObserver.
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		const tocPill = page.locator('[data-testid="project-toc-pill"]');
		await expect(tocPill).toBeVisible();

		// The pill is a real button exposing a heading name + counter.
		const pillButton = tocPill.locator('button.toc-pill');
		await expect(pillButton).toBeVisible();
		await expect(tocPill.locator('.toc-pill-counter')).toHaveText(/\d+\/\d+/);
	});

	test('project glance panel renders on desktop', async ({ page }) => {
		test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only glance panel');

		await gotoFirstProject(page);

		// The visible desktop glance panel is the testid'd scroller in the right column.
		// (A first-match on [class*="glance"] returns the hidden mobile overview node.)
		const glancePanel = page.locator('[data-testid="project-glance-panel"]');
		await expect(glancePanel).toBeVisible();

		const box = await glancePanel.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.width).toBeGreaterThan(0);
		expect(box!.height).toBeGreaterThan(0);
	});

	test('project detail renders README section when present', async ({ page }) => {
		await gotoFirstProject(page);

		// The center column always renders at least one section heading.
		const centerHeadings = page.locator('.sections-column h2.section-title');
		expect(await centerHeadings.count()).toBeGreaterThan(0);

		// README is optional (only when project.readmeUrl resolves). When the README
		// section exists, its h2 title renders as a real, visible heading.
		const readmeHeading = page
			.locator('.sections-column h2.section-title')
			.filter({ hasText: /readme/i });
		if (await readmeHeading.count() > 0) {
			await expect(readmeHeading.first()).toBeVisible();
		}
	});

	test('project detail glance panel shows non-empty metadata', async ({ page }) => {
		test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only glance panel');

		await gotoFirstProject(page);

		const glancePanel = page.locator('[data-testid="project-glance-panel"]');
		await expect(glancePanel).toBeVisible();

		// The panel always carries an Overview sub-section with non-empty prose.
		const overviewTitle = glancePanel.locator('h2.section-title').filter({ hasText: /overview/i });
		await expect(overviewTitle).toBeVisible();
		const overview = glancePanel.locator('.glance-overview');
		await expect(overview).toBeVisible();
		expect((await overview.innerText()).trim().length).toBeGreaterThan(0);

		// And a Stack sub-section listing at least one technology badge.
		const stackTitle = glancePanel.locator('h2.section-title').filter({ hasText: /stack/i });
		await expect(stackTitle).toBeVisible();
	});
});

test.describe('/projects/[slug] repo-private links state (homework #13)', () => {
	// yesid-dev ships repoPrivate: true in committed content, alongside a real
	// liveUrl AND a repoUrl. ProjectLinksCard must suppress the GitHub link and
	// render the honest non-link span instead (an honest state beats a 404),
	// while the live-site link keeps rendering next to it.
	test('private repo renders honest non-link state instead of a GitHub link', async ({ page }) => {
		await page.goto('/projects/yesid-dev');
		await expect(page.locator('[data-testid="project-detail-page"]')).toBeVisible();

		// The links card renders twice (desktop toc rail + hidden mobile glance).
		// Scope to the visible instance to dodge strict-mode "resolved to 2".
		const linksCard = page.getByTestId('project-links-card').filter({ visible: true }).first();
		await expect(linksCard).toBeVisible();

		const privateState = linksCard.getByTestId('project-repo-private');
		await expect(privateState).toBeVisible();
		await expect(privateState).toHaveText(/Private repo \(for now\)/);

		// No GitHub anchor ships in ANY links-card instance (visible or hidden):
		// repoUrl is set on this project, so a zero count proves the suppression.
		await expect(page.getByTestId('project-links-card').locator('a[href*="github.com"]')).toHaveCount(0);
		// The live-site link still renders: the private state coexists with real links.
		await expect(linksCard.locator('a[href="https://yesid.dev"]')).toBeVisible();
	});

	test('FR locale renders the translated private-repo label', async ({ page }) => {
		await page.goto('/fr/projects/yesid-dev');
		await expect(page.locator('[data-testid="project-detail-page"]')).toBeVisible();

		const privateState = page.getByTestId('project-repo-private').filter({ visible: true }).first();
		await expect(privateState).toBeVisible();
		await expect(privateState).toHaveText(/Dépôt privé \(pour le moment\)/);
	});
});
