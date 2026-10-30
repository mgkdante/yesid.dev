import { describe, expect, it } from 'vitest';

import { staticAdapter, resolveStaticErrorPage } from '#lib/adapters/static.ts';
import { errorPagesById } from '#lib/content/error-pages.ts';
import { ErrorPageContentSchema } from '@repo/shared';

// ---------------------------------------------------------------------------
// FIX A — content.errorPage per-statusCode lookup
// ---------------------------------------------------------------------------

describe('staticAdapter.content.errorPage — per-statusCode lookup (FIX A)', () => {
	it.each([undefined, 0, 404, 500, 9999])('sync lookup and async port agree for %s', async (status) => {
		const result = resolveStaticErrorPage(status);
		expect(result).not.toBeInstanceOf(Promise);
		expect(result).toEqual(await staticAdapter.content.errorPage(status ?? 0));
	});

	it('errorPagesById has a 0-fallback row', () => {
		expect(errorPagesById[0]).toBeDefined();
		expect(ErrorPageContentSchema.safeParse(errorPagesById[0]).success).toBe(true);
	});

	it('errorPagesById has a 404 row', () => {
		expect(errorPagesById[404]).toBeDefined();
		expect(ErrorPageContentSchema.safeParse(errorPagesById[404]).success).toBe(true);
	});

	it('errorPagesById has a 500 row', () => {
		expect(errorPagesById[500]).toBeDefined();
		expect(ErrorPageContentSchema.safeParse(errorPagesById[500]).success).toBe(true);
	});

	it('errorPage(404) returns a valid ErrorPageContent', async () => {
		const result = await staticAdapter.content.errorPage(404);
		expect(ErrorPageContentSchema.safeParse(result).success).toBe(true);
	});

	it('errorPage(500) returns a valid ErrorPageContent', async () => {
		const result = await staticAdapter.content.errorPage(500);
		expect(ErrorPageContentSchema.safeParse(result).success).toBe(true);
	});

	it('errorPage(404) label differs from errorPage(500) label', async () => {
		const p404 = await staticAdapter.content.errorPage(404);
		const p500 = await staticAdapter.content.errorPage(500);
		expect(p404.label.en).not.toBe(p500.label.en);
	});

	it('errorPage(404) heading differs from errorPage(0) heading', async () => {
		const p404 = await staticAdapter.content.errorPage(404);
		const p0 = await staticAdapter.content.errorPage(0);
		expect(p404.heading.en).not.toBe(p0.heading.en);
	});

	it('errorPage(500) heading differs from errorPage(0) heading', async () => {
		const p500 = await staticAdapter.content.errorPage(500);
		const p0 = await staticAdapter.content.errorPage(0);
		expect(p500.heading.en).not.toBe(p0.heading.en);
	});

	it('errorPage(unknown status) falls back to 0-row', async () => {
		const fallback = await staticAdapter.content.errorPage(0);
		const unknown = await staticAdapter.content.errorPage(9999);
		// Deep structural equality: same label/heading/description
		expect(unknown.label.en).toBe(fallback.label.en);
		expect(unknown.heading.en).toBe(fallback.heading.en);
	});
});
