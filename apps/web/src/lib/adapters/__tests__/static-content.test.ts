// Static adapter — content method shape tests (slice-27.1 FIX A).
//
// Network-free, CI-runnable shape coverage. Born as the companion to the
// RUN_PARITY harness (deleted at slice-26 close after Directus 12 passed it
// on both environments); now the canonical suite asserting:
//   FIX A: content.errorPage(statusCode) returns per-status content, and
//          errorPage(404) ≠ errorPage(500) ≠ errorPage(0-fallback).
//
// Runs in the "data" Vitest project (Node env, $env stubbed to {}). The static
// adapter never touches the network, so importing it directly is safe here.

import { describe, expect, it } from 'vitest';

import { staticAdapter } from '$lib/adapters/static';
import { errorPagesById } from '$lib/content/error-pages';
import { ErrorPageContentSchema } from '$lib/schemas';

// ---------------------------------------------------------------------------
// FIX A — content.errorPage per-statusCode lookup
// ---------------------------------------------------------------------------

describe('staticAdapter.content.errorPage — per-statusCode lookup (FIX A)', () => {
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
