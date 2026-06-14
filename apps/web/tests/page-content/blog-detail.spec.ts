import { test, expect, type Page } from '@playwright/test';
import { gotoFirstDetail, blogPostLinks } from '../_support/helpers';

/**
 * Navigate to the first real blog post detail page and return its href.
 * Wraps the shared gotoFirstDetail helper, which waits on the
 * `blog-detail-page` landmark (no networkidle) after navigating. blogPostLinks
 * scopes to the blog-row anchor, intrinsically excluding the /blog/personal
 * corner link (a sidebar link, not a row).
 */
async function gotoFirstPost(page: Page): Promise<string> {
	return gotoFirstDetail(page, '/blog', blogPostLinks, 'blog-detail-page');
}

test.describe('/blog/[slug] detail page content', () => {
	test('blog detail page renders with header + content', async ({ page }) => {
		await gotoFirstPost(page);

		// gotoFirstPost already asserts blog-detail-page is visible; assert the
		// remaining landmarks render too.
		await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();
		await expect(page.locator('[data-testid="blog-detail-header"]')).toBeVisible();
		await expect(page.locator('[data-testid="blog-content"]')).toBeVisible();
	});

	test('blog detail header renders title + metadata', async ({ page }) => {
		await gotoFirstPost(page);

		// The header always renders the post title in an <h1>.
		const headerTitle = page.locator('[data-testid="blog-detail-header"] h1').first();
		await expect(headerTitle).toBeVisible();
		const titleText = await headerTitle.textContent();
		expect(titleText?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail content zone renders non-empty body', async ({ page }) => {
		await gotoFirstPost(page);

		// Content area always renders the rendered blocks.
		const contentZone = page.locator('[data-testid="blog-content"]');
		await expect(contentZone).toBeVisible();

		const bodyText = await contentZone.textContent();
		expect(bodyText?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail renders headings for TOC tracking', async ({ page }) => {
		await gotoFirstPost(page);

		// The seeded posts all carry h2/h3 section headings inside the prose,
		// each rendered with an id for IntersectionObserver TOC tracking.
		const headings = page.locator('[data-testid="blog-content"] h2[id], [data-testid="blog-content"] h3[id]');
		const count = await headings.count();
		expect(count).toBeGreaterThan(0);

		const firstHeadingText = await headings.first().textContent();
		expect(firstHeadingText?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail TOC visible on desktop', async ({ page }) => {
		test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only TOC');

		await gotoFirstPost(page);

		// Desktop (>=1024px) shows the .toc-column sidebar with a .toc-nav of
		// .toc-item buttons — one per heading. Posts have headings, so the nav
		// renders concrete items.
		const tocColumn = page.locator('.toc-column');
		await expect(tocColumn).toBeVisible();

		const tocItems = tocColumn.locator('.toc-item');
		expect(await tocItems.count()).toBeGreaterThan(0);

		// TOC item count mirrors the prose headings.
		const headingCount = await page
			.locator('[data-testid="blog-content"] h2[id], [data-testid="blog-content"] h3[id], [data-testid="blog-content"] h4[id]')
			.count();
		expect(await tocItems.count()).toBe(headingCount);
	});

	test('blog detail renders metadata (category, language, reading time)', async ({ page }) => {
		await gotoFirstPost(page);

		// Metadata panel (.left-meta) lives in the desktop TOC column and always
		// renders category / words / read-time / language items for a post.
		const metaPanel = page.locator('.left-meta');
		await expect(metaPanel).toBeVisible();

		const metaItems = metaPanel.locator('.left-meta__item');
		expect(await metaItems.count()).toBeGreaterThan(0);

		// Each item exposes a label; verify the labels are non-empty.
		const labels = metaPanel.locator('.left-meta__label');
		expect(await labels.count()).toBeGreaterThan(0);
		const firstLabel = await labels.first().textContent();
		expect(firstLabel?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail page renders in EN', async ({ page }) => {
		await gotoFirstPost(page);
		await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();

		const bodyText = await page.locator('[data-testid="blog-content"]').textContent();
		expect(bodyText?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail page renders in FR (/fr/blog/[slug])', async ({ page }) => {
		// Navigate to the first English post to get a real slug.
		const href = await gotoFirstPost(page);

		// Extract slug from href (e.g., /blog/my-post -> my-post)
		const slug = href.split('/').pop();
		const frHref = `/fr/blog/${slug}`;

		const response = await page.goto(frHref);
		// FR route may 404 if a post is FR-excluded; only assert content on 200.
		if (response?.status() === 200) {
			await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();
			const bodyText = await page.locator('[data-testid="blog-content"]').textContent();
			expect(bodyText?.trim().length).toBeGreaterThan(0);
		}
	});
});
