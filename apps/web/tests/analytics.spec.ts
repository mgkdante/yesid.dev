import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';

const ENDPOINT = 'https://plausible.io/api/event';
const LOCAL_PRODUCTION_ORIGIN = 'http://yesid.dev:4173';
const CONSENT_KEY = 'yesid:analytics-consent:v1';
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
