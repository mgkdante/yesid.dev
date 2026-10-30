import { test, expect } from '@playwright/test';
import { services } from '../src/lib/content/services';
import { gotoFirstDetail, blogPostLinks, projectDetailLinks } from './_support/helpers';

const readers = [
	{ kind: 'projects', links: projectDetailLinks, landmark: 'project-detail-page', body: '.sections-column .article-body:visible' },
	{ kind: 'blog', links: blogPostLinks, landmark: 'blog-detail-page', body: '.blog-section-body:visible' },
	{ kind: 'services', landmark: 'service-detail-page', body: '.sections .section-body:not([data-slot="collapsible-content"]):visible' },
] as const;

test('project, blog and service details share the reading scale without page-wide code overflow', async ({ page, viewport }, testInfo) => {
	const desktop = viewport!.width >= 1024;
	const measurements = [];
	await page.emulateMedia({ reducedMotion: 'reduce' });
	for (const reader of readers) {
		if (reader.kind === 'services') {
			const service = services.find((item) => item.visible !== false && (item.valueProposition || item.sections?.length));
			expect(service, 'fixture needs a service with reading content').toBeDefined();
			await page.goto(`/services/${service!.id}`);
			await expect(page.getByTestId(reader.landmark)).toBeVisible();
		} else {
			await gotoFirstDetail(page, `/${reader.kind}`, reader.links, reader.landmark);
		}
		await page.evaluate(() => document.fonts.ready);
		const body = page.locator(reader.body).first();
		await expect(body).toBeVisible();
		const sample = await body.evaluate((element) => {
			const fixture = document.createElement('div');
			fixture.className = 'article-body';
			fixture.innerHTML = '<p>Readable prose with an <code data-inline>inline value</code>.</p><ul><li>Consistent list text.</li></ul><blockquote><p>Consistent quoted text.</p></blockquote><table><tbody><tr><td>Consistent table text.</td></tr></tbody></table><figure><figcaption>Image caption.</figcaption></figure><pre data-code tabindex="0"><code>const proof = "' + 'x'.repeat(240) + '";</code></pre>';
			element.after(fixture);
			const size = (node: Element) => parseFloat(getComputedStyle(node).fontSize);
			const code = fixture.querySelector<HTMLElement>('[data-code]')!;
			const style = getComputedStyle(code);
			const result = {
				body: size(element),
				prose: [...fixture.querySelectorAll('p, li, td')].map(size),
				inline: size(fixture.querySelector('[data-inline]')!),
				code: size(code),
				codeLeading: parseFloat(style.lineHeight) / size(code),
				caption: size(fixture.querySelector('figcaption')!),
				codeScrolls: code.scrollWidth > code.clientWidth && style.overflowX === 'auto',
				pageOverflows: document.documentElement.scrollWidth > window.innerWidth,
				fontsLoaded: document.fonts.check('20px "Inter Variable"') && document.fonts.check('17px "JetBrains Mono Variable"'),
			};
			fixture.remove();
			return result;
		});
		measurements.push({ kind: reader.kind, width: viewport!.width, ...sample });
		const railBody = page.locator('.reading-support p:visible').first();
		if (await railBody.count()) {
			const size = await railBody.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
			measurements.push({ kind: reader.kind, supportingBody: size });
			expect.soft(size).toBe(18);
		}
		if (reader.kind === 'projects') {
			const metric = page.locator('[data-slot="metric-display"] .metric-value:visible').first();
			if (await metric.count()) measurements.push({ projectCompactMetric: await metric.evaluate((element) => parseFloat(getComputedStyle(element).fontSize)) });
		}
		expect.soft(sample.body).toBe(desktop ? 20 : 19);
		for (const size of sample.prose) expect.soft(size).toBe(desktop ? 20 : 19);
		expect.soft(sample.inline).toBeCloseTo((desktop ? 20 : 19) * 0.95, 1);
		expect.soft(sample.code).toBe(desktop ? 17 : 16);
		expect.soft(sample.codeLeading).toBeCloseTo(1.6, 1);
		expect.soft(sample.caption).toBe(16);
		expect.soft(sample.codeScrolls).toBe(true);
		expect.soft(sample.pageOverflows).toBe(false);
		expect.soft(sample.fontsLoaded).toBe(true);
		await expect.soft(page.locator('.section-header .section-title:visible').first()).toHaveCSS('font-size', `${desktop ? 22 : 20}px`);
		if (reader.kind === 'services') {
			const metric = page.locator(desktop ? '.impact-value:visible' : '.metric-inline-value:visible').first();
			const size = await metric.evaluate((element) => parseFloat(getComputedStyle(element).fontSize));
			measurements.push({ serviceImpact: size });
			expect.soft(size).toBeCloseTo(desktop ? Math.min(124, Math.max(78, viewport!.width * 0.089)) : Math.min(36, Math.max(28.8, viewport!.width * 0.045)), 1);
		}
		await body.scrollIntoViewIfNeeded();
		await page.screenshot({ path: testInfo.outputPath(`${reader.kind}-${desktop ? 'desktop' : 'mobile'}.png`) });
	}
	await testInfo.attach('reading-scale.json', { body: JSON.stringify(measurements, null, 2), contentType: 'application/json' });
});

test('article text remains readable at 200 percent with user spacing and contained code scrolling', async ({ page, viewport }, testInfo) => {
	test.skip(viewport!.width >= 1024, 'One narrow-viewport override check.');
	await gotoFirstDetail(page, '/projects', projectDetailLinks, 'project-detail-page');
	await page.addStyleTag({ content: 'html { font-size: 200% !important; } .article-body * { line-height: 1.5 !important; letter-spacing: .12em !important; word-spacing: .16em !important; } .article-body p { margin-bottom: 2em !important; }' });
	const body = page.locator('.sections-column .article-body:visible').first();
	const result = await body.evaluate((element) => {
		const fixture = document.createElement('div');
		fixture.innerHTML = '<p>Text resized to two hundred percent remains available and wraps inside its reader.</p><pre tabindex="0"><code>' + 'long_code_value_'.repeat(30) + '</code></pre>';
		element.append(fixture);
		const paragraph = fixture.querySelector('p')!;
		const code = fixture.querySelector('pre')!;
		return {
			size: parseFloat(getComputedStyle(paragraph).fontSize),
			paragraphFits: paragraph.getBoundingClientRect().right <= window.innerWidth,
			codeFits: code.getBoundingClientRect().right <= window.innerWidth && code.scrollWidth > code.clientWidth,
			pageFits: document.documentElement.scrollWidth <= window.innerWidth,
		};
	});
	expect(result.size).toBe(38);
	expect(result.paragraphFits).toBe(true);
	expect(result.codeFits).toBe(true);
	expect(result.pageFits).toBe(true);
	await body.locator('pre').last().focus();
	await expect(body.locator('pre').last()).toBeFocused();
	await page.screenshot({ path: testInfo.outputPath('project-mobile-200-percent-spacing.png') });
});
