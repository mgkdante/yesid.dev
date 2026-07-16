import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, type Page } from '@playwright/test';

const routes = [
	['home', '/', 'home-cta-band'],
	['service', '/services/database-engineering', 'service-cta-band'],
	['project', '/projects/yesid-dev', 'project-cta-band'],
] as const;

const viewports = [
	['desktop', 1280, 720],
	['large-desktop', 1512, 982],
	['wide-desktop', 1920, 1080],
	['tablet', 768, 1024],
	['phone', 390, 664],
	['small-phone', 360, 780],
] as const;

const densityViewports = viewports.slice(0, 3);

const themes = ['dark', 'light'] as const;
const shotRoot = process.env.CTA_BLUEPRINT_SHOT_DIR;
const captureShots = process.env.CTA_BLUEPRINT_SHOTS === '1' && Boolean(shotRoot);

async function waitForStablePaint(page: Page): Promise<void> {
	await page.waitForLoadState('load');
	await page.evaluate(() => document.fonts.ready);
}

async function measureBlueprintVerticalDensity(
	page: Page,
): Promise<{ upper: number; lower: number; ratio: number }> {
	return page.getByTestId('cta-blueprint-background').evaluate((background) => {
		const root = background.getBoundingClientRect();
		const splitY = root.top + root.height / 2;
		let upper = 0;
		let lower = 0;

		const effectiveOpacity = (target: Element) => {
			let opacity = 1;
			let current: Element | null = target;
			while (current) {
				opacity *= Number.parseFloat(getComputedStyle(current).opacity || '1');
				if (current === background) break;
				current = current.parentElement;
			}
			return opacity;
		};

		const toScreen = (matrix: DOMMatrix, point: DOMPoint) => ({
			x: matrix.a * point.x + matrix.c * point.y + matrix.e,
			y: matrix.b * point.x + matrix.d * point.y + matrix.f,
		});

		for (const geometry of background.querySelectorAll<SVGGeometryElement>(
			'path, line, rect, circle, ellipse, polyline, polygon',
		)) {
			const styles = getComputedStyle(geometry);
			if (
				styles.display === 'none' ||
				styles.visibility === 'hidden' ||
				styles.stroke === 'none'
			) {
				continue;
			}

			const matrix = geometry.getScreenCTM();
			const length = geometry.getTotalLength();
			const strokeWidth = Number.parseFloat(styles.strokeWidth);
			if (!matrix || !Number.isFinite(length) || length <= 0 || !Number.isFinite(strokeWidth)) {
				continue;
			}

			const screenScale =
				(Math.hypot(matrix.a, matrix.b) + Math.hypot(matrix.c, matrix.d)) / 2;
			const weight = strokeWidth * screenScale * effectiveOpacity(geometry);
			const segmentCount = Math.min(160, Math.max(1, Math.ceil(length / 8)));
			let previous = toScreen(matrix, geometry.getPointAtLength(0));

			for (let index = 1; index <= segmentCount; index += 1) {
				const current = toScreen(
					matrix,
					geometry.getPointAtLength((length * index) / segmentCount),
				);
				const contribution = Math.hypot(current.x - previous.x, current.y - previous.y) * weight;
				const midpoint = {
					x: (current.x + previous.x) / 2,
					y: (current.y + previous.y) / 2,
				};
				if (
					midpoint.x >= root.left &&
					midpoint.x <= root.right &&
					midpoint.y >= root.top &&
					midpoint.y <= root.bottom
				) {
					if (midpoint.y < splitY) upper += contribution;
					else lower += contribution;
				}
				previous = current;
			}
		}

		return {
			upper: Number(upper.toFixed(1)),
			lower: Number(lower.toFixed(1)),
			ratio: Number((upper / lower).toFixed(3)),
		};
	});
}

async function assertBandGeometry(page: Page, prefix: string): Promise<void> {
	const band = page.getByTestId(prefix);
	const background = band.getByTestId('cta-blueprint-background');
	const foreground = band.locator(':scope > .cta-band');

	await expect(band).toBeVisible();
	await expect(background).toBeVisible();
	await expect(foreground).toBeVisible();
	await expect
		.poll(
			async () => {
				const [currentBandBox, currentBackgroundBox] = await Promise.all([
					band.boundingBox(),
					background.boundingBox(),
				]);
				if (!currentBandBox || !currentBackgroundBox) return Number.POSITIVE_INFINITY;
				return Math.max(
					Math.abs(currentBackgroundBox.x - currentBandBox.x),
					Math.abs(currentBackgroundBox.y - currentBandBox.y),
					Math.abs(currentBackgroundBox.width - currentBandBox.width),
					Math.abs(currentBackgroundBox.height - currentBandBox.height),
				);
			},
			{ message: `${prefix} background must fill the settled band` },
		)
		.toBeLessThanOrEqual(1);

	const [bandBox, backgroundBox, foregroundBox] = await Promise.all([
		band.boundingBox(),
		background.boundingBox(),
		foreground.boundingBox(),
	]);
	expect(bandBox).not.toBeNull();
	expect(backgroundBox).not.toBeNull();
	expect(foregroundBox).not.toBeNull();

	for (const [measurement, actual, expected] of [
		['x', backgroundBox!.x, bandBox!.x],
		['y', backgroundBox!.y, bandBox!.y],
		['width', backgroundBox!.width, bandBox!.width],
		['height', backgroundBox!.height, bandBox!.height],
	] as const) {
		expect(
			Math.abs(actual - expected),
			`${prefix} background ${measurement} must fill the band`,
		).toBeLessThanOrEqual(1);
	}

	expect(foregroundBox!.width).toBeLessThanOrEqual(Math.min(bandBox!.width, 1152) + 1);
	const headingBox = await band.getByRole('heading', { level: 2 }).boundingBox();
	expect(headingBox).not.toBeNull();
	const headingCenter = {
		x: headingBox!.x + headingBox!.width / 2,
		y: headingBox!.y + headingBox!.height / 2,
	};
	expect(headingCenter.x).toBeGreaterThanOrEqual(backgroundBox!.x);
	expect(headingCenter.x).toBeLessThanOrEqual(backgroundBox!.x + backgroundBox!.width);
	expect(headingCenter.y).toBeGreaterThanOrEqual(backgroundBox!.y);
	expect(headingCenter.y).toBeLessThanOrEqual(backgroundBox!.y + backgroundBox!.height);

	const shellStyles = await band.evaluate((element) => {
		const bg = element.querySelector<HTMLElement>('[data-testid="cta-blueprint-background"]')!;
		const fg = element.querySelector<HTMLElement>(':scope > .cta-band')!;
		const shell = getComputedStyle(element);
		return {
			overflowX: shell.overflowX,
			overflowY: shell.overflowY,
			shellBackground: shell.backgroundColor,
			pageBackground: getComputedStyle(document.documentElement).backgroundColor,
			foregroundBackground: getComputedStyle(fg).backgroundColor,
			backgroundPointerEvents: getComputedStyle(bg).pointerEvents,
			backgroundZ: Number(getComputedStyle(bg).zIndex),
			foregroundZ: Number(getComputedStyle(fg).zIndex),
		};
	});
	expect(['clip', 'hidden']).toContain(shellStyles.overflowX);
	expect(['clip', 'hidden']).toContain(shellStyles.overflowY);
	expect(shellStyles.shellBackground).toBe(shellStyles.pageBackground);
	expect(shellStyles.foregroundBackground).toBe('rgba(0, 0, 0, 0)');
	expect(shellStyles.backgroundPointerEvents).toBe('none');
	expect(shellStyles.backgroundZ).toBeLessThan(shellStyles.foregroundZ);

	await expect(background).toHaveAttribute('aria-hidden', 'true');
	expect(
		await background.locator('a, button, input, select, textarea, [tabindex]').count(),
	).toBe(0);

	const sheetIntersections = await background.locator('[data-cta-sheet]').evaluateAll((sheets, box) =>
			sheets.map((sheet) => {
			const rect = sheet.getBoundingClientRect();
			return {
				left: rect.left,
				top: rect.top,
				right: rect.right,
				bottom: rect.bottom,
				width: rect.width,
				height: rect.height,
				intersectionWidth: Math.max(0, Math.min(rect.right, box.right) - Math.max(rect.left, box.left)),
				intersectionHeight: Math.max(0, Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top)),
			};
		}),
		{
			left: bandBox!.x,
			top: bandBox!.y,
			right: bandBox!.x + bandBox!.width,
			bottom: bandBox!.y + bandBox!.height,
		},
	);
	expect(sheetIntersections).toHaveLength(12);
	const visibleSheets = sheetIntersections.filter((sheet) => sheet.width > 0 && sheet.height > 0);
	expect(visibleSheets).toHaveLength(page.viewportSize()!.width < 768 ? 7 : 12);
	for (const sheet of visibleSheets) {
		expect(sheet.width).toBeGreaterThan(0);
		expect(sheet.height).toBeGreaterThan(0);
		expect(sheet.intersectionWidth).toBeGreaterThan(0);
		expect(sheet.intersectionHeight).toBeGreaterThan(0);
	}
	for (let column = 0; column < 5; column += 1) {
		for (let row = 0; row < 2; row += 1) {
			const zone = {
				left: bandBox!.x + (bandBox!.width * column) / 5,
				right: bandBox!.x + (bandBox!.width * (column + 1)) / 5,
				top: bandBox!.y + (bandBox!.height * row) / 2,
				bottom: bandBox!.y + (bandBox!.height * (row + 1)) / 2,
			};
			expect(
				visibleSheets.some(
					(sheet) =>
						Math.min(sheet.right, zone.right) > Math.max(sheet.left, zone.left) &&
						Math.min(sheet.bottom, zone.bottom) > Math.max(sheet.top, zone.top),
				),
				`blueprint sheets must cover column ${column + 1}, row ${row + 1}`,
			).toBe(true);
		}
	}

	for (const suffix of ['contact', 'github']) {
		const action = page.getByTestId(`${prefix}-${suffix}`);
		await expect(action).toBeVisible();
		const box = await action.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.width).toBeGreaterThanOrEqual(44);
		expect(box!.height).toBeGreaterThanOrEqual(44);
		await action.focus();
		await expect(action).toBeFocused();
	}
	await band.evaluate(() => {
		if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
	});
	await expect
		.poll(() =>
			band
				.locator('.band-actions')
				.evaluate((element) => element.getAnimations({ subtree: true }).length),
		)
		.toBe(0);

	const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
	expect(overflow).toBeLessThanOrEqual(1);
}

async function captureBand(page: Page, prefix: string, path?: string): Promise<Buffer> {
	const band = page.getByTestId(prefix);
	await page.addStyleTag({
		content: `
			[data-testid="nav"], [data-testid="toc-pill"] { visibility: hidden !important; }
			*, *::before, *::after {
				animation-duration: 0s !important;
				animation-delay: 0s !important;
				transition: none !important;
				caret-color: transparent !important;
			}
		`,
	});
	return band.screenshot(path ? { path } : undefined);
}

for (const [viewportName, width, height] of viewports) {
	for (const theme of themes) {
		test(`${viewportName} ${theme}: shared blueprint band is full, clipped, and route-invariant`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
			const domSnapshots: string[] = [];
			const styleSnapshots: string[] = [];
			const routeBoxes: { width: number; height: number }[] = [];

			for (const [routeName, route, prefix] of routes) {
				await page.goto(route);
				await waitForStablePaint(page);
				await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
				await assertBandGeometry(page, prefix);

				const band = page.getByTestId(prefix);
				const box = await band.boundingBox();
				expect(box).not.toBeNull();
				routeBoxes.push({ width: box!.width, height: box!.height });
				domSnapshots.push(
					await band.evaluate(
						(element, routePrefix) => element.outerHTML.replaceAll(routePrefix, 'cta-band'),
						prefix,
					),
				);
				styleSnapshots.push(
					await band.evaluate((element) => {
						const pick = (selector: string, properties: string[]) => {
							const target =
								selector === ':scope' ? (element as HTMLElement) : element.querySelector<HTMLElement>(selector)!;
							const styles = getComputedStyle(target);
							return Object.fromEntries(properties.map((property) => [property, styles.getPropertyValue(property)]));
						};
						return JSON.stringify({
							root: pick(':scope', ['position', 'overflow-x', 'overflow-y', 'background-color', 'isolation']),
							foreground: pick(':scope > .cta-band', ['max-width', 'padding-left', 'padding-right', 'background-color', 'z-index']),
							heading: pick('.band-heading', ['font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color', 'text-align']),
							subtitle: pick('.band-subtitle', ['font-family', 'font-size', 'line-height', 'color', 'text-align']),
							background: pick('[data-testid="cta-blueprint-background"]', ['position', 'pointer-events', 'color', 'z-index']),
							hero: pick('.hero-svg', ['opacity']),
							details: pick('.edge-details', ['opacity']),
							contact: pick(`[data-testid$="-contact"]`, ['background-color', 'color', 'border-color']),
							github: pick(`[data-testid$="-github"]`, ['background-color', 'color', 'border-color']),
						});
					}),
				);

				if (captureShots) {
					await captureBand(
						page,
						prefix,
						join(shotRoot!, `${routeName}-${viewportName}-${theme}-no-preference.png`),
					);
				}
			}

			expect(domSnapshots[1]).toBe(domSnapshots[0]);
			expect(domSnapshots[2]).toBe(domSnapshots[0]);
			expect(styleSnapshots[1]).toBe(styleSnapshots[0]);
			expect(styleSnapshots[2]).toBe(styleSnapshots[0]);
			for (const box of routeBoxes.slice(1)) {
				expect(Math.abs(box.width - routeBoxes[0].width)).toBeLessThanOrEqual(1);
				expect(Math.abs(box.height - routeBoxes[0].height)).toBeLessThanOrEqual(1);
			}
		});
	}
}

for (const [viewportName, width, height] of densityViewports) {
	for (const theme of themes) {
		test(`${viewportName} ${theme}: blueprint stroke density is vertically balanced`, async ({
			page,
		}) => {
			await page.setViewportSize({ width, height });
			await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
			await page.goto('/');
			await waitForStablePaint(page);

			const density = await measureBlueprintVerticalDensity(page);
			console.info(`[cta-density] ${viewportName} ${theme} ${JSON.stringify(density)}`);
			expect(
				density.ratio,
				`${viewportName} ${theme} blueprint density ${JSON.stringify(density)} must not stack toward either edge`,
			).toBeGreaterThanOrEqual(0.82);
			expect(
				density.ratio,
				`${viewportName} ${theme} blueprint density ${JSON.stringify(density)} must not overcorrect toward the top`,
			).toBeLessThanOrEqual(1.2);
		});
	}
}

test('French detail route keeps the same shared band with localized semantics', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 664 });
	await page.goto('/fr/services/database-engineering');
	await waitForStablePaint(page);
	await assertBandGeometry(page, 'service-cta-band');

	const band = page.getByTestId('service-cta-band');
	await expect(band.locator('.band-line').nth(0)).toHaveText('Bâtissons quelque chose');
	await expect(band.locator('.band-line').nth(1)).toHaveText('qui avance.');
	await expect(band.locator('.band-subtitle')).toHaveText(
		"Base de données, pipeline, tableau de bord, site web : peu importe où ça accroche, c'est là qu'on commence.",
	);
	await expect(band.getByRole('link', { name: 'Parlons-en' })).toHaveAttribute('href', '/fr/contact');
	await expect(band.getByRole('link', { name: 'Voir sur GitHub' })).toBeVisible();
});

test('reduced motion keeps the same complete static blueprint composition', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 664 });
	await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
	const compositionSignatures: string[] = [];

	for (const reducedMotion of ['no-preference', 'reduce'] as const) {
		await page.emulateMedia({ reducedMotion });
		await page.goto('/');
		await waitForStablePaint(page);
		await assertBandGeometry(page, 'home-cta-band');

		const background = page.getByTestId('cta-blueprint-background');
		expect(await background.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
		compositionSignatures.push(
			await background.evaluate((element) => {
				const root = element.getBoundingClientRect();
				const primitiveCount = (target: Element) =>
					target.querySelectorAll('path, line, rect, circle, ellipse, polyline, polygon, text').length;
				const relativeBox = (target: Element) => {
					const rect = target.getBoundingClientRect();
					if (rect.width === 0 && rect.height === 0) return [0, 0, 0, 0];
					return [rect.x - root.x, rect.y - root.y, rect.width, rect.height].map((value) =>
						Number(value.toFixed(3)),
					);
				};
				const hero = element.querySelector<SVGElement>('.hero-svg svg')!;
				return JSON.stringify({
					hero: {
						viewBox: hero.getAttribute('viewBox'),
						primitiveCount: primitiveCount(hero),
					},
					heroOpacity: getComputedStyle(element.querySelector('.hero-svg')!).opacity,
					sheets: [...element.querySelectorAll('[data-cta-sheet]')].map((sheet) => ({
						name: sheet.getAttribute('data-cta-sheet'),
						viewBox: sheet.getAttribute('viewBox'),
						primitiveCount: primitiveCount(sheet),
						box: relativeBox(sheet),
						opacity: getComputedStyle(sheet).opacity,
					})),
				});
			}),
		);
		if (captureShots) {
			await captureBand(
				page,
				'home-cta-band',
				join(shotRoot!, `home-phone-dark-${reducedMotion}.png`),
			);
		}
	}

	expect(compositionSignatures[1]).toBe(compositionSignatures[0]);
});

test.beforeAll(() => {
	if (captureShots) mkdirSync(shotRoot!, { recursive: true });
});
