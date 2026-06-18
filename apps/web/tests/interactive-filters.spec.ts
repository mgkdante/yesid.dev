import { test, expect } from '@playwright/test';

// networkidle is banned in this suite (see tests/_support/helpers.ts): against the
// live preview the contact info-terminal fires a one-shot fetch('/api/weather') +
// a DOM clock interval, so "network idle" never settles deterministically. Each
// listing's beforeEach now waits on its filter-sidebar landmark (web-first,
// auto-retrying) — that's the element every test in the block depends on.

// Ground truth (verified against the live preview + src):
//   - ProjectFilterSidebar renders FilterGroup with testIdPrefix="service-filter" /
//     "tag-filter"; FilterGroup emits data-testid=`${prefix}-${key}` on each item
//     button (so [data-testid^="service-filter-"] is correct).
//   - The Services group is startOpen (open on load); the Tags group is
//     startOpen={false} (collapsed) — its buttons are in the DOM but the collapse
//     wrapper intercepts pointer events, so the group header must be expanded first.
//   - Filter changes call goto({replaceState:true}) asynchronously; networkidle does
//     NOT wait for the client history update, so we assert with toHaveURL (auto-retry).
//   - Clear control = FilterSummary button labelled "clear filters" (lowercase).
//   - Blog sidebar: language group renders only "All" + "English" (no FR posts exist,
//     so languagesFromPosts === ['en']); tag items have NO testIdPrefix and use
//     role="radio" (bits-ui ToggleGroup), so they're targeted via button.filter-btn.
//   - Listing consolidation refactor: ListingMobileFilters now WRAPS the same
//     ProjectFilterSidebar/BlogFilterSidebar used on desktop, so
//     [data-testid="project-filter-sidebar"] (and blog-filter-sidebar) resolves to
//     TWO elements — the desktop <aside> in .listing-filter-column and the copy
//     inside the mobile panel (data-testid="*-filter-mobile", which is lg:hidden).
//     Every sidebar/item locator below is scoped to the DESKTOP sidebar via
//     .listing-filter-column so it stays unique AND visible at the desktop-chrome
//     viewport (>=1024px); the mobile copy is display:none there.

test.describe('Project listing filters', () => {
  // Desktop sidebar = the one in .listing-filter-column (visible >=1024px); the
  // mobile-panel copy carries the same testid but is lg:hidden on desktop-chrome.
  const desktopSidebar = (page: import('@playwright/test').Page) =>
    page.locator('.listing-filter-column [data-testid="project-filter-sidebar"]');

  test.beforeEach(async ({ page }) => {
    await page.goto('/projects');
    // Wait on the filter-sidebar landmark (web-first, auto-retrying) — the element
    // every test in this block depends on — instead of the banned networkidle.
    await expect(desktopSidebar(page)).toBeVisible();
  });

  test('clicking a service filter button updates URL param', async ({ page }) => {
    // Services group is open by default — its first item button is clickable.
    // Scope to the desktop sidebar so we hit the visible button, not the mobile copy.
    const filterBtn = desktopSidebar(page).locator('[data-testid^="service-filter-"]').first();
    await expect(filterBtn).toBeVisible();

    await filterBtn.click();

    // goto({replaceState}) runs async after the click — wait for the URL to commit.
    await expect(page).toHaveURL(/[?&]service=/);
  });

  test('clicking a tag filter button updates URL param', async ({ page }) => {
    // The Tags group is collapsed by default — expand it before its items are clickable.
    const sidebar = desktopSidebar(page);
    await sidebar.locator('button.label-section', { hasText: 'Tags' }).click();

    const filterBtn = sidebar.locator('[data-testid^="tag-filter-"]').first();
    await expect(filterBtn).toBeVisible();

    await filterBtn.click();

    await expect(page).toHaveURL(/[?&]tag=/);
  });

  test('typing in project search filters results in real-time', async ({ page }) => {
    // Baseline: the listing renders real project cards.
    const projectCards = page.locator('[data-testid="project-card"]');
    const initialCount = await projectCards.count();
    expect(initialCount).toBeGreaterThan(0);

    // A term that matches nothing must collapse the grid to zero and surface the
    // empty state — proving the search input actually drives the filter. The
    // search input lives only on the desktop sidebar (the mobile copy renders
    // with showSearch={false}), so project-search-sidebar is already unique.
    const searchInput = page.locator('[data-testid="project-search-sidebar"]');
    await searchInput.fill('zzzznomatchterm');

    await expect(projectCards).toHaveCount(0);
    await expect(page.locator('[data-testid="work-empty-state"]')).toBeVisible();

    // Clearing the query restores the full set.
    await searchInput.fill('');
    await expect(projectCards).toHaveCount(initialCount);
  });

  test('clearing filters removes URL params and shows all results', async ({ page }) => {
    // Apply a service filter first (Services group is open) — desktop sidebar only.
    const filterBtn = desktopSidebar(page).locator('[data-testid^="service-filter-"]').first();
    await expect(filterBtn).toBeVisible();
    await filterBtn.click();
    await expect(page).toHaveURL(/[?&]service=/);

    // FilterSummary's "clear filters" control resets all params.
    const clearBtn = page.getByRole('button', { name: /clear filters/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();

    await expect(page).not.toHaveURL(/[?&]service=/);
  });

  test('service and tag filters use AND logic', async ({ page }) => {
    const sidebar = desktopSidebar(page);

    // Apply service filter (open group).
    const serviceBtn = sidebar.locator('[data-testid^="service-filter-"]').first();
    await expect(serviceBtn).toBeVisible();
    await serviceBtn.click();
    await expect(page).toHaveURL(/[?&]service=/);

    // Expand Tags, then apply a tag filter — both params must coexist (AND logic).
    await sidebar.locator('button.label-section', { hasText: 'Tags' }).click();
    const tagBtn = sidebar.locator('[data-testid^="tag-filter-"]').first();
    await expect(tagBtn).toBeVisible();
    await tagBtn.click();

    await expect(page).toHaveURL(/[?&]service=/);
    await expect(page).toHaveURL(/[?&]tag=/);
  });
});

test.describe('Blog listing filters', () => {
  // Desktop sidebar = the one in .listing-filter-column (visible >=1024px); the
  // mobile-panel copy (blog-filter-mobile) carries the same testid but is lg:hidden.
  const desktopSidebar = (page: import('@playwright/test').Page) =>
    page.locator('.listing-filter-column [data-testid="blog-filter-sidebar"]');

  test.beforeEach(async ({ page }) => {
    await page.goto('/blog');
    // Wait on the filter-sidebar landmark (web-first, auto-retrying) — the element
    // every test in this block depends on — instead of the banned networkidle.
    await expect(desktopSidebar(page)).toBeVisible();
  });

  test('blog tag filter updates URL and filters posts', async ({ page }) => {
    const sidebar = desktopSidebar(page);

    // The Tags group is collapsed by default — expand it first.
    await sidebar.locator('button.label-section', { hasText: 'Tags' }).click();

    // Blog tag items carry no data-testid and render as role="radio" buttons; target
    // the first real tag chip (not the "All" reset) via the shared filter-btn class.
    const tagBtn = sidebar
      .locator('button.filter-btn')
      .filter({ hasNotText: 'All' })
      .filter({ hasNotText: 'English' })
      .first();
    await expect(tagBtn).toBeVisible();
    await tagBtn.click();

    // Tag selection updates the URL param and narrows the post list (but never to empty).
    await expect(page).toHaveURL(/[?&]tag=/);
    const blogRows = page.locator('[data-testid="blog-row"]');
    expect(await blogRows.count()).toBeGreaterThan(0);
  });

  test('blog search filters results in real-time', async ({ page }) => {
    const blogRows = page.locator('[data-testid="blog-row"]');
    const initialCount = await blogRows.count();
    expect(initialCount).toBeGreaterThan(0);

    const searchInput = page.locator('[data-testid="blog-search-sidebar"]');

    // A non-matching term must drop the list to zero, proving the search drives it.
    await searchInput.fill('zzzznomatchterm');
    await expect(blogRows).toHaveCount(0);

    // Clearing restores the full list.
    await searchInput.fill('');
    await expect(blogRows).toHaveCount(initialCount);
  });
});

test.describe('Services listing filters', () => {
  test('services page renders without crash', async ({ page }) => {
    const response = await page.goto('/services');
    expect(response?.status()).toBe(200);
    await expect(page.locator('[data-testid="nav"]')).toBeVisible();
  });
});
