// GO-W2.2 T8: per-page light-mode audit. Forces theme=light via the same
// localStorage channel the inline script reads, walks every page shape, and
// asserts: attribute applied pre-hydration, light surface painted, the home
// closer + its terminal follow the theme (go2/w4 — the old pinned-dark scene
// is gone), the toggle round-trips, and zero console errors.
//
// Detail routes are resolved dynamically (first card href on /projects and
// /blog) — Track 4 may rename service slugs this wave, so nothing is
// hardcoded below the collection level.
import { test, expect, type Page } from '@playwright/test';

const LIGHT_BG = 'rgb(247, 242, 233)'; // #F7F2E9 — GO2-W5 warm station paper

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

	test('home closer follows light mode (go2/w4: dark pin removed)', async ({ page }) => {
		// Operator QA: the closer's pinned-dark wrapper was the "extra layer"
		// keeping its terminal dark in light mode. Section + terminal now
		// follow the active theme. GO2-W5 taste round 2: the terminal body IS
		// the site background (--terminal === --background, solid) — identity
		// lives in chrome/rule-border/type, not a special surface color.
		await page.goto('/', { waitUntil: 'networkidle' });
		const closerBg = await page
			.getByTestId('closer-section')
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(closerBg).toBe(LIGHT_BG);

		const terminalBg = await page
			.getByTestId('closer-board')
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(terminalBg).toBe(LIGHT_BG); // --terminal === --background (round-2 contract)
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
		expect(color).toBe('rgb(110, 101, 87)'); // #6E6557 — GO2-W5 warm muted-foreground
	});

	test('station labels speak the wayfinding voice (accent-text, not primary)', async ({ page }) => {
		// GO2-W5: .label-station is signage — amber ink in light (#815D00).
		await page.goto('/', { waitUntil: 'networkidle' });
		const color = await page.evaluate(() => {
			const probe = document.createElement('span');
			probe.className = 'label-station';
			document.body.appendChild(probe);
			const c = getComputedStyle(probe).color;
			probe.remove();
			return c;
		});
		expect(color).toBe('rgb(129, 93, 0)'); // #815D00 --accent-text (light)
	});

	test('hazard separators render real black+yellow tape in light mode', async ({ page }) => {
		// GO2-W5 non-negotiable: light-mode hazard strips stay BLACK+YELLOW
		// (theme-invariant tokens), never orange+white. Probe the strip under
		// the closer board's titlebar (TerminalChrome composes Separator).
		await page.goto('/', { waitUntil: 'networkidle' });
		const bgImage = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="closer-board"] > div:nth-child(2)');
			return el ? getComputedStyle(el).backgroundImage : '';
		});
		expect(bgImage).toContain('rgb(255, 182, 39)'); // #FFB627 hazard-a
		expect(bgImage).toContain('rgb(28, 24, 20)'); // #1C1814 hazard-b
	});

	test('round 3: bolder structure — 2px rules and stronger blueprint art in light', async ({ page }) => {
		// Operator round 3: dividers one step thicker in both modes; light-mode
		// blueprint art up another step. Probe computed styles on /projects
		// (blueprint header + footer present on one page).
		await page.goto('/projects', { waitUntil: 'networkidle' });

		// .divider-dashed: 2px dashed route-set rule (light primary #9D5200).
		const divider = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.className = 'divider-dashed';
			document.body.appendChild(probe);
			const s = getComputedStyle(probe);
			const out = {
				width: s.borderTopWidth,
				style: s.borderTopStyle,
				color: s.borderTopColor,
			};
			probe.remove();
			return out;
		});
		expect(divider).toEqual({ width: '2px', style: 'dashed', color: 'rgb(157, 82, 0)' });

		// Footer departure rule: 2px solid amber (#B57F00 light line-amber).
		const footerRule = await page.evaluate(() => {
			const el = document.querySelector('.footer-status-border');
			if (!el) return null;
			const s = getComputedStyle(el);
			return { width: s.borderTopWidth, color: s.borderTopColor };
		});
		expect(footerRule).toEqual({ width: '2px', color: 'rgb(181, 127, 0)' });

		// Blueprint header hero layer: round-3 light opacity (0.34 → 0.46).
		const heroOpacity = await page.evaluate(() => {
			const el = document.querySelector('.hero-svg');
			return el ? getComputedStyle(el).opacity : null;
		});
		expect(heroOpacity).toBe('0.46');
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
		await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#F7F2E9');
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
