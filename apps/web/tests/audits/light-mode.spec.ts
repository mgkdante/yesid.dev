// GO-W2.2 T8: per-page light-mode audit. Forces theme=light via the same
// localStorage channel the inline script reads, walks every page shape, and
// asserts: attribute applied pre-hydration, light surface painted, pinned-dark
// scenes stay dark, the toggle round-trips, and zero console errors.
//
// Detail routes are resolved dynamically (first card href on /projects and
// /blog) — Track 4 may rename service slugs this wave, so nothing is
// hardcoded below the collection level.
import { test, expect, type Page } from '@playwright/test';

const LIGHT_BG = 'rgb(250, 250, 248)'; // #FAFAF8
const DARK_BG = 'rgb(20, 20, 20)'; // #141414

const ROUTES = [
	'/',
	'/projects',
	'/services',
	'/blog',
	'/blog/personal',
	'/about',
	'/contact',
	'/tech-stack',
	'/this-route-does-not-exist',
];

function collectProblems(page: Page, problems: string[], allow: RegExp[] = []) {
	page.on('console', (msg) => {
		if (msg.type() === 'error' && !allow.some((re) => re.test(msg.text()))) {
			problems.push(`console: ${msg.text()}`);
		}
	});
	page.on('pageerror', (err) => problems.push(`pageerror: ${err.message}`));
}

// The intentionally-missing route legitimately answers HTTP 404 for its own
// document — Chromium logs that as a resource error. Everything else on the
// page must still be clean.
const EXPECTED_DOC_404 = /Failed to load resource: the server responded with a status of 404/;

async function assertRendersLight(page: Page, route: string, allow: RegExp[] = []) {
	const problems: string[] = [];
	collectProblems(page, problems, allow);

	await page.goto(route, { waitUntil: 'domcontentloaded' });
	// Pre-paint script must have applied the attribute already.
	await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

	const bodyBg = await page.evaluate(
		() => getComputedStyle(document.documentElement).backgroundColor,
	);
	expect(bodyBg).toBe(LIGHT_BG);

	await page.waitForLoadState('networkidle');
	expect(problems, problems.join('\n')).toEqual([]);
}

test.describe('light mode — per-page audit', () => {
	test.beforeEach(async ({ page }) => {
		await page.addInitScript(() => localStorage.setItem('theme', 'light'));
	});

	for (const route of ROUTES) {
		test(`${route} renders light with no console errors`, async ({ page }) => {
			const allow = route === '/this-route-does-not-exist' ? [EXPECTED_DOC_404] : [];
			await assertRendersLight(page, route, allow);
		});
	}

	test('project detail (first card href) renders light with no console errors', async ({
		page,
	}) => {
		await page.goto('/projects', { waitUntil: 'networkidle' });
		const href = await page.getByTestId('project-card').first().getAttribute('href');
		expect(href, 'first project card must link to a detail route').toBeTruthy();
		await assertRendersLight(page, href!);
	});

	test('blog post detail (first row href) renders light with no console errors', async ({
		page,
	}) => {
		await page.goto('/blog', { waitUntil: 'networkidle' });
		const href = await page.getByTestId('blog-row').first().getAttribute('href');
		expect(href, 'first blog row must link to a post route').toBeTruthy();
		await assertRendersLight(page, href!);
	});

	test('home closer stays pinned dark inside light mode', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		const closerBg = await page
			.getByTestId('closer-section')
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(closerBg).toBe(DARK_BG);
	});

	test('muted text resolves to the AA light value', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		const color = await page.evaluate(() => {
			const probe = document.createElement('span');
			probe.className = 'label-section';
			document.body.appendChild(probe);
			const c = getComputedStyle(probe).color;
			probe.remove();
			return c;
		});
		expect(color).toBe('rgb(111, 111, 111)'); // #6F6F6F
	});
});

test.describe('theme toggle behaviour', () => {
	// Playwright's default emulated colorScheme is LIGHT, and the pre-paint
	// script honors system preference when no choice is stored — so these
	// round-trips pin a dark-preferring user (the brand-default story).
	// System-preference behaviour itself is covered explicitly below.
	test.use({ colorScheme: 'dark' });

	test('toggle flips theme, persists across navigation + reload, updates meta', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		await page.getByTestId('theme-toggle').first().click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#FAFAF8');
		expect(await page.evaluate(() => localStorage.getItem('theme'))).toBe('light');

		await page.getByRole('link', { name: 'Projects' }).first().click();
		await page.waitForURL('**/projects');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.getByTestId('theme-toggle').first().click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('system preference applies when no stored choice (dark default otherwise)', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.emulateMedia({ colorScheme: 'dark' });
		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
	});

	test('toggle is an aria switch with a 44px hit target', async ({ page }) => {
		await page.goto('/', { waitUntil: 'networkidle' });
		const toggle = page.getByTestId('theme-toggle').first();
		await expect(toggle).toHaveAttribute('role', 'switch');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');
		const box = await toggle.boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
		expect(box!.width).toBeGreaterThanOrEqual(44);
	});
});
