import { test, expect } from '@playwright/test';
import { visibleContactTerminal } from './_support/helpers';

// Contact fold containment (operator spec 2026-07-09): with the nav, the page
// is EXACTLY one viewport (100dvh); the footer sits below the fold and appears
// only on scroll; nothing clips dead behind main's overflow:hidden — content
// taller than the fold scrolls INSIDE the terminal bodies.
//
// Regression class this guards (caught in review, previously unguarded): the
// .contact-grid row sized `auto` let .contact-content outgrow the 100dvh cap,
// half-clipping the submit button and stranding the cal.com booking link at
// common laptop viewport heights (720-900px) — Playwright's default 1280x720
// stayed green only because the submit's CENTER was 9px above the fold.
// Desktop-only (the >=1024px viewport equation; mobile flows naturally).

const VIEWPORT = { width: 1280, height: 720 };

for (const path of ['/contact', '/es/contact']) {
	test(`fold containment at 1280x720: ${path}`, async ({ page }) => {
		await page.setViewportSize(VIEWPORT);
		await page.goto(path);
		const terminal = visibleContactTerminal(page);
		await expect(terminal).toBeVisible();

		// Footer entirely below the fold (appears only on scroll).
		const footerTop = await page
			.getByTestId('footer')
			.evaluate((el) => el.getBoundingClientRect().top);
		expect(footerTop, 'footer must sit below the fold').toBeGreaterThanOrEqual(VIEWPORT.height - 1);

		// Both visible terminal cards end above the fold — no dead clipped content.
		for (const testId of ['contact-info-terminal', 'contact-form-terminal']) {
			const bottoms = await page.getByTestId(testId).evaluateAll((els) =>
				els
					.filter((el) => el.getBoundingClientRect().width > 0)
					.map((el) => el.getBoundingClientRect().bottom),
			);
			expect(bottoms.length).toBeGreaterThan(0);
			for (const bottom of bottoms) {
				expect(bottom, `${testId} card must end above the fold`).toBeLessThanOrEqual(
					VIEWPORT.height + 1,
				);
			}
		}

		// The overflow lives INSIDE the terminal body: after scrolling the form
		// body to its end, the submit button AND the booking escape hatch sit
		// inside the viewport (they were dead-clipped in the regression).
		await terminal
			.locator('.terminal-body')
			.evaluate((el) => el.scrollTo(0, el.scrollHeight));
		for (const control of ['contact-submit', 'contact-booking-link'] as const) {
			const box = await terminal.getByTestId(control).evaluate((el) => {
				const r = el.getBoundingClientRect();
				return { top: r.top, bottom: r.bottom };
			});
			expect(box.bottom, `${control} must be reachable above the fold`).toBeLessThanOrEqual(
				VIEWPORT.height + 1,
			);
			expect(box.top, `${control} must be inside the viewport`).toBeGreaterThanOrEqual(0);
		}
	});
}
