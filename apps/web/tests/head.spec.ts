import { expect, test, type Page, type APIRequestContext } from '@playwright/test';
import { parseDocument, DomUtils } from 'htmlparser2';
import { projectDetailLinks } from './_support/helpers';


test.skip(({ viewport }) => viewport!.width < 1024, 'Desktop composition or viewport-independent.');

type Cluster = { loc: string; alternates: string[][] };
const pathOf = (href: string) => new URL(href).pathname;
const xml = (text: string) => text.replaceAll('&amp;', '&');

async function sitemap(request: APIRequestContext): Promise<Cluster[]> {
	const body = await (await request.get('/sitemap.xml')).text();
	return [...body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, url]) => ({
		loc: xml(/<loc>([^<]+)<\/loc>/.exec(url!)![1]!),
		alternates: [...url!.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, href]) => [lang!, xml(href!)]),
	}));
}

async function expectHead(page: Page, { loc, alternates }: Cluster) {
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', loc);
	await expect(page).toHaveTitle(/\S/);
	expect((await page.title()).length).toBeLessThanOrEqual(70);
	const imageAlt = await page.locator('meta[property="og:image:alt"]').getAttribute('content');
	expect(imageAlt).toMatch(/^.+ \| yesid\.$/);
	expect(imageAlt).not.toMatch(/^yesid\. [|·]/);
	expect(imageAlt).not.toContain(' | yesid. | yesid.');
	await expect(page.locator('meta[name="twitter:image:alt"]')).toHaveAttribute('content', imageAlt!);
	await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
	await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'max-image-preview:large');
	await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', loc);
	const links = await page
		.locator('link[rel="alternate"][hreflang]')
		.evaluateAll((els) => els.map((el) => [el.getAttribute('hreflang')!, el.getAttribute('href')!]));
	// A single-variant sitemap entry is a one-locale page: no cluster beyond itself.
	if (alternates.length > 1) expect(links).toEqual(alternates);
	else expect(links.every(([, href]) => href === loc)).toBe(true);

	const graph = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? '')['@graph'];
	expect(graph.length).toBeGreaterThan(0);
	for (const node of graph) expect(typeof node['@type']).toBe('string');

	const image = (await page.locator('meta[property="og:image"]').getAttribute('content'))!;
	const card = await page.request.get(pathOf(image));
	expect(card.ok(), image).toBe(true);
	expect(card.headers()['content-type']).toMatch(/^image\//);
	if (pathOf(image).startsWith('/og/')) {
		const bytes = await card.body();
		const size = [
			Number(await page.locator('meta[property="og:image:width"]').getAttribute('content')),
			Number(await page.locator('meta[property="og:image:height"]').getAttribute('content')),
		];
		expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual(size);
	}
}

test('client navigation updates the detail head and serves its share image', async ({ page }) => {
	await page.addInitScript(() => {
		document.addEventListener('themechange', () => performance.mark('app-mounted'), { once: true });
	});
	await page.goto('/projects');
	await expect.poll(() => page.evaluate(() => performance.getEntriesByName('app-mounted').length)).toBe(1);
	const link = projectDetailLinks(page).first();
	const target = await link.getAttribute('href');
	expect(target).toBeTruthy();
	const entry = (await sitemap(page.request)).find(row => pathOf(row.loc) === target);
	expect(entry, 'detail page in the sitemap').toBeDefined();
	const documentStart = await page.evaluate(() => performance.timeOrigin);
	await link.click();
	await page.waitForURL(target!);
	await expect(page.getByTestId('project-detail-page')).toBeVisible();
	expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart);
	await expectHead(page, entry!);
});

test('every sitemap share image resolves to an image response', async ({ request }) => {
	const images = new Set<string>();
	for (const { loc } of await sitemap(request)) {
		const response = await request.get(pathOf(loc));
		expect(response.ok(), loc).toBe(true);
		const document = parseDocument(await response.text());
		const image = DomUtils.findOne(node => node.name === 'meta' && node.attribs.property === 'og:image', document.children);
		expect(image, `${loc} has a share image`).not.toBeNull();
		images.add(pathOf(image!.attribs.content!));
	}
	for (const path of images) {
		const response = await request.get(path);
		expect(response.ok(), path).toBe(true);
		expect(response.headers()['content-type'], path).toMatch(/^image\//);
	}
});

test('robots follows the host indexing policy', async ({ request }) => {
	// Prerendered documents are static (the host adds their header), so the policy shows on robots itself.
	const response = await request.get('/robots.txt');
	const robots = await response.text();
	if (/^Disallow: \/$/m.test(robots)) expect(response.headers()['x-robots-tag']).toContain('noindex');
	else expect(robots).toMatch(/^Sitemap: \S+\/sitemap\.xml$/m);
});
