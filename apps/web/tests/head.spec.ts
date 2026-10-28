import { expect, test, type Page } from '@playwright/test';

import { siteLabels } from '../src/lib/content/site-labels';
import { DEFAULT_LOCALE, resolveLocale } from '../src/lib/utils/locale';
import { isPathPublished, STATIC_PAGE_PATHS } from '../src/lib/utils/page-registry';
import { PUBLISHED_LOCALES } from '../src/lib/utils/published-locales';

type Cluster = { loc: string; alternates: string[][] };
const prefix = new RegExp(`^/(${PUBLISHED_LOCALES.filter((l) => l !== DEFAULT_LOCALE).join('|')})(?=/|$)`);
const pathOf = (href: string) => new URL(href).pathname;
const routeOf = (href: string) => pathOf(href).replace(prefix, '') || '/';
const localeOf = (href: string) => prefix.exec(pathOf(href))?.[1] ?? DEFAULT_LOCALE;
const xml = (text: string) => text.replaceAll('&amp;', '&');

async function sitemap(page: Page): Promise<Cluster[]> {
	const body = await (await page.request.get('/sitemap.xml')).text();
	return [...body.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, url]) => ({
		loc: xml(/<loc>([^<]+)<\/loc>/.exec(url!)![1]!),
		alternates: [...url!.matchAll(/hreflang="([^"]+)" href="([^"]+)"/g)].map(([, lang, href]) => [lang!, xml(href!)]),
	}));
}

async function expectHead(page: Page, { loc, alternates }: Cluster) {
	const response = await page.goto(pathOf(loc));
	expect(response?.ok(), loc).toBe(true);
	await expect(page).toHaveTitle(/\S/);
	await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /\S/);
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

for (const route of STATIC_PAGE_PATHS.filter((path) => isPathPublished(path))) {
	for (const locale of PUBLISHED_LOCALES) {
		test(`${route} (${locale}): the head matches its sitemap cluster`, async ({ page }) => {
			const entry = (await sitemap(page)).find((c) => routeOf(c.loc) === route && localeOf(c.loc) === locale);
			expect(entry, `${route} ${locale} in the sitemap`).toBeDefined();
			await expectHead(page, entry!);
		});
	}
}

for (const section of ['/blog/', '/projects/']) {
	test(`the first ${section} page's head matches its sitemap cluster`, async ({ page }) => {
		const entry = (await sitemap(page)).find(
			(c) => routeOf(c.loc).startsWith(section) && !STATIC_PAGE_PATHS.includes(routeOf(c.loc)) && c.alternates.length > 1,
		);
		expect(entry, `a ${section} page in the sitemap`).toBeDefined();
		await expectHead(page, entry!);
	});
}

test('robots follows the host indexing policy', async ({ page }) => {
	// Prerendered documents are static (the host adds their header), so the policy shows on robots itself.
	const response = await page.request.get('/robots.txt');
	const robots = await response.text();
	if (/^Disallow: \/$/m.test(robots)) expect(response.headers()['x-robots-tag']).toContain('noindex');
	else expect(robots).toMatch(/^Sitemap: \S+\/sitemap\.xml$/m);
});

for (const colorScheme of ['dark', 'light'] as const) {
	test(`a reload paints the stored theme and a closed section before the app runs (system ${colorScheme})`, async ({ page }) => {
		await page.emulateMedia({ colorScheme });
		const project = (await sitemap(page)).find(
			(c) => routeOf(c.loc).startsWith('/projects/') && localeOf(c.loc) === DEFAULT_LOCALE,
		)!;
		await page.goto(pathOf(project.loc));
		const html = page.locator('html');
		await expect(html).toHaveAttribute('data-theme', 'dark');
		const toggle = page.getByRole('switch', {
			name: resolveLocale(siteLabels.navChrome.shared.themeToggleAria, DEFAULT_LOCALE),
		});
		const section = page.locator('[data-section-index="0"]').getByRole('button').first();
		// Server markup shows the controls before hydration wires them; retry until they respond.
		await expect(async () => {
			if ((await html.getAttribute('data-theme')) !== 'light') await toggle.click();
			await expect(html).toHaveAttribute('data-theme', 'light', { timeout: 1000 });
		}).toPass();
		await expect(async () => {
			if ((await section.getAttribute('aria-expanded')) !== 'false') await section.click();
			await expect(section).toHaveAttribute('aria-expanded', 'false', { timeout: 1000 });
		}).toPass();

		await page.route('**/_app/**/*.js', (route) => route.abort());
		await page.reload();
		await expect(html).toHaveAttribute('data-theme', 'light');
		await expect(section).toHaveAttribute('aria-expanded', 'false');
	});
}
