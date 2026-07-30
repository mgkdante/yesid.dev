import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const playwrightTestRequire = createRequire(require.resolve('@playwright/test/package.json'));
const playwrightRequire = createRequire(playwrightTestRequire.resolve('playwright/package.json'));
const { chromium } = playwrightRequire('playwright-core');

const previewArg = process.argv[2];
if (!previewArg) {
	throw new Error('Usage: node scripts/strip-geometry-probe.mjs <preview-url>');
}

const previewUrl = new URL(previewArg);
if (!['http:', 'https:'].includes(previewUrl.protocol)) {
	throw new Error(`Preview URL must use http or https: ${previewUrl.href}`);
}

const widths = [375, 767, 768, 1023, 1024, 1279, 1280];
const themes = ['dark', 'light'];
const locales = [
	{ name: 'en', prefix: '' },
	{ name: 'fr', prefix: '/fr' },
	{ name: 'es', prefix: '/es' },
];
const listingSelector = '[data-testid="service-listing-page"]';
const detailSelector = '[data-testid="service-detail-page"]';
const stripSelectors = {
	listingTop: `${listingSelector} > .tabs-bar`,
	listingBottom: `${listingSelector} > .strip-bar > [data-testid="projects-strip"]`,
	detailTop: `${detailSelector} > .tabs-bar`,
};

function pageUrl(prefix, path) {
	return new URL(`${prefix}${path}`, `${previewUrl.origin}/`).href;
}

function round(value) {
	return Math.round(value * 1000) / 1000;
}

async function settle(page, landmark) {
	await page.waitForSelector(landmark, { state: 'visible' });
	await page.evaluate(async () => {
		await document.fonts.ready;
		await new Promise((resolve) =>
			requestAnimationFrame(() => requestAnimationFrame(resolve)),
		);
	});
}

async function goto(page, url, landmark) {
	const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
	if (!response?.ok()) {
		throw new Error(`Navigation failed (${response?.status() ?? 'no response'}): ${url}`);
	}
	await settle(page, landmark);
}

async function rect(page, selector) {
	const locator = page.locator(selector);
	const count = await locator.count();
	if (count !== 1) {
		throw new Error(`Expected one match for ${selector}, found ${count}`);
	}
	return locator.evaluate((element) => {
		const box = element.getBoundingClientRect();
		return {
			left: box.left,
			top: box.top,
			right: box.right,
			bottom: box.bottom,
			width: box.width,
			height: box.height,
		};
	}).then((box) => Object.fromEntries(
		Object.entries(box).map(([key, value]) => [key, round(value)]),
	));
}

function pairwiseDeltas(strips) {
	const pairs = [
		['yesid-listing-top', 'yesid-detail-top'],
		['yesid-listing-top', 'yesid-bottom'],
		['yesid-detail-top', 'yesid-bottom'],
	];
	const byName = new Map(strips.map((strip) => [strip.name, strip.rect]));
	return pairs.map(([from, to]) => {
		const signedHeightPx = round(byName.get(to).height - byName.get(from).height);
		return {
			from,
			to,
			signedHeightPx,
			absoluteHeightPx: Math.abs(signedHeightPx),
		};
	});
}

async function projectStateRects(page) {
	const stationIds = await page
		.locator('[data-testid^="station-tab-"]')
		.evaluateAll((tabs) => tabs.map((tab) => tab.getAttribute('data-testid').slice('station-tab-'.length)));
	const states = new Map();
	const clickOrder = [...stationIds.slice(1), stationIds[0]];

	for (const stationId of clickOrder) {
		await page.getByTestId(`station-tab-${stationId}`).evaluate((tab) => tab.click());
		await page.waitForFunction((id) => {
			const active = document.querySelector(`[data-testid="station-tab-${id}"]`);
			return (
				new URL(window.location.href).searchParams.get('station') === id &&
				active?.getAttribute('data-active') === 'true'
			);
		}, stationId);
		await settle(page, listingSelector);

		const projectCount = await page.locator(`${stripSelectors.listingBottom} .strip-link`).count();
		const stateName = projectCount === 0 ? 'empty' : projectCount === 1 ? 'one' : 'many';
		if (!states.has(stateName)) {
			states.set(stateName, {
				name: stateName,
				source: 'service-state',
				stationId,
				projectCount,
				countLabel: await page.locator(`${stripSelectors.listingBottom} .strip-count`).innerText(),
				rect: await rect(page, stripSelectors.listingBottom),
			});
		}
		if (states.size === 3) break;
	}
	if (!states.has('empty')) {
		const links = page.locator(`${stripSelectors.listingBottom} .strip-link`);
		const sourceProjectCount = await links.count();
		await links.evaluateAll((elements) => {
			elements.forEach((element) => {
				element.style.display = 'none';
			});
		});
		await settle(page, listingSelector);
		states.set('empty', {
			name: 'empty',
			source: 'geometry-projection',
			sourceProjectCount,
			projectCount: 0,
			rect: await rect(page, stripSelectors.listingBottom),
		});
	}
	if (!states.has('one') || !states.has('many')) {
		throw new Error(`Expected live one and many project states; found ${[...states.keys()]}`);
	}
	return ['empty', 'one', 'many'].map((name) => states.get(name));
}

async function assertRenderContext(page, route, theme, locale) {
	const rendered = await page.locator('html').evaluate((element) => ({
		theme: element.getAttribute('data-theme'),
		locale: element.getAttribute('lang')?.split('-')[0],
	}));
	if (rendered.theme !== theme) {
		throw new Error(`Theme mismatch at ${route}: expected ${theme}, got ${rendered.theme}`);
	}
	if (rendered.locale !== locale) {
		throw new Error(`Locale mismatch at ${route}: expected ${locale}, got ${rendered.locale}`);
	}
}

async function newContext(browser, width, theme) {
	const context = await browser.newContext({
		viewport: { width, height: 900 },
		colorScheme: theme,
	});
	await context.addInitScript((selectedTheme) => {
		localStorage.setItem('theme', selectedTheme);
	}, theme);
	return context;
}

async function measureScenario(browser, width, theme, locale) {
	const context = await newContext(browser, width, theme);
	const page = await context.newPage();
	try {
		const listingRoute = pageUrl(locale.prefix, '/services');
		await goto(page, listingRoute, listingSelector);
		await assertRenderContext(page, listingRoute, theme, locale.name);

		const listingTop = await rect(page, stripSelectors.listingTop);
		const listingBottom = await rect(page, stripSelectors.listingBottom);
		const projects = await projectStateRects(page);
		const stripTargetPx = await page.locator('.circuit-grid').evaluate((element) =>
			Number.parseFloat(getComputedStyle(element).getPropertyValue('--strip-h')),
		);

		const detailRoute = pageUrl(locale.prefix, '/services/database-engineering');
		await goto(page, detailRoute, detailSelector);
		await assertRenderContext(page, detailRoute, theme, locale.name);
		const detailTop = await rect(page, stripSelectors.detailTop);
		const strips = [
			{ name: 'yesid-listing-top', route: listingRoute, rect: listingTop },
			{ name: 'yesid-detail-top', route: detailRoute, rect: detailTop },
			{ name: 'yesid-bottom', route: listingRoute, rect: listingBottom },
		];

		return {
			width,
			height: 900,
			theme,
			locale: locale.name,
			stripTargetPx,
			strips,
			pairwiseDeltas: pairwiseDeltas(strips),
			projectStates: projects,
		};
	} finally {
		await context.close();
	}
}

async function measureSafeArea(browser) {
	const context = await newContext(browser, 375, 'dark');
	const page = await context.newPage();
	try {
		const session = await context.newCDPSession(page);
		await session.send('Emulation.setSafeAreaInsetsOverride', {
			insets: { top: 0, right: 0, bottom: 24, left: 0 },
		});
		const route = pageUrl('', '/services');
		await goto(page, route, listingSelector);
		const composite = await rect(page, stripSelectors.listingBottom);
		const wrapper = await rect(page, `${listingSelector} > .strip-bar`);
		const paddingBottomPx = await page
			.locator(`${listingSelector} > .strip-bar`)
			.evaluate((element) => Number.parseFloat(getComputedStyle(element).paddingBottom));
		return {
			route,
			width: 375,
			theme: 'dark',
			locale: 'en',
			bottomInsetPx: 24,
			paddingBottomPx,
			composite,
			wrapper,
			outsideCompositePx: round(wrapper.height - composite.height),
		};
	} finally {
		await context.close();
	}
}

async function measureTextResize(browser) {
	const context = await newContext(browser, 375, 'dark');
	const page = await context.newPage();
	try {
		const route = pageUrl('', '/services');
		await goto(page, route, listingSelector);
		await page.evaluate(() => {
			document.documentElement.style.fontSize = '200%';
		});
		await settle(page, listingSelector);
		const clippedElements = await page
			.locator('.station-tab, .strip-link, .strip-label, .strip-count')
			.evaluateAll((elements) =>
				elements.flatMap((element) => {
					const verticalOverflow = element.scrollHeight - element.clientHeight;
					const horizontalOverflow = element.scrollWidth - element.clientWidth;
					return verticalOverflow > 1 || horizontalOverflow > 1
						? [{
								className: element.className,
								text: element.textContent?.trim() ?? '',
								verticalOverflow,
								horizontalOverflow,
							}]
						: [];
				}),
			);
		return {
			route,
			width: 375,
			theme: 'dark',
			locale: 'en',
			textScalePercent: 200,
			strips: {
				listingTop: await rect(page, stripSelectors.listingTop),
				listingBottom: await rect(page, stripSelectors.listingBottom),
			},
			clippedElements,
			noContentLoss: clippedElements.length === 0,
		};
	} finally {
		await context.close();
	}
}

const browser = await chromium.launch({ headless: true });
try {
	const matrix = [];
	for (const width of widths) {
		for (const theme of themes) {
			for (const locale of locales) {
				matrix.push(await measureScenario(browser, width, theme, locale));
			}
		}
	}
	const receipt = {
		previewUrl: previewUrl.href,
		generatedAt: new Date().toISOString(),
		widths,
		themes,
		locales: locales.map(({ name }) => name),
		matrix,
		safeArea: await measureSafeArea(browser),
		textResize: await measureTextResize(browser),
	};
	process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
} finally {
	await browser.close();
}
