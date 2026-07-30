import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

// playwright-core is present but only as a transitive dep of @playwright/test
// (bun's isolated install leaves no top-level symlink for it), so resolve it
// through that package's own module graph rather than adding a direct
// dependency just to run this receipt.
function loadPlaywrightCore() {
	try {
		return require('playwright-core');
	} catch {
		return createRequire(require.resolve('@playwright/test'))('playwright-core');
	}
}

const { chromium } = loadPlaywrightCore();

// Run against a live Vite dev target:
// node scripts/lang-switch-receipt.mjs http://127.0.0.1:5179
//
// Proves the in-app language switch performs a REAL document navigation.
// `<html lang>` is stamped server-side only (hooks.server.ts transformPageChunk
// over app.html's %lang%), so a client-routed switch changed the URL while
// documentElement.lang — and every string resolved from it — stayed on the old
// locale. yesid.dev has exactly ONE locale anchor (LanguageToggle, rendered by
// Nav); it CYCLES en → fr → es → en, so this receipt walks the whole cycle and
// re-checks the reload attribute on each hop's anchor before clicking it.
const targetArg = process.argv[2];
if (!targetArg) {
	throw new Error('Usage: node scripts/lang-switch-receipt.mjs <vite-dev-url>');
}

const targetUrl = new URL(targetArg);
if (!['http:', 'https:'].includes(targetUrl.protocol)) {
	throw new Error(`Vite dev URL must use http or https: ${targetUrl.href}`);
}

// /services is the live-confirmed repro (2026-07-30): the URL flipped to
// /fr/services while lang stayed "en" and the copy stayed English.
const startUrl = new URL('/services', targetUrl);

// One entry per click. `switchName` is the anchor's accessible name BEFORE the
// click (it self-names the CURRENT locale); `expectedHeading` is the first
// service card's h2 on the services listing — translated body copy, i.e. exactly
// what stayed English under the defect. The trailing '.' is the decorative
// `.title-dot` span inside the h2, so it is part of the accessible name.
const HOPS = [
	{
		from: 'en',
		to: 'fr',
		switchName: 'Language: English',
		expectedHref: '/fr/services',
		expectedPath: '/fr/services',
		expectedHeading: 'Bases de données et SQL.',
	},
	{
		from: 'fr',
		to: 'es',
		switchName: 'Langue: Français',
		expectedHref: '/es/services',
		expectedPath: '/es/services',
		expectedHeading: 'Bases de datos y SQL.',
	},
	{
		from: 'es',
		to: 'en',
		switchName: 'Idioma: Español',
		expectedHref: '/services',
		expectedPath: '/services',
		expectedHeading: 'Databases & SQL.',
	},
];

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE;
const browser = await chromium.launch({
	headless: true,
	...(executablePath ? { executablePath } : {}),
});

try {
	const context = await browser.newContext({
		viewport: { width: 1280, height: 900 },
		serviceWorkers: 'block',
	});
	const page = await context.newPage();
	try {
		const response = await page.goto(startUrl.href, { waitUntil: 'domcontentloaded' });
		if (!response?.ok()) {
			throw new Error(
				`Navigation failed (${response?.status() ?? 'no response'}): ${startUrl.href}`,
			);
		}

		const failures = [];
		const hops = [];

		for (const hop of HOPS) {
			const languageSwitch = page.getByTestId('language-toggle');
			await languageSwitch.waitFor({ state: 'visible' });

			// The client router must be hydrated before the click, or the click is a
			// native document navigation and the receipt passes even when the reload
			// attribute is absent — i.e. it would prove nothing about the fix. This
			// has to be re-established on EVERY hop: each switch replaces the
			// document, so the next click needs the fresh document hydrated too.
			await page.waitForLoadState('load');
			await page.waitForLoadState('networkidle');

			const startingLang = await page.locator('html').getAttribute('lang');
			const switchHref = await languageSwitch.getAttribute('href');
			const documentIdBefore = await page.evaluate(() => {
				globalThis.__langReceiptDocId ??= Math.random().toString(36).slice(2);
				return globalThis.__langReceiptDocId;
			});
			const switchName = await languageSwitch.getAttribute('aria-label');

			await Promise.all([
				page.waitForURL((url) => url.pathname === hop.expectedPath),
				languageSwitch.click(),
			]);
			// data-sveltekit-reload makes this a full document navigation, so the
			// asserted DOM belongs to a document that is still loading at
			// domcontentloaded; wait for the heading itself rather than sampling
			// whatever exists at that instant.
			await page.waitForLoadState('load');

			const finalUrl = new URL(page.url());
			const heading = page.getByRole('heading', {
				level: 2,
				name: hop.expectedHeading,
				exact: true,
			});
			const headingVisible = await heading
				.first()
				.waitFor({ state: 'visible', timeout: 15_000 })
				.then(() => true)
				.catch(() => false);
			const htmlLang = await page.locator('html').getAttribute('lang');

			const label = `${hop.from}→${hop.to}`;
			const documentIdAfter = await page.evaluate(() => globalThis.__langReceiptDocId ?? null);
			if (documentIdAfter !== documentIdBefore) {
				failures.push(
					`${label}: the switch replaced the document; this receipt covers the client-routed path`,
				);
			}
			if (startingLang !== hop.from) {
				failures.push(`${label}: starting html lang: expected ${hop.from}, got ${String(startingLang)}`);
			}
			if (switchName !== hop.switchName) {
				failures.push(
					`${label}: switch accessible name: expected ${hop.switchName}, got ${String(switchName)}`,
				);
			}
			if (switchHref !== hop.expectedHref) {
				failures.push(`${label}: switch href: expected ${hop.expectedHref}, got ${String(switchHref)}`);
			}
			if (finalUrl.pathname !== hop.expectedPath) {
				failures.push(`${label}: URL path: expected ${hop.expectedPath}, got ${finalUrl.pathname}`);
			}
			if (htmlLang !== hop.to) {
				failures.push(`${label}: html lang: expected ${hop.to}, got ${String(htmlLang)}`);
			}
			if (!headingVisible) {
				failures.push(`${label}: missing visible h2: ${hop.expectedHeading}`);
			}

			hops.push({
				hop: label,
				startingLang,
				switchName,
				switchHref,
				sameDocument: documentIdAfter === documentIdBefore,
				hydratedBeforeClick: true,
				finalUrl: finalUrl.href,
				htmlLang,
				expectedHeading: hop.expectedHeading,
				headingVisible,
			});
		}

		const receipt = {
			targetUrl: targetUrl.href,
			generatedAt: new Date().toISOString(),
			startUrl: startUrl.href,
			clickCount: hops.length,
			hops,
			serviceWorkers: 'block',
			passed: failures.length === 0,
			failures,
		};
		process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
		if (failures.length > 0) {
			throw new Error(`Language-switch receipt failed:\n${failures.join('\n')}`);
		}
	} finally {
		await context.close();
	}
} finally {
	await browser.close();
}
