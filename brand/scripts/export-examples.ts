#!/usr/bin/env bun
/**
 * export-examples.ts
 *
 * Generates paired screenshot + source snippets under brand/examples/. Each
 * example is a .png screenshot of a specific site surface plus a .svelte.txt
 * file containing the source snippet that produced it. The pair is the
 * grounding data a vision LLM needs to understand the brand's built
 * appearance alongside its structure.
 *
 * Run: `bun run brand:export-examples`
 *
 * Prerequisite: the dev server must be running at http://localhost:5173
 * (or set PREVIEW_URL). This script does NOT start the server — it assumes
 * the server is already up, matching the normal development flow.
 *
 * Output layout:
 *   brand/examples/hero.png
 *   brand/examples/hero.svelte.txt
 *   brand/examples/service-card.png
 *   brand/examples/service-card.svelte.txt
 *   ... (one pair per example)
 *
 * Idempotent: re-running overwrites existing files.
 */

import { mkdir, copyFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium, firefox } from '@playwright/test';

// Allow PLAYWRIGHT_BROWSER=firefox as an escape hatch for Windows envs where
// the headless Chromium launch hangs. Defaults to chromium.
const BROWSER_KIND = (process.env.PLAYWRIGHT_BROWSER ?? 'chromium').toLowerCase();
const launcher = BROWSER_KIND === 'firefox' ? firefox : chromium;

const PREVIEW_URL = process.env.PREVIEW_URL ?? 'http://localhost:5173';

// Resolve paths from this script's location so the script works regardless
// of cwd (called from apps/web/package.json with cwd=apps/web/, or directly).
const SCRIPT_DIR = import.meta.dir;
const OUT_DIR = resolve(SCRIPT_DIR, '../examples');
const APPS_WEB_DIR = resolve(SCRIPT_DIR, '../../apps/web');

type Example = {
	/** Stem name for both output files (hero → hero.png + hero.svelte.txt). */
	name: string;
	/** Path on the dev server to load (e.g., '/'). */
	path: string;
	/** CSS selector of the element to capture, or null for full viewport. */
	selector: string | null;
	/** Viewport size to emulate. */
	viewport: { width: number; height: number };
	/** Source file to copy as the .svelte.txt pair. Path relative to repo root. */
	source: string;
	/** Optional: wait for this selector before screenshotting (e.g., let fonts + SVGs paint). */
	waitFor?: string;
};

const EXAMPLES: Example[] = [
	{
		name: 'home-hero',
		path: '/',
		selector: '.hero-section',
		viewport: { width: 1440, height: 900 },
		source: 'src/lib/components/home/HeroBanner.svelte',
		waitFor: '.hero-section'
	},
	{
		name: 'service-card-sql',
		path: '/services',
		selector: '[data-service-id="sql"], .service-card, section',
		viewport: { width: 1440, height: 900 },
		source: 'src/lib/components/services/ServiceCard.svelte'
	},
	{
		name: 'blog-listing',
		path: '/blog',
		selector: null, // full viewport
		viewport: { width: 1440, height: 900 },
		source: 'src/lib/components/blog/BlogListingPage.svelte'
	},
	{
		name: 'contact-terminal',
		path: '/contact',
		selector: null,
		viewport: { width: 1440, height: 900 },
		source: 'src/lib/components/contact/ContactPage.svelte'
	},
	{
		name: 'about-identity',
		path: '/about',
		selector: '[data-testid="about-identity"]',
		viewport: { width: 1440, height: 900 },
		source: 'src/lib/components/about/AboutIdentity.svelte',
		waitFor: '[data-testid="about-identity"]'
	}
];

async function captureOne(
	browser: import('@playwright/test').Browser,
	example: Example
): Promise<void> {
	const context = await browser.newContext({
		viewport: example.viewport,
		colorScheme: 'dark',
		deviceScaleFactor: 2
	});
	try {
		const page = await context.newPage();
		await page.goto(`${PREVIEW_URL}${example.path}`, {
			waitUntil: 'domcontentloaded',
			timeout: 20_000
		});

		if (example.waitFor) {
			await page.waitForSelector(example.waitFor, { timeout: 8_000 }).catch(() => {
				// Selector didn't appear — fall back to full-viewport capture
			});
		}

		// Give fonts + ambient motion a moment to settle
		await page.waitForTimeout(400);

		const pngPath = join(OUT_DIR, `${example.name}.png`);
		const srcPath = join(OUT_DIR, `${example.name}.svelte.txt`);

		if (example.selector) {
			const el = await page.$(example.selector).catch(() => null);
			if (el) {
				await el.screenshot({ path: pngPath });
			} else {
				await page.screenshot({ path: pngPath });
			}
		} else {
			await page.screenshot({ path: pngPath, fullPage: false });
		}

		// Copy source as .svelte.txt (plaintext so git renders it inline).
		// example.source is relative to apps/web/.
		await copyFile(join(APPS_WEB_DIR, example.source), srcPath);

		console.log(`  ✓ ${example.name}.png + ${example.name}.svelte.txt`);
	} finally {
		await context.close();
	}
}

async function main(): Promise<void> {
	await mkdir(OUT_DIR, { recursive: true });

	console.log(`Capturing ${EXAMPLES.length} paired examples from ${PREVIEW_URL}`);
	console.log('');

	// One browser shared across all examples — avoids Windows launch overhead
	// compounding per-example.
	console.log(`Using browser: ${BROWSER_KIND}`);
	const browser = await launcher.launch({ headless: true, timeout: 45_000 });

	try {
		for (const example of EXAMPLES) {
			console.log(example.name);
			try {
				await captureOne(browser, example);
			} catch (err) {
				console.error(`  ✗ failed: ${(err as Error).message}`);
			}
		}
	} finally {
		await browser.close();
	}

	console.log('');
	console.log(`Done. ${EXAMPLES.length} pairs attempted; check ${OUT_DIR}/ for successes.`);
	console.log('Prereq: dev server running (bun run dev) at ' + PREVIEW_URL);
}

main().catch((err) => {
	console.error('export-examples failed:', err);
	process.exit(1);
});
