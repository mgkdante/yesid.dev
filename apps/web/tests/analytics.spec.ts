import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';

const ENDPOINT = 'https://plausible.io/api/event';
const LOCAL_PRODUCTION_ORIGIN = 'http://yesid.dev:4173';
const CONSENT_KEY = 'yesid:analytics-consent:v1';
const HERO_INTRO_KEY = 'yesid:hero-intro-day';
const CLIENT_CHUNKS_DIR = fileURLToPath(
	new URL('../.svelte-kit/output/client/_app/immutable/chunks/', import.meta.url),
);

type Payload = {
	n: string;
	u: string;
	d: string;
	p?: Record<string, string>;
};

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
		(window as Window & { __plausible?: boolean }).__plausible = true;
	}, CONSENT_KEY);
}

async function enableWebdriverSends(page: Page): Promise<void> {
	await page.addInitScript(() => {
		(window as Window & { __plausible?: boolean }).__plausible = true;
	});
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
	return payloads.filter(({ n }) => n === 'pageview');
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
		([endpoint, n]) =>
			fetch(endpoint, { method: 'POST', body: JSON.stringify({ n }) }).catch(() => undefined),
		[ENDPOINT, marker] as const,
	);
	await expect.poll(() => payloads.some(({ n }) => n === marker)).toBe(true);
}

function nonSentinel(payloads: Payload[]): Payload[] {
	return payloads.filter(({ n }) => !n.startsWith('__e2e-drain-'));
}

function eventsNamed(payloads: Payload[], name: string): Payload[] {
	return nonSentinel(payloads).filter((payload) => payload.n === name);
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

/** The tracker chunk is identified by content (the provider endpoint literal)
 *  against the build being served, so the assertion survives hash changes. A
 *  request for that chunk is proof of a consent breach even while the lazy
 *  import is still in flight and `window.plausible` is not yet bound. */
function expectNoTrackerChunkRequest(requestedUrls: string[]): void {
	const trackerChunks = readdirSync(CLIENT_CHUNKS_DIR).filter(
		(name) =>
			name.endsWith('.js') &&
			readFileSync(join(CLIENT_CHUNKS_DIR, name), 'utf8').includes('plausible.io/api/event'),
	);
	expect(trackerChunks.length).toBeGreaterThan(0);
	const trackerRequests = requestedUrls.filter((url) =>
		trackerChunks.some((chunk) => url.endsWith(`/${chunk}`)),
	);
	expect(trackerRequests).toHaveLength(0);
}

async function expectNpmTracker(page: Page): Promise<void> {
	await expect
		.poll(() =>
			page.evaluate(
				() => (window as Window & { plausible?: { s?: string } }).plausible?.s,
			),
		)
		.toBe('npm');
}

test('fresh homepage keeps consent absent while the GSAP intro owns the viewport', async ({
	page,
}) => {
	await enableWebdriverSends(page);
	await proxyProductionHostnameToPreview(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/`);

	await expect.poll(() => page.locator('.pin-spacer').count(), { timeout: 15_000 }).toBeGreaterThan(0);
	await expect(page.getByTestId('analytics-consent')).toHaveCount(0);
});

test('same-day settled home shows consent, hides it for replay, and restores it after completion', async ({
	page,
}) => {
	await enableWebdriverSends(page);
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
	await enableWebdriverSends(page);
	await page.emulateMedia({ reducedMotion: 'reduce' });
	await proxyProductionHostnameToPreview(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/`);

	const station = page.getByTestId('analytics-consent');
	await expect(station).toBeVisible();
	expect(await station.evaluate((element) => getComputedStyle(element).animationName)).toBe('none');
	await expect(page.locator('.pin-spacer')).toHaveCount(0);
});

test('analytics station fits a 360px viewport with 44px actions and no horizontal overflow', async ({
	page,
}) => {
	await page.setViewportSize({ width: 360, height: 780 });
	await enableWebdriverSends(page);
	await proxyProductionHostnameToPreview(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);

	const station = page.getByTestId('analytics-consent');
	await expect(station).toBeVisible();
	const box = await station.boundingBox();
	expect(box).not.toBeNull();
	expect(box!.x).toBeGreaterThanOrEqual(12);
	expect(box!.x + box!.width).toBeLessThanOrEqual(348);

	for (const id of ['analytics-consent-decline', 'analytics-consent-accept']) {
		const actionBox = await page.getByTestId(id).boundingBox();
		expect(actionBox).not.toBeNull();
		expect(actionBox!.height).toBeGreaterThanOrEqual(44);
	}

	expect(
		await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
	).toBe(true);
});

test('mobile blog TOC does not block the analytics consent action', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await enableWebdriverSends(page);
	await proxyProductionHostnameToPreview(page);

	await page.goto(
		`${LOCAL_PRODUCTION_ORIGIN}/blog/does-your-website-need-instant-publishing`,
	);

	await expect(page.getByTestId('toc-pill')).toBeVisible();
	const accept = page.getByTestId('analytics-consent-accept');
	await expect(accept).toBeVisible();
	await accept.click({ trial: true });
});

test('production hostname without a saved choice renders consent and sends no events', async ({
	page,
}) => {
	await enableWebdriverSends(page);
	const requestedUrls = await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);

	await expect(page.getByTestId('analytics-consent')).toBeVisible();
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(await page.evaluate(() => 'plausible' in window)).toBe(false);
	expectNoTrackerChunkRequest(requestedUrls);
	expect(nonSentinel(payloads)).toHaveLength(0);
});

test('accepting consent sends exactly one initial pageview through the NPM tracker', async ({
	page,
}) => {
	await enableWebdriverSends(page);
	await proxyProductionHostnameToPreview(page);
	const payloads = await capturePlausible(page);

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/projects`);
	await expect(page.getByTestId('analytics-consent')).toBeVisible();
	await page.getByTestId('analytics-consent-accept').click();

	await waitForPageviews(payloads, 1);
	await expectNpmTracker(page);
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
	await expectNpmTracker(page);

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
		n: 'direct_contact_click',
		d: 'yesid.dev',
	});
	expect(events[0].p).toBeUndefined();
	const trackedUrl = new URL(events[0].u);
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
	await expectNpmTracker(page);

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
		n: 'project_proof_click',
		d: 'yesid.dev',
	});
	expect(events[0].p).toBeUndefined();
	const trackedUrl = new URL(events[0].u);
	expect(trackedUrl.pathname).toBe('/projects/yesid-dev');
	expect(trackedUrl.searchParams.get('utm_source')).toBe('codex_ops2_qa');
	expect(trackedUrl.searchParams.has('stack')).toBe(false);
	expectExactPageviewCount(payloads, 1);
});

test('direct contact remains blocked after decline and after withdrawal', async ({
	page,
}) => {
	await enableWebdriverSends(page);
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
		await expectNpmTracker(page);
		await settleBrowser(page);
		await drainCapturedRequests(page, payloads);
		expectExactPageviewCount(payloads, 1);

		const [pageview] = pageviews(payloads);
		const trackedUrl = new URL(pageview.u);
		expect(pageview.d).toBe('yesid.dev');
		expect(pageview.p).toBeUndefined();
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
	await expectNpmTracker(page);
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
	await expectNpmTracker(page);
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

test('localhost never loads the tracker even with saved consent', async ({ page }) => {
	await grantBeforeLoad(page);
	const requestedUrls = await recordChunkRequests(page);
	const payloads = await capturePlausible(page);

	await page.goto('http://localhost:4173/projects');

	await expect(page.getByTestId('nav')).toBeVisible();
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(await page.evaluate(() => 'plausible' in window)).toBe(false);
	expectNoTrackerChunkRequest(requestedUrls);
	expect(nonSentinel(payloads)).toHaveLength(0);
});

test('an aborted provider request fails open across internal navigation', async ({ page }) => {
	await grantBeforeLoad(page);
	await proxyProductionHostnameToPreview(page);
	const abortedPayloads: Payload[] = [];
	await page.route(ENDPOINT, async (route) => {
		abortedPayloads.push(JSON.parse(route.request().postData() ?? '{}') as Payload);
		await route.abort();
	});

	await page.goto(`${LOCAL_PRODUCTION_ORIGIN}/contact`);

	await expect(page.getByTestId('page-contact')).toBeVisible();
	await expectNpmTracker(page);
	await waitForPageviews(abortedPayloads, 1);
	await settleBrowser(page);
	await drainCapturedRequests(page, abortedPayloads);
	expectExactPageviewCount(abortedPayloads, 1);

	const servicesLink = page.getByTestId('nav').locator('a[href="/services"]');
	await expect(servicesLink).toBeVisible();
	await servicesLink.click();

	await expect(page).toHaveURL(`${LOCAL_PRODUCTION_ORIGIN}/services`);
	await expect(page.getByTestId('service-listing-page')).toBeVisible();
	await waitForPageviews(abortedPayloads, 2);
	await settleBrowser(page);
	await drainCapturedRequests(page, abortedPayloads);
	expectExactPageviewCount(abortedPayloads, 2);
});
