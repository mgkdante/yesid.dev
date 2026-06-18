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
import { serviceDetailLinks } from '../_support/helpers';

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

	// Settle the page before asserting zero console errors (was networkidle —
	// racy against the contact terminal's /api/weather fetch + clock interval).
	// `load` fires all resources; the footer is rendered by +layout.svelte on
	// EVERY route (including the 404 error page), so its visibility is a
	// deterministic signal that hydration has run far enough for any deferred
	// console/page error to have surfaced.
	await page.waitForLoadState('load');
	await expect(page.getByTestId('footer')).toBeVisible();
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
		await page.goto('/projects');
		const card = page.getByTestId('project-card').first();
		await expect(card).toBeVisible(); // card present before reading its href
		const href = await card.getAttribute('href');
		expect(href, 'first project card must link to a detail route').toBeTruthy();
		await assertRendersLight(page, href!);
	});

	test('blog post detail (first row href) renders light with no console errors', async ({
		page,
	}) => {
		await page.goto('/blog');
		const row = page.getByTestId('blog-row').first();
		await expect(row).toBeVisible(); // row present before reading its href
		const href = await row.getAttribute('href');
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
		await page.goto('/');
		// The board is nested inside the section, so its visibility guarantees
		// both surfaces are painted before we read their computed colors.
		await expect(page.getByTestId('closer-board')).toBeVisible();
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
		await page.goto('/');
		// Probe reads a CSS-var-driven color; the footer landmark guarantees the
		// stylesheet + light theme are applied before we append the probe.
		await expect(page.getByTestId('footer')).toBeVisible();
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
		await page.goto('/');
		await expect(page.getByTestId('footer')).toBeVisible(); // stylesheet + theme applied
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
		await page.goto('/');
		await expect(page.getByTestId('closer-board')).toBeVisible(); // probe target painted
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
		await page.goto('/projects');
		// Footer visibility means the whole page (blueprint header above it +
		// footer-status-border below) has painted before we probe computed styles.
		await expect(page.getByTestId('footer')).toBeVisible();

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
		await page.goto('/projects');
		await expect(page.getByTestId('project-card').first()).toBeVisible(); // cards painted
		await expect(page.getByTestId('footer')).toBeVisible(); // footer-status-border painted

		// Listing-header subline = YELLOW overline (accent-text #815D00).
		// Consolidation renamed the bespoke `.projects-header-subtitle` to the
		// shared listing chrome class `.listing-header-subtitle` (same element,
		// same voice — still the accent-text overline above the listing title).
		const subtitle = await page.evaluate(() => {
			const el = document.querySelector('.listing-header-subtitle');
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
		await page.goto('/blog');
		await expect(page.getByTestId('blog-row').first()).toBeVisible(); // rows painted
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
		await page.goto('/contact');
		await expect(page.getByTestId('contact-submit').first()).toBeVisible(); // button painted
		const submit = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="contact-submit"]');
			if (!el) return null;
			const s = getComputedStyle(el);
			return { bg: s.backgroundColor, ink: s.color };
		});
		expect(submit).toEqual({ bg: AMBER, ink: SIGNAGE_INK });

		// Hero: contact CTA yellow, projects CTA stays orange (≤1 yellow per view).
		await page.goto('/');
		await expect(page.getByTestId('hero-cta-contact').first()).toBeVisible(); // hero CTAs painted
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
		await page.goto('/projects');
		await expect(page.getByTestId('project-card').first()).toBeVisible(); // cards + rail painted
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
		await page.goto('/services');
		await expect(page.getByTestId('service-listing-page')).toBeVisible(); // tabs-bar painted

		// The listing's solid backdrop above the sticky tabs (the reference
		// treatment the detail page must match).
		const listingBand = await page.evaluate(() => {
			const el = document.querySelector('[data-testid="service-listing-page"] .tabs-bar');
			return el ? getComputedStyle(el, '::before').backgroundColor : null;
		});
		expect(listingBand).toBe(LIGHT_BG);

		const detailLink = serviceDetailLinks(page).first();
		await expect(detailLink, 'listing must link to a service detail route').toBeVisible();
		const href = await detailLink.getAttribute('href');
		expect(href, 'listing must link to a service detail route').toBeTruthy();
		await page.goto(href!);
		// Detail landmark visible → tabs-bar + hero composition have rendered.
		await expect(page.getByTestId('service-detail-page')).toBeVisible();

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
		// Wait for the desktop svg panel to be visible so its geometry is settled
		// before we read bounding rects.
		await expect(page.locator('.svg-desktop [data-testid="service-svg-panel"]')).toBeVisible();
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

	test('go2/home-cards: solid paper cards, signage chip, yellow metric', async ({ page }) => {
		// Story-first proof cards must stay theme-correct in light mode:
		// solid --card paper surface (no grid bleed-through), 3px blog-parity
		// chassis, theme-INVARIANT signage chip, and a YELLOW-voice metric.
		// (The consolidation migrated the reel onto the shared ProjectCard; the
		// per-card "see the build" line and the grayscale-at-rest image doctrine
		// were dropped with it — operator-accepted; the station chip was restored.)
		await page.goto('/');
		const proofReel = page.getByTestId('proof-reel-section');
		await expect(proofReel).toBeVisible(); // section + proof cards painted
		await proofReel.scrollIntoViewIfNeeded();

		// Consolidation: the bespoke `.proof-card` chassis was replaced by the
		// shared ProjectCard (variant="proof"). The chassis surface is now the
		// generic `.card-surface` inside data-testid="proof-card"; the proof
		// variant still overrides it to the 3px blog-parity frame.
		const chassis = await page
			.getByTestId('proof-card')
			.first()
			.locator('.card-surface')
			.evaluate((el) => {
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

		// Metric = YELLOW wayfinding voice.
		const metricColor = await page
			.getByTestId('proof-metric-value')
			.first()
			.evaluate((el) => getComputedStyle(el).color);
		expect(metricColor).toBe('rgb(129, 93, 0)'); // #815D00 light accent-text
	});

	test('final batch: the footer street panel + ONE platform-edge tape at the seam', async ({ page }) => {
		// 6c: the footer paints the muted street panel (light = station paper
		// #F1E9DA; dark asphalt #1E1E1E is pinned in tokens.test) under the
		// theme-invariant platform-edge tape. 6b: the page above contributes
		// NO second tape at the footer seam.
		await page.goto('/about');
		await expect(page.getByTestId('page-about')).toBeVisible(); // about section painted
		await expect(page.getByTestId('footer')).toBeVisible(); // footer panel + tape painted

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
		await page.goto('/');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		// Wait for the hydrated toggle before clicking — replaces networkidle.
		await expect(page.getByTestId('theme-toggle').first()).toBeVisible();
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
		await page.goto('/');
		const toggle = page.getByTestId('theme-toggle').first();
		await expect(toggle).toBeVisible(); // toggle painted before reading attrs/box
		await expect(toggle).toHaveAttribute('role', 'switch');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');
		const box = await toggle.boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(44);
		expect(box!.width).toBeGreaterThanOrEqual(44);
	});
});
