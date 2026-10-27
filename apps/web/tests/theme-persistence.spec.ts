import { test, expect } from '@playwright/test';
import { createServer, type ViteDevServer } from 'vite';
import type { BlockEditorDoc } from '@repo/shared';

// Ground truth (@yesid/ui ThemeToggle + @yesid/ui/state theme + src/app.html):
//   - toggle control: data-testid="theme-toggle", role="switch", aria-checked={isDark}
//   - localStorage key: 'theme', values 'dark' | 'light'
//   - theme reflected on <html data-theme="...">; pre-paint script always writes 'dark' or 'light' (never null); dark is default
//   - meta[name="theme-color"] SSR'd '#141414' (dark surface); toggle to light => '#F3F6FB'

test.describe('Theme toggle persistence', () => {
	test('page loads in dark theme by default', async ({ page }) => {
		await page.goto('/');

		// The pre-paint inline script in app.html resolves data-theme synchronously
		// to 'light'/'dark' (never null). With no stored preference it must be dark.
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

		// Toggle reflects the dark default via aria-checked.
		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();
		await expect(toggle).toHaveAttribute('role', 'switch');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');
	});

	test('theme toggle button changes theme to light', async ({ page }) => {
		await page.goto('/');

		const htmlElement = page.locator('html');
		await expect(htmlElement).toHaveAttribute('data-theme', 'dark');

		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();

		// Click toggle -> flips to light.
		await toggle.click();
		await expect(htmlElement).toHaveAttribute('data-theme', 'light');
		await expect(toggle).toHaveAttribute('aria-checked', 'false');

		// Clicking again flips back to dark (real toggle behaviour).
		await toggle.click();
		await expect(htmlElement).toHaveAttribute('data-theme', 'dark');
		await expect(toggle).toHaveAttribute('aria-checked', 'true');
	});

	test('theme preference persists after page reload', async ({ page }) => {
		await page.goto('/');

		// Toggle visible == page hydrated; deterministic gate before reading localStorage.
		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();

		// No stored preference on first load.
		const storageBefore = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storageBefore).toBeNull();

		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

		// localStorage now records the chosen theme.
		const storageAfter = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storageAfter).toBe('light');

		// Reload -> pre-paint script restores the stored theme.
		// The data-theme + aria-checked assertions below auto-wait, so no networkidle needed.
		await page.reload();

		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		await expect(page.getByTestId('theme-toggle')).toHaveAttribute('aria-checked', 'false');

		const storageRestored = await page.evaluate(() => localStorage.getItem('theme'));
		expect(storageRestored).toBe('light');
	});

	test('theme-color meta tag updates with theme', async ({ page }) => {
		await page.goto('/');

		// SSR'd dark surface. The toHaveAttribute assertion below auto-waits, so no networkidle needed.
		const themeMeta = page.locator('meta[name="theme-color"]');
		await expect(themeMeta).toHaveAttribute('content', '#141414');

		const toggle = page.getByTestId('theme-toggle');
		await expect(toggle).toBeVisible();

		// Toggle to light -> store rewrites the meta to the light surface.
		await toggle.click();
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
		await expect(themeMeta).toHaveAttribute('content', /^#f3f6fb$/i);

		const newColor = await themeMeta.getAttribute('content');
		expect(newColor).toMatch(/^#[0-9A-F]{6}$/i);
	});
});

test.describe('Project gallery SSR theme hydration', () => {
	let server: ViteDevServer;
	let url: string;
	let html: string;
	const sources = {
		dark: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="black"/></svg>'),
		light: 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="white"/></svg>'),
	};
	const doc: BlockEditorDoc = {
		time: 1, version: '2.31.2',
		blocks: [{
			id: 'theme-image', type: 'image',
			data: {
				file: { url: sources.dark, fileId: '', fileURL: '' },
				variants: { light: { url: sources.light, fileId: '', fileURL: '' } },
				caption: 'Theme-aware screenshot', withBorder: false, withBackground: false, stretched: false,
			},
		}],
	};

	test.beforeAll(async () => {
		test.setTimeout(60_000);
		// The content fixture has no gallery light variants. Render the real component
		// on the server with test-owned data, then hydrate that markup in Chromium.
		server = await createServer({
			server: { host: '127.0.0.1', port: 0 },
			plugins: [{
				name: 'gallery-test-public-env', enforce: 'post',
				config: () => ({ resolve: { alias: [{ find: '$app/env/public', replacement: '\0gallery-public-env' }] } }),
				resolveId: (id) => id === '\0gallery-public-env' ? id : undefined,
				load: (id) => id === '\0gallery-public-env' ? 'export const PUBLIC_DIRECTUS_URL = "";' : undefined,
			}],
		});
		await server.listen();
		expect(server.httpServer?.listening).toBe(true);
		const { default: Gallery } = await server.ssrLoadModule('/src/lib/components/projects/ProjectImageGallery.svelte');
		const { ThemeToggle } = await server.ssrLoadModule('@yesid/ui/brand');
		const { render } = await server.ssrLoadModule('svelte/server');
		const rendered = render(Gallery, { props: { doc } });
		const toggle = render(ThemeToggle, { props: { label: 'Change theme' } });
		expect(rendered.body).toContain(`src="${sources.dark}"`);
		url = new URL('/__gallery-hydration', server.resolvedUrls!.local[0]).href;
		html = await server.transformIndexHtml('/__gallery-hydration', `<!doctype html><html><head>${rendered.head}</head><body>
			<script>
				document.documentElement.dataset.theme = localStorage.getItem('theme') || 'dark';
			</script>
			<div id="toggle">${toggle.body}</div>
			<div id="gallery">${rendered.body}</div>
			<script type="module">
				import { hydrate } from 'svelte';
				import { ThemeToggle } from '@yesid/ui/brand';
				import Gallery from '/src/lib/components/projects/ProjectImageGallery.svelte';
				hydrate(ThemeToggle, { target: document.getElementById('toggle'), props: { label: 'Change theme' } });
				hydrate(Gallery, { target: document.getElementById('gallery'), props: ${JSON.stringify({ doc })} });
				document.documentElement.dataset.hydrated = 'true';
			</script>
		</body></html>`);
	});
	test.afterAll(async () => {
		await server?.close();
		expect(server.httpServer?.listening).toBe(false);
	});

	for (const theme of ['light', 'dark'] as const) {
		test(`loads the ${theme} variant from a saved theme on first SSR hydration`, async ({ page }, testInfo) => {
			await page.addInitScript((saved) => localStorage.setItem('theme', saved), theme);
			await page.route(url, (route) => route.fulfill({ contentType: 'text/html', body: html }));
			await page.goto(url);
			await expect(page.locator('html')).toHaveAttribute('data-hydrated', 'true');
			await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
			const image = page.getByTestId('project-image-gallery-trigger').locator('img');
			await expect(image).toHaveAttribute('src', sources[theme]);
			await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);

			for (const next of [theme === 'light' ? 'dark' : 'light', theme] as const) {
				await page.getByTestId('theme-toggle').click();
				await expect(page.locator('html')).toHaveAttribute('data-theme', next);
				await expect(image).toHaveAttribute('src', sources[next]);
			}
			const trigger = page.getByTestId('project-image-gallery-trigger');
			await trigger.press('Enter');
			const dialog = page.getByRole('dialog');
			await expect(dialog.locator('img')).toHaveAttribute('src', sources[theme]);
			const close = dialog.getByRole('button');
			await expect(close).toBeFocused();
			await page.keyboard.press('Tab');
			await expect(close).toBeFocused();
			await page.keyboard.press('Shift+Tab');
			await expect(close).toBeFocused();
			await page.keyboard.press('Escape');
			await expect(dialog).toHaveCount(0);
			await expect(trigger).toBeFocused();
			await page.screenshot({ path: testInfo.outputPath(`gallery-${theme}-hydrated.png`) });
		});
	}
});
