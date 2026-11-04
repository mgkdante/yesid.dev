import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

test.skip(({ viewport }) => viewport?.width !== 1440, 'Explicit title matrix runs in desktop.');

for (const locale of ['en', 'fr', 'es']) {
	for (const viewport of [{ width: 1024, height: 900 }, { width: 1440, height: 900 }, { width: 1440, height: 1200 }]) {
		test(`${locale} ${viewport.width}x${viewport.height} home titles share type, column placement and sticky line`, async ({ page }, testInfo) => {
			await page.setViewportSize(viewport);
			await page.goto(locale === 'en' ? '/' : `/${locale}`);
			await expect(page.locator('.home-section').first()).toHaveAttribute('style', /--rotated-title-size:/);
			await page.evaluate(() => document.fonts.ready);
			await expect(page.locator('.construction-extension')).toHaveCSS('height', '0px');
			const titles = page.locator('.rotated-title');
			await expect(titles).toHaveCount(4);
			await page.evaluate(() => window.scrollTo(0, 0));
			const measured = await titles.evaluateAll(elements => elements.map(el => {
				const heading = el.querySelector('.section-heading-text')!;
				const dot = el.querySelector('[data-slot="section-heading-dot"]')!;
				const content = el.parentElement!.querySelector('.home-section-content')!;
				const style = getComputedStyle(el), type = getComputedStyle(heading);
				const rect = el.getBoundingClientRect(), parent = el.parentElement!.getBoundingClientRect(), text = heading.getBoundingClientRect(), c = content.getBoundingClientRect();
				const right = el.classList.contains('rotated-title--right');
				return {
					title: heading.textContent!.trim(),
					type: { font: type.fontFamily, size: type.fontSize, weight: type.fontWeight, spacing: type.letterSpacing, writing: style.writingMode },
					rotation: style.rotate, right, block: { width: rect.width, height: rect.height }, text: { width: text.width, height: text.height },
					columnOffset: right ? parent.right - rect.right : rect.left - parent.left,
					contentGap: right ? rect.left - c.right : c.left - rect.right,
					textCenterOffset: (text.left + text.right - rect.left - rect.right) / 2,
					stickyTop: parseFloat(style.top), z: style.zIndex,
					dot: { color: getComputedStyle(dot).color, size: getComputedStyle(dot).fontSize, hidden: dot.getAttribute('aria-hidden') },
					sectionTop: parent.top + scrollY, sectionHeight: parent.height,
					start: parent.top + scrollY - parseFloat(style.top),
					end: parent.bottom + scrollY - rect.height - parseFloat(style.top),
					travel: parent.height - rect.height,
				};
			}));
			const samples = [];
			for (let i = 0; i < measured.length; i++) {
				const title = measured[i];
				expect(title.type).toEqual(measured[0].type);
				expect(title.dot).toEqual(measured[0].dot);
				expect(title.rotation).toBe(title.right ? 'none' : '180deg');
				expect(Math.abs(title.columnOffset)).toBeLessThanOrEqual(1);
				expect(Math.abs(title.contentGap)).toBeLessThanOrEqual(1);
				expect(Math.abs(title.textCenterOffset)).toBeLessThanOrEqual(1);
				expect(title.stickyTop).toBe(viewport.height / 2);
				expect(title.z).toBe(measured[0].z);
				const positions = [];
				for (const requested of [title.start - 20, title.start + 1, (title.start + title.end) / 2, title.end - 1, title.end + 20]) {
					await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), requested);
					if (i === 3) await expect.poll(() => page.locator('.construction-extension').evaluate(el => {
						const progress = Number(document.querySelector('[data-slot="construction-props"]')!.getAttribute('data-progress'));
						return Math.abs(el.getBoundingClientRect().height - 100 * progress);
					})).toBeLessThan(0.1);
					await expect.poll(() => titles.nth(i).evaluate(el => {
						const r = el.getBoundingClientRect(), p = el.parentElement!.getBoundingClientRect();
						return Math.abs(r.top - Math.min(Math.max(p.top, innerHeight / 2), p.bottom - r.height));
					})).toBeLessThanOrEqual(1);
					positions.push(await titles.nth(i).evaluate(el => ({ scroll: scrollY, top: el.getBoundingClientRect().top })));
				}
				// Check the shared line itself, not only agreement with CSS's formula.
				for (const position of positions.slice(1, 4)) expect(Math.abs(position.top - title.stickyTop)).toBeLessThanOrEqual(1);
				expect(positions[0].top).toBeGreaterThan(title.stickyTop);
				expect(positions[4].top).toBeLessThan(title.stickyTop);
				samples.push({ ...title, positions });
				if (process.env.S7_EVIDENCE && viewport.width === 1440 && viewport.height === 900 && [0, 2].includes(i)) {
					await mkdir(process.env.S7_EVIDENCE, { recursive: true });
					await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), title.start + 1);
					await titles.nth(i).locator('..').screenshot({ path: join(process.env.S7_EVIDENCE, `${locale}-1440x900-${i === 2 ? 'about' : 'services'}-section.png`) });
					await page.screenshot({ path: join(process.env.S7_EVIDENCE, `${locale}-1440x900-${i === 2 ? 'about' : 'services'}-sticky.png`) });
				}
			}
			const report = JSON.stringify({ locale, ...viewport, titles: samples }, null, 2);
			await testInfo.attach('title-geometry', { body: report, contentType: 'application/json' });
			if (process.env.S7_EVIDENCE) {
				await mkdir(process.env.S7_EVIDENCE, { recursive: true });
				await writeFile(join(process.env.S7_EVIDENCE, `${locale}-${viewport.width}x${viewport.height}-titles.json`), report);
			}
		});
	}
}
