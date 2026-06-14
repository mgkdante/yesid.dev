// slice-16 verify-pass diagnostic. Captures `console.error` + unhandled
// promise rejections on the spec's three critical paths (nav transitions,
// contact submit interaction, project-detail render). Re-runnable baseline
// before each deploy.
//
// Failure prints the captured array; `console.warn` is intentionally not
// captured per slice-16 spec (Clarifications section).
//
// networkidle is intentionally NOT used: against the live preview the contact
// info-terminal fires a one-shot fetch('/api/weather') + a DOM clock interval,
// so "network idle" never settles deterministically. Each navigation waits on
// `load` plus a deterministic landmark for the page being scanned; the
// console/pageerror listeners are attached up-front and catch errors throughout.

import { test, expect, type Page } from '@playwright/test';
import { visibleContactTerminal, gotoFirstDetail, projectDetailLinks } from '../_support/helpers';

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
		await page.goto(route, { waitUntil: 'load' });
		// Deterministic settle: wait for the page's primary landmark so any
		// client-side JS that surfaces console errors has run before we move on.
		// Replaces a racy networkidle wait — the listeners above stay live and
		// keep catching errors across the whole walk regardless.
		await expect(page.locator('main')).toBeVisible();
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

	await page.goto('/contact', { waitUntil: 'load' });
	// Wait for the visible contact terminal — the form's landmark — instead of
	// networkidle. Once it's visible the reactive form code has mounted, which is
	// exactly what this test exercises.
	const terminal = visibleContactTerminal(page);
	await expect(terminal).toBeVisible();

	// Fill the form but DO NOT submit. Verifies client-side validation +
	// reactive form code doesn't surface errors. Per slice-16 spec the
	// form must not be actually submitted.
	const nameInput = terminal.locator('#contact-name');
	await nameInput.fill('audit-bot');
	await terminal.locator('#contact-email').fill('audit@example.invalid');
	await terminal.locator('#contact-message').fill('slice-16 console scan');

	expect(problems, JSON.stringify(problems, null, 2)).toHaveLength(0);
});

test('/projects/[slug] render — no console errors', async ({ page }) => {
	// Listeners attached before navigation; tag each problem with the page's
	// live URL so the report stays accurate across the listing → detail hop.
	const problems: ConsoleProblem[] = [];
	page.on('console', (msg) => {
		if (msg.type() === 'error') problems.push({ route: page.url(), type: 'error', text: msg.text() });
	});
	page.on('pageerror', (err) => {
		problems.push({ route: page.url(), type: 'rejection', text: err.message });
	});

	// Discover + open the first real /projects/[slug] from the listing and wait
	// for the detail landmark (no networkidle). Asserts a link exists, so the
	// scan can never vacuously pass on an empty listing.
	await gotoFirstDetail(page, '/projects', projectDetailLinks, 'project-detail-page');

	expect(problems, JSON.stringify(problems, null, 2)).toHaveLength(0);
});
