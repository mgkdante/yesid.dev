// slice-16 verify-pass diagnostic. Captures `console.error` + unhandled
// promise rejections on the spec's three critical paths (nav transitions,
// contact submit interaction, project-detail render). Re-runnable baseline
// before each deploy.
//
// Failure prints the captured array; `console.warn` is intentionally not
// captured per slice-16 spec (Clarifications section).

import { test, expect, type Page } from '@playwright/test';

type ConsoleProblem = { route: string; type: 'error' | 'rejection'; text: string };

async function walk(page: Page, routes: string[]): Promise<ConsoleProblem[]> {
	const problems: ConsoleProblem[] = [];
	let currentRoute = routes[0];

	page.on('console', (msg) => {
		if (msg.type() === 'error') {
			problems.push({ route: currentRoute, type: 'error', text: msg.text() });
		}
	});
	page.on('pageerror', (err) => {
		problems.push({ route: currentRoute, type: 'rejection', text: err.message });
	});

	for (const route of routes) {
		currentRoute = route;
		await page.goto(route, { waitUntil: 'networkidle' });
	}
	return problems;
}

test('nav transitions — no console errors', async ({ page }) => {
	const problems = await walk(page, ['/', '/projects', '/services', '/blog', '/about', '/contact']);
	expect(problems, JSON.stringify(problems, null, 2)).toHaveLength(0);
});

test('contact form interaction — no console errors', async ({ page }) => {
	const problems: ConsoleProblem[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') problems.push({ route: '/contact', type: 'error', text: msg.text() });
	});
	page.on('pageerror', (err) => {
		problems.push({ route: '/contact', type: 'rejection', text: err.message });
	});

	await page.goto('/contact', { waitUntil: 'networkidle' });

	// Fill the form but DO NOT submit. Verifies client-side validation +
	// reactive form code doesn't surface errors. Per slice-16 spec the
	// form must not be actually submitted.
	const nameInput = page.locator('#contact-name').filter({ visible: true }).first();
	if (await nameInput.count()) {
		await nameInput.fill('audit-bot');
		await page.locator('#contact-email').filter({ visible: true }).first().fill('audit@example.invalid');
		await page.locator('#contact-message').filter({ visible: true }).first().fill('slice-16 console scan');
	}

	expect(problems, JSON.stringify(problems, null, 2)).toHaveLength(0);
});

test('/projects/[slug] render — no console errors', async ({ page }) => {
	// Discover a slug from the listing page so this stays content-agnostic.
	await page.goto('/projects', { waitUntil: 'networkidle' });
	const firstLink = page.locator('a[href^="/projects/"]').filter({ visible: true }).first();
	const href = await firstLink.getAttribute('href');
	if (!href) {
		test.skip(true, 'no /projects/[slug] link found on /projects');
		return;
	}

	const problems: ConsoleProblem[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') problems.push({ route: href!, type: 'error', text: msg.text() });
	});
	page.on('pageerror', (err) => {
		problems.push({ route: href!, type: 'rejection', text: err.message });
	});

	await page.goto(href, { waitUntil: 'networkidle' });
	expect(problems, JSON.stringify(problems, null, 2)).toHaveLength(0);
});
