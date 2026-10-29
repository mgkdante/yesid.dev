import { expect, test, type Locator, type Page } from '@playwright/test';
import { mockWeb3Forms, visibleContactTerminal } from './_support/helpers';

const ENDPOINT = 'https://plausible.io/api/event';

type Payload = {
	n: string;
	u: string;
	d: string;
	r?: string | null;
	p?: Record<string, string>;
	v?: number;
	i?: boolean;
	h?: number;
};

test.beforeEach(async ({ page }) => {
	await page.addInitScript(() => { Reflect.set(window, '__plausible', true); });
});

test.afterEach(async ({ page }) => {
	await page.unrouteAll({ behavior: 'wait' });
});

async function proxyProductionHostnameToPreview(page: Page, baseURL: string | undefined): Promise<string> {
	const localOrigin = new URL(baseURL!);
	const productionOrigin = new URL(localOrigin);
	productionOrigin.hostname = 'yesid.dev';
	await page.route(productionOrigin.origin + '/**', async (route) => {
		const localUrl = new URL(route.request().url());
		localUrl.host = localOrigin.host;
		await route.continue({ url: localUrl.toString() });
	});
	return productionOrigin.origin;
}

async function capturePlausible(page: Page): Promise<Payload[]> {
	const payloads: Payload[] = [];
	await page.route(ENDPOINT, async (route) => {
		payloads.push(JSON.parse(route.request().postData() ?? '{}') as Payload);
		await route.fulfill({ status: 202, contentType: 'text/plain', body: '' });
	});
	return payloads;
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
			fetch(endpoint, { method: 'POST', body: JSON.stringify({ n }) }).catch(
				() => undefined,
			),
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

test('successful contact form sends one property-free event without form data', async ({ page, baseURL }) => {
	const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
	const payloads = await capturePlausible(page);
	await mockWeb3Forms(page, { success: true });

	await page.goto(
		`${productionOrigin}/contact?utm_source=codex_ops2_qa&message=private`,
	);
	await waitForPageviews(payloads, 1);

	const terminal = visibleContactTerminal(page);
	await terminal.getByLabel(/^(?:name|nom|nombre):$/i).fill('Private Test Name');
	await terminal.getByLabel(/^(?:email|courriel|correo):$/i).fill('private-test@example.com');
	await terminal.getByLabel(/^(?:message|mensaje):$/i).fill('Private form message');
	await terminal.getByTestId('contact-submit').click();

	await expect
		.poll(() => eventsNamed(payloads, 'contact_form_success').length)
		.toBe(1);
	await drainCapturedRequests(page, payloads);

	const events = eventsNamed(payloads, 'contact_form_success');
	expect(events).toHaveLength(1);
	expect(events[0]).toMatchObject({
		n: 'contact_form_success',
		d: 'yesid.dev',
	});
	expect(events[0].p).toBeUndefined();
	const trackedUrl = new URL(events[0].u);
	expect(trackedUrl.pathname).toBe('/contact');
	expect(trackedUrl.searchParams.get('utm_source')).toBe('codex_ops2_qa');
	expect(trackedUrl.searchParams.has('message')).toBe(false);
	expect(JSON.stringify(events[0])).not.toContain('Private Test Name');
	expect(JSON.stringify(events[0])).not.toContain('private-test@example.com');
	expect(JSON.stringify(events[0])).not.toContain('Private form message');
	expectExactPageviewCount(payloads, 1);
});

test('booking click sends one property-free event with the sanitized current page', async ({
	page,
	baseURL,
}) => {
	const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
	const payloads = await capturePlausible(page);

	await page.goto(
		`${productionOrigin}/contact?utm_source=codex_ops2_qa&booking=private`,
	);
	await waitForPageviews(payloads, 1);

	const booking = visibleContactTerminal(page).getByTestId('contact-booking-link');
	await expect(booking).toBeVisible();
	await clickWithoutNavigation(booking);

	await expect.poll(() => eventsNamed(payloads, 'booking_click').length).toBe(1);
	await drainCapturedRequests(page, payloads);

	const events = eventsNamed(payloads, 'booking_click');
	expect(events).toHaveLength(1);
	expect(events[0]).toMatchObject({
		n: 'booking_click',
		d: 'yesid.dev',
	});
	expect(events[0].p).toBeUndefined();
	const trackedUrl = new URL(events[0].u);
	expect(trackedUrl.pathname).toBe('/contact');
	expect(trackedUrl.searchParams.get('utm_source')).toBe('codex_ops2_qa');
	expect(trackedUrl.searchParams.has('booking')).toBe(false);
	expectExactPageviewCount(payloads, 1);
});

test('direct contact click sends one property-free event with the sanitized current page', async ({
	page,
	baseURL,
}) => {
	const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
	const payloads = await capturePlausible(page);

	await page.goto(
		`${productionOrigin}/contact?utm_source=codex_ops2_qa&bp=secret`,
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
	baseURL,
}) => {
	const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
	const payloads = await capturePlausible(page);

	await page.goto(
		`${productionOrigin}/projects/yesid-dev?utm_source=codex_ops2_qa&stack=secret`,
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

for (const { locale, path } of [
	{ locale: 'English', path: '/projects' },
	{ locale: 'French', path: '/fr/projects' },
	{ locale: 'Spanish', path: '/es/projects' },
] as const) {
	test(`${locale} pageview preserves acquisition data and strips private query parameters`, async ({
		page,
		baseURL,
	}) => {
		const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
		const payloads = await capturePlausible(page);

		await page.goto(
			`${productionOrigin}${path}?utm_source=linkedin&stack=sveltekit&bp=secret`,
		);

		await waitForPageviews(payloads, 1);
		await settleBrowser(page);
		await drainCapturedRequests(page, payloads);
		expectExactPageviewCount(payloads, 1);

		const [pageview] = pageviews(payloads);
		const trackedUrl = new URL(pageview.u);
		expect(pageview.d).toBe('yesid.dev');
		expect(pageview.p).toBeUndefined();
		expect(trackedUrl.origin).toBe(productionOrigin);
		expect(trackedUrl.pathname).toBe(path);
		expect(trackedUrl.searchParams.get('utm_source')).toBe('linkedin');
		expect(trackedUrl.searchParams.has('stack')).toBe(false);
		expect(trackedUrl.searchParams.has('bp')).toBe(false);
	});
}

test('query-only service filtering does not emit a duplicate pageview', async ({ page, baseURL }) => {
	const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
	const payloads = await capturePlausible(page);

	await page.goto(`${productionOrigin}/projects`);
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

test('internal path navigation emits one additional pageview', async ({ page, baseURL }) => {
	const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
	const payloads = await capturePlausible(page);

	await page.goto(`${productionOrigin}/projects?utm_source=e2e&stack=secret#private`);
	await waitForPageviews(payloads, 1);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectExactPageviewCount(payloads, 1);

	const servicesLink = page.getByTestId('nav').locator('a[href="/services"]');
	await expect(servicesLink).toBeVisible();
	await servicesLink.click();

	await expect(page).toHaveURL(`${productionOrigin}/services`);
	await expect(page.getByTestId('service-listing-page')).toBeVisible();
	await waitForPageviews(payloads, 2);
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expectExactPageviewCount(payloads, 2);
	expect(eventsNamed(payloads, 'engagement').length).toBeGreaterThan(0);
	for (const payload of nonSentinel(payloads)) {
		expect(payload.d).toBe('yesid.dev');
		expect(payload.p).toBeUndefined();
		const url = new URL(payload.u);
		expect([...url.searchParams.keys()].every(key => key === 'utm_source')).toBe(true);
		expect(url.hash).toBe('');
	}
	expect(await page.evaluate(() => document.cookie)).toBe('');
	expect(await page.evaluate(() =>
		[...Object.keys(localStorage), ...Object.keys(sessionStorage)]
			.filter(key => /plausible|analytics/i.test(key)),
	)).toEqual([]);
});

test('the local host sends nothing', async ({ page, baseURL }) => {
	const payloads = await capturePlausible(page);
	const localOrigin = new URL(baseURL!).origin;
	await page.goto(localOrigin + '/projects');
	await expect(page.getByTestId('nav')).toBeVisible();
	await page.getByTestId('nav').locator('a[href="/services"]').click();
	await expect(page).toHaveURL(localOrigin + '/services');
	await expect(page.getByTestId('service-listing-page')).toBeVisible();
	await settleBrowser(page);
	await drainCapturedRequests(page, payloads);
	expect(nonSentinel(payloads)).toHaveLength(0);
});

test('an aborted provider request does not block navigation', async ({ page, baseURL }) => {
	const productionOrigin = await proxyProductionHostnameToPreview(page, baseURL);
	const abortedPayloads: Payload[] = [];
	await page.route(ENDPOINT, async (route) => {
		abortedPayloads.push(JSON.parse(route.request().postData() ?? '{}') as Payload);
		await route.abort();
	});
	await page.goto(productionOrigin + '/contact');
	await expect(page.getByTestId('page-contact')).toBeVisible();
	await waitForPageviews(abortedPayloads, 1);
	await page.getByTestId('nav').locator('a[href="/services"]').click();
	await expect(page).toHaveURL(productionOrigin + '/services');
	await expect(page.getByTestId('service-listing-page')).toBeVisible();
	await waitForPageviews(abortedPayloads, 2);
});
