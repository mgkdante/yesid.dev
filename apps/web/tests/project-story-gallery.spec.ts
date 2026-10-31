import { test, expect } from '@playwright/test';
import { projects } from '../src/lib/content/projects';

const project = projects.find((candidate) => {
	const docs = [candidate.description.en, ...candidate.sections.map((section) => section.content.en)];
	const files = docs.flatMap((doc) => doc.blocks.flatMap((block) =>
		block.type === 'image' ? [block.data.file.fileId || block.data.file.url] : [],
	));
	return new Set(files).size >= 2;
});

test('project gallery follows the reader flow and supports native browsing and keyboard lightbox access', async ({ page, viewport }) => {
	expect(project, 'fixture needs a project with two distinct article images').toBeDefined();
	await page.goto(`/projects/${project!.slug}`);
	const mobile = viewport!.width < 1024;
	const gallery = page.getByTestId(mobile ? 'project-image-gallery-mobile' : 'project-image-gallery-rail');
	await expect(gallery).toBeVisible();
	const thumbnails = gallery.getByTestId('project-image-gallery-trigger');
	expect(await thumbnails.count()).toBeGreaterThanOrEqual(2);
	await expect(thumbnails.nth(1)).toBeEnabled({ timeout: 30_000 });

	if (mobile) {
		const panels = await page.getByTestId('project-glance-panel-mobile').boundingBox();
		const images = await gallery.boundingBox();
		expect(images!.y).toBeGreaterThanOrEqual(panels!.y + panels!.height);
		const scroller = gallery.getByTestId('project-image-gallery');
		await expect(scroller).toHaveCSS('overflow-x', 'auto');
		// Wheel browsing is independent of the thumbnail's focus handler.
		await scroller.hover();
		await page.mouse.wheel(400, 0);
		await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
		await scroller.evaluate((element) => { element.scrollLeft = 0; });
		await thumbnails.first().focus();
		await page.keyboard.press('Tab');
		await expect(thumbnails.nth(1)).toBeFocused();
		await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
		await expect.poll(async () => {
			const strip = await scroller.boundingBox();
			const focused = await thumbnails.nth(1).boundingBox();
			return Boolean(strip && focused && focused.x >= strip.x && focused.x + focused.width <= strip.x + strip.width);
		}).toBe(true);
	} else {
		const rail = await gallery.boundingBox();
		const article = await page.locator('.sections-column').boundingBox();
		expect(rail!.x + rail!.width).toBeLessThanOrEqual(article!.x);
		await thumbnails.nth(1).focus();
	}

	await page.keyboard.press('Enter');
	await expect(page.getByRole('dialog')).toBeVisible();
	await expect(page.getByTestId('project-image-gallery-lightbox-image')).toBeVisible();
	await expect(page.locator('.project-image-gallery__lightbox-caption')).toHaveCSS('font-size', '16px');
	await page.keyboard.press('Escape');
	await expect(page.getByRole('dialog')).not.toBeVisible();
	await expect(thumbnails.nth(1)).toBeFocused();
});
