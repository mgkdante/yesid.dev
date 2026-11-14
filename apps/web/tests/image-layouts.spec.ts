import { test, expect } from '@playwright/test';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

// Use the installed SvelteKit serializer without adding a test dependency.
const require = createRequire(import.meta.url);
const kitRequire = createRequire(require.resolve('@sveltejs/kit/package.json'));
const { stringify, unflatten } = await import(pathToFileURL(kitRequire.resolve('devalue')).href);
import type { BlockEditorDoc, ImageBlock } from '@repo/shared';
import { projects } from '../src/lib/content/projects';

const project = projects.find(item => item.description.en.blocks.length);
const image = (id: string, layout?: 'row' | 'beside', both = false): ImageBlock => ({
	id, type: 'image', data: {
		file: { fileId: '', fileURL: '', url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844"><rect width="390" height="844" fill="#345"/></svg>'), width: 390, height: 844 },
		caption: id, withBorder: false, withBackground: false, stretched: true, layout,
		...(both ? { showBothThemes: true, variants: { light: { fileId: '', fileURL: '', url: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844"><rect width="390" height="844" fill="#abc"/></svg>'), width: 390, height: 844 } } } : {}),
	},
});
const doc: BlockEditorDoc = { time: 0, version: '2', blocks: [
	image('Single phone'), ...['One', 'Two', 'Three', 'Four'].map(id => image(id, 'row')),
	image('Beside phone', 'beside'), { id: 'table', type: 'table', data: { withHeadings: true, content: [['Feature', 'Value'], ['Language', 'French']] } },
	image('Themes', undefined, true),
] };

test('article image layouts preserve order and fit desktop and phones', async ({ page }, testInfo) => {
	test.skip(testInfo.project.name !== 'desktop', 'One test explicitly covers all three widths');
	// Change only the browser response, leaving shared fixture and production content untouched.
	await page.route('**/__data.json*', async route => {
		const response = await route.fetch();
		const payload = await response.json();
		for (const node of payload.nodes ?? []) {
			if (node?.type !== 'data' || !node.data) continue;
			const data = unflatten(node.data) as { project?: { description: { en: BlockEditorDoc }; sections: unknown[] } };
			if (!data.project) continue;
			data.project.sections = [{ title: { en: 'Image layouts' }, content: { en: doc } }];
			node.data = JSON.parse(stringify(data));
		}
		await route.fulfill({ response, json: payload });
	});
	await page.goto('/projects');
	// SSR links can navigate by document before Kit's client router starts.
	await expect(page.locator('html')).toHaveAttribute('data-hydrated', '');
	await page.locator(`a[href="/projects/${project!.slug}"]`).first().click();
	const article = page.locator('.article-body:visible').filter({ has: page.locator('[data-image-layout="row"]') });
	const row = article.locator('[data-image-layout="row"]:visible');
	await expect(row).toBeVisible();
	for (const width of [1440, 390, 320]) {
		await page.setViewportSize({ width, height: 1000 });
		const phones = row.getByRole('img');
		const boxes = await phones.evaluateAll(nodes => nodes.map(n => { const b = n.getBoundingClientRect(); return { x: b.x, y: b.y, width: b.width }; }));
		expect(boxes).toHaveLength(4);
		expect(boxes.every(b => b.width <= 390)).toBe(true);
		if (width >= 768) {
			expect(boxes[0].y).toBeCloseTo(boxes[1].y, 0);
			expect(boxes[3].y).toBeGreaterThan(boxes[0].y);
		} else {
			expect(boxes[1].y).toBeGreaterThan(boxes[0].y);
			expect(boxes[0].x).toBeCloseTo(boxes[1].x, 0);
		}
		const single = await article.getByRole('img', { name: 'Single phone', exact: true }).boundingBox();
		expect(single!.width).toBeLessThanOrEqual(400);
		const beside = page.locator('[data-image-layout="beside"]:visible');
		const phone = await beside.getByRole('img').boundingBox();
		const table = await beside.getByRole('table').boundingBox();
		if (width >= 768) expect(table!.x).toBeGreaterThan(phone!.x);
		else expect(table!.y).toBeGreaterThan(phone!.y + phone!.height);
		await expect(article.getByText('Themes · Dark', { exact: true })).toBeVisible();
		await expect(article.getByText('Themes · Light', { exact: true })).toBeVisible();
		expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
	}
	await article.getByRole('button', { name: 'Open Themes · Light', exact: true }).click();
	const dialog = page.getByRole('dialog');
	await expect(dialog).toBeVisible();
	await expect(dialog.getByRole('img')).toHaveAttribute('src', /%23abc/);
	await page.keyboard.press('Escape');
	await expect(dialog).not.toBeVisible();
});

