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
		// remaining landmarks render too. The consolidation refactor renamed the
		// article body wrapper from blog-content -> blog-sections (each block in
		// data-testid="blog-section-body").
		await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();
		await expect(page.locator('[data-testid="blog-detail-header"]')).toBeVisible();
		await expect(page.locator('[data-testid="blog-sections"]')).toBeVisible();
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

		// Content area (blog-sections) always renders the sectionized blocks.
		const contentZone = page.locator('[data-testid="blog-sections"]');
		await expect(contentZone).toBeVisible();

		// The rendered prose lives in one or more blog-section-body blocks.
		const sectionBodies = page.locator('[data-testid="blog-section-body"]');
		expect(await sectionBodies.count()).toBeGreaterThan(0);

		const bodyText = await contentZone.textContent();
		expect(bodyText?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail renders headings for TOC tracking', async ({ page }) => {
		await gotoFirstPost(page);

		// The seeded posts all carry top-level section headings, each rendered as
		// a CollapsibleSection card whose anchor is exposed via data-toc inside the
		// blog-sections wrapper. The shared TOC observer tracks these (plus any
		// h3/h4[id] sub-headings in the section bodies) for IntersectionObserver
		// tracking. Assert the content headings render with text.
		const sectionHeadings = page.locator('[data-testid="blog-sections"] [data-toc]');
		const count = await sectionHeadings.count();
		expect(count).toBeGreaterThan(0);

		const firstHeadingText = await sectionHeadings.first().textContent();
		expect(firstHeadingText?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail TOC visible on desktop', async ({ page }) => {
		test.skip(test.info().project.name !== 'desktop-chrome', 'desktop-only TOC');

		await gotoFirstPost(page);

		// Desktop (>=1024px) shows the .context-column sidebar with a .toc-nav of
		// .toc-item buttons — one per heading. Posts have headings, so the nav
		// renders concrete items.
		const tocColumn = page.locator('.context-column');
		await expect(tocColumn).toBeVisible();

		const tocItems = tocColumn.locator('.toc-item');
		expect(await tocItems.count()).toBeGreaterThan(0);

		// TOC item count mirrors the prose headings: the desktop nav lists every
		// non-rail content heading, i.e. each top-level section card (data-toc in
		// the blog-sections wrapper) plus every h3/h4[id] sub-heading inside the
		// section bodies. (The right-rail entry cards are excluded from the nav.)
		const sectionAnchorCount = await page
			.locator('[data-testid="blog-sections"] [data-toc]')
			.count();
		const subHeadingCount = await page
			.locator(
				'[data-testid="blog-section-body"] h3[id], [data-testid="blog-section-body"] h4[id]'
			)
			.count();
		expect(await tocItems.count()).toBe(sectionAnchorCount + subHeadingCount);
	});

	test('blog detail renders metadata (category, language, reading time)', async ({ page }) => {
		await gotoFirstPost(page);

		// Metadata panel (blog-meta-card) lives in the desktop TOC column and
		// always renders category / words / read-time / language items for a post.
		const metaPanel = page.locator('[data-testid="blog-meta-card"]');
		await expect(metaPanel).toBeVisible();

		const metaItems = metaPanel.locator('.meta-list__item');
		expect(await metaItems.count()).toBeGreaterThan(0);

		// Each item exposes a <dt> label; verify the labels are non-empty.
		const labels = metaPanel.locator('.meta-list__item dt');
		expect(await labels.count()).toBeGreaterThan(0);
		const firstLabel = await labels.first().textContent();
		expect(firstLabel?.trim().length).toBeGreaterThan(0);
	});

	test('blog detail page renders in EN', async ({ page }) => {
		await gotoFirstPost(page);
		await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();

		const bodyText = await page.locator('[data-testid="blog-sections"]').textContent();
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
			const bodyText = await page.locator('[data-testid="blog-sections"]').textContent();
			expect(bodyText?.trim().length).toBeGreaterThan(0);
		}
	});
});

test.describe('blog heading permalinks (homework #7c)', () => {
	// Committed content: anime-data-viz-challenge carries h3 sub-headings inside
	// its section bodies. h2 blocks never reach the body (sectionizeBlogBody
	// consumes every level-2 header as a section-card title), so on blog detail
	// the heading anchors live on h3/h4 only. This heading's kebab id starts with
	// a letter, keeping the raw #id CSS selector valid.
	const POST = '/blog/anime-data-viz-challenge';
	const HEADING_ID = 'isekai-exploded-in-2016';

	test('h3 carries a real "#" permalink with href + aria-labelledby', async ({ page }) => {
		await page.goto(POST);
		await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();

		const heading = page.locator(`[data-testid="blog-section-body"] h3#${HEADING_ID}`);
		await expect(heading).toBeVisible();

		// Contract from cms/blocks/Heading.svelte: the anchor lives INSIDE the
		// heading, points at the heading id, and is named by it for AT users.
		const anchor = heading.locator('a.heading-anchor');
		await expect(anchor).toHaveAttribute('href', `#${HEADING_ID}`);
		await expect(anchor).toHaveAttribute('aria-labelledby', HEADING_ID);
		await expect(anchor).toHaveText('#');
	});

	test('permalink is hover-revealed: opacity 0 at rest, >0 on heading hover', async ({ page }) => {
		await page.goto(POST);
		await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();

		const heading = page.locator(`[data-testid="blog-section-body"] h3#${HEADING_ID}`);
		await heading.scrollIntoViewIfNeeded();
		const anchor = heading.locator('a.heading-anchor');

		// Playwright counts opacity:0 elements as "visible" (non-empty box, no
		// visibility:hidden), so toBeVisible cannot prove the hover reveal.
		// Assert the computed opacity instead: 0 at rest, > 0 after hovering the
		// heading (--opacity-muted = 0.6 once the 200ms fade settles).
		await expect.poll(() => anchor.evaluate((el) => getComputedStyle(el).opacity)).toBe('0');
		await heading.hover();
		await expect
			.poll(() => anchor.evaluate((el) => parseFloat(getComputedStyle(el).opacity)))
			.toBeGreaterThan(0);
	});

	test('copyable anchor: navigating to the #fragment scrolls the heading into view', async ({ page }) => {
		// Under reduced motion Lenis never mounts (see reduced-motion.spec), so
		// the browser's native fragment scroll runs and lands deterministically.
		await page.emulateMedia({ reducedMotion: 'reduce' });
		await page.goto(`${POST}#${HEADING_ID}`);
		await expect(page.locator('[data-testid="blog-detail-page"]')).toBeVisible();

		const heading = page.locator(`[data-testid="blog-section-body"] h3#${HEADING_ID}`);
		await expect(heading).toBeVisible();

		// The fragment target sits well below the fold: the page must have
		// scrolled, and the heading must land inside the viewport.
		await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
		const box = await heading.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.y).toBeGreaterThanOrEqual(-1);
		expect(box!.y).toBeLessThan(page.viewportSize()!.height);
	});
});
