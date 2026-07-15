import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';

const ENDPOINT = 'https://plausible.io/api/event';
const LOCAL_PRODUCTION_ORIGIN = 'http://yesid.dev:4173';
const CONSENT_KEY = 'yesid:analytics-consent:v1';
const HERO_INTRO_KEY = 'yesid:hero-intro-day';
const CONSENT_DISCLOSURES = [
	{
		locale: 'English',
		path: '/projects',
		copy: 'Plausible, not Google Analytics, would count visits, pages, referrers, key clicks, and general device and region data. No cookies or form fields.',
	},
	{
		locale: 'French',
		path: '/fr/projects',
		copy: 'Plausible, et non Google Analytics, compterait les visites, les pages, les sources, les clics clés et des données générales sur l’appareil et la région. Aucun témoin ni champ de formulaire.',
	},
	{
		locale: 'Spanish',
		path: '/es/projects',
		copy: 'Plausible, no Google Analytics, contaría visitas, páginas, referencias, clics clave y datos generales del dispositivo y la región. Sin cookies ni campos de formulario.',
	},
] as const;
const CLIENT_CHUNKS_DIR = fileURLToPath(
	new URL('../.svelte-kit/output/client/_app/immutable/chunks/', import.meta.url),
);

type Payload = {
	name: string;
	url: string;
	domain: string;
	referrer?: string;
	props?: Record<string, string>;
};

test.afterEach(async ({ page }) => {
	await page.unrouteAll({ behavior: 'wait' });
});

async function proxyProductionHostnameToPreview(page: Page): Promise<string[]> {
	const requestedUrls: string[] = [];
	await page.route(LOCAL_PRODUCTION_ORIGIN + '/**', async (route) => {
		requestedUrls.push(route.request().url());
		const localUrl = new URL(route.request().url());
		localUrl.hostname = 'localhost';
		const response = await route.fetch({ url: localUrl.toString() });
		await route.fulfill({ response });
	});
	return requestedUrls;
}

/** Localhost requests bypass the production-origin proxy, so the zero-call
 *  localhost test records chunk requests through its own transparent route. */
async function recordChunkRequests(page: Page): Promise<string[]> {
	const requestedUrls: string[] = [];
	await page.route('**/_app/immutable/chunks/*.js', async (route) => {
		requestedUrls.push(route.request().url());
		await route.continue();
	});
	return requestedUrls;
}

async function capturePlausible(page: Page): Promise<Payload[]> {
	const payloads: Payload[] = [];
	await page.route(ENDPOINT, async (route) => {
		payloads.push(JSON.parse(route.request().postData() ?? '{}') as Payload);
		await route.fulfill({ status: 202, contentType: 'text/plain', body: '' });
	});
	return payloads;
}

async function grantBeforeLoad(page: Page): Promise<void> {
	await page.addInitScript((key) => {
		window.localStorage.setItem(key, 'granted');
	}, CONSENT_KEY);
}

async function completeHeroTodayBeforeLoad(page: Page): Promise<void> {
	await page.addInitScript((key) => {
		const now = new Date();
		const month = String(now.getMonth() + 1).padStart(2, '0');
		const day = String(now.getDate()).padStart(2, '0');
		window.localStorage.setItem(key, `${now.getFullYear()}-${month}-${day}`);
	}, HERO_INTRO_KEY);
}

async function scrollHomeIntroThrough(page: Page): Promise<void> {
	for (let step = 0; step < 40; step++) {
		const completed = await page.evaluate(() => {
			if (document.querySelector('.pin-spacer') === null) return true;
			window.scrollBy(0, window.innerHeight * 0.9);
			return false;
		});
		if (completed) return;
		await settleBrowser(page);
	}
}

function pageviews(payloads: Payload[]): Payload[] {
	return payloads.filter(({ name }) => name === 'pageview');
}

async function waitForPageviews(payloads: Payload[], count: number): Promise<void> {
	await expect.poll(() => pageviews(payloads).length).toBeGreaterThanOrEqual(count);
}

function expectExactPageviewCount(payloads: Payload[], count: number): void {
	expect(pageviews(payloads)).toHaveLength(count);
}

async function settleBrowser(page: Page): Promise<void> {
	await page.evaluate(
		() =>
			new Promise<void>((resolve) => {
				requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
			}),
	);
}

let drainSequence = 0;

/** Capture barrier. Renderer-side settling cannot order Node-side route
 *  captures (Runtime.evaluate replies and Fetch.requestPaused events have no
 *  cross-process ordering), so a page-issued sentinel POST to the intercepted
 *  endpoint drains the interception queue: once the sentinel is captured,
 *  every request dispatched before it has already been pushed to `payloads`. */
async function drainCapturedRequests(page: Page, payloads: Payload[]): Promise<void> {
	drainSequence += 1;
	const marker = `__e2e-drain-${drainSequence}__`;
	await page.evaluate(
		([endpoint, name]) =>
			fetch(endpoint, { method: 'POST', body: JSON.stringify({ name }) }).catch(
				() => undefined,
			),
		[ENDPOINT, marker] as const,
	);
	await expect.poll(() => payloads.some(({ name }) => name === marker)).toBe(true);
}

function nonSentinel(payloads: Payload[]): Payload[] {
	return payloads.filter(({ name }) => !name.startsWith('__e2e-drain-'));
}

function eventsNamed(payloads: Payload[], name: string): Payload[] {
	return nonSentinel(payloads).filter((payload) => payload.name === name);
}

async function clickWithoutNavigation(link: Locator): Promise<void> {
	await link.evaluate((element) => {
		element.addEventListener(
			'click',
			(event) => event.preventDefault(),
			{ capture: true, once: true },
		);
		(element as HTMLElement).click();
	});
}

/** The transport chunk is identified by content (the provider endpoint literal)
 *  against the build being served, so the assertion survives hash changes. A
 *  request for that chunk is proof of a consent breach even while the lazy
 *  import is still in flight. */
function expectNoTransportChunkRequest(requestedUrls: string[]): void {
	const transportChunks = readdirSync(CLIENT_CHUNKS_DIR).filter(
		(name) =>
			name.endsWith('.js') &&
			readFileSync(join(CLIENT_CHUNKS_DIR, name), 'utf8').includes('plausible.io/api/event'),
	);
	expect(transportChunks.length).toBeGreaterThan(0);
	const transportRequests = requestedUrls.filter((url) =>
		transportChunks.some((chunk) => url.endsWith(`/${chunk}`)),
	);
	expect(transportRequests).toHaveLength(0);
}

test('fresh homepage keeps consent absent while the GSAP intro owns the viewport', async ({
	page,
}) => {
	await proxyProductionHostnameToPreview(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/`);

	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);
	await expect(page.getByTestId('analytics-consent')).toHaveCount(0);
});

test('same-day settled home shows consent, hides it for replay, and restores it after completion', async ({
	page,
}) => {
	await completeHeroTodayBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/`);

	const hero = page.getByTestId('hero-banner');
	await expect(hero).toHaveClass(/hero-intro-done/);
	await expect(page.getByTestId('analytics-consent')).toBeVisible();

	await page.getByTestId('hero-dot-replay').click();
	await expect(page.getByTestId('analytics-consent')).toHaveCount(0);
	await expect(hero).not.toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);
	await expect.poll(() => page.evaluate(() => window.scrollY), { timeout: 15_000 }).toBeLessThan(8);

	await scrollHomeIntroThrough(page);
	await expect(hero).toHaveClass(/hero-intro-done/, { timeout: 15_000 });
	await expect(page.getByTestId('analytics-consent')).toBeVisible();
});

test('reduced motion treats the static home hero as settled', async ({ page }) => {
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await proxyProductionHostnameToPreview(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/`);

	const station = page.getByTestId('analytics-consent');
	await expect(station).toBeVisible();
	expect(await station.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
	await expect(page.locator('.pin-spacer')).toHaveCount(0);
});

test('analytics consent is a wide borderless desktop rail', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await proxyProductionHostnameToPreview(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);

	const rail = page.getByTestId('analytics-consent');
	await expect(rail).toBeVisible();
	const box = await rail.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.width).toBeGreaterThanOrEqual(1100);
	expect(box!.height).toBeLessThanOrEqual(128);
	expect(
		await rail.evaluate((element) => {
			const style = getComputedStyle(element);
			return [
				style.borderTopWidth,
				style.borderRightWidth,
				style.borderBottomWidth,
				style.borderLeftWidth,
			];
		}),
	).toEqual(['0px', '0px', '0px', '0px']);
});

for (const { locale, path } of CONSENT_DISCLOSURES) {
	test(`${locale} analytics consent fits a 360px viewport with contained 44px actions`, async ({
		page,
	}) => {
		await page.setViewportSize({ width: 360, height: 780 });
		await proxyProductionHostnameToPreview(page);

		await page.goto(`${LOCAL_PRODUCTION_ORIGIN}${path}`);

		const station = page.getByTestId('analytics-consent');
		await expect(station).toBeVisible();
		const { rail, actions } = await station.evaluate((element) => {
			const railBox = element.getBoundingClientRect();
			const actionBoxes = [
				element.querySelector('[data-testid="analytics-consent-decline"]'),
				element.querySelector('[data-testid="analytics-consent-accept"]'),
			].map((action) => action?.getBoundingClientRect());
			return {
				rail: {
					x: railBox.x,
					right: railBox.right,
					height: railBox.height,
				},
				actions: actionBoxes.map((action) =>
					action
						? {
								x: action.x,
								right: action.right,
								y: action.y,
								height: action.height,
							}
						: null,
				),
			};
		});

		expect(rail.x).toBeGreaterThanOrEqual(12);
		expect(rail.right).toBeLessThanOrEqual(348);
		expect(rail.height).toBeLessThanOrEqual(280);
		for (const action of actions) {
			expect(action).not.toBeNull();
			expect(action!.x).toBeGreaterThanOrEqual(rail.x);
			expect(action!.right).toBeLessThanOrEqual(rail.right);
			expect(action!.height).toBeGreaterThanOrEqual(44);
		}
		expect(Math.abs(actions[0]!.y - actions[1]!.y)).toBeLessThan(1);

		expect(
			await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
		).toBe(true);
	});
}

test('mobile blog TOC does not block the analytics consent action', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await proxyProductionHostnameToPreview(page);

	await page.goto(
		`${LOCAL_PRODUCTION_ORIGIN}/blog/does-your-website-need-instant-publishing`,
	);

	await expect(page.getByTestId('toc-pill')).toBeVisible();
	const accept = page.getByTestId('analytics-consent-accept');
	await expect(accept).toBeVisible();
	await accept.click({ trial: true });
});

for (const { locale, path, copy } of CONSENT_DISCLOSURES) {
	test(`${locale} consent renders the exact high-intent disclosure`, async ({ page }) => {
		await proxyProductionHostnameToPreview(page);

		await page.goto(`${LOCAL_PRODUCTION_ORIGIN}${path}`);

		await expect(page.locator('#analytics-consent-description')).toHaveText(copy);
	});
}

test('production hostname without a saved choice renders consent and sends no events', async ({
	page,
}) => {
	const requestedUrls = await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);

	await expect(page.getByTestId('analytics-consent')).toBeVisible();
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectNoTransportChunkRequest(requestedUrls);
	expect(nonSentinel(payloads)).toHaveLength(0);
});

test('accepting consent sends exactly one initial pageview through the controlled transport', async ({
	page,
}) => {
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);
	await expect(page.getByTestId('analytics-consent')).toBeVisible();
	await page.getByTestId('analytics-consent-accept').click();

	await waitForPageviews(payloads, 1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectExactPageviewCount(payloads, 1);
});

test('direct contact click sends one property-free event with the sanitized current page', async ({
	page,
}) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(
		`${LOCAL_PRODUCTION_ORIGIN}/contact?utm_source=codex_ops2_qa&bp=secret`,
	);
	await waitForPageviews(payloads, 1);

	const email = page
		.getByTestId('contact-social-email')
		.filter({ visible: true })
		.first();
	await expect(email).toBeVisible();
	await clickWithoutNavigation(email);

	await expect
		.poll(() => eventsNamed(payloads, 'direct_contact_click').length)
		.toBe(1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);

	const events = eventsNamed(payloads, 'direct_contact_click');
	expect(events).toHaveLength(1);
	expect(events[0]).toMatchObject({
		name: 'direct_contact_click',
		domain: 'yesid.dev',
	});
	expect(events[0].props).toBeUndefined();
	const trackedUrl = new URL(events[0].url);
	expect(trackedUrl.pathname).toBe('/contact');
	expect(trackedUrl.searchParams.get('utm_source')).toBe('codex_ops2_qa');
	expect(trackedUrl.searchParams.has('bp')).toBe(false);
	expectExactPageviewCount(payloads, 1);
});

test('project proof click sends one property-free event with the sanitized current project page', async ({
	page,
}) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(
		`${LOCAL_PRODUCTION_ORIGIN}/projects/yesid-dev?utm_source=codex_ops2_qa&stack=secret`,
	);
	await waitForPageviews(payloads, 1);

	const card = page
		.getByTestId('project-links-card')
		.filter({ visible: true })
		.first();
	const liveSite = card.locator('a[href="https://yesid.dev"]');
	await expect(liveSite).toBeVisible();
	await clickWithoutNavigation(liveSite);

	await expect
		.poll(() => eventsNamed(payloads, 'project_proof_click').length)
		.toBe(1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);

	const events = eventsNamed(payloads, 'project_proof_click');
	expect(events).toHaveLength(1);
	expect(events[0]).toMatchObject({
		name: 'project_proof_click',
		domain: 'yesid.dev',
	});
	expect(events[0].props).toBeUndefined();
	const trackedUrl = new URL(events[0].url);
	expect(trackedUrl.pathname).toBe('/projects/yesid-dev');
	expect(trackedUrl.searchParams.get('utm_source')).toBe('codex_ops2_qa');
	expect(trackedUrl.searchParams.has('stack')).toBe(false);
	expectExactPageviewCount(payloads, 1);
});

test('direct contact remains blocked after decline and after withdrawal', async ({
	page,
}) => {
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/contact`);
	const email = page
		.getByTestId('contact-social-email')
		.filter({ visible: true })
		.first();

	await page.getByTestId('analytics-consent-decline').click();
	await clickWithoutNavigation(email);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(eventsNamed(payloads, 'direct_contact_click')).toHaveLength(0);

	await page.getByTestId('analytics-preferences').click();
	await page.getByTestId('analytics-consent-accept').click();
	await waitForPageviews(payloads, 1);
	await clickWithoutNavigation(email);
	await expect
		.poll(() => eventsNamed(payloads, 'direct_contact_click').length)
		.toBe(1);
	await drainCapturedRequests(page, payloads);
	expect(eventsNamed(payloads, 'direct_contact_click')).toHaveLength(1);

	await page.getByTestId('analytics-preferences').click();
	await page.getByTestId('analytics-consent-decline').click();
	await clickWithoutNavigation(email);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(eventsNamed(payloads, 'direct_contact_click')).toHaveLength(1);
});

test('withdrawal emits no autonomous engagement event on page lifecycle signals', async ({
	page,
}) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);
	await waitForPageviews(payloads, 1);

	await page.getByTestId('analytics-preferences').click();
	await page.getByTestId('analytics-consent-decline').click();
	await page.evaluate(() => {
		Object.defineProperty(document, 'hasFocus', {
			configurable: true,
			value: () => false,
		});
		window.dispatchEvent(new Event('blur'));
		document.dispatchEvent(new Event('visibilitychange'));
		Object.defineProperty(document, 'hasFocus', {
			configurable: true,
			value: () => true,
		});
		window.dispatchEvent(new Event('focus'));
	});

	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(eventsNamed(payloads, 'engagement')).toHaveLength(0);
	expectExactPageviewCount(payloads, 1);
});

for (const { locale, path } of [
	{ locale: 'English', path: '/projects' },
	{ locale: 'French', path: '/fr/projects' },
	{ locale: 'Spanish', path: '/es/projects' },
] as const) {
	test(`${locale} pageview preserves acquisition data and strips private query parameters`, async ({
		page,
	}) => {
		await grantBeforeLoad(page);
		await proxyProductionHostnameToPreview(page);
		const payloads = await capturePlausible(page);

		await page.goto(
			`${LOCAL_PRODUCTION_ORIGIN}${path}?utm_source=linkedin&stack=sveltekit&bp=secret`,
		);

		await waitForPageviews(payloads, 1);
		await settleBrowser(page);
		await drainCapturedRequests(page, payloads);
		expectExactPageviewCount(payloads, 1);

		const [pageview] = pageviews(payloads);
		const trackedUrl = new URL(pageview.url);
		expect(pageview.domain).toBe('yesid.dev');
		expect(pageview.props).toBeUndefined();
		expect(trackedUrl.origin).toBe(LOCAL_PRODUCTION_ORIGIN);
		expect(trackedUrl.pathname).toBe(path);
		expect(trackedUrl.searchParams.get('utm_source')).toBe('linkedin');
		expect(trackedUrl.searchParams.has('stack')).toBe(false);
		expect(trackedUrl.searchParams.has('bp')).toBe(false);
	});
}

test('query-only service filtering does not emit a duplicate pageview', async ({ page }) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);
	await waitForPageviews(payloads, 1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectExactPageviewCount(payloads, 1);

	const filter = page
		.locator('.listing-filter-column [data-testid="project-filter-sidebar"]')
		.locator('[data-testid^="service-filter-"]')
		.first();
	await expect(filter).toBeVisible();
	await filter.click();

	await expect(page).toHaveURL(/[?&]service=/);
	await expect(filter).toHaveClass(/tag-active/);
	await waitForPageviews(payloads, 1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectExactPageviewCount(payloads, 1);
});

test('internal path navigation emits one additional pageview', async ({ page }) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);
	await waitForPageviews(payloads, 1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectExactPageviewCount(payloads, 1);

	const servicesLink = page.getByTestId('nav').locator('a[href="/services"]');
	await expect(servicesLink).toBeVisible();
	await servicesLink.click();

	await expect(page).toHaveURL(`${LOCAL_PRODUCTION_ORIGIN}/services`);
	await expect(page.getByTestId('service-listing-page')).toBeVisible();
	await waitForPageviews(payloads, 2);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectExactPageviewCount(payloads, 2);
});

test('localhost never loads the transport even with saved consent', async ({ page }) => {
	await grantBeforeLoad(page);
	const requestedUrls = await recordChunkRequests(page);
	const payloads = await capturePlausible(page);

	await page.goto('http://localhost:4173/projects');

	await expect(page.getByTestId('nav')).toBeVisible();
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectNoTransportChunkRequest(requestedUrls);
	expect(nonSentinel(payloads)).toHaveLength(0);
});

test('an aborted provider request remains retryable without blocking navigation', async ({
	page,
}) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const abortedPayloads: Payload[] = [];
	await page.route(ENDPOINT, async (route) => {
		abortedPayloads.push(JSON.parse(route.request().postData() ?? '{}') as Payload);
		await route.abort();
	});

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/contact`);

	await expect(page.getByTestId('page-contact')).toBeVisible();
	await waitForPageviews(abortedPayloads, 1);
	await settleBrowser(page);
	await drainCapturedRequests(page, abortedPayloads);
	expect(
		pageviews(abortedPayloads).filter(
			(payload) => new URL(payload.url).pathname === '/contact',
		).length,
	).toBeGreaterThanOrEqual(1);

	const servicesLink = page.getByTestId('nav').locator('a[href="/services"]');
	await expect(servicesLink).toBeVisible();
	await servicesLink.click();

	await expect(page).toHaveURL(`${LOCAL_PRODUCTION_ORIGIN}/services`);
	await expect(page.getByTestId('service-listing-page')).toBeVisible();
	await expect
		.poll(
			() =>
				pageviews(abortedPayloads).filter(
					(payload) => new URL(payload.url).pathname === '/services',
				).length,
		)
		.toBeGreaterThanOrEqual(1);
	await settleBrowser(page);
	await drainCapturedRequests(page, abortedPayloads);
	for (const payload of pageviews(abortedPayloads)) {
		expect(payload.domain).toBe('yesid.dev');
		expect(payload.props).toBeUndefined();
	}
});
