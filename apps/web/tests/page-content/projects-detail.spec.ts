import { projects } from '../../src/lib/content/projects';
import { siteLabels } from '../../src/lib/content/site-labels';
import { test, expect } from '@playwright/test';
import { gotoFirstDetail, projectDetailLinks } from '../_support/helpers';

test.skip(({ viewport }) => viewport!.width < 1024, 'Desktop composition or viewport-independent.');

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
		await expect(header.getByRole('heading', { level: 1 })).toHaveText(/.+/);
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
		test.skip(page.viewportSize()!.width < 1024, 'Sets its own viewports.');
		await page.setViewportSize({ width: 390, height: 844 });

		await gotoFirstProject(page);

		// The floating pill only mounts ({#if visible}) once the header scrolls out of view.
		// Scroll well past the header to trigger the hero IntersectionObserver.
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		const tocPill = page.getByTestId('toc-pill');
		await expect(tocPill).toBeVisible();
		const pillButton = tocPill.getByRole('button').first();
		await pillButton.click();
		const picked = tocPill.getByRole('navigation').getByRole('button').nth(3);
		await picked.click();
		await expect(pillButton).toHaveAttribute('aria-expanded', 'false');
		await pillButton.click();
		await expect(picked).toHaveAttribute('aria-current', 'location');
	});

	test('project glance panel renders on desktop', async ({ page }) => {

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
			.filter({ hasText: siteLabels.projectsChrome.detail.readmeSectionTitle.en });
		if (await readmeHeading.count() > 0) {
			await expect(readmeHeading.first()).toBeVisible();
		}
	});

	test('project detail glance panel shows non-empty metadata', async ({ page }) => {

		await gotoFirstProject(page);

		const glancePanel = page.locator('[data-testid="project-glance-panel"]');
		await expect(glancePanel).toBeVisible();

		// The panel always carries an Overview sub-section with non-empty prose.
		const overviewTitle = glancePanel.locator('h2.section-title').filter({ hasText: siteLabels.projectsChrome.detail.glance.overview.en });
		await expect(overviewTitle).toBeVisible();
		const overview = glancePanel.locator('.glance-overview');
		await expect(overview).toBeVisible();
		expect((await overview.innerText()).trim().length).toBeGreaterThan(0);

		// And a Stack sub-section listing at least one technology badge.
		const stackTitle = glancePanel.locator('h2.section-title').filter({ hasText: siteLabels.projectsChrome.detail.glance.stack.en });
		await expect(stackTitle).toBeVisible();
	});
});

test.describe('/projects/[slug] repo-private links state (homework #13)', () => {
	// Select a private repository with real repo/live URLs from the generated fixture.
	// Its repository link must be suppressed while the live-site link stays visible.
	const candidate = projects.find((project) =>
		project.repoPrivate === true && project.repoUrl?.trim() && project.liveUrl?.trim()
	);
	test('private repo renders honest non-link state instead of a GitHub link', async ({ page }) => {
		test.skip(!candidate, 'Fixture has no private-repo project with repoUrl and liveUrl');
		await page.goto(`/projects/${candidate!.slug}`);
		await expect(page.locator('[data-testid="project-detail-page"]')).toBeVisible();

		// The links card renders twice (desktop toc rail + hidden mobile glance).
		// Scope to the visible instance to dodge strict-mode "resolved to 2".
		const linksCard = page.getByTestId('project-links-card').filter({ visible: true }).first();
		await expect(linksCard).toBeVisible();

		const privateState = linksCard.getByTestId('project-repo-private');
		await expect(privateState).toBeVisible();
		await expect(privateState).toHaveText(siteLabels.projectsChrome.detail.glance.repoPrivateLabel.en);

		// No GitHub anchor ships in ANY links-card instance (visible or hidden):
		// repoUrl is set on this project, so a zero count proves the suppression.
		await expect(page.getByTestId('project-links-card').locator('a[href*="github.com"]')).toHaveCount(0);
		await expect(page.getByTestId('project-links-card').locator(`a[href="${candidate!.repoUrl}"]`)).toHaveCount(0);
		// The live-site link still renders: the private state coexists with real links.
		await expect(linksCard.locator(`a[href="${candidate!.liveUrl}"]`)).toBeVisible();
	});

	test('FR locale renders the translated private-repo label', async ({ page }) => {
		test.skip(!candidate, 'Fixture has no private-repo project with repoUrl and liveUrl');
		await page.goto(`/fr/projects/${candidate!.slug}`);
		await expect(page.locator('[data-testid="project-detail-page"]')).toBeVisible();

		const privateState = page.getByTestId('project-repo-private').filter({ visible: true }).first();
		await expect(privateState).toBeVisible();
		await expect(privateState).toHaveText(siteLabels.projectsChrome.detail.glance.repoPrivateLabel.fr!);
		await expect(page.getByTestId('project-links-card').locator('a[href*="github.com"]')).toHaveCount(0);
		await expect(page.getByTestId('project-links-card').locator(`a[href="${candidate!.repoUrl}"]`)).toHaveCount(0);
		await expect(page.getByTestId('project-links-card').filter({ visible: true }).first().locator(`a[href="${candidate!.liveUrl}"]`)).toBeVisible();
	});
});
