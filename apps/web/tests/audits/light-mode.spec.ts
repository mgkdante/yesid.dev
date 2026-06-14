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

	test('home closer is transparent over the grid (round 6), terminal stays solid', async ({ page }) => {
		// GO2-W5 round 6 (operator): the terminus section paints NOTHING — the
		// page's circuit-grid schematic shows through in both themes (inverts
		// the old "closer painted solid" probe). Solidity lives only in the
		// terminal board inside: GO2-W5 taste round 2 contract — the terminal
		// body IS the site background (--terminal === --background, solid);
		// identity lives in chrome/rule-border/type, not a surface color.
		await page.goto('/', { waitUntil: 'networkidle' });
		const closerBg = await page
			.getByTestId('closer-section')
			.evaluate((el) => getComputedStyle(el).backgroundColor);
		expect(closerBg).toBe('rgba(0, 0, 0, 0)'); // transparent — grid shows through

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

	test('round 4: four-color doctrine — yellow readouts, black structure, 3px list frames', async ({ page }) => {
		// Operator doctrine: orange signage / yellow wayfinding / reflective
		// white / black tape-structure. Probe the light-mode computed values.
		await page.goto('/projects', { waitUntil: 'networkidle' });

		// Listing-header subline = YELLOW overline (accent-text #815D00).
		const subtitle = await page.evaluate(() => {
			const el = document.querySelector('.projects-header-subtitle');
			return el ? getComputedStyle(el).color : null;
		});
		expect(subtitle).toBe('rgb(129, 93, 0)');

		// Project cards (list items) draw the 3px round-4 frame.
		const cardBorder = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="project-card"] .card-surface');
			return el ? getComputedStyle(el).borderTopWidth : null;
		});
		expect(cardBorder).toBe('3px');

		// Footer status line = YELLOW departure-board readout. (:scope > spans
		// only — nested spans inside <small>/<nav> are different voices.)
		const statusColor = await page.evaluate(() => {
			const rule = document.querySelector('.footer-status-border');
			const span = rule?.querySelector(':scope > span:last-of-type');
			return span ? getComputedStyle(span).color : null;
		});
		expect(statusColor).toBe('rgb(129, 93, 0)');

		// BLACK structure: light --border-strong resolves to the #1C1814
		// signage family (black tape on paper). The prod CSS pipeline
		// lowercases hex literals — compare case-insensitively.
		const borderStrong = await page.evaluate(() =>
			getComputedStyle(document.documentElement).getPropertyValue('--border-strong').trim(),
		);
		expect(borderStrong.toUpperCase()).toBe('#1C1814');

		// Blog rows carry the 3px list-item frame too.
		await page.goto('/blog', { waitUntil: 'networkidle' });
		const rowBorder = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="blog-row"] .card-surface');
			return el ? getComputedStyle(el).borderTopWidth : null;
		});
		expect(rowBorder).toBe('3px');
	});

	test('round 5: yellow-conversion doctrine + card parity + bolder rails', async ({ page }) => {
		const AMBER = 'rgb(255, 182, 39)'; // #FFB627 --accent (theme-invariant)
		const SIGNAGE_INK = 'rgb(28, 24, 20)'; // #1C1814 --signage-bg
		const LIGHT_PRIMARY = 'rgb(157, 82, 0)'; // #9D5200

		// Contact submit = THE yellow conversion button (signage pair, light too).
		await page.goto('/contact', { waitUntil: 'networkidle' });
		const submit = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="contact-submit"]');
			if (!el) return null;
			const s = getComputedStyle(el);
			return { bg: s.backgroundColor, ink: s.color };
		});
		expect(submit).toEqual({ bg: AMBER, ink: SIGNAGE_INK });

		// Hero: contact CTA yellow, projects CTA stays orange (≤1 yellow per view).
		await page.goto('/', { waitUntil: 'networkidle' });
		const hero = await page.evaluate(() => {
			const contact = document.querySelector('[data-testid="hero-cta-contact"]');
			const projects = document.querySelector('[data-testid="hero-cta-projects"]');
			return {
				contactBg: contact ? getComputedStyle(contact).backgroundColor : null,
				projectsBg: projects ? getComputedStyle(projects).backgroundColor : null,
			};
		});
		expect(hero.contactBg).toBe(AMBER);
		expect(hero.projectsBg).toBe(LIGHT_PRIMARY);

		// Closer CTA = solid yellow signage button.
		const closerCta = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="closer-cta"]');
			if (!el) return null;
			const s = getComputedStyle(el);
			return { bg: s.backgroundColor, ink: s.color };
		});
		expect(closerCta).toEqual({ bg: AMBER, ink: SIGNAGE_INK });

		// R5-2 card parity: project card chassis = bare 3px frame, no inset
		// route strip in the box-shadow stack. (Chrome serializes shadows as
		// "color X Y blur spread inset" — the old strip read "2px 0px 0px 0px inset".)
		await page.goto('/projects', { waitUntil: 'networkidle' });
		const cardShadow = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="project-card"] .card-surface');
			return el ? getComputedStyle(el).boxShadow : null;
		});
		expect(cardShadow).toBeTruthy();
		expect(cardShadow).not.toContain('2px 0px 0px 0px inset');

		// R5-3 bolder rails: the edge-title rule draws at 2px.
		const railWidth = await page.evaluate(() => {
			const el = document.querySelector('.accent-rail');
			return el ? (el as HTMLElement).offsetWidth : null;
		});
		expect(railWidth).toBe(2);
	});

	test('round 6: detail art on the RIGHT + top band matches the listing', async ({ page }) => {
		// Resolve a real detail route from the listing (nothing hardcoded
		// below the collection level — Track 4 may rename service slugs).
		await page.goto('/services', { waitUntil: 'networkidle' });

		// The listing's solid backdrop above the sticky tabs (the reference
		// treatment the detail page must match).
		const listingBand = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="service-listing-page"] .tabs-bar');
			return el ? getComputedStyle(el, '::before').backgroundColor : null;
		});
		expect(listingBand).toBe(LIGHT_BG);

		const href = await page.locator('a[href^="/services/"]').first().getAttribute('href');
		expect(href, 'listing must link to a service detail route').toBeTruthy();
		await page.goto(href!, { waitUntil: 'networkidle' });

		// R6-3 top-band parity: the detail page paints the same solid band
		// above its StationTabs (was transparent — grid peeked through).
		const detailBand = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="service-detail-page"] .tabs-bar');
			return el ? getComputedStyle(el, '::before').backgroundColor : null;
		});
		expect(detailBand).toBe(LIGHT_BG);

		// Fun art on the RIGHT (operator pass 2 — commit 2d3f7796 "move service
		// detail art right"; hero-grid is `1fr auto`, text col then svg col): the
		// svg panel renders and sits to the RIGHT of the hero text column.
		const layout = await page.evaluate(() => {
			const panel = document.querySelector('.svg-desktop [data-testid="service-svg-panel"]');
			const text = document.querySelector('.hero-text');
			if (!panel || !text) return null;
			return {
				panelLeft: panel.getBoundingClientRect().left,
				textRight: text.getBoundingClientRect().right,
				hasArt: !!panel.querySelector('svg'),
			};
		});
		expect(layout, 'detail hero must render the svg panel + text column').toBeTruthy();
		expect(layout!.hasArt).toBe(true);
		expect(layout!.textRight).toBeLessThanOrEqual(layout!.panelLeft);
	});

	test('go2/home-cards: solid paper cards, signage chip, yellow metric, whitened image band', async ({ page }) => {
		// Story-first proof cards must stay theme-correct in light mode:
		// solid --card paper surface (no grid bleed-through), 3px blog-parity
		// chassis, theme-INVARIANT signage chip, YELLOW-voice metric, ORANGE
		// exploration line, and the F5 image doctrine (light WHITENS the
		// resting B&W band instead of dimming it).
		await page.goto('/', { waitUntil: 'networkidle' });
		await page.getByTestId('proof-reel-section').scrollIntoViewIfNeeded();

		const chassis = await page.locator('.proof-card').first().evaluate((el) => {
			const s = getComputedStyle(el);
			return { bg: s.backgroundColor, borderW: s.borderTopWidth };
		});
		expect(chassis.bg).toBe('rgb(255, 253, 248)'); // #FFFDF8 light --card — solid
		expect(chassis.borderW).toBe('3px'); // round-5 blog-card chassis parity

		// Signage chip: real signs don't reskin when the lights change.
		const chip = await page.getByTestId('proof-station-chip').first().evaluate((el) => {
			const s = getComputedStyle(el);
			return { bg: s.backgroundColor, ink: s.color };
		});
		expect(chip).toEqual({ bg: 'rgb(28, 24, 20)', ink: 'rgb(255, 182, 39)' });

		// Metric = YELLOW wayfinding voice; exploration line = ORANGE action.
		const metricColor = await page
			.getByTestId('proof-metric-value')
			.first()
			.evaluate((el) => getComputedStyle(el).color);
		expect(metricColor).toBe('rgb(129, 93, 0)'); // #815D00 light accent-text
		const seeBuildColor = await page
			.getByTestId('proof-see-build')
			.first()
			.evaluate((el) => getComputedStyle(el).color);
		expect(seeBuildColor).toBe('rgb(157, 82, 0)'); // #9D5200 light primary

		// F5 doctrine on the resting band: light mode whitens the B&W photo
		// (brightness > 1), never the dark dim. Active slide stays colored.
		const restingImg = page.locator('.proof-card[data-active="false"] .proof-img');
		if ((await restingImg.count()) > 0) {
			const filter = await restingImg.first().evaluate((el) => getComputedStyle(el).filter);
			expect(filter).toContain('grayscale(1)');
			expect(filter).toContain('brightness(1.12)');
		}
		const activeImg = page.locator('.proof-card[data-active="true"] .proof-img');
		if ((await activeImg.count()) > 0) {
			const filter = await activeImg.first().evaluate((el) => getComputedStyle(el).filter);
			expect(filter).toContain('grayscale(0)');
		}
	});

	test('final batch: the footer street panel + ONE platform-edge tape at the seam', async ({ page }) => {
		// 6c: the footer paints the muted street panel (light = station paper
		// #F1E9DA; dark asphalt #1E1E1E is pinned in tokens.test) under the
		// theme-invariant platform-edge tape. 6b: the page above contributes
		// NO second tape at the footer seam.
		await page.goto('/about', { waitUntil: 'networkidle' });

		const footer = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="footer"]');
			if (!el) return null;
			const sep = el.querySelector('.footer-gradient-sep');
			return {
				bg: getComputedStyle(el).backgroundColor,
				tape: sep ? getComputedStyle(sep).backgroundImage : '',
			};
		});
		expect(footer).not.toBeNull();
		expect(footer!.bg).toBe('rgb(241, 233, 218)'); // #F1E9DA light --muted
		expect(footer!.tape).toContain('rgb(255, 182, 39)'); // #FFB627 hazard-a
		expect(footer!.tape).toContain('rgb(28, 24, 20)'); // #1C1814 hazard-b

		// 6b: About's only page-owned hazard stripe is the TOP one — nothing
		// tape-shaped may sit between the bento section and the footer tape
		// (tapes INSIDE cards, e.g. the CTA terminal chrome, are fine).
		const tapesBelowPage = await page.evaluate(() => {
			const section = document.querySelector('[data-testid="page-about"]');
			if (!section) return -1;
			return Array.from(document.querySelectorAll('main div[style]')).filter((el) => {
				if (!(el.getAttribute('style') ?? '').includes('repeating-linear-gradient')) return false;
				const pos = section.compareDocumentPosition(el);
				return (
					pos & Node.DOCUMENT_POSITION_FOLLOWING && !(pos & Node.DOCUMENT_POSITION_CONTAINED_BY)
				);
			}).length;
		});
		expect(tapesBelowPage).toBe(0);
	});
});

test.describe('theme toggle behaviour', () => {
	// Pin the brand-default story explicitly; system color preference is ignored
	// unless the user has stored a real theme choice.
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

	test('system preference is ignored: defaults dark, stored light still wins', async ({ page }) => {
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/', { waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		await page.evaluate(() => localStorage.setItem('theme', 'light'));
		await page.reload({ waitUntil: 'domcontentloaded' });
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		await page.emulateMedia({ colorScheme: 'dark' });
		await page.evaluate(() => localStorage.removeItem('theme'));
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
